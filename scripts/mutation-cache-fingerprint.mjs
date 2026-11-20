import { createHash } from 'node:crypto'
import { appendFileSync, existsSync, globSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import ts from 'typescript'
import { createWorkspaceRuntimeResolver } from './mutation-cache-workspace-runtime.mjs'

const SCRIPT_PATH = fileURLToPath(import.meta.url)
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts', '.mjs', '.cjs']
const PARSEABLE_EXTENSIONS = new Set(SOURCE_EXTENSIONS)
const TEST_SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs'])
const TEST_SOURCE_EXCLUDED_DIRECTORIES = new Set(['node_modules', 'dist', 'coverage', 'tests'])
const TEST_READ_FIXTURES = ['apps/web/public/manifest.json', 'packages/ui/src/tokens.css']
const DECLARATION_RUNTIME_SUFFIXES = [
    ['.d.ts', '.js'],
    ['.d.mts', '.mjs'],
    ['.d.cts', '.cjs'],
]
const UNSUPPORTED_GLOB_MARKERS = ['{', '}', '[', ']', '(', ')']

function isWithin(root, candidate) {
    const pathFromRoot = relative(root, candidate)
    return (
        pathFromRoot !== '..' && !pathFromRoot.startsWith(`..${sep}`) && !isAbsolute(pathFromRoot)
    )
}

function isLiteralString(node) {
    return ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)
}

function isDeclarationFilePath(file) {
    return /\.d\.(?:ts|mts|cts)$/i.test(file)
}

function importMetaGlobCall(node) {
    return (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === 'glob' &&
        ts.isMetaProperty(node.expression.expression) &&
        node.expression.expression.keywordToken === ts.SyntaxKind.ImportKeyword &&
        node.expression.expression.name.text === 'meta'
    )
}

function globArgumentPatterns(argument) {
    if (isLiteralString(argument)) return [argument.text]
    if (ts.isArrayLiteralExpression(argument)) {
        return argument.elements.every(isLiteralString)
            ? argument.elements.map((element) => element.text)
            : null
    }
    return null
}

function markUnsupportedDynamicImport(context, file) {
    context.unsupportedDynamicImports.add(relative(context.root, file))
}

function recordUnresolvedImport(context, fromFile, specifier) {
    context.unresolvedLocalImports.add(`${relative(context.root, fromFile)} -> ${specifier}`)
}

function enqueueResolvedModule(context, resolution, { includeAdjacentRuntime = true } = {}) {
    if (!resolution) return false
    const resolvedPath = resolve(resolution)
    if (!isWithin(context.root, resolvedPath)) return false
    if (!resolvedPath.split(sep).includes('node_modules')) {
        context.queue.push(resolvedPath)
        if (includeAdjacentRuntime) enqueueRuntimeImplementation(context, resolvedPath)
    }
    return true
}

function runtimeImplementationPath(declarationPath) {
    const suffix = DECLARATION_RUNTIME_SUFFIXES.find(([declaration]) =>
        declarationPath.endsWith(declaration),
    )
    return suffix ? `${declarationPath.slice(0, -suffix[0].length)}${suffix[1]}` : null
}

function enqueueRuntimeImplementation(context, declarationPath) {
    const runtimePath = runtimeImplementationPath(declarationPath)
    if (!runtimePath) return
    if (!isWithin(context.root, runtimePath)) return
    if (!existsSync(runtimePath)) return
    context.queue.push(runtimePath)
}

function enqueueRelativeFirstPartyAsset(context, fromFile, specifier) {
    if (!specifier.startsWith('.')) return false
    const relativePath = resolve(dirname(fromFile), specifier)
    // Vite can import first-party assets which TypeScript does not resolve as modules.
    // Include an existing relative file directly; unresolved source imports fail below.
    if (existsSync(relativePath) && isWithin(context.root, relativePath)) {
        context.queue.push(relativePath)
    } else {
        recordUnresolvedImport(context, fromFile, specifier)
    }
    return true
}

function enqueueWorkspaceSpecifier(context, request) {
    const workspace = context.resolveWorkspaceRuntime(
        request.resolution,
        request.specifier,
        request.runtimeRequired,
        request.requestKind,
    )
    if (!workspace) return false
    if (workspace.error) {
        recordUnresolvedImport(context, request.fromFile, workspace.error)
        return true
    }

    enqueueWorkspaceRuntime(context, request, workspace)
    return true
}

function enqueueWorkspaceRuntime(context, request, workspace) {
    context.queue.push(workspace.manifestPath)
    enqueueResolvedModule(context, request.resolution, { includeAdjacentRuntime: false })
    for (const error of workspace.errors) {
        recordUnresolvedImport(context, request.fromFile, error)
    }
    if (!request.runtimeRequired) return
    context.queue.push(...workspace.runtimePaths)
}

function hasProvenLocalRuntimeTarget(root, resolution) {
    if (!resolution) return false
    const resolvedPath = resolve(resolution)
    if (!isWithin(root, resolvedPath)) return false
    return !isDeclarationFilePath(resolvedPath)
}

function rejectUnprovenPackageRuntimeImport(context, request) {
    const { fromFile, specifier, resolution, runtimeRequired } = request
    if (!runtimeRequired) return false
    if (!specifier.startsWith('#')) return false
    if (hasProvenLocalRuntimeTarget(context.root, resolution)) return false
    const resolvedPath = resolution ? resolve(resolution) : null
    const detail = resolvedPath
        ? `resolved only to declaration or external path ${resolution}`
        : 'TypeScript resolution is missing'
    recordUnresolvedImport(context, fromFile, `${specifier} runtime target is unproven (${detail})`)
    return true
}

function resolutionModeForRequestKind(typescript, requestKind) {
    return requestKind === 'require' ? typescript.ModuleKind.CommonJS : typescript.ModuleKind.ESNext
}

function enqueueResolvedFirstPartySpecifier(
    context,
    fromFile,
    specifier,
    resolution,
    { includeAdjacentRuntime = true } = {},
) {
    if (enqueueResolvedModule(context, resolution, { includeAdjacentRuntime })) return true
    if (enqueueRelativeFirstPartyAsset(context, fromFile, specifier)) return true
    if (specifier.startsWith('@/')) recordUnresolvedImport(context, fromFile, specifier)
    return false
}

function addFirstPartySpecifier(
    context,
    fromFile,
    specifier,
    { runtimeRequired = true, requestKind = 'import' } = {},
) {
    const { typescript, compilerOptions } = context
    const resolution = typescript.resolveModuleName(
        specifier,
        fromFile,
        compilerOptions,
        typescript.sys,
        undefined,
        undefined,
        resolutionModeForRequestKind(typescript, requestKind),
    ).resolvedModule?.resolvedFileName

    if (
        enqueueWorkspaceSpecifier(context, {
            fromFile,
            specifier,
            resolution,
            runtimeRequired,
            requestKind,
        })
    )
        return

    if (
        rejectUnprovenPackageRuntimeImport(context, {
            fromFile,
            specifier,
            resolution,
            runtimeRequired,
        })
    )
        return
    enqueueResolvedFirstPartySpecifier(context, fromFile, specifier, resolution, {
        includeAdjacentRuntime: runtimeRequired,
    })
}

function describeGlobPattern(rawPattern) {
    const excluded = rawPattern.startsWith('!')
    const pattern = excluded ? rawPattern.slice(1) : rawPattern
    const hasRelativePrefix = ['./', '../'].some((prefix) => pattern.startsWith(prefix))
    if (!hasRelativePrefix) {
        return { excluded, pattern, globIndex: -1, supported: false }
    }
    if (UNSUPPORTED_GLOB_MARKERS.some((marker) => pattern.includes(marker))) {
        return { excluded, pattern, globIndex: -1, supported: false }
    }

    const segments = pattern.split('/')
    const globIndex = segments.findIndex((segment) =>
        ['*', '?', '{', '['].some((marker) => segment.includes(marker)),
    )
    return { excluded, pattern, segments, globIndex, supported: true }
}

function readGlobMatches(context, file, globRoot, globPattern) {
    if (!isWithin(context.root, globRoot)) {
        markUnsupportedDynamicImport(context, file)
        return []
    }

    if (!existsSync(globRoot)) return []
    return globSync(globPattern, { cwd: globRoot })
        .map((match) => resolve(globRoot, match))
        .filter((match) => statSync(match).isFile())
}

function addGlobPattern(file, rawPattern, context, matches) {
    const description = describeGlobPattern(rawPattern)
    if (!description.supported) {
        markUnsupportedDynamicImport(context, file)
        return
    }

    const { excluded: isExclude, pattern, segments, globIndex } = description
    if (globIndex < 0) {
        const resolved = resolve(dirname(file), pattern)
        if (isExclude) matches.excluded.add(resolved)
        else if (!isWithin(context.root, resolved) || !existsSync(resolved)) {
            context.unresolvedLocalImports.add(`${relative(context.root, file)} -> ${pattern}`)
        } else {
            matches.included.add(resolved)
        }
        return
    }

    const prefix = segments.slice(0, globIndex).join('/') || '.'
    const globRoot = resolve(dirname(file), prefix)
    const globPattern = segments.slice(globIndex).join('/')
    const globMatches = readGlobMatches(context, file, globRoot, globPattern)
    for (const match of globMatches) {
        ;(isExclude ? matches.excluded : matches.included).add(resolve(match))
    }
}

function addStaticGlobDependencies(node, file, context) {
    if (node.arguments.length !== 1) {
        markUnsupportedDynamicImport(context, file)
        return
    }

    const patterns = node.arguments[0] && globArgumentPatterns(node.arguments[0])
    if (!patterns || patterns.length === 0) {
        markUnsupportedDynamicImport(context, file)
        return
    }

    const matches = { included: new Set(), excluded: new Set() }
    for (const pattern of patterns) addGlobPattern(file, pattern, context, matches)
    for (const match of matches.included) {
        if (!matches.excluded.has(match)) context.queue.push(match)
    }
}

function importHasRuntimeBindings(importClause, typescript) {
    if (!importClause || importClause.name) return true
    const bindings = importClause.namedBindings
    if (!bindings || !typescript.isNamedImports(bindings)) return true
    if (bindings.elements.length === 0) return true
    return bindings.elements.some((element) => !element.isTypeOnly)
}

function importRequiresRuntime(node, typescript, compilerOptions) {
    if (node.isTypeOnly || node.importClause?.isTypeOnly) return false
    return (
        importHasRuntimeBindings(node.importClause, typescript) ||
        Boolean(compilerOptions.verbatimModuleSyntax)
    )
}

function exportRequiresRuntime(node, typescript, compilerOptions) {
    if (node.isTypeOnly) return false
    if (!node.exportClause) return true
    if (!typescript.isNamedExports(node.exportClause)) return true
    if (node.exportClause.elements.length === 0) return true
    return (
        node.exportClause.elements.some((element) => !element.isTypeOnly) ||
        Boolean(compilerOptions.verbatimModuleSyntax)
    )
}

function visitImportOrExport(node, file, context) {
    if (!node.moduleSpecifier || !isLiteralString(node.moduleSpecifier)) return
    const runtimeRequired =
        !isDeclarationFilePath(file) &&
        (context.typescript.isImportDeclaration(node)
            ? importRequiresRuntime(node, context.typescript, context.compilerOptions)
            : exportRequiresRuntime(node, context.typescript, context.compilerOptions))
    addFirstPartySpecifier(context, file, node.moduleSpecifier.text, {
        runtimeRequired,
    })
}

function visitImportEquals(node, file, context) {
    const specifier = externalModuleSpecifier(node.moduleReference, context.typescript)
    if (specifier) {
        addFirstPartySpecifier(context, file, specifier, {
            runtimeRequired: !isDeclarationFilePath(file) && !node.isTypeOnly,
            requestKind: 'require',
        })
    }
}

function externalModuleSpecifier(reference, typescript) {
    if (!typescript.isExternalModuleReference(reference)) return null
    const expression = reference.expression
    if (!expression || !isLiteralString(expression)) return null
    return expression.text
}

function visitImportType(node, file, context) {
    if (
        context.typescript.isLiteralTypeNode(node.argument) &&
        isLiteralString(node.argument.literal)
    ) {
        addFirstPartySpecifier(context, file, node.argument.literal.text, {
            runtimeRequired: false,
        })
    }
}

function visitImportScripts(node, file, context) {
    if (node.arguments.length === 0) {
        markUnsupportedDynamicImport(context, file)
        return
    }
    for (const argument of node.arguments) {
        if (isLiteralString(argument)) addFirstPartySpecifier(context, file, argument.text)
        else markUnsupportedDynamicImport(context, file)
    }
}

function visitDynamicImportOrRequire(node, file, context) {
    const argument = node.arguments[0]
    if (!argument || !isLiteralString(argument)) {
        markUnsupportedDynamicImport(context, file)
        return
    }
    const requestKind =
        context.typescript.isIdentifier(node.expression) && node.expression.text === 'require'
            ? 'require'
            : 'import'
    addFirstPartySpecifier(context, file, argument.text, { requestKind })
}

function visitCallExpression(node, file, context) {
    if (importMetaGlobCall(node)) addStaticGlobDependencies(node, file, context)

    const key = context.typescript.isIdentifier(node.expression)
        ? node.expression.text
        : node.expression.kind
    const visitor = context.callVisitors.get(key)
    if (visitor) visitor(node, file, context)
}

function isImportMetaUrl(node, typescript) {
    if (!node) return false
    return (
        typescript.isPropertyAccessExpression(node) &&
        node.name.text === 'url' &&
        typescript.isMetaProperty(node.expression) &&
        node.expression.keywordToken === typescript.SyntaxKind.ImportKeyword &&
        node.expression.name.text === 'meta'
    )
}

function isUrlConstructor(node, typescript) {
    return (
        typescript.isNewExpression(node) &&
        typescript.isIdentifier(node.expression) &&
        node.expression.text === 'URL'
    )
}

function isRelativeUrlReference(node) {
    return Boolean(node && isLiteralString(node) && !/^(?:\/|[a-z][a-z\d+.-]*:)/i.test(node.text))
}

function propertyAccessPath(node, typescript) {
    const properties = []
    while (typescript.isPropertyAccessExpression(node)) {
        properties.unshift(node.name.text)
        node = node.expression
    }
    return typescript.isIdentifier(node) ? [node.text, ...properties].join('.') : ''
}

const RUNTIME_ORIGIN_PATHS = new Set([
    'window.location.origin',
    'window.location.href',
    'location.origin',
    'location.href',
    'globalThis.location.origin',
    'globalThis.location.href',
])

function isRuntimeOriginExpression(node, typescript) {
    return RUNTIME_ORIGIN_PATHS.has(propertyAccessPath(node, typescript))
}

function isRuntimeOriginUrlDeclaration(node, typescript) {
    if (!typescript.isVariableDeclaration(node) || !typescript.isIdentifier(node.name)) {
        return false
    }
    const initializer = node.initializer
    return Boolean(
        initializer &&
        (isRuntimeOriginExpression(initializer, typescript) ||
            (typescript.isArrowFunction(initializer) &&
                isRuntimeOriginExpression(initializer.body, typescript)) ||
            (isUrlConstructor(initializer, typescript) &&
                initializer.arguments?.some((argument) =>
                    isRuntimeOriginExpression(argument, typescript),
                ))),
    )
}

function collectRuntimeUrlBases(sourceFile, typescript) {
    const bases = new Set()
    const visit = (node) => {
        if (isRuntimeOriginUrlDeclaration(node, typescript)) bases.add(node.name.text)
        typescript.forEachChild(node, visit)
    }
    visit(sourceFile)
    return bases
}

function isAbsoluteUrlBase(base) {
    return !base || (isLiteralString(base) && /^[a-z][a-z\d+.-]*:/i.test(base.text))
}

function runtimeUrlBaseName(base, typescript) {
    if (typescript.isIdentifier(base)) return base.text
    if (typescript.isCallExpression(base) && typescript.isIdentifier(base.expression)) {
        return base.expression.text
    }
    return ''
}

function isKnownRuntimeUrlBase(base, context) {
    if (!base) return false
    const { typescript } = context
    return (
        isRuntimeOriginExpression(base, typescript) ||
        context.runtimeUrlBases.has(runtimeUrlBaseName(base, typescript))
    )
}

function nonLocalUrlSpecifier(argument) {
    if (!isLiteralString(argument)) return false
    return isRelativeUrlReference(argument) ? false : null
}

function relativeUrlSpecifier(node, context) {
    const { typescript } = context
    if (!isUrlConstructor(node, typescript)) return null
    const firstArgument = node.arguments?.[0]
    const base = node.arguments[1]
    if (isImportMetaUrl(base, typescript)) {
        if (!isLiteralString(firstArgument)) return false
        return isRelativeUrlReference(firstArgument) ? firstArgument.text : null
    }
    if (isKnownRuntimeUrlBase(base, context)) return null
    if (isAbsoluteUrlBase(base)) return null
    return nonLocalUrlSpecifier(firstArgument)
}

function enqueueModuleRelativeUrl(context, fromFile, specifier) {
    const resolvedPath = fileURLToPath(new URL(specifier, pathToFileURL(fromFile)))

    if (!isWithin(context.root, resolvedPath) || !existsSync(resolvedPath)) {
        recordUnresolvedImport(context, fromFile, specifier)
        return
    }
    context.queue.push(resolvedPath)
}

function visitNewUrl(node, file, context) {
    const specifier = relativeUrlSpecifier(node, context)
    if (specifier === false) markUnsupportedDynamicImport(context, file)
    else if (specifier) enqueueModuleRelativeUrl(context, file, specifier)
}

function readTestSourceTree(webRoot) {
    const files = []
    const walk = (directory) => {
        for (const entry of readdirSync(directory)) {
            if (TEST_SOURCE_EXCLUDED_DIRECTORIES.has(entry)) continue
            const file = resolve(directory, entry)
            const metadata = statSync(file)
            if (metadata.isDirectory()) {
                walk(file)
                continue
            }
            if (entry.includes('.test.') || entry.includes('.spec.')) continue
            if (TEST_SOURCE_EXTENSIONS.has(extname(entry))) files.push(file)
        }
    }
    walk(webRoot)
    return files
}

function resolveTestReadInputs(root, webRoot) {
    const sourceTree = readTestSourceTree(webRoot)
    const fixtureFiles = TEST_READ_FIXTURES.map((file) => resolve(root, file))
    const missingFiles = fixtureFiles.filter((file) => !isWithin(root, file) || !existsSync(file))
    if (missingFiles.length > 0) {
        throw new Error(
            `Configured test filesystem inputs are missing or outside the repository:\n${missingFiles.map((file) => relative(root, file)).join('\n')}`,
        )
    }
    return [...sourceTree, ...fixtureFiles]
}

function visitModule(file, context) {
    const source = readFileSync(file, 'utf8')
    const sourceFile = context.typescript.createSourceFile(
        file,
        source,
        context.typescript.ScriptTarget.Latest,
        true,
        file.endsWith('x') ? context.typescript.ScriptKind.TSX : context.typescript.ScriptKind.TS,
    )
    context.runtimeUrlBases = collectRuntimeUrlBases(sourceFile, context.typescript)

    const visit = (node) => {
        const visitor = context.nodeVisitors.get(node.kind)
        if (visitor) visitor(node, file, context)
        context.typescript.forEachChild(node, visit)
    }
    visit(sourceFile)
}

function createGraphContext(root, compilerOptions, typescript) {
    const nodeVisitors = new Map([
        [typescript.SyntaxKind.ImportDeclaration, visitImportOrExport],
        [typescript.SyntaxKind.ExportDeclaration, visitImportOrExport],
        [typescript.SyntaxKind.ImportEqualsDeclaration, visitImportEquals],
        [typescript.SyntaxKind.ImportType, visitImportType],
        [typescript.SyntaxKind.CallExpression, visitCallExpression],
        [typescript.SyntaxKind.NewExpression, visitNewUrl],
    ])
    const callVisitors = new Map([
        [typescript.SyntaxKind.ImportKeyword, visitDynamicImportOrRequire],
        ['require', visitDynamicImportOrRequire],
        ['importScripts', visitImportScripts],
    ])
    return {
        root,
        compilerOptions,
        typescript,
        resolveWorkspaceRuntime: createWorkspaceRuntimeResolver(root),
        nodeVisitors,
        callVisitors,
        queue: [],
        files: new Set(),
        runtimeUrlBases: new Set(),
        unresolvedLocalImports: new Set(),
        unsupportedDynamicImports: new Set(),
    }
}

function visitQueuedFile(file, context) {
    const resolvedFile = resolve(file)
    const isExternal =
        !isWithin(context.root, resolvedFile) || resolvedFile.split(sep).includes('node_modules')
    if (isExternal || context.files.has(resolvedFile)) return
    if (!existsSync(resolvedFile)) {
        context.unresolvedLocalImports.add(`missing file: ${relative(context.root, resolvedFile)}`)
        return
    }

    context.files.add(resolvedFile)
    if (PARSEABLE_EXTENSIONS.has(extname(resolvedFile).toLowerCase())) {
        visitModule(resolvedFile, context)
    }
}

function collectFirstPartyFiles(roots, context) {
    context.queue.push(...roots)
    while (context.queue.length > 0) visitQueuedFile(context.queue.pop(), context)
}

function readWebCompilerOptions(webTsconfigPath, typescript) {
    const config = typescript.readConfigFile(webTsconfigPath, typescript.sys.readFile)
    if (config.error) {
        throw new Error(typescript.flattenDiagnosticMessageText(config.error.messageText, '\n'))
    }

    const parsedConfig = typescript.parseJsonConfigFileContent(
        config.config,
        typescript.sys,
        dirname(webTsconfigPath),
        undefined,
        webTsconfigPath,
    )
    if (parsedConfig.errors.length > 0) {
        const diagnostic = parsedConfig.errors[0]
        throw new Error(typescript.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
    }
    return parsedConfig.options
}

function resolveMutationTargets(config, webRoot, typescript) {
    if (!Array.isArray(config.mutate) || config.mutate.length === 0) {
        throw new Error('stryker.conf.json must define at least one mutation target')
    }
    const includes = config.mutate.filter((pattern) => !pattern.startsWith('!'))
    const excludes = config.mutate
        .filter((pattern) => pattern.startsWith('!'))
        .map((pattern) => pattern.slice(1))
    const targets = typescript.sys.readDirectory(webRoot, SOURCE_EXTENSIONS, excludes, includes)
    if (targets.length === 0) throw new Error('Stryker mutation patterns resolved to no files')
    return targets
}

function resolveWorkspaceConfigPath(root) {
    const workspaceConfigPath = resolve(root, 'pnpm-workspace.yaml')
    if (!existsSync(workspaceConfigPath)) throw new Error('pnpm-workspace.yaml is missing')
    return workspaceConfigPath
}

function assertCompleteGraph(context) {
    if (context.unresolvedLocalImports.size > 0) {
        throw new Error(
            `Could not resolve first-party imports:\n${[...context.unresolvedLocalImports].sort().join('\n')}`,
        )
    }
    if (context.unsupportedDynamicImports.size > 0) {
        throw new Error(
            `Dynamic first-party module loading needs explicit fingerprint support:\n${[...context.unsupportedDynamicImports].sort().join('\n')}`,
        )
    }
}

function fingerprintFiles(root, files) {
    const sortedFiles = [...files].sort((left, right) => {
        const leftPath = relative(root, left).split(sep).join('/')
        const rightPath = relative(root, right).split(sep).join('/')
        return leftPath < rightPath ? -1 : leftPath > rightPath ? 1 : 0
    })
    const fingerprint = createHash('sha256')
    for (const file of sortedFiles) {
        fingerprint.update(relative(root, file).split(sep).join('/'))
        fingerprint.update('\0')
        fingerprint.update(readFileSync(file))
        fingerprint.update('\0')
    }
    return {
        fingerprint: fingerprint.digest('hex'),
        files: sortedFiles.map((file) => relative(root, file).split(sep).join('/')),
    }
}

function resolveFingerprintInputs({
    root,
    webRoot,
    strykerConfigPath,
    webTsconfigPath,
    typescript,
}) {
    const strykerConfig = JSON.parse(readFileSync(strykerConfigPath, 'utf8'))
    const targets = resolveMutationTargets(strykerConfig, webRoot, typescript)
    const workspaceConfigPath = resolveWorkspaceConfigPath(root)
    const testFiles = typescript.sys.readDirectory(
        webRoot,
        SOURCE_EXTENSIONS,
        undefined,
        strykerConfig.testFiles ?? [],
    )
    const viteConfig = resolve(webRoot, strykerConfig.vitest?.configFile ?? 'vite.config.ts')
    if (!existsSync(viteConfig)) {
        throw new Error(`Configured Vitest/Vite config is missing: ${viteConfig}`)
    }

    const roots = [...targets, ...testFiles, viteConfig]
    const setupFile = resolve(webRoot, 'vitest.setup.ts')
    if (existsSync(setupFile)) roots.push(setupFile)

    return {
        roots,
        additionalFiles: [...resolveTestReadInputs(root, webRoot), workspaceConfigPath],
        compilerOptions: readWebCompilerOptions(webTsconfigPath, typescript),
        targetCount: targets.length,
        testFileCount: testFiles.length,
    }
}

/**
 * Hash every Stryker mutation target and its recursively imported first-party modules.
 * Unresolved local imports and dynamic module discovery fail closed so a new dependency
 * cannot silently escape the cache fingerprint.
 */
export function calculateMutationDependencyFingerprint({
    repoRoot = process.cwd(),
    strykerConfigPath = resolve(repoRoot, 'stryker.conf.json'),
    webTsconfigPath = resolve(repoRoot, 'apps/web/tsconfig.json'),
    typescript = ts,
} = {}) {
    const root = resolve(repoRoot)
    const webRoot = resolve(root, 'apps/web')
    const inputs = resolveFingerprintInputs({
        root,
        webRoot,
        strykerConfigPath,
        webTsconfigPath,
        typescript,
    })
    const context = createGraphContext(root, inputs.compilerOptions, typescript)
    collectFirstPartyFiles(inputs.roots, context)
    for (const file of inputs.additionalFiles) context.files.add(file)
    assertCompleteGraph(context)

    return {
        ...fingerprintFiles(root, context.files),
        targetCount: inputs.targetCount,
        testFileCount: inputs.testFileCount,
    }
}

if (process.argv[1] && resolve(process.argv[1]) === SCRIPT_PATH) {
    try {
        const result = calculateMutationDependencyFingerprint()
        if (process.env.GITHUB_OUTPUT) {
            appendFileSync(process.env.GITHUB_OUTPUT, `fingerprint=${result.fingerprint}\n`)
        } else {
            process.stdout.write(`fingerprint=${result.fingerprint}\n`)
        }
        process.stdout.write(
            `Stryker targets: ${result.targetCount}; test files: ${result.testFileCount}; first-party dependency files: ${result.files.length}\n`,
        )
    } catch (error) {
        process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
        process.exitCode = 1
    }
}
