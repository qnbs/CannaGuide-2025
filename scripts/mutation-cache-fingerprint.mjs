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
    if (!Array.isArray(strykerConfig.mutate) || strykerConfig.mutate.length === 0) {
        throw new Error('stryker.conf.json must define at least one mutation target')
    }

    const includes = strykerConfig.mutate.filter((pattern) => !pattern.startsWith('!'))
    const excludes = strykerConfig.mutate
        .filter((pattern) => pattern.startsWith('!'))
        .map((pattern) => pattern.slice(1))
    const targets = typescript.sys.readDirectory(webRoot, SOURCE_EXTENSIONS, excludes, includes)
    if (targets.length === 0) throw new Error('Stryker mutation patterns resolved to no files')

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

    const queue = [...targets]
    const files = new Set()
    const unresolvedLocalImports = new Set()
    const unsupportedDynamicImports = new Set()
    const addSpecifier = (fromFile, specifier) => {
        const resolution = typescript.resolveModuleName(
            specifier,
            fromFile,
            parsedConfig.options,
            typescript.sys,
        ).resolvedModule?.resolvedFileName

        if (resolution && isWithin(root, resolve(resolution))) {
            const resolvedPath = resolve(resolution)
            if (!resolvedPath.split(sep).includes('node_modules')) queue.push(resolvedPath)
            return
        }

        // Vite can import first-party assets which TypeScript does not resolve as modules.
        // Include an existing relative file directly; unresolved source imports fail below.
        if (specifier.startsWith('.')) {
            const relativePath = resolve(dirname(fromFile), specifier)
            if (existsSync(relativePath) && isWithin(root, relativePath)) {
                queue.push(relativePath)
                return
            }
            unresolvedLocalImports.add(`${relative(root, fromFile)} -> ${specifier}`)
            return
        }

        if (specifier.startsWith('@/')) {
            unresolvedLocalImports.add(`${relative(root, fromFile)} -> ${specifier}`)
        }
    }

    while (queue.length > 0) {
        const file = resolve(queue.pop())
        if (!isWithin(root, file) || file.split(sep).includes('node_modules') || files.has(file))
            continue
        if (!existsSync(file)) {
            unresolvedLocalImports.add(`missing file: ${relative(root, file)}`)
            continue
        }

        files.add(file)
        if (!PARSEABLE_EXTENSIONS.has(extname(file).toLowerCase())) continue

        const source = readFileSync(file, 'utf8')
        const sourceFile = typescript.createSourceFile(
            file,
            source,
            typescript.ScriptTarget.Latest,
            true,
            file.endsWith('x') ? typescript.ScriptKind.TSX : typescript.ScriptKind.TS,
        )

        const visit = (node) => {
            if (
                (typescript.isImportDeclaration(node) || typescript.isExportDeclaration(node)) &&
                node.moduleSpecifier &&
                isLiteralString(node.moduleSpecifier)
            ) {
                addSpecifier(file, node.moduleSpecifier.text)
            } else if (typescript.isImportEqualsDeclaration(node)) {
                const reference = node.moduleReference
                if (
                    typescript.isExternalModuleReference(reference) &&
                    reference.expression &&
                    isLiteralString(reference.expression)
                ) {
                    addSpecifier(file, reference.expression.text)
                }
            } else if (
                typescript.isImportTypeNode(node) &&
                typescript.isLiteralTypeNode(node.argument)
            ) {
                if (isLiteralString(node.argument.literal))
                    addSpecifier(file, node.argument.literal.text)
            } else if (typescript.isCallExpression(node)) {
                if (importMetaGlobCall(node)) unsupportedDynamicImports.add(relative(root, file))

                const isDynamicImport = node.expression.kind === typescript.SyntaxKind.ImportKeyword
                const isRequire =
                    typescript.isIdentifier(node.expression) && node.expression.text === 'require'
                const isImportScripts =
                    typescript.isIdentifier(node.expression) &&
                    node.expression.text === 'importScripts'

                if (isDynamicImport || isRequire || isImportScripts) {
                    const argument = node.arguments[0]
                    if (argument && isLiteralString(argument)) {
                        addSpecifier(file, argument.text)
                    } else {
                        unsupportedDynamicImports.add(relative(root, file))
                    }
                }
            } else if (
                typescript.isNewExpression(node) &&
                typescript.isIdentifier(node.expression) &&
                node.expression.text === 'URL' &&
                node.arguments?.[0] &&
                isLiteralString(node.arguments[0]) &&
                node.arguments[0].text.startsWith('.')
            ) {
                addSpecifier(file, node.arguments[0].text)
            }

            typescript.forEachChild(node, visit)
        }

        visit(sourceFile)
    }

    if (unresolvedLocalImports.size > 0) {
        throw new Error(
            `Could not resolve first-party imports:\n${[...unresolvedLocalImports].sort().join('\n')}`,
        )
    }
    if (unsupportedDynamicImports.size > 0) {
        throw new Error(
            `Dynamic first-party module loading needs explicit fingerprint support:\n${[...unsupportedDynamicImports].sort().join('\n')}`,
        )
    }

    const sortedFiles = [...files].sort((left, right) => {
        const leftPath = relative(root, left).split(sep).join('/')
        const rightPath = relative(root, right).split(sep).join('/')
        return leftPath < rightPath ? -1 : leftPath > rightPath ? 1 : 0
    })
    const fingerprint = createHash('sha256')
    for (const file of sortedFiles) {
        const relativePath = relative(root, file).split(sep).join('/')
        fingerprint.update(relativePath)
        fingerprint.update('\0')
        fingerprint.update(readFileSync(file))
        fingerprint.update('\0')
    }

    return {
        fingerprint: fingerprint.digest('hex'),
        files: sortedFiles.map((file) => relative(root, file).split(sep).join('/')),
        targetCount: targets.length,
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
            `Stryker targets: ${result.targetCount}; first-party dependency files: ${result.files.length}\n`,
        )
    } catch (error) {
        process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
        process.exitCode = 1
    }
}
