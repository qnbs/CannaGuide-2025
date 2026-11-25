#!/usr/bin/env node
/**
 * Ensures localStorage/sessionStorage usage stays within the allowlist
 * (IndexedDB-first persistence; localStorage only for small non-secret flags).
 *
 * Every web app file is parsed with TypeScript's parser (syntax only, no type check), so
 * strings, comments, escapes, regex literals and type arguments are read the way the compiler
 * reads them. Every storage call is checked, whatever form its key takes:
 * - a string literal is checked directly;
 * - an identifier is resolved to the binding the call sees, by block, function and module scope:
 *   a `const` holding a literal or aliasing one, or a named import or re-export of one, read
 *   through the exporting module's exports, never its private declarations. A parameter,
 *   `let`, `var`, destructured, loop or catch binding is computed;
 * - anything else (a call, a template, a parameter) has to be listed in
 *   REVIEWED_DYNAMIC_KEYS with the keys it produces, so a new dynamic key fails until
 *   someone reviews it, and an entry whose call is gone fails as stale;
 * - every zustand `persist(...)` call (imported under any name, also through a local module
 *   that re-exports it, as `ns.persist`, through a const alias, or a `persist` the file does
 *   not declare) is a store written under its `name`, to localStorage unless a readable
 *   `storage` option says otherwise. A store whose name or storage cannot be read, or a
 *   `createJSONStorage` that is no persist call's `storage` option, counts as computed and
 *   needs a review entry for that exact call; one entry approves one such call.
 *
 * Before 2026-11-24 the check read literal keys only. On `main` at v1.12.2 that was 6 of
 * 106 storage calls: the other 100 pass a constant or a computed key and were never checked,
 * and the persisted IoT store was not seen at all.
 *
 * Scope: accident prevention for code written in good faith; CI enforces it through the real-tree
 * test in check-localstorage-usage.test.mjs. What the parser cannot read fails closed: an unreadable key, name or storage, and a file or an
 * imported module that does not parse. It is no boundary against code written to evade it,
 * such as an aliased storage object or a method name built at run time; that needs review.
 *
 * Exits 1 on an unknown key, an unreviewed or unreadable key, a file that does not parse, a
 * stale review entry or a stale allowlist pattern.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, extname, join, normalize, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import ts from 'typescript'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const APP = 'apps/web'

/**
 * Prefixes or exact keys permitted without an ADR exception. The list is exactly as wide
 * as the source needs: a pattern no key uses fails as stale, so a removed key cannot leave
 * an allowance behind. Sixteen such patterns were removed on 2026-11-24, among them
 * `gemini_key_`, `openai_key_`, `xai_key_` and `anthropic_key_`, which allowed raw provider
 * keys in localStorage long after they moved to encrypted IndexedDB.
 */
export const ALLOWED_PATTERNS = [
    /^cg\.onboarding\./,
    // The IoT MQTT settings exception (apps/web/CLAUDE.md, WEB-03): useIotStore persists
    // selected settings with encryptedPassword, never the plaintext password.
    /^cannaguide-iot-settings$/,
    /^cg\.ai\.provider\./,
    /^cg\.voice\./,
    /^cg\.localai\./,
    /^cg\.ageVerified/,
    /^cg\.geoLegal/,
    /^cg\.pwa\./,
    // Reviewed 2026-11-24, when the check first saw constant and computed keys. None
    // holds a secret or a user payload.
    // Recovery, persistence and device session flags.
    /^cannaguide\.(recoveryEpoch|safeRecoveryAttempted|persistenceTabId|batteryGatingNotified|ecoModeNotified)$/,
    /^cannaguide\.pendingSnapshotSaveFailure:/,
    // PWA install and banner state, command history, coach cooldown.
    /^cannaGuidePwaInstalled$/,
    /^cannaguide-pwa-banner-(dismissed|later)$/,
    /^cannaguide_recent_commands$/,
    /^cannaguide_coach_cooldown$/,
    // AI settings and usage counters; the audit log holds a timestamp and an endpoint,
    // never a prompt or a response, and the key metadata only its update time.
    /^cg\.ai\.(activeProvider|auditLog|costTracker|monthlyBudget|clear-on-exit\.pending)$/,
    /^cg\.ai\.consent\./,
    /^cg\.gemini\.apiKey\.meta\.v1$/,
    /^cg\.image\.ai\.consent\.v1$/,
    /^cg\.reminders\.lastNotified$/,
    // Caches of public data: the daily strain feed and the strain-lookup session cache.
    /^cg\.daily-drop\.(feed|dismissed)$/,
    /^cg\.sl\./,
    // Installed plugin manifests.
    /^installed_plugins_v1$/,
]

/**
 * Keys an older build wrote that current code only reads once and removes (migrations
 * to IndexedDB). Writing one again fails: it is not in ALLOWED_PATTERNS.
 */
export const LEGACY_READ_REMOVE = [/^cg\.crypto\.key\.v1$/, /^cg\.gdpr\.consent\.v1$/]

/**
 * Storage calls whose key is computed. Each entry names the file, the exact key
 * expression, the methods it may use, and an example key it produces; the example must
 * pass the allowlist unless the site only reads every key for the user's own export.
 * A persisted store's expression is its `persist(...)` options, a stray storage accessor's
 * its `createJSONStorage(...)` call, so one entry approves one call. Line breaks and their
 * indentation count as one space.
 */
export const REVIEWED_DYNAMIC_KEYS = [
    {
        file: 'apps/web/services/aiConsentService.ts',
        expression: 'consentKey(provider)',
        methods: ['getItem', 'setItem', 'removeItem'],
        example: 'cg.ai.consent.gemini',
    },
    {
        file: 'apps/web/services/aiProviderService.ts',
        expression: 'getProviderMetadataKey(provider)',
        methods: ['getItem', 'setItem', 'removeItem'],
        example: 'cg.ai.provider.gemini.meta.v1',
    },
    {
        file: 'apps/web/services/persistenceFailureMarker.ts',
        expression: 'markerKey(marker.tabId)',
        methods: ['setItem'],
        example: 'cannaguide.pendingSnapshotSaveFailure:tab-1',
    },
    {
        file: 'apps/web/services/persistenceFailureMarker.ts',
        expression: 'markerKey(tabId)',
        methods: ['getItem', 'removeItem'],
        example: 'cannaguide.pendingSnapshotSaveFailure:tab-1',
    },
    {
        // clearAllSnapshotSaveFailures: keys filtered by the marker prefix.
        file: 'apps/web/services/persistenceFailureMarker.ts',
        expression: 'key',
        methods: ['removeItem'],
        example: 'cannaguide.pendingSnapshotSaveFailure:tab-1',
    },
    {
        file: 'apps/web/services/strain-lookup/strainLookupCache.ts',
        expression: 'key',
        methods: ['getItem', 'setItem', 'removeItem'],
        example: 'cg.sl.blue dream',
    },
    {
        // The data export reads every key the app stored, for the user's own download.
        file: 'apps/web/services/privacyService.ts',
        expression: 'key',
        methods: ['getItem'],
        example: null,
    },
]

const SOURCE = /\.(ts|tsx|mjs)$/
const EXCLUDED =
    /(^|\/)(tests|__mocks__|__tests__)\/|\.(test|spec|ct|stories|bench)\.[cm]?[jt]sx?$|\.d\.ts$|^apps\/web\/(locales|public)\//
const STORAGES = new Set(['localStorage', 'sessionStorage'])
const METHODS = new Set(['getItem', 'setItem', 'removeItem'])
const ZUSTAND_MIDDLEWARE = 'zustand/middleware'
const MAX_DEPTH = 6
const { NodeFlags, SyntaxKind } = ts

/** The app source the check covers: tracked files, without tests, locales and assets. */
export function appSourceFiles(root = ROOT) {
    const result = spawnSync('git', ['ls-files', '-z', '--', APP], { cwd: root, encoding: 'utf8' })
    if (result.status !== 0) throw new Error('git ls-files failed')
    return result.stdout
        .split('\0')
        .filter((file) => SOURCE.test(file) && !EXCLUDED.test(file))
        .sort()
}

// ---------------------------------------------------------------------------
// Syntax trees and module resolution
// ---------------------------------------------------------------------------

const SCRIPT_KINDS = { '.tsx': ts.ScriptKind.TSX, '.mjs': ts.ScriptKind.JS }

/** A file's syntax tree, with parent links for the scope walk. */
function parse(file, source) {
    const kind = SCRIPT_KINDS[extname(file)] ?? ts.ScriptKind.TS
    return ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, kind)
}

const modules = new Map()

/** A module's syntax tree, parsed once per path; null when it cannot be read. */
function parsedModule(root, file) {
    const path = join(root, file)
    if (!modules.has(path)) modules.set(path, readModule(path, file))
    return modules.get(path)
}

/** A module's tree when it parses cleanly; null when it cannot be read or has syntax errors. */
function readModule(path, file) {
    let tree
    try {
        tree = parse(file, readFileSync(path, 'utf8'))
    } catch {
        return null
    }
    // A declaration the parser recovered from a broken module is no evidence for a key.
    return syntaxErrors(tree).length === 0 ? tree : null
}

/**
 * The parser's syntax errors for a tree. TypeScript keeps them on `parseDiagnostics`, which is
 * not public API: if a release moves it, fail loudly rather than pass every broken file.
 */
function syntaxErrors(tree) {
    const errors = tree.parseDiagnostics
    if (!Array.isArray(errors)) {
        throw new TypeError('typescript no longer exposes parseDiagnostics; update this check')
    }
    return errors
}

const MODULE_SUFFIXES = ['', '.ts', '.tsx', '.mjs', '/index.ts', '/index.tsx']

/** The path an `@/` or relative import specifier starts from; null for a package. */
function moduleBase(fromFile, specifier, root) {
    if (specifier.startsWith('@/')) return join(root, APP, specifier.slice(2))
    return specifier.startsWith('.') ? resolve(dirname(join(root, fromFile)), specifier) : null
}

const isSourceFile = (candidate) => existsSync(candidate) && SOURCE.test(candidate)

/** TypeScript resolves an ESM-style `./a.js` specifier to `./a.ts` or `./a.tsx`. */
const sourceForJs = (base) =>
    base.endsWith('.js') ? ['.ts', '.tsx'].map((ext) => `${base.slice(0, -3)}${ext}`) : []

function moduleFile(fromFile, specifier, root) {
    const base = moduleBase(fromFile, specifier, root)
    if (base === null) return null
    const candidates = [
        ...MODULE_SUFFIXES.map((suffix) => `${base}${suffix}`),
        ...sourceForJs(base),
    ]
    const found = candidates.find(isSourceFile)
    return found === undefined ? null : normalize(relative(root, found))
}

/** Syntax that wraps an expression without changing its value. */
const WRAPPERS = new Set([
    SyntaxKind.ParenthesizedExpression,
    SyntaxKind.AsExpression,
    SyntaxKind.SatisfiesExpression,
    SyntaxKind.TypeAssertionExpression,
    SyntaxKind.NonNullExpression,
])

function unwrap(node) {
    let inner = node
    while (WRAPPERS.has(inner.kind)) inner = inner.expression
    return inner
}

const isMemberAccess = (node) =>
    ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)

/** The member a property access reads: `a.name`, or `a['name']` with a literal. */
function memberName(node) {
    if (ts.isPropertyAccessExpression(node)) return node.name.text
    const literal =
        ts.isElementAccessExpression(node) && ts.isStringLiteralLike(node.argumentExpression)
    return literal ? node.argumentExpression.text : null
}

/** The name a call's callee goes by: `f` in `f()`, `name` in `a.name()`. */
function calleeName(call) {
    const callee = unwrap(call.expression)
    return ts.isIdentifier(callee) ? callee.text : memberName(callee)
}

const lineOf = (node) =>
    node.getSourceFile().getLineAndCharacterOfPosition(node.getStart()).line + 1

/** The tokens of a node in source order: the leaves of its syntax tree. */
function tokensOf(node) {
    const children = node.getChildren()
    return children.length === 0 ? [node] : children.flatMap(tokensOf)
}

const foldedGap = (gap) => (gap.includes('\n') ? ' ' : gap)

/**
 * A node's source text with each line break between two tokens, and the indentation around
 * it, folded to one space. Tokens are kept as written: a line break inside a template stays.
 */
function textOf(node) {
    const text = node.getSourceFile().text
    let out = ''
    let previous = null
    for (const token of tokensOf(node)) {
        const start = token.getStart()
        if (previous !== null) out += foldedGap(text.slice(previous, start))
        out += text.slice(start, token.end)
        previous = token.end
    }
    return out
}

const fileOf = (node) => node.getSourceFile().fileName

// ---------------------------------------------------------------------------
// Bindings. A name resolves to what the nearest enclosing scope declares under it: a block's
// `let`, `const`, function and class declarations, a function's parameters and the `var`s
// hoisted into it, a loop or catch binding, the module's declarations and imports.
// ---------------------------------------------------------------------------

/** The identifiers a binding name introduces, destructuring included. */
function bindingNames(name) {
    if (ts.isIdentifier(name)) return [name.text]
    return name.elements.flatMap((element) =>
        ts.isBindingElement(element) ? bindingNames(element.name) : [],
    )
}

/** The names one declaration binds. */
function namesOf(declaration) {
    const name = declaration.name
    if (name === undefined) return []
    const pattern = ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)
    return pattern ? bindingNames(name) : [name.text]
}

const isVarList = (list) => (list.flags & NodeFlags.BlockScoped) === 0

/** The declarations a statement adds to its block (a `var` belongs to its function). */
const NAMED_DECLARATIONS = new Set([
    SyntaxKind.FunctionDeclaration,
    SyntaxKind.ClassDeclaration,
    SyntaxKind.EnumDeclaration,
    SyntaxKind.ModuleDeclaration,
    SyntaxKind.ImportEqualsDeclaration,
])

function statementDeclarations(statement) {
    if (ts.isVariableStatement(statement)) {
        const list = statement.declarationList
        return isVarList(list) ? [] : [...list.declarations]
    }
    if (ts.isImportDeclaration(statement)) return importDeclarations(statement)
    return NAMED_DECLARATIONS.has(statement.kind) ? [statement] : []
}

/** The value bindings an import makes; a type-only import makes none. */
function importDeclarations(statement) {
    const clause = statement.importClause
    if (clause === undefined || clause.isTypeOnly) return []
    const named = clause.namedBindings
    const defaults = clause.name === undefined ? [] : [clause]
    if (named === undefined) return defaults
    if (ts.isNamespaceImport(named)) return [...defaults, named]
    return [...defaults, ...named.elements.filter((element) => !element.isTypeOnly)]
}

/** The `var`s hoisted into a body: nested functions and class static blocks keep their own. */
function hoistedVars(body) {
    const found = []
    const visit = (node) => {
        if (ts.isFunctionLike(node) || ts.isClassStaticBlockDeclaration(node)) return
        if (ts.isVariableDeclarationList(node) && isVarList(node)) found.push(...node.declarations)
        ts.forEachChild(node, visit)
    }
    ts.forEachChild(body, visit)
    return found
}

const blockDeclarations = (statements) => statements.flatMap(statementDeclarations)

function loopDeclarations(loop) {
    const init = loop.initializer
    return init !== undefined && ts.isVariableDeclarationList(init) ? [...init.declarations] : []
}

/** What a parameter list sees: a named function expression's own name and the parameters. */
const parameterDeclarations = (fn) => [
    ...(ts.isFunctionExpression(fn) ? [fn] : []),
    ...fn.parameters,
]

/** What a function body sees: that, and the `var`s hoisted into the body. */
function functionDeclarations(fn) {
    const vars = fn.body === undefined ? [] : hoistedVars(fn.body)
    return [...parameterDeclarations(fn), ...vars]
}

const SCOPES = new Map([
    [
        SyntaxKind.SourceFile,
        (node) => [...blockDeclarations(node.statements), ...hoistedVars(node)],
    ],
    [SyntaxKind.Block, (node) => blockDeclarations(node.statements)],
    [SyntaxKind.ModuleBlock, (node) => blockDeclarations(node.statements)],
    [SyntaxKind.CaseBlock, (node) => blockDeclarations(node.clauses.flatMap((c) => c.statements))],
    [
        SyntaxKind.CatchClause,
        (node) => (node.variableDeclaration ? [node.variableDeclaration] : []),
    ],
    [SyntaxKind.ForStatement, loopDeclarations],
    [SyntaxKind.ForInStatement, loopDeclarations],
    [SyntaxKind.ForOfStatement, loopDeclarations],
    [SyntaxKind.ClassStaticBlockDeclaration, (node) => hoistedVars(node.body)],
    [SyntaxKind.ClassExpression, (node) => [node]],
])

const NO_BINDINGS = new Map()
const scopeIndexes = new WeakMap()
const parameterIndexes = new WeakMap()

/**
 * Every name a scope declares, as seen from its child `child`, mapped to its declarations and
 * built once per scope. A parameter's default value sees the parameters, not the body's vars.
 */
function scopeIndex(scope, child = scope) {
    if (ts.isFunctionLike(scope) && ts.isParameter(child)) {
        return cachedIndex(parameterIndexes, scope, parameterDeclarations)
    }
    const declares = ts.isFunctionLike(scope) ? functionDeclarations : SCOPES.get(scope.kind)
    return declares === undefined ? NO_BINDINGS : cachedIndex(scopeIndexes, scope, declares)
}

function cachedIndex(cache, scope, declares) {
    if (!cache.has(scope)) cache.set(scope, indexByName(declares(scope)))
    return cache.get(scope)
}

function indexByName(declarations) {
    const index = new Map()
    for (const declaration of declarations) {
        for (const name of namesOf(declaration)) {
            index.set(name, [...(index.get(name) ?? []), declaration])
        }
    }
    return index
}

/** The declarations the nearest scope around an identifier makes of its name; [] for a global. */
function bindingsOf(identifier) {
    let child = identifier
    for (let scope = identifier.parent; scope !== undefined; scope = scope.parent) {
        const found = scopeIndex(scope, child).get(identifier.text)
        if (found !== undefined) return found
        child = scope
    }
    return []
}

/** The one declaration an identifier sees, or null when it is global or declared twice. */
function soleBinding(identifier) {
    const found = bindingsOf(identifier)
    return found.length === 1 ? found[0] : null
}

// ---------------------------------------------------------------------------
// Constant strings
// ---------------------------------------------------------------------------

/** A `const NAME = value` declaration: one identifier with an initializer, never `using`. */
function isConstant(declaration) {
    if (!ts.isVariableDeclaration(declaration) || declaration.initializer === undefined)
        return false
    const scoped = declaration.parent.flags & NodeFlags.BlockScoped
    return ts.isIdentifier(declaration.name) && scoped === NodeFlags.Const
}

/** The string an expression holds: a literal, or a constant bound to one; null when unknown. */
function stringValue(expression, context) {
    const node = unwrap(expression)
    if (ts.isStringLiteralLike(node)) return node.text
    return ts.isIdentifier(node) ? identifierValue(node, context) : null
}

/** The string the binding an identifier sees holds; null for any binding but a constant. */
function identifierValue(identifier, context) {
    const binding = soleBinding(identifier)
    return originValue(binding === null ? null : originOf(binding, context), context)
}

const originValue = (origin, context) =>
    origin?.declaration === undefined ? null : declarationValue(origin.declaration, context)

function declarationValue(declaration, context) {
    return isConstant(declaration) ? stringValue(declaration.initializer, deeper(context)) : null
}

const deeper = (context) => ({ ...context, depth: context.depth + 1 })
const importedName = (specifier) => (specifier.propertyName ?? specifier.name).text

/**
 * Where a binding's value is declared: the declaration itself, or for an import what the
 * exporting module exports under that name. A package is not opened: it ends the walk as
 * `{ package, name }`.
 */
function originOf(declaration, context) {
    if (context.depth > MAX_DEPTH) return null
    if (!ts.isImportSpecifier(declaration)) return { declaration }
    const from = declaration.parent.parent.parent.moduleSpecifier.text
    return exportOrigin(fileOf(declaration), from, importedName(declaration), deeper(context))
}

/** What module `from`, imported by `fromFile`, exports as `name`. */
function exportOrigin(fromFile, from, name, context) {
    // Cyclic `export *` chains end here instead of overflowing the stack.
    if (context.depth > MAX_DEPTH) return null
    if (moduleBase(fromFile, from, context.root) === null) return { package: from, name }
    const target = moduleFile(fromFile, from, context.root)
    const module = target === null ? null : parsedModule(context.root, target)
    return module === null ? null : moduleExport(module, name, context)
}

const isExported = (declaration) =>
    (ts.getCombinedModifierFlags(declaration) & ts.ModifierFlags.Export) !== 0

/** A module's export `name`: an exported declaration, else an export list or `export *`. */
function moduleExport(module, name, context) {
    const declared = (scopeIndex(module).get(name) ?? []).filter(isExported)
    if (declared.length === 0) return listedExport(module, name, context)
    return declared.length === 1 ? originOf(declared[0], deeper(context)) : null
}

/** `export { a as name }` (from a module, or of a local binding), else `export *`. */
function listedExport(module, name, context) {
    const statements = module.statements.filter(
        (statement) => ts.isExportDeclaration(statement) && !statement.isTypeOnly,
    )
    const named = statements.flatMap((statement) => namedExports(statement, name))
    if (named.length > 0) return named.length === 1 ? specifierOrigin(named[0], context) : null
    const stars = statements.filter((statement) => statement.exportClause === undefined)
    const via = (star) =>
        exportOrigin(fileOf(star), star.moduleSpecifier.text, name, deeper(context))
    return soleOrigin(stars.map(via))
}

function namedExports(statement, name) {
    const clause = statement.exportClause
    if (clause === undefined || !ts.isNamedExports(clause)) return []
    return clause.elements.filter((element) => !element.isTypeOnly && element.name.text === name)
}

function specifierOrigin(specifier, context) {
    const from = specifier.parent.parent.moduleSpecifier
    const local = importedName(specifier)
    if (from !== undefined)
        return exportOrigin(fileOf(specifier), from.text, local, deeper(context))
    const binding = moduleBinding(specifier.getSourceFile(), local)
    return binding === null ? null : originOf(binding, deeper(context))
}

function moduleBinding(module, name) {
    const found = scopeIndex(module).get(name) ?? []
    return found.length === 1 ? found[0] : null
}

/**
 * The one origin several `export *` agree on; null for none or a conflict. A package is
 * never opened, so a local module that declares the name wins over a package's guess.
 */
function soleOrigin(origins) {
    const found = origins.filter((origin) => origin !== null)
    const local = found.filter((origin) => origin.declaration !== undefined)
    const pool = local.length > 0 ? local : found
    const distinct = new Set(pool.map((o) => o.declaration ?? `${o.package}#${o.name}`))
    return distinct.size === 1 ? pool[0] : null
}

/** The string a module-level name holds, following aliases, imports and re-exports; null when unknown. */
export function resolveConstant(file, name, root = ROOT, depth = 0) {
    const module = parsedModule(root, file)
    if (module === null) return null
    const context = { root, depth }
    const binding = moduleBinding(module, name)
    const origin =
        binding === null ? listedExport(module, name, context) : originOf(binding, context)
    return originValue(origin, context)
}

// ---------------------------------------------------------------------------
// getItem, setItem and removeItem calls
// ---------------------------------------------------------------------------

/** The node naming a storage object: `localStorage`, or the member of `window.localStorage`. */
function storageToken(receiver) {
    const node = unwrap(receiver)
    if (ts.isIdentifier(node)) return node
    if (ts.isPropertyAccessExpression(node)) return node.name
    const literal =
        ts.isElementAccessExpression(node) && ts.isStringLiteralLike(node.argumentExpression)
    return literal ? node.argumentExpression : null
}

const storageOf = (token) => (token !== null && STORAGES.has(token.text) ? token.text : null)

const UNREADABLE = {
    missing: 'the call passes no key',
    spread: 'a spread key argument cannot be read',
}

/** How a call's first argument names its key: unparsed, literal, constant or dynamic. */
function classifyKey(argument, context) {
    if (argument === undefined)
        return { expression: '', kind: 'unparsed', reason: UNREADABLE.missing }
    const expression = textOf(argument)
    if (ts.isSpreadElement(argument))
        return { expression, kind: 'unparsed', reason: UNREADABLE.spread }
    const node = unwrap(argument)
    if (ts.isStringLiteralLike(node)) return { expression, kind: 'literal', key: node.text }
    const key = ts.isIdentifier(node) ? identifierValue(node, context) : null
    return key === null ? { expression, kind: 'dynamic' } : { expression, kind: 'constant', key }
}

/** A getItem, setItem or removeItem call on localStorage or sessionStorage; null otherwise. */
function directCall(call, context) {
    const callee = unwrap(call.expression)
    const method = isMemberAccess(callee) ? memberName(callee) : null
    if (!METHODS.has(method)) return null
    const token = storageToken(callee.expression)
    const storage = storageOf(token)
    if (storage === null) return null
    const site = { file: context.file, line: lineOf(token), storage, method }
    return { ...site, ...classifyKey(call.arguments[0], context) }
}

// ---------------------------------------------------------------------------
// Persisted zustand stores. `persist` writes its state under the `name` option, with no
// visible getItem or setItem call, to `createJSONStorage(() => window.localStorage)` unless a
// `storage` option says otherwise (zustand 5 middleware).
// ---------------------------------------------------------------------------

/**
 * Whether an expression is zustand's `persist`: an import of `persist` (renamed or not, from
 * any module, so a wrapper counts), an import under another name whose export chain ends at
 * `persist`, `ns.persist` on a namespace import of zustand/middleware, a const alias of one,
 * or a `persist` the file never declares. A local function or variable named `persist` is not.
 */
function isPersistReference(expression, context) {
    const node = unwrap(expression)
    if (ts.isIdentifier(node)) return context.depth <= MAX_DEPTH && persistBinding(node, context)
    if (!isMemberAccess(node) || memberName(node) !== 'persist') return false
    return isMiddlewareNamespace(node.expression, context)
}

function persistBinding(identifier, context) {
    const binding = soleBinding(identifier)
    // Undeclared, declared twice or a default import: a call named `persist` counts, failing closed.
    if (binding === null || ts.isImportClause(binding)) return identifier.text === 'persist'
    if (ts.isImportSpecifier(binding)) return importsPersist(binding, context)
    return aliasesPersist(binding, context)
}

function importsPersist(specifier, context) {
    if (importedName(specifier) === 'persist') return true
    return isPersistOrigin(originOf(specifier, context), context)
}

/**
 * Whether an import's origin is a `persist`: a package export of that name, or a declaration
 * that is or aliases one. An origin that cannot be found counts, failing closed.
 */
function isPersistOrigin(origin, context) {
    if (origin === null) return true
    if (origin.package !== undefined) return origin.name === 'persist'
    return declaresPersist(origin.declaration, context)
}

/** A declaration that is a `persist` or an alias of one. */
const declaresPersist = (declaration, context) =>
    namesOf(declaration).includes('persist') || aliasesPersist(declaration, context)

function aliasesPersist(declaration, context) {
    if (!isConstant(declaration)) return false
    return isPersistReference(declaration.initializer, deeper(context))
}

/** A namespace of zustand/middleware, or of a local module whose `persist` export is one. */
function isMiddlewareNamespace(expression, context) {
    const node = unwrap(expression)
    const binding = ts.isIdentifier(node) ? soleBinding(node) : null
    if (binding === null || !ts.isNamespaceImport(binding)) return false
    const from = binding.parent.parent.moduleSpecifier.text
    if (from === ZUSTAND_MIDDLEWARE) return true
    // Another package's namespace member named persist is not opened, and does not count.
    if (moduleBase(fileOf(binding), from, context.root) === null) return false
    const origin = exportOrigin(fileOf(binding), from, 'persist', deeper(context))
    return isPersistOrigin(origin, context)
}

/** A persist call's options object, or null when its second argument is not one. */
function optionsObject(call) {
    const [first, options] = call.arguments
    // A spread before the options shifts them: zustand may read another value as its options.
    if (first === undefined || ts.isSpreadElement(first)) return null
    const node = options === undefined ? null : unwrap(options)
    return node !== null && ts.isObjectLiteralExpression(node) ? node : null
}

/** The key a property is written under: its name or a literal computed name; null if computed. */
function propertyKey(property) {
    const name = property.name
    if (!ts.isComputedPropertyName(name)) return name.text
    const key = unwrap(name.expression)
    return ts.isStringLiteralLike(key) ? key.text : null
}

const UNKNOWN_OPTIONS = { name: null, storage: null }

/** A store `name`: a literal, or a constant holding one, as a property or a shorthand. */
function nameOption(property, context) {
    if (ts.isPropertyAssignment(property)) return stringValue(property.initializer, context)
    return ts.isShorthandPropertyAssignment(property)
        ? identifierValue(property.name, context)
        : null
}

/** A `storage` option this scan can read: `createJSONStorage(() => localStorage)` and the like. */
function storageOption(property) {
    if (!ts.isPropertyAssignment(property)) return null
    const call = unwrap(property.initializer)
    if (!isCreateJSONStorage(call) || call.arguments.length !== 1) return null
    const accessor = unwrap(call.arguments[0])
    if (!ts.isArrowFunction(accessor) || accessor.parameters.length > 0) return null
    return ts.isBlock(accessor.body) ? null : storageOf(storageToken(accessor.body))
}

const OPTION_EFFECTS = {
    name: (property, state, context) => ({ ...state, name: nameOption(property, context) }),
    storage: (property, state) => ({ ...state, storage: storageOption(property) }),
}

/**
 * How one property changes what is known: `name` and `storage` set their option, read or
 * unknown. A spread or a computed name may set either, so both become unknown until a later
 * property sets them again: the last property wins, as in JavaScript.
 */
function optionEffect(property, state, context) {
    if (ts.isSpreadAssignment(property)) return UNKNOWN_OPTIONS
    const key = propertyKey(property)
    if (key === null) return UNKNOWN_OPTIONS
    return Object.hasOwn(OPTION_EFFECTS, key)
        ? OPTION_EFFECTS[key](property, state, context)
        : state
}

/** The name and storage a store's options give; the storage is localStorage unless set. */
function storeOptions(call, context) {
    const options = optionsObject(call)
    if (options === null) return UNKNOWN_OPTIONS
    const initial = { name: null, storage: 'localStorage' }
    return options.properties.reduce((state, p) => optionEffect(p, state, context), initial)
}

/** The arguments that decide a store's key: its options, or every argument without them. */
const decidingArguments = (call) =>
    call.arguments.length > 1 ? call.arguments.slice(1) : call.arguments

/** One persisted store: a known key, or computed when its name or its storage is unknown. */
function persistedStore(call, context) {
    const { name, storage } = storeOptions(call, context)
    const store = {
        file: context.file,
        line: lineOf(call.expression),
        storage: storage ?? 'unknown',
        method: 'setItem',
        expression: `persist(${decidingArguments(call).map(textOf).join(', ')})`,
        oneCall: true,
    }
    const known = storage !== null && name !== null
    return known ? { ...store, kind: 'persist', key: name } : { ...store, kind: 'dynamic' }
}

const isCreateJSONStorage = (node) =>
    ts.isCallExpression(node) && calleeName(node) === 'createJSONStorage'

/** The `storage` initializers of a persist call: the accessors its store analysis reads. */
function storageInitializers(call) {
    const options = optionsObject(call)
    if (options === null) return []
    return options.properties
        .filter((p) => ts.isPropertyAssignment(p) && propertyKey(p) === 'storage')
        .map((p) => unwrap(p.initializer))
}

/** A `createJSONStorage` that is no persist call's `storage`: a store this scan cannot read. */
function strayStorage(call, file) {
    return {
        file,
        line: lineOf(call.expression),
        storage: 'unknown',
        method: 'setItem',
        expression: textOf(call),
        kind: 'dynamic',
        oneCall: true,
    }
}

/** Every call expression of a tree, in source order. */
function callExpressions(tree) {
    const calls = []
    const visit = (node) => {
        if (ts.isCallExpression(node)) calls.push(node)
        ts.forEachChild(node, visit)
    }
    visit(tree)
    return calls
}

/** A file the parser cannot read without errors: what it calls cannot be trusted. */
function parseFailures(tree, file) {
    const [first] = syntaxErrors(tree)
    if (first === undefined) return []
    const message = ts.flattenDiagnosticMessageText(first.messageText, ' ')
    const line = tree.getLineAndCharacterOfPosition(first.start).line + 1
    const reason = `the file does not parse: ${message}`
    return [
        {
            file,
            line,
            storage: 'unknown',
            method: 'setItem',
            expression: '',
            kind: 'unparsed',
            reason,
        },
    ]
}

/** Every storage call and persisted store in one file, classified by how its key is known. */
export function storageCalls(file, source, root = ROOT) {
    const tree = parse(file, source)
    const context = { file, root, depth: 0 }
    const calls = callExpressions(tree)
    const stores = calls.filter((call) => isPersistReference(call.expression, context))
    const read = new Set(stores.flatMap(storageInitializers))
    const strays = calls.filter((call) => isCreateJSONStorage(call) && !read.has(call))
    return [
        ...parseFailures(tree, file),
        ...calls.map((call) => directCall(call, context)).filter((found) => found !== null),
        ...stores.map((call) => persistedStore(call, context)),
        ...strays.map((call) => strayStorage(call, file)),
    ]
}

// ---------------------------------------------------------------------------
// Verdicts
// ---------------------------------------------------------------------------

const isAllowed = (key) => ALLOWED_PATTERNS.some((pattern) => pattern.test(key))

/** Why a literal, constant or persisted key fails; null when it is allowed. */
function knownKeyProblem(call) {
    const legacy =
        call.method !== 'setItem' && LEGACY_READ_REMOVE.some((pattern) => pattern.test(call.key))
    return legacy || isAllowed(call.key) ? null : `key "${call.key}" not in allowlist`
}

/** Why a computed key fails against its review entry; null when the entry covers it. */
function reviewedKeyProblem(call, entry) {
    if (!entry) return `computed key \`${call.expression}\` is not reviewed`
    if (!entry.methods.includes(call.method)) {
        return `computed key \`${call.expression}\` is reviewed for ${entry.methods.join(', ')} only, not ${call.method}`
    }
    if (entry.example === null) {
        return call.method === 'getItem' ? null : 'a reviewed read-every-key site may only read'
    }
    return isAllowed(entry.example) ? null : `reviewed example "${entry.example}" not in allowlist`
}

const KNOWN_KINDS = new Set(['literal', 'constant', 'persist'])

/** Why one call fails, recording the review entry it uses; null when it passes. */
function callProblem(call, reviewed, used) {
    // An unreadable call or file is never reviewable: nobody can say which key it writes.
    if (call.kind === 'unparsed') return call.reason
    if (KNOWN_KINDS.has(call.kind)) return knownKeyProblem(call)
    const entry = reviewed.find(
        (candidate) => candidate.file === call.file && candidate.expression === call.expression,
    )
    const earlier = entry === undefined ? undefined : used.get(entry)
    // A computed store or accessor is approved one call at a time, never a second identical one.
    if (call.oneCall && earlier !== undefined) {
        return `computed key \`${call.expression}\` is reviewed for line ${earlier.line} only: each computed store needs its own entry`
    }
    if (entry) used.set(entry, call)
    return reviewedKeyProblem(call, entry)
}

/** The violations for a set of classified calls and the reviewed dynamic-key entries. */
export function violations(calls, reviewed = REVIEWED_DYNAMIC_KEYS) {
    const used = new Map()
    const problems = calls
        .map((call) => ({ call, reason: callProblem(call, reviewed, used) }))
        .filter(({ reason }) => reason)
        .map(({ call, reason }) => ({ ...call, reason }))
    for (const entry of reviewed) {
        if (!used.has(entry)) {
            problems.push({
                file: entry.file,
                line: 0,
                reason: `stale review entry \`${entry.expression}\``,
            })
        }
    }
    return problems
}

/** Allowlist patterns that no key in the source, or no reviewed example, uses any more. */
export function stalePatterns(
    calls,
    patterns = ALLOWED_PATTERNS,
    reviewed = REVIEWED_DYNAMIC_KEYS,
) {
    const keys = [
        ...calls.filter((call) => call.key !== undefined).map((call) => call.key),
        ...reviewed.map((entry) => entry.example).filter(Boolean),
    ]
    return patterns
        .filter((pattern) => !keys.some((key) => pattern.test(key)))
        .map((pattern) => ({
            file: 'scripts/security/check-localstorage-usage.mjs',
            line: 0,
            reason: `allowlist pattern ${pattern} matches no key any more`,
        }))
}

function main() {
    const files = appSourceFiles()
    const calls = files.flatMap((file) =>
        storageCalls(file, readFileSync(join(ROOT, file), 'utf8')),
    )
    const problems = [...violations(calls), ...stalePatterns(calls)]
    const count = (kind) => calls.filter((call) => call.kind === kind).length

    console.log('\nLOCAL STORAGE ALLOWLIST CHECK')
    console.log('=============================')
    console.log(
        `Scanned ${files.length} files, ${calls.length} storage calls: ${count('literal')} literal, ${count('constant')} resolved constant, ${count('dynamic')} computed, ${count('persist')} persisted store, ${count('unparsed')} unparsed`,
    )
    if (problems.length === 0) {
        console.log('[OK] Every storage key is allowed')
        return 0
    }
    for (const problem of problems) {
        console.log(`[FAIL] ${problem.file}:${problem.line} -- ${problem.reason}`)
    }
    console.log(
        `\n[FAIL] ${problems.length} violation(s). localStorage holds small non-secret flags only (apps/web/CLAUDE.md, WEB-03): allow the key in ALLOWED_PATTERNS, or review the computed key in REVIEWED_DYNAMIC_KEYS.`,
    )
    return 1
}

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isDirectRun) process.exitCode = main()
