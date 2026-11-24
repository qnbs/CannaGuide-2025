import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { scanSource } from './check-i18n-hardcoded.mjs'

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
        "<p>{t('plants.title')} Some Words</p>",
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

test('CI runs the check in strict mode, so a finding fails the job', () => {
    // Without CHECK_I18N_STRICT=1 the check prints its findings and exits 0.
    const ci = readFileSync(resolve(ROOT, '.github/workflows/ci.yml'), 'utf8')
    assert.match(
        ci,
        /- name: Hardcoded UI strings \(web app \.tsx\)\n(?:\s+#[^\n]*\n)*\s+env:\n\s+CHECK_I18N_STRICT: '1'\n\s+run: pnpm run lint:i18n\n/,
    )
})
