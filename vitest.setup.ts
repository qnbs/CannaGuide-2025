import '@testing-library/jest-dom/vitest'
import { webcrypto } from 'node:crypto'
import { beforeAll } from 'vitest'
import { i18nPromise } from './i18n'

// jsdom provides crypto.getRandomValues but NOT crypto.subtle.
// Restore Node.js WebCrypto so AES-GCM encryption works in tests (Node 20 CI).
if (typeof globalThis.crypto?.subtle === 'undefined') {
    Object.defineProperty(globalThis, 'crypto', {
        value: webcrypto,
        configurable: true,
    })
}

beforeAll(async () => {
    await i18nPromise
})
