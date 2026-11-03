import { fireEvent, screen } from '@testing-library/react'
import { act, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    getT: vi.fn(() => (key: string) => {
        if (key === 'common.errorBoundary.safeRecovery') return 'Try Safe Recovery'
        if (key === 'common.otherTab.reload') return 'Reload this tab'
        if (key === 'common.staleTab.reload') return 'Reload this tab'
        if (key === 'common.errorBoundary.safeRecoveryDescription') {
            return 'Restore the last validated backup.'
        }
        return key
    }),
}))

vi.mock('@/i18n', () => ({
    getT: mocks.getT,
    i18nInstance: {},
}))

vi.mock('@/components/views/plants/App', () => ({ App: () => null }))
vi.mock('@/components/common/ErrorBoundary', () => ({
    ErrorBoundary: ({ children }: { children: ReactNode }) => children,
}))

let renderError: typeof import('./render').renderError
let renderOtherTabNotice: typeof import('./render').renderOtherTabNotice
let renderStaleTabNotice: typeof import('./render').renderStaleTabNotice
let renderUnverifiedTabNotice: typeof import('./render').renderUnverifiedTabNotice

describe('renderError', () => {
    beforeEach(async () => {
        vi.resetModules()
        ;({ renderError } = await import('./render'))
    })

    it('offers explicit safe recovery when startup fails', async () => {
        document.body.innerHTML = '<div id="root"></div>'
        const recoveryHandler = vi.fn()
        globalThis.addEventListener('cannaguide-safe-recovery-request', recoveryHandler)

        await act(async () => {
            renderError(new Error('Hydration failed'))
        })
        fireEvent.click(screen.getByRole('button', { name: 'Try Safe Recovery' }))

        expect(screen.getByText('Hydration failed')).toBeInTheDocument()
        expect(screen.getByText('Restore the last validated backup.')).toBeInTheDocument()
        expect(recoveryHandler).toHaveBeenCalledOnce()
        globalThis.removeEventListener('cannaguide-safe-recovery-request', recoveryHandler)
    })
})

describe('renderOtherTabNotice', () => {
    beforeEach(async () => {
        vi.resetModules()
        ;({ renderOtherTabNotice } = await import('./render'))
    })

    it('explains the pause and lets the user reload', () => {
        document.body.innerHTML = '<div id="root"></div>'
        const reload = vi.fn()

        act(() => {
            renderOtherTabNotice(reload)
        })

        const notice = screen.getByRole('alert')
        expect(notice).toHaveTextContent('common.otherTab.title')
        expect(notice).toHaveTextContent('common.otherTab.description')
        fireEvent.click(screen.getByRole('button', { name: 'Reload this tab' }))
        expect(reload).toHaveBeenCalledOnce()
    })
})

describe('renderStaleTabNotice', () => {
    beforeEach(async () => {
        vi.resetModules()
        ;({ renderStaleTabNotice } = await import('./render'))
    })

    it('says the page is out of date and lets the user reload', () => {
        document.body.innerHTML = '<div id="root"></div>'
        const reload = vi.fn()

        act(() => {
            renderStaleTabNotice(reload)
        })

        const notice = screen.getByRole('alert')
        expect(notice).toHaveTextContent('common.staleTab.title')
        expect(notice).toHaveTextContent('common.staleTab.description')
        fireEvent.click(screen.getByRole('button', { name: 'Reload this tab' }))
        expect(reload).toHaveBeenCalledOnce()
    })
})

describe('renderUnverifiedTabNotice', () => {
    beforeEach(async () => {
        vi.resetModules()
        ;({ renderUnverifiedTabNotice } = await import('./render'))
    })

    it('says saving is paused, not that another tab changed the data, and lets the user reload', () => {
        document.body.innerHTML = '<div id="root"></div>'
        const reload = vi.fn()

        act(() => {
            renderUnverifiedTabNotice(reload)
        })

        const notice = screen.getByRole('alert')
        expect(notice).toHaveTextContent('common.unverifiedTab.title')
        expect(notice).toHaveTextContent('common.unverifiedTab.description')
        expect(notice).not.toHaveTextContent('common.staleTab.title')
        fireEvent.click(screen.getByRole('button', { name: 'Reload this tab' }))
        expect(reload).toHaveBeenCalledOnce()
    })
})
