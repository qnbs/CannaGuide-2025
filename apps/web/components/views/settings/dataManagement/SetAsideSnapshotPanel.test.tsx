import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

const mocks = vi.hoisted(() => ({ readQuarantinedSnapshot: vi.fn() }))

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock('@/services/snapshotQuarantine', () => ({
    readQuarantinedSnapshot: mocks.readQuarantinedSnapshot,
}))

import { SetAsideSnapshotPanel } from './SetAsideSnapshotPanel'

const KEPT = '{"version":6,"settings":{"settings":{}},"simulation":{"plants":{"ids":["p1"]}}}'

describe('SetAsideSnapshotPanel (#666)', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('shows nothing while no copy was set aside', async () => {
        mocks.readQuarantinedSnapshot.mockResolvedValueOnce(null)
        const { container } = render(<SetAsideSnapshotPanel onRestore={vi.fn()} />)

        await vi.waitFor(() => expect(mocks.readQuarantinedSnapshot).toHaveBeenCalledOnce())
        expect(container).toBeEmptyDOMElement()
    })

    it('offers the kept copy for download and for restore', async () => {
        mocks.readQuarantinedSnapshot.mockResolvedValueOnce(KEPT)
        const onRestore = vi.fn()
        const createObjectURL = vi.fn((_blob: Blob) => 'blob:set-aside')
        const revokeObjectURL = vi.fn()
        Object.assign(URL, { createObjectURL, revokeObjectURL })
        const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

        render(<SetAsideSnapshotPanel onRestore={onRestore} />)

        expect(await screen.findByText('settingsView.data.setAside.title')).toBeInTheDocument()
        expect(screen.getByText('settingsView.data.setAside.description')).toBeInTheDocument()

        fireEvent.click(screen.getByText('settingsView.data.setAside.download'))
        expect(createObjectURL).toHaveBeenCalledOnce()
        await expect(createObjectURL.mock.calls[0]?.[0].text()).resolves.toBe(KEPT)
        expect(click).toHaveBeenCalledOnce()
        expect(revokeObjectURL).toHaveBeenCalledWith('blob:set-aside')

        fireEvent.click(screen.getByText('settingsView.data.setAside.restore'))
        expect(onRestore).toHaveBeenCalledWith(KEPT)
    })
})
