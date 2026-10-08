import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const LOCALES = ['en', 'de', 'es', 'fr', 'nl'] as const

const connectSrcHosts = (): string[] => {
    const source = readFileSync(path.join(webRoot, 'securityHeaders.ts'), 'utf8')
    const match = source.match(/"connect-src ([^"]+)"/)
    expect(match).not.toBeNull()
    return (match?.[1] ?? '')
        .split(/\s+/)
        .filter((token) => token.startsWith('https://'))
        .map((token) => token.slice('https://'.length))
}

describe('privacy copy', () => {
    it('names every CSP connect-src host in each locale privacy statement', () => {
        const hosts = connectSrcHosts()
        expect(hosts.length).toBeGreaterThan(0)
        for (const locale of LOCALES) {
            const source = readFileSync(path.join(webRoot, 'locales', locale, 'legal.ts'), 'utf8')
            for (const host of hosts) {
                expect(source, `${locale} missing ${host}`).toContain(host)
            }
            expect(source).not.toContain('Google Fonts')
        }
    })

    it('does not treat the repealed TMG citation as a decided Impressum exemption', () => {
        for (const locale of LOCALES) {
            const source = readFileSync(path.join(webRoot, 'locales', locale, 'legal.ts'), 'utf8')
            expect(source).toContain('DDG')
            expect(source).not.toMatch(
                /TMG[^.]{0,80}(required|erforderlich|requis|vereist|requiere)/,
            )
        }
    })

    it('does not promise cross-device cloud sync in onboarding', () => {
        const forbidden = [
            'across devices',
            'enable cloud sync later',
            'zwischen Geraeten',
            'zwischen Geräten',
            'Cloud-Sync später',
            'entre dispositivos',
            'sincronizacion en la nube mas tarde',
            'entre appareils',
            'synchronisation cloud plus tard',
            'tussen apparaten',
            'cloudsynchronisatie inschakelen',
        ]
        for (const locale of LOCALES) {
            const source = readFileSync(
                path.join(webRoot, 'locales', locale, 'onboarding.ts'),
                'utf8',
            )
            for (const phrase of forbidden) {
                expect(source, `${locale} still says ${phrase}`).not.toContain(phrase)
            }
        }
    })
})
