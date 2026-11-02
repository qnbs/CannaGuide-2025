import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { test } from 'node:test'

const read = (path) => readFileSync(path, 'utf8')

function globToRegExp(glob) {
    let source = ''
    for (let index = 0; index < glob.length; index += 1) {
        if (glob.startsWith('**', index)) {
            source += '.*'
            index += 1
            if (glob[index + 1] === '/') index += 1
            continue
        }
        if (glob[index] === '*') {
            source += '[^/]*'
            continue
        }
        source += glob[index].replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    }
    return new RegExp(`^${source}$`)
}

function parseRule(path) {
    const text = read(path)
    const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)
    assert.ok(frontmatter, `${path} is missing frontmatter`)
    const fields = {}
    for (const line of frontmatter[1].split('\n')) {
        const split = line.indexOf(':')
        assert.ok(split > 0, `${path} has a frontmatter line without a key`)
        const key = line.slice(0, split).trim()
        const raw = line.slice(split + 1).trim()
        fields[key] = raw === 'true' ? true : raw === 'false' ? false : raw
    }
    const globs =
        typeof fields.globs === 'string' && fields.globs.length > 0
            ? fields.globs.split(',').map((glob) => glob.trim())
            : []
    return { path, fields, globs, alwaysApply: fields.alwaysApply === true }
}

function applies(rule, file) {
    if (rule.alwaysApply) return true
    return rule.globs.some((glob) => globToRegExp(glob).test(file))
}

const rules = readdirSync('.cursor/rules')
    .filter((name) => name.endsWith('.mdc'))
    .sort()
    .map((name) => parseRule(`.cursor/rules/${name}`))

test('Cursor does not configure Graphify; Claude Code keeps it', () => {
    assert.equal(existsSync('.cursor/mcp.json'), false)
    const claude = JSON.parse(read('.mcp.json'))
    assert.ok(claude.mcpServers.graphify)
    assert.ok(claude.mcpServers.gitkraken)
    const doctor = read('scripts/graphify-mcp-doctor.mjs')
    assert.equal(doctor.includes('Cursor reads .cursor/mcp.json'), false)
    assert.match(doctor, /Cursor does not run Graphify or codegraph/)
})

test('project rules have the expected scope and do not name a permanent writer', () => {
    assert.deepEqual(
        rules.map((rule) => rule.path),
        [
            '.cursor/rules/00-repository-governance.mdc',
            '.cursor/rules/10-web-typescript-state.mdc',
            '.cursor/rules/20-strains-evidence-data.mdc',
            '.cursor/rules/30-ci-security-deps.mdc',
        ],
    )
    const governance = rules[0]
    assert.equal(governance.alwaysApply, true)
    assert.deepEqual(governance.globs, [])
    assert.match(governance.fields.description, /Writer lease/)
    for (const rule of rules.slice(1)) {
        assert.equal(rule.alwaysApply, false)
        assert.ok(rule.globs.length > 0)
    }
    const governanceText = read(governance.path)
    assert.equal(governanceText.includes('currently Claude'), false)
    assert.equal(governanceText.includes('permanent sole'), false)
    assert.match(governanceText, /QNB-259/)
})

test('scoped rules match their files and skip unrelated ones', () => {
    const matches = (file) => rules.filter((rule) => applies(rule, file)).map((rule) => rule.path)
    assert.deepEqual(matches('README.md'), ['.cursor/rules/00-repository-governance.mdc'])
    assert.ok(matches('apps/web/stores/store.ts').includes('.cursor/rules/10-web-typescript-state.mdc'))
    assert.equal(
        matches('apps/web/stores/store.ts').includes('.cursor/rules/30-ci-security-deps.mdc'),
        false,
    )
    assert.ok(
        matches('apps/web/data/strains/a.ts').includes('.cursor/rules/20-strains-evidence-data.mdc'),
    )
    assert.ok(
        matches('packages/ai-core/src/domain/strain.ts').includes(
            '.cursor/rules/20-strains-evidence-data.mdc',
        ),
    )
    assert.ok(
        matches('scripts/generate-strain-files.mjs').includes(
            '.cursor/rules/20-strains-evidence-data.mdc',
        ),
    )
    assert.ok(matches('.github/workflows/ci.yml').includes('.cursor/rules/30-ci-security-deps.mdc'))
    assert.deepEqual(matches('scripts/codegraph.mjs'), [
        '.cursor/rules/00-repository-governance.mdc',
    ])
    assert.deepEqual(matches('scripts/graphify-mcp-launcher.mjs'), [
        '.cursor/rules/00-repository-governance.mdc',
    ])
})

test('agent-doc changes still run this file', () => {
    const ci = read('.github/workflows/ci.yml')
    const policy = ci.slice(ci.indexOf('\n    policy:'), ci.indexOf('\n    rust:'))
    assert.match(policy, /cursor-project-config\.test\.mjs/)
})

test('agent docs name the lease and the current stack', () => {
    const agents = read('AGENTS.md')
    assert.match(agents, /QNB-259/)
    assert.equal(agents.includes('currently Claude Code'), false)
    const guide = read('docs/GRAPHIFY-COMPLETE-GUIDE.md').split('\n').slice(0, 12).join('\n')
    assert.match(guide, /Claude Code CLI/)
    assert.match(guide, /Cursor does not run those tools/)
    assert.equal(guide.includes('Cursor project MCP'), false)
    const copilot = read('.github/copilot-instructions.md')
    assert.match(copilot, /\*\*Version:\*\* 1\.11\.0/)
    assert.match(copilot, /Vite 8/)
    assert.match(copilot, /pnpm 11\.19\.0/)
    assert.equal(/Cloudflare Pages[^\n]*PAUSED/.test(copilot), false)
    assert.match(copilot, /Netlify GitHub Actions deploys stay paused/)
})
