import { fireEvent, screen } from '@testing-library/react'
import { act, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    getT: vi.fn(() => (key: string) => {
        if (key === 'common.errorBoundary.safeRecovery') return 'Try Safe Recovery'
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
