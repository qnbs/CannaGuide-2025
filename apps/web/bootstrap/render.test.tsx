import { fireEvent, screen } from '@testing-library/react'
import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderError } from './render'

vi.mock('@/i18n', () => ({
    getT: () => (key: string) => {
        if (key === 'common.errorBoundary.safeRecovery') return 'Try Safe Recovery'
        if (key === 'common.errorBoundary.safeRecoveryDescription') {
            return 'Restore the last validated backup.'
        }
        return key
    },
    i18nInstance: {},
}))

describe('renderError', () => {
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
