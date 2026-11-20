import { createHash } from 'node:crypto'
import { appendFileSync, existsSync, readFileSync } from 'node:fs'
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const SCRIPT_PATH = fileURLToPath(import.meta.url)
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts', '.mjs', '.cjs']
const PARSEABLE_EXTENSIONS = new Set(SOURCE_EXTENSIONS)

function isWithin(root, candidate) {
    const pathFromRoot = relative(root, candidate)
    return (
        pathFromRoot !== '..' && !pathFromRoot.startsWith(`..${sep}`) && !isAbsolute(pathFromRoot)
    )
}

function isLiteralString(node) {
    return ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)
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

function addFirstPartySpecifier(context, fromFile, specifier) {
    const { root, typescript, compilerOptions } = context
    const resolution = typescript.resolveModuleName(
        specifier,
        fromFile,
        compilerOptions,
        typescript.sys,
    ).resolvedModule?.resolvedFileName

    if (resolution && isWithin(root, resolve(resolution))) {
        const resolvedPath = resolve(resolution)
        if (!resolvedPath.split(sep).includes('node_modules')) context.queue.push(resolvedPath)
        return
    }

    // Vite can import first-party assets which TypeScript does not resolve as modules.
    // Include an existing relative file directly; unresolved source imports fail below.
    if (specifier.startsWith('.')) {
        const relativePath = resolve(dirname(fromFile), specifier)
        if (existsSync(relativePath) && isWithin(root, relativePath)) {
            context.queue.push(relativePath)
            return
        }
        context.unresolvedLocalImports.add(`${relative(root, fromFile)} -> ${specifier}`)
        return
    }

    if (specifier.startsWith('@/')) {
        context.unresolvedLocalImports.add(`${relative(root, fromFile)} -> ${specifier}`)
    }
}

function describeGlobPattern(rawPattern) {
    const excluded = rawPattern.startsWith('!')
    const pattern = excluded ? rawPattern.slice(1) : rawPattern
    if (!pattern.startsWith('./') && !pattern.startsWith('../')) {
        return { excluded, pattern, globIndex: -1, supported: false }
    }

    const segments = pattern.split('/')
    const globIndex = segments.findIndex((segment) =>
        ['*', '?', '{', '['].some((marker) => segment.includes(marker)),
    )
    return { excluded, pattern, segments, globIndex, supported: true }
}

function addGlobPattern(file, rawPattern, context, included, excluded) {
    const description = describeGlobPattern(rawPattern)
    if (!description.supported) {
        markUnsupportedDynamicImport(context, file)
        return
    }

    const { excluded: isExclude, pattern, segments, globIndex } = description
    if (globIndex < 0) {
        const resolved = resolve(dirname(file), pattern)
        if (isExclude) excluded.add(resolved)
        else addFirstPartySpecifier(context, file, pattern)
        return
    }

    const prefix = segments.slice(0, globIndex).join('/') || '.'
    const globRoot = resolve(dirname(file), prefix)
    const globPattern = segments.slice(globIndex).join('/')
    const matches = context.typescript.sys.readDirectory(globRoot, SOURCE_EXTENSIONS, undefined, [
        globPattern,
    ])
    for (const match of matches) (isExclude ? excluded : included).add(resolve(match))
}

function addStaticGlobDependencies(node, file, context) {
    const patterns = node.arguments[0] && globArgumentPatterns(node.arguments[0])
    if (!patterns || patterns.length === 0) {
        markUnsupportedDynamicImport(context, file)
        return
    }

    const included = new Set()
    const excluded = new Set()
    for (const pattern of patterns) addGlobPattern(file, pattern, context, included, excluded)
    for (const match of included) {
        if (!excluded.has(match)) context.queue.push(match)
    }
}

function visitImportOrExport(node, file, context) {
    if (node.moduleSpecifier && isLiteralString(node.moduleSpecifier)) {
        addFirstPartySpecifier(context, file, node.moduleSpecifier.text)
    }
}

function visitImportEquals(node, file, context) {
    const reference = node.moduleReference
    if (
        context.typescript.isExternalModuleReference(reference) &&
        reference.expression &&
        isLiteralString(reference.expression)
    ) {
        addFirstPartySpecifier(context, file, reference.expression.text)
    }
}

function visitImportType(node, file, context) {
    if (
        context.typescript.isLiteralTypeNode(node.argument) &&
        isLiteralString(node.argument.literal)
    ) {
        addFirstPartySpecifier(context, file, node.argument.literal.text)
    }
}

function dynamicLoaderKind(expression, typescript) {
    if (expression.kind === typescript.SyntaxKind.ImportKeyword) return 'import'
    if (!typescript.isIdentifier(expression)) return null
    if (expression.text === 'require') return 'require'
    if (expression.text === 'importScripts') return 'importScripts'
    return null
}

function visitCallExpression(node, file, context) {
    if (importMetaGlobCall(node)) addStaticGlobDependencies(node, file, context)

    const loader = dynamicLoaderKind(node.expression, context.typescript)
    if (!loader) return
    if (loader === 'importScripts' && node.arguments.length > 0) {
        for (const argument of node.arguments) {
            if (isLiteralString(argument)) addFirstPartySpecifier(context, file, argument.text)
            else markUnsupportedDynamicImport(context, file)
        }
        return
    }

    const argument = node.arguments[0]
    if (argument && isLiteralString(argument)) {
        addFirstPartySpecifier(context, file, argument.text)
    } else {
        markUnsupportedDynamicImport(context, file)
    }
}

function visitNewUrl(node, file, context) {
    const firstArgument = node.arguments?.[0]
    if (
        context.typescript.isIdentifier(node.expression) &&
        node.expression.text === 'URL' &&
        firstArgument &&
        isLiteralString(firstArgument) &&
        firstArgument.text.startsWith('.')
    ) {
        addFirstPartySpecifier(context, file, firstArgument.text)
    }
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

    const visit = (node) => {
        const { typescript } = context
        if (typescript.isImportDeclaration(node) || typescript.isExportDeclaration(node)) {
            visitImportOrExport(node, file, context)
        } else if (typescript.isImportEqualsDeclaration(node)) {
            visitImportEquals(node, file, context)
        } else if (typescript.isImportTypeNode(node)) {
            visitImportType(node, file, context)
        } else if (typescript.isCallExpression(node)) {
            visitCallExpression(node, file, context)
        } else if (typescript.isNewExpression(node)) {
            visitNewUrl(node, file, context)
        }

        typescript.forEachChild(node, visit)
    }
    visit(sourceFile)
}

function createGraphContext(root, compilerOptions, typescript) {
    return {
        root,
        compilerOptions,
        typescript,
        queue: [],
        files: new Set(),
        unresolvedLocalImports: new Set(),
        unsupportedDynamicImports: new Set(),
    }
}

function collectFirstPartyFiles(roots, context) {
    context.queue.push(...roots)
    while (context.queue.length > 0) {
        const file = resolve(context.queue.pop())
        const isExternal = !isWithin(context.root, file) || file.split(sep).includes('node_modules')
        if (isExternal || context.files.has(file)) continue
        if (!existsSync(file)) {
            context.unresolvedLocalImports.add(`missing file: ${relative(context.root, file)}`)
            continue
        }

        context.files.add(file)
        if (PARSEABLE_EXTENSIONS.has(extname(file).toLowerCase())) visitModule(file, context)
    }
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
    const strykerConfig = JSON.parse(readFileSync(strykerConfigPath, 'utf8'))
    const targets = resolveMutationTargets(strykerConfig, webRoot, typescript)
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

    const compilerOptions = readWebCompilerOptions(webTsconfigPath, typescript)
    const context = createGraphContext(root, compilerOptions, typescript)
    const setupFile = resolve(webRoot, 'vitest.setup.ts')
    const roots = [...targets, ...testFiles, viteConfig]
    if (existsSync(setupFile)) roots.push(setupFile)
    collectFirstPartyFiles(roots, context)
    assertCompleteGraph(context)

    return {
        ...fingerprintFiles(root, context.files),
        targetCount: targets.length,
        testFileCount: testFiles.length,
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
