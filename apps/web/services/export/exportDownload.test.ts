import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as exportDownload from './exportDownload'

const { generateTxt, triggerDownload } = exportDownload

describe('exportDownload', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    it('triggerDownload creates anchor, clicks, and cleans up', () => {
        const click = vi.fn()
        const remove = vi.fn()
        const anchor = { href: '', download: '', click, remove } as unknown as HTMLAnchorElement
        const createElement = vi.spyOn(document, 'createElement').mockReturnValue(anchor)
        const appendChild = vi.spyOn(document.body, 'appendChild').mockImplementation(() => anchor)
        const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)

        triggerDownload('blob:mock', 'export.txt')

        expect(createElement).toHaveBeenCalledWith('a')
        expect(anchor.href).toBe('blob:mock')
        expect(anchor.download).toBe('export.txt')
        expect(click).toHaveBeenCalled()
        expect(appendChild).toHaveBeenCalledWith(anchor)

        vi.advanceTimersByTime(100)
        expect(remove).toHaveBeenCalled()
        expect(revoke).toHaveBeenCalledWith('blob:mock')
    })

    it('generateTxt builds blob and triggers download', () => {
        const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:txt')
        const click = vi.fn()
        const anchor = {
            href: '',
            download: '',
            click,
            remove: vi.fn(),
        } as unknown as HTMLAnchorElement
        vi.spyOn(document, 'createElement').mockReturnValue(anchor)
        vi.spyOn(document.body, 'appendChild').mockImplementation(() => anchor)

        generateTxt('hello grow', 'notes.txt')

        expect(createObjectURL).toHaveBeenCalled()
        expect(anchor.download).toBe('notes.txt')
        expect(click).toHaveBeenCalled()
    })
})
