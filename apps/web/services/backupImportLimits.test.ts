import { describe, expect, it } from 'vitest'
import type JSZip from 'jszip'
import { BackupImportLimitError, readEntryText } from '@/services/backupImportLimits'

/** A fake entry whose internalStream emits the given chunks in order. */
const entryEmitting = (name: string, chunks: Uint8Array[]): JSZip.JSZipObject => {
    const handlers: Record<string, (arg?: unknown) => void> = {}
    const stream = {
        on(event: string, listener: (arg?: unknown) => void) {
            handlers[event] = listener
            return stream
        },
        pause: () => stream,
        resume() {
            queueMicrotask(() => {
                for (const chunk of chunks) handlers['data']?.(chunk)
                handlers['end']?.()
            })
            return stream
        },
    }
    return { name, internalStream: () => stream } as unknown as JSZip.JSZipObject
}

describe('readEntryText (#671, #748 review)', () => {
    it('decodes a character split across two chunks', async () => {
        const bytes = new TextEncoder().encode('{"note":"Blüte"}')
        const split = bytes.indexOf(0xc3) + 1 // inside the two-byte "ü"
        const text = await readEntryText(
            entryEmitting('state.json', [bytes.slice(0, split), bytes.slice(split)]),
            1024,
            { remaining: 1024 },
        )
        expect(text).toBe('{"note":"Blüte"}')
    })

    it('stops at the entry limit and charges the shared budget', async () => {
        const chunk = new Uint8Array(600).fill(0x61)
        const budget = { remaining: 10_000 }
        await expect(
            readEntryText(entryEmitting('big.json', [chunk, chunk]), 1000, budget),
        ).rejects.toBeInstanceOf(BackupImportLimitError)
        expect(budget.remaining).toBe(10_000 - 1200)
    })

    it('stops when the shared budget runs out across entries', async () => {
        const chunk = new Uint8Array(600).fill(0x61)
        const budget = { remaining: 1000 }
        await expect(
            readEntryText(entryEmitting('a.json', [chunk]), 1000, budget),
        ).resolves.toHaveLength(600)
        await expect(
            readEntryText(entryEmitting('b.json', [chunk]), 1000, budget),
        ).rejects.toBeInstanceOf(BackupImportLimitError)
    })

    it('refuses an entry without a stream instead of inflating it whole', async () => {
        const entry = { name: 'x.json', async: async () => 'x' } as unknown as JSZip.JSZipObject
        await expect(readEntryText(entry, 1000, { remaining: 1000 })).rejects.toBeInstanceOf(
            BackupImportLimitError,
        )
    })
})
