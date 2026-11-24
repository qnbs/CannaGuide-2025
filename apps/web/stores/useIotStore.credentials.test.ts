import { beforeEach, describe, expect, it, vi } from 'vitest'

// The start loads the saved broker credential while the UI is already usable, so a new one
// can be typed while the saved one still decrypts. The newer one must win (GH #945 review).

const crypto = vi.hoisted(() => ({
    releaseDecrypt: (): void => undefined,
    failDecrypt: false,
}))
vi.mock('@/services/cryptoService', () => ({
    encrypt: async (value: string) => `sealed:${value}`,
    decrypt: (value: string) =>
        new Promise<string>((resolve, reject) => {
            crypto.releaseDecrypt = () =>
                crypto.failDecrypt ? reject(new Error('bad key')) : resolve(value.slice(7))
        }),
}))

const load = async () => {
    vi.resetModules()
    const { useIotStore } = await import('./useIotStore')
    return useIotStore
}

describe('loading the saved broker credential', () => {
    beforeEach(() => {
        localStorage.clear()
        crypto.failDecrypt = false
    })

    it('applies the saved value when nothing changed meanwhile', async () => {
        const store = await load()
        const saved = 'grow-room'
        await store.getState().setPassword(saved)
        store.setState({ password: '' })
        const loading = store.getState().loadPersistedPassword()
        crypto.releaseDecrypt()
        await loading
        expect(store.getState().password).toBe(saved)
    })

    it('keeps a value typed while the saved one was still decrypting', async () => {
        const store = await load()
        await store.getState().setPassword('grow-room')
        store.setState({ password: '' })
        const loading = store.getState().loadPersistedPassword()
        const typedLater = 'grow-room-2'
        await store.getState().setPassword(typedLater)
        crypto.releaseDecrypt()
        await loading
        expect(store.getState().password).toBe(typedLater)
        expect(store.getState().encryptedPassword).toBe(`sealed:${typedLater}`)
    })

    it('does not clear a value typed while a failing decryption was pending', async () => {
        const store = await load()
        await store.getState().setPassword('grow-room')
        const loading = store.getState().loadPersistedPassword()
        const typedLater = 'grow-room-2'
        await store.getState().setPassword(typedLater)
        crypto.failDecrypt = true
        crypto.releaseDecrypt()
        await loading
        expect(store.getState().password).toBe(typedLater)
        expect(store.getState().encryptedPassword).toBe(`sealed:${typedLater}`)
    })
})
