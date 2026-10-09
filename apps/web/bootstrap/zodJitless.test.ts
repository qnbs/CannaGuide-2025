import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { CSP } from '@/securityHeaders'

const emptyConstructs = { count: 0 }
const originalFunction = globalThis.Function

const installFunctionSpy = (): void => {
    emptyConstructs.count = 0
    const wrapped = new Proxy(originalFunction, {
        construct(target, args, newTarget) {
            if (args.length === 1 && args[0] === '') {
                emptyConstructs.count += 1
            }
            return Reflect.construct(target, args, newTarget)
        },
    })
    globalThis.Function = wrapped as typeof Function
}

afterEach(() => {
    globalThis.Function = originalFunction
    const config = globalThis as { __zod_globalConfig?: { jitless?: boolean } }
    if (config.__zod_globalConfig) {
        config.__zod_globalConfig.jitless = true
    }
})

const firstImport = (source: string): string | undefined => {
    // Side-effect imports and `import ... from '...'` both count. The match is
    // anchored at the start so a later side-effect import cannot hide an earlier
    // named import.
    const match = source.match(/^\s*import\s+(?:type\s+)?(?:[^'"\n]+from\s+)?['"]([^'"]+)['"]/)
    return match?.[1]
}

describe('zod jitless', () => {
    it('is the first import of the app entry and the test setup', () => {
        const root = process.cwd()
        const indexSource = readFileSync(resolve(root, 'index.tsx'), 'utf8')
        const setupSource = readFileSync(resolve(root, 'vitest.setup.ts'), 'utf8')
        expect(firstImport(indexSource)).toBe('./bootstrap/zodJitless')
        expect(firstImport(setupSource)).toBe('./bootstrap/zodJitless')
        expect(firstImport("import { z } from 'zod'\nimport './bootstrap/zodJitless'\n")).toBe('zod')
        expect(firstImport("import './bootstrap/zodJitless'\nimport { z } from 'zod'\n")).toBe(
            './bootstrap/zodJitless',
        )
    })

    it('keeps script-src free of unsafe-eval', () => {
        const scriptSrc = CSP.split(';')
            .map((part) => part.trim())
            .find((part) => part.startsWith('script-src'))
        const tokens = scriptSrc?.split(/\s+/) ?? []
        expect(tokens).not.toContain("'unsafe-eval'")
        expect(tokens).toContain("'wasm-unsafe-eval'")
    })

    it('does not construct Function while a schema parses', async () => {
        vi.resetModules()
        const { z } = await import('zod')
        z.config({ jitless: true })
        installFunctionSpy()
        const parsed = z.object({ name: z.string() }).parse({ name: 'ok' })
        expect(parsed).toEqual({ name: 'ok' })
        expect(emptyConstructs.count).toBe(0)
    })

    it('still constructs Function for the probe when jitless is off', async () => {
        vi.resetModules()
        const { z } = await import('zod')
        z.config({ jitless: false })
        installFunctionSpy()
        z.object({ name: z.string() }).parse({ name: 'ok' })
        expect(emptyConstructs.count).toBeGreaterThan(0)
    })
})
