import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'

// Resolve the parser through its real TypeDoc consumer, without relying on hoisting.
const require = createRequire(import.meta.url)
const typedocEntry = require.resolve('typedoc')
const requireTypedoc = createRequire(typedocEntry)
const manifestPath = requireTypedoc.resolve('markdown-it/package.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const moduleEntry = pathToFileURL(resolve(dirname(manifestPath), manifest.exports['.'].import))

const entrypoints = {
    CommonJS: () => requireTypedoc('markdown-it'),
    ESM: async () => (await import(moduleEntry.href)).default,
}

for (const [name, load] of Object.entries(entrypoints)) {
    test(`${name} Markdown parser contract`, async (context) => {
        const MarkdownIt = await load()
        const parser = new MarkdownIt()

        await context.test('retains useful documentation markup, Unicode and safe links', () => {
            const html = parser.render(
                '# Guide\n\n**Größe** and [reference](https://example.test)\n',
            )
            assert.match(html, /<h1>Guide<\/h1>/u)
            assert.match(html, /<strong>Größe<\/strong>/u)
            assert.match(html, /href="https:\/\/example\.test"/u)
        })

        await context.test('preserves the default HTML and Markdown URL safeguards', () => {
            const html = parser.render('<script>alert(1)</script>\n\n[unsafe](javascript:alert(1))')
            assert.match(html, /&lt;script&gt;/u)
            assert.doesNotMatch(html, /<script\b/u)
            assert.doesNotMatch(html, /href="javascript:/u)
        })
    })
}

test('TypeDoc loads its real Markdown helpers without a project build', async () => {
    // TypeDoc constructs MarkdownIt helpers during module initialization. Importing
    // it checks the actual generator boundary without converting the app or emitting docs.
    const typedoc = await import(pathToFileURL(typedocEntry).href)
    assert.equal(typeof typedoc.Application.bootstrap, 'function')
})
