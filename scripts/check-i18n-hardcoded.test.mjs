import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { collectTsxFiles, EXCLUDED_FILES, scanSource } from './check-i18n-hardcoded.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const texts = (source) => scanSource(source).map(({ line, text }) => `${line}:${text}`)

test('text and props on the tag line are found', () => {
    assert.deepEqual(texts('<p>Some Hardcoded Words</p>'), ['1:Some Hardcoded Words'])
    assert.deepEqual(texts('<button title="Click This Button">x</button>'), ['1:Click This Button'])
})

test('text that Prettier wrapped onto its own line is found', () => {
    const afterIcon = [
        '<Button onClick={save}>',
        '    <Icon className="w-5 h-5" />',
        '    Save Experiment Results',
        '</Button>',
    ].join('\n')
    assert.deepEqual(texts(afterIcon), ['3:Save Experiment Results'])
    const beforeClose = ['<span>', '    {icon}', '    IoT Live', '</span>'].join('\n')
    assert.deepEqual(texts(beforeClose), ['3:IoT Live'])
})

test('a class list, an export or a URL on the line no longer hides its text', () => {
    // These were whole-line skips: any className, any export, any `//` such as https://.
    assert.deepEqual(texts('<p className="text-sm">Some Hardcoded Words</p>'), [
        '1:Some Hardcoded Words',
    ])
    assert.deepEqual(texts('export const Probe = () => <p>Some Hardcoded Words</p>'), [
        '1:Some Hardcoded Words',
    ])
    assert.deepEqual(texts('<a href="https://example.org">Visit Our Site</a>'), [
        '1:Visit Our Site',
    ])
})

test('translated text, comments, code and single words stay quiet', () => {
    for (const source of [
        '// <p>Some Hardcoded Words</p>',
        ' * <p>Some Hardcoded Words</p>',
        '<p>Live</p>',
        'const label = value\n    Some Words Here\n',
        "<p>\n    {t('a.b')}\n</p>",
    ]) {
        assert.deepEqual(texts(source), [], source)
    }
})

test('text inside a multi-line block or JSX comment is not UI text', () => {
    assert.deepEqual(texts(['/*', 'Some Example Text', '*/', 'export {}'].join('\n')), [])
    assert.deepEqual(
        texts(['<div>', '    {/*', '    Some Example Text', '    */}', '</div>'].join('\n')),
        [],
    )
    // The same text right after the comment, inside the JSX, is still found.
    const afterComment = [
        '<Button>',
        '    {/* the icon */}',
        '    <Icon />',
        '    Save Experiment Results',
        '</Button>',
    ].join('\n')
    assert.deepEqual(texts(afterComment), ['4:Save Experiment Results'])
    // A glob in an attribute does not open a comment.
    assert.deepEqual(texts('<input accept="image/*" />\n<p>Some Hardcoded Words</p>'), [
        '2:Some Hardcoded Words',
    ])
})

test('text beside a translated expression is checked; translated text alone is not', () => {
    assert.deepEqual(texts("<p>{t('plants.title')} Some Words</p>"), ['1:Some Words'])
    assert.deepEqual(texts("<p>{t('plants.title')}</p>"), [])
    // A call the stripper cannot remove still skips its line, as before.
    assert.deepEqual(texts("<p>{t('a', { n: 1 })} Some Words</p>"), [])
    // The same on its own line, as Prettier wraps it inside a tag.
    assert.deepEqual(texts("<p>\n    {t('plants.title')} Some Words\n</p>"), ['2:Some Words'])
    assert.deepEqual(texts("<p>\n    {t('plants.title')}\n</p>"), [])
})

test('an arrow or prose arrow is not an opening tag', () => {
    for (const before of ['const render = () =>', 'Step one ->']) {
        assert.deepEqual(texts(`${before}\n    Some Example Text\nconst next = 1`), [], before)
    }
    assert.deepEqual(texts('<p>\n    Some Example Text\nconst next = 1'), ['2:Some Example Text'])
})

test('an excluded file is excluded by its path, not by its name in any directory', (t) => {
    const web = mkdtempSync(join(tmpdir(), 'cg-i18n-'))
    t.after(() => rmSync(web, { recursive: true, force: true }))
    for (const file of [
        'bootstrap/render.tsx',
        'components/views/render.tsx',
        'components/common/DevTelemetryPanel.tsx',
        'components/views/DevTelemetryPanel.tsx',
        'components/views/Panel.test.tsx',
    ]) {
        mkdirSync(dirname(join(web, file)), { recursive: true })
        writeFileSync(join(web, file), '<p>Some Hardcoded Words</p>\n')
    }
    const collected = collectTsxFiles(web).map((file) => relative(web, file).replaceAll('\\', '/'))
    assert.deepEqual(collected.sort(), [
        'components/views/DevTelemetryPanel.tsx',
        'components/views/render.tsx',
    ])
    // Every exclusion names a real file that the real scan then skips: none is stale.
    const appDir = resolve(ROOT, 'apps/web')
    const real = collectTsxFiles().map((file) => relative(appDir, file).replaceAll('\\', '/'))
    for (const excluded of EXCLUDED_FILES) {
        assert.ok(existsSync(resolve(appDir, excluded)), `stale exclusion ${excluded}`)
        assert.ok(!real.includes(excluded), excluded)
    }
})

test('CI runs the check in strict mode, so a finding fails the job', () => {
    // Without CHECK_I18N_STRICT=1 the check prints its findings and exits 0.
    const ci = readFileSync(resolve(ROOT, '.github/workflows/ci.yml'), 'utf8')
    assert.match(
        ci,
        /- name: Hardcoded UI strings \(web app \.tsx\)\n(?:\s+#[^\n]*\n)*\s+env:\n\s+CHECK_I18N_STRICT: '1'\n\s+run: pnpm run lint:i18n\n/,
    )
})
