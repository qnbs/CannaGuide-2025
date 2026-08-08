import { fireEvent, screen } from '@testing-library/react'
import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderError } from './render'

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
        expect(recoveryHandler).toHaveBeenCalledOnce()
        globalThis.removeEventListener('cannaguide-safe-recovery-request', recoveryHandler)
    })
})
