import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setLocalOnlyMode } from '@/services/localOnlyModeService'
import {
    assertEgressAllowed,
    classifyDestination,
    EgressBlockedError,
    egressFetch,
    isEgressAllowed,
} from './egress'

describe('classifyDestination', () => {
    it.each([
        ['data:image/png;base64,AAAA', 'inline'],
        ['blob:https://example.org/1234', 'inline'],
        [`${globalThis.location.origin}/models/weights.bin`, 'same-origin'],
        ['./version.json', 'same-origin'],
        ['ws://192.168.1.20:9001', 'private-network'],
        ['wss://10.0.0.5/mqtt', 'private-network'],
        ['ws://172.16.0.1:1883', 'private-network'],
        ['ws://172.31.255.1:1883', 'private-network'],
        ['ws://127.0.0.1:9001', 'private-network'],
        ['ws://169.254.10.2', 'private-network'],
        ['ws://localhost:9001', 'private-network'],
        ['ws://broker.local:9001', 'private-network'],
        ['ws://broker.home.arpa', 'private-network'],
        ['ws://broker.local.:9001', 'private-network'],
        ['ws://LOCALHOST.:9001', 'private-network'],
        ['ws://[::1]:9001', 'private-network'],
        ['ws://[fd12:3456::1]:9001', 'private-network'],
        ['ws://[fe80::1]:9001', 'private-network'],
        ['ws://172.32.0.1:1883', 'public'],
        ['ws://192.169.0.1', 'public'],
        ['wss://broker.hivemq.cloud:8884/mqtt', 'public'],
        ['https://api.elevenlabs.io/v1/text-to-speech/x', 'public'],
        ['https://localhost.example.com', 'public'],
        ['http://[2001:db8::1]', 'public'],
        ['http://exa mple.com', 'public'],
    ])('%s is %s', (destination, kind) => {
        expect(classifyDestination(destination)).toBe(kind)
    })
})

describe('egress gate', () => {
    beforeEach(() => setLocalOnlyMode(false))
    afterEach(() => {
        setLocalOnlyMode(false)
        vi.unstubAllGlobals()
    })

    it('lets everything out while Local-Only Mode is off', () => {
        expect(isEgressAllowed('https://api.elevenlabs.io/v1')).toBe(true)
        expect(isEgressAllowed('wss://broker.hivemq.cloud/mqtt')).toBe(true)
    })

    it('in Local-Only Mode allows only the device and same-origin assets by default', () => {
        setLocalOnlyMode(true)

        expect(isEgressAllowed('data:text/plain,x')).toBe(true)
        expect(isEgressAllowed('./manifest.json')).toBe(true)
        expect(isEgressAllowed('ws://192.168.1.20:9001')).toBe(false)
        expect(isEgressAllowed('https://api.openai.com/v1/chat/completions')).toBe(false)
    })

    it('in Local-Only Mode allows the LAN only for callers that opt in', () => {
        setLocalOnlyMode(true)

        expect(isEgressAllowed('ws://192.168.1.20:9001', { allowPrivateNetwork: true })).toBe(true)
        expect(
            isEgressAllowed('wss://broker.hivemq.cloud/mqtt', { allowPrivateNetwork: true }),
        ).toBe(false)
    })

    it('names only the origin of a refused destination, never credentials or path', () => {
        setLocalOnlyMode(true)

        let refusal: unknown
        try {
            assertEgressAllowed('wss://alice:s3cret@broker.example.com:8884/mqtt?token=abc')
        } catch (error) {
            refusal = error
        }

        expect(refusal).toBeInstanceOf(EgressBlockedError)
        const { message, destination } = refusal as EgressBlockedError
        expect(destination).toBe('wss://broker.example.com:8884')
        expect(message).not.toMatch(/alice|s3cret|token|mqtt\?/u)
    })

    it('egressFetch rejects without sending in Local-Only Mode', async () => {
        const fetchSpy = vi.fn()
        vi.stubGlobal('fetch', fetchSpy)
        setLocalOnlyMode(true)

        await expect(egressFetch('https://api.elevenlabs.io/v1/x')).rejects.toBeInstanceOf(
            EgressBlockedError,
        )
        expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('egressFetch refuses redirects in Local-Only Mode, so a redirect cannot leave the gate', async () => {
        const fetchSpy = vi.fn().mockResolvedValue(new Response('ok'))
        vi.stubGlobal('fetch', fetchSpy)
        setLocalOnlyMode(true)

        await egressFetch('./version.json', { cache: 'no-store' })

        expect(fetchSpy).toHaveBeenCalledWith('./version.json', {
            cache: 'no-store',
            redirect: 'error',
        })
    })

    it('egressFetch sends normally when allowed', async () => {
        const response = new Response('ok')
        const fetchSpy = vi.fn().mockResolvedValue(response)
        vi.stubGlobal('fetch', fetchSpy)

        await expect(egressFetch('https://example.org/x', { method: 'POST' })).resolves.toBe(
            response,
        )
        expect(fetchSpy).toHaveBeenCalledWith('https://example.org/x', { method: 'POST' })
    })
})
