#!/usr/bin/env node
/**
 * Fail when a deploy, signing, or release secret can be read from a
 * pull_request workflow or from a workflow_dispatch that is not pinned to
 * main.
 *
 * pull_request runs the workflow file from the merge commit, so a same-repo
 * pull request can rewrite any step that sees the secret. workflow_dispatch
 * selects a branch; a job-level main ref guard stops that branch only when
 * the guard is on every path that can still run. A guard substring next to
 * `|| always()` does not count.
 *
 * The scan fails closed. Flow-style triggers, secrets['NAME'], secrets:
 * inherit, and a jobs tree that is not a mapping are violations when a
 * privileged secret is involved. An unparsed file is not treated as safe.
 *
 * GitHub Environments and secret rotation are owner settings and are not
 * claimed here. GITHUB_TOKEN is not in the privileged set: its scope is the
 * job permissions block. A rewritten workflow_dispatch file on another
 * branch is also outside this checker; that needs a default-branch
 * workflow_run or an environment deployment rule.
 *
 * Run: node scripts/security/check-workflow-credential-scope.mjs
 */

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const PRIVILEGED = new Set([
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_ACCOUNT_ID',
    'VERCEL_TOKEN',
    'RELEASE_PAT',
    'TAURI_SIGNING_PRIVATE_KEY',
    'TAURI_SIGNING_PRIVATE_KEY_PASSWORD',
    'APPLE_CERTIFICATE',
    'APPLE_CERTIFICATE_PASSWORD',
    'APPLE_SIGNING_IDENTITY',
    'APPLE_ID',
    'APPLE_PASSWORD',
    'APPLE_TEAM_ID',
    'WINDOWS_CERTIFICATE_THUMBPRINT',
    'SNYK_TOKEN',
])

const TRUE = 'true'
const FALSE = 'false'
const UNKNOWN = 'unknown'
const NOT_MAIN = 'refs/heads/not-main'

export function violationsInWorkflow(filename, text) {
    const normalized = text.replace(/\r\n/g, '\n')
    const triggers = triggersOf(normalized)
    const jobs = jobsOf(normalized)
    if (!triggers.ok || !jobs.ok) {
        if (!fileReadsPrivileged(normalized)) return []
        return [
            `${filename} has a privileged secret and an unsupported workflow shape; refusing to treat it as safe`,
        ]
    }
    const problems = []
    const workflowEnv = workflowEnvLines(normalized)
    for (const job of jobs.jobs) {
        const secrets = privilegedSecrets([...workflowEnv, ...job.lines])
        if (secrets.length === 0) continue
        const ifText = jobIf(job.lines)
        const listed = secrets.join(', ')
        if (reachableFromPullRequest(triggers.keys, ifText)) {
            problems.push(
                `${filename} job ${job.name} reads ${listed} from a pull_request workflow`,
            )
        }
        if (
            triggers.keys.has('workflow_dispatch') &&
            expressionCanRun(ifText, { event: 'workflow_dispatch', ref: NOT_MAIN })
        ) {
            problems.push(
                `${filename} job ${job.name} reads ${listed} from workflow_dispatch without a main ref guard`,
            )
        }
    }
    return problems
}

export function violationsInTree(root) {
    const dir = join(root, '.github', 'workflows')
    const problems = []
    for (const name of readdirSync(dir).filter(
        (entry) => entry.endsWith('.yml') || entry.endsWith('.yaml'),
    )) {
        const text = readFileSync(join(dir, name), 'utf8')
        problems.push(...violationsInWorkflow(name, text))
    }
    return problems
}

export function expressionCanRun(ifText, ctx) {
    const expr = unwrapIf(ifText)
    if (!expr) return true
    const tokens = tokenize(expr)
    if (!tokens) return true
    const parsed = parseOr(tokens)
    if (!parsed || parsed.rest.length > 0) return true
    return evalNode(parsed.node, ctx) !== FALSE
}

function fileReadsPrivileged(text) {
    return privilegedSecrets(text.split('\n')).length > 0
}

function workflowEnvLines(text) {
    const env = topLevelBlocks(text).find((block) => block.key === 'env')
    if (!env) return []
    return [env.rest, ...env.body]
}

function triggersOf(text) {
    const on = topLevelBlocks(text).find((block) => block.key === 'on')
    if (!on) return { ok: false, keys: new Set() }
    if (on.rest === '') return mappingKeys(on.body)
    const flow = flowKeys(on.rest)
    if (flow) return flow
    if (/^[A-Za-z_][A-Za-z0-9_-]*$/.test(on.rest)) return { ok: true, keys: new Set([on.rest]) }
    return { ok: false, keys: new Set() }
}

function jobsOf(text) {
    const jobs = topLevelBlocks(text).find((block) => block.key === 'jobs')
    if (!jobs) return { ok: true, jobs: [] }
    if (jobs.rest !== '') return { ok: false, jobs: [] }
    const split = splitChildren(jobs.body)
    if (!split.ok) return { ok: false, jobs: [] }
    return { ok: true, jobs: split.children }
}

function topLevelBlocks(text) {
    const lines = text.split('\n')
    const blocks = []
    let index = 0
    while (index < lines.length) {
        const line = lines[index]
        if (line.trim() === '' || /^\s*#/.test(line) || line.trim() === '---') {
            index += 1
            continue
        }
        if (line[0] === ' ' || line[0] === '\t') {
            index += 1
            continue
        }
        const match = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/)
        if (!match) {
            index += 1
            continue
        }
        const key = match[1]
        const rest = match[2].replace(/\s+#.*$/, '').trim()
        const body = []
        index += 1
        if (rest === '' || rest === '|' || rest === '|-' || rest === '>' || rest === '>-') {
            while (index < lines.length) {
                const next = lines[index]
                if (
                    next.trim() !== '' &&
                    next[0] !== ' ' &&
                    next[0] !== '\t' &&
                    !next.startsWith('#')
                ) {
                    break
                }
                body.push(next)
                index += 1
            }
        }
        blocks.push({
            key,
            rest: rest === '|' || rest === '>' || rest === '|-' || rest === '>-' ? '' : rest,
            body,
        })
    }
    return blocks
}

function mappingKeys(body) {
    const split = splitChildren(body)
    if (!split.ok) return { ok: false, keys: new Set() }
    return { ok: true, keys: new Set(split.children.map((child) => child.name)) }
}

function splitChildren(bodyLines) {
    let min = Infinity
    for (const line of bodyLines) {
        if (!line.trim() || line.trim().startsWith('#')) continue
        min = Math.min(min, line.match(/^[ \t]*/)[0].length)
    }
    if (!Number.isFinite(min)) return { ok: true, children: [] }
    const children = []
    let current = null
    for (const line of bodyLines) {
        if (!line.trim() || line.trim().startsWith('#')) {
            if (current) current.lines.push(line)
            continue
        }
        const indent = line.match(/^[ \t]*/)[0].length
        if (indent < min) return { ok: false, children: [] }
        if (indent === min) {
            const match = line.trim().match(/^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/)
            if (!match) return { ok: false, children: [] }
            if (current) children.push(current)
            current = { name: match[1], lines: [] }
            continue
        }
        if (!current) return { ok: false, children: [] }
        current.lines.push(line)
    }
    if (current) children.push(current)
    return { ok: true, children }
}

function flowKeys(rest) {
    const match = rest.match(/^\[(.*)]$/)
    if (!match) return null
    const parts = match[1]
        .split(',')
        .map((part) => part.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean)
    if (parts.some((part) => !/^[A-Za-z_][A-Za-z0-9_-]*$/.test(part))) {
        return { ok: false, keys: new Set() }
    }
    return { ok: true, keys: new Set(parts) }
}

function jobIf(lines) {
    let min = Infinity
    for (const line of lines) {
        if (!line.trim() || line.trim().startsWith('#')) continue
        min = Math.min(min, line.match(/^[ \t]*/)[0].length)
    }
    if (!Number.isFinite(min)) return ''
    const out = []
    let collecting = false
    const pattern = new RegExp(`^ {${min}}if:\\s*(.*)$`)
    for (const line of lines) {
        if (!collecting) {
            const match = line.match(pattern)
            if (!match) continue
            collecting = true
            out.push(match[1])
            continue
        }
        if (!line.trim() || line.trim().startsWith('#')) {
            out.push('')
            continue
        }
        const indent = line.match(/^[ \t]*/)[0].length
        if (indent > min) {
            out.push(line.trim())
            continue
        }
        break
    }
    return out.join('\n')
}

function privilegedSecrets(lines) {
    const found = new Set()
    const dot = /secrets\.([A-Z][A-Z0-9_]*)/g
    const indexed = /secrets\[\s*(['"])([A-Z][A-Z0-9_]*)\1\s*\]/g
    for (const line of lines) {
        for (const match of line.matchAll(dot)) {
            if (PRIVILEGED.has(match[1])) found.add(match[1])
        }
        for (const match of line.matchAll(indexed)) {
            if (PRIVILEGED.has(match[2])) found.add(match[2])
        }
        const unresolved = line.replace(/secrets\[\s*['"][A-Z][A-Z0-9_]*['"]\s*\]/g, '')
        if (/secrets\s*\[/.test(unresolved)) found.add('unresolved secrets index')
    }
    if (/\bsecrets:\s*inherit\b/.test(lines.join('\n'))) found.add('inherited secrets')
    return [...found]
}

function reachableFromPullRequest(triggers, ifText) {
    for (const event of ['pull_request', 'pull_request_target']) {
        if (!triggers.has(event)) continue
        if (expressionCanRun(ifText, { event, ref: 'refs/heads/pr' })) return true
    }
    return false
}

function unwrapIf(ifText) {
    let expr = stripYamlComments(ifText).trim()
    expr = expr.replace(/^>-?\s*/, '')
    expr = expr.replace(/^\|[+-]?\s*/, '')
    expr = expr.replace(/^\$\{\{\s*/, '').replace(/\s*}}$/, '')
    return expr.trim()
}

function stripYamlComments(expr) {
    return expr
        .split('\n')
        .map((line) => {
            let quote = ''
            let out = ''
            for (const ch of line) {
                if (quote) {
                    out += ch
                    if (ch === quote) quote = ''
                    continue
                }
                if (ch === '"' || ch === "'") {
                    quote = ch
                    out += ch
                    continue
                }
                if (ch === '#') break
                out += ch
            }
            return out
        })
        .join('\n')
}

function tokenize(expr) {
    const tokens = []
    let index = 0
    while (index < expr.length) {
        if (/\s/.test(expr[index])) {
            index += 1
            continue
        }
        if (expr.startsWith('&&', index)) {
            tokens.push({ type: 'and' })
            index += 2
            continue
        }
        if (expr.startsWith('||', index)) {
            tokens.push({ type: 'or' })
            index += 2
            continue
        }
        if (expr.startsWith('==', index)) {
            tokens.push({ type: 'eq' })
            index += 2
            continue
        }
        if (expr.startsWith('!=', index)) {
            tokens.push({ type: 'neq' })
            index += 2
            continue
        }
        if (expr[index] === '!') {
            tokens.push({ type: 'not' })
            index += 1
            continue
        }
        if (expr[index] === '(') {
            tokens.push({ type: 'lpar' })
            index += 1
            continue
        }
        if (expr[index] === ')') {
            tokens.push({ type: 'rpar' })
            index += 1
            continue
        }
        if (expr[index] === "'" || expr[index] === '"') {
            const quote = expr[index]
            const end = expr.indexOf(quote, index + 1)
            if (end < 0) return null
            tokens.push({ type: 'str', value: expr.slice(index + 1, end) })
            index = end + 1
            continue
        }
        const ident = expr.slice(index).match(/^[A-Za-z_][A-Za-z0-9_.-]*/)
        if (ident) {
            tokens.push({ type: 'ident', value: ident[0] })
            index += ident[0].length
            continue
        }
        return null
    }
    return tokens
}

function parseOr(tokens) {
    const first = parseAnd(tokens)
    if (!first) return null
    const nodes = [first.node]
    let rest = first.rest
    while (rest[0]?.type === 'or') {
        const next = parseAnd(rest.slice(1))
        if (!next) return null
        nodes.push(next.node)
        rest = next.rest
    }
    return { node: nodes.length === 1 ? nodes[0] : { type: 'or', nodes }, rest }
}

function parseAnd(tokens) {
    const first = parseUnary(tokens)
    if (!first) return null
    const nodes = [first.node]
    let rest = first.rest
    while (rest[0]?.type === 'and') {
        const next = parseUnary(rest.slice(1))
        if (!next) return null
        nodes.push(next.node)
        rest = next.rest
    }
    return { node: nodes.length === 1 ? nodes[0] : { type: 'and', nodes }, rest }
}

function parseUnary(tokens) {
    if (tokens[0]?.type === 'not') {
        const inner = parseUnary(tokens.slice(1))
        if (!inner) return null
        return { node: { type: 'not', node: inner.node }, rest: inner.rest }
    }
    return parsePrimary(tokens)
}

function parsePrimary(tokens) {
    if (tokens[0]?.type === 'lpar') {
        const inner = parseOr(tokens.slice(1))
        if (!inner || inner.rest[0]?.type !== 'rpar') return null
        return { node: inner.node, rest: inner.rest.slice(1) }
    }
    if (tokens[0]?.type === 'ident' && tokens[1]?.type === 'lpar' && tokens[2]?.type === 'rpar') {
        return {
            node: { type: 'call', name: tokens[0].value },
            rest: tokens.slice(3),
        }
    }
    if (
        tokens[0]?.type === 'ident' &&
        (tokens[1]?.type === 'eq' || tokens[1]?.type === 'neq') &&
        (tokens[2]?.type === 'str' || tokens[2]?.type === 'ident')
    ) {
        return {
            node: {
                type: 'cmp',
                op: tokens[1].type,
                left: tokens[0].value,
                right: tokens[2].type === 'str' ? tokens[2].value : tokens[2].value,
            },
            rest: tokens.slice(3),
        }
    }
    if (tokens[0]?.type === 'ident') {
        return { node: { type: 'unknown' }, rest: tokens.slice(1) }
    }
    return null
}

function evalNode(node, ctx) {
    if (node.type === 'or')
        return fold(
            node.nodes.map((child) => evalNode(child, ctx)),
            TRUE,
            FALSE,
        )
    if (node.type === 'and')
        return fold(
            node.nodes.map((child) => evalNode(child, ctx)),
            FALSE,
            TRUE,
        )
    if (node.type === 'not') {
        const value = evalNode(node.node, ctx)
        if (value === UNKNOWN) return UNKNOWN
        return value === TRUE ? FALSE : TRUE
    }
    if (node.type === 'call') return node.name === 'always' ? TRUE : UNKNOWN
    if (node.type === 'cmp') return evalCmp(node, ctx)
    return UNKNOWN
}

function fold(values, short, identity) {
    if (values.includes(short)) return short
    if (values.includes(UNKNOWN)) return UNKNOWN
    return identity
}

function evalCmp(node, ctx) {
    let actual = null
    if (node.left === 'github.event_name') actual = ctx.event
    else if (node.left === 'github.ref') actual = ctx.ref
    else return UNKNOWN
    if (node.op === 'eq') return actual === node.right ? TRUE : FALSE
    return actual !== node.right ? TRUE : FALSE
}

function main() {
    const problems = violationsInTree(process.cwd())
    if (problems.length > 0) {
        for (const problem of problems) console.error(`[FAIL] ${problem}`)
        process.exit(1)
    }
    console.log(
        '[OK] Deploy, signing, and release secrets stay off pull_request and off non-main dispatch.',
    )
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main()
