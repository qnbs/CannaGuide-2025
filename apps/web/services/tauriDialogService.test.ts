import { describe, expect, it, vi } from 'vitest'
import { saveFileDialog, openFileDialog } from './tauriDialogService'

// Mock platformService to make isTauri false
vi.mock('@/services/platformService', () => ({
    platform: {
        isTauri: false,
        isPwa: true,
        isBrowser: true,
    },
}))

describe('tauriDialogService', () => {
    describe('saveFileDialog (web fallback)', () => {
        it('returns null path on web platform', async () => {
            const result = await saveFileDialog('test data', 'export.json')
            expect(result.path).toBeNull()
        })
    })

    describe('openFileDialog (web fallback)', () => {
        it('returns null path and content on web platform', async () => {
            const result = await openFileDialog('import.json')
            expect(result.path).toBeNull()
            expect(result.content).toBeNull()
        })
    })
})
