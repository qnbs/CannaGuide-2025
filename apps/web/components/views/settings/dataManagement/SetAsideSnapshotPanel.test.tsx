import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

const mocks = vi.hoisted(() => ({ readQuarantinedSnapshot: vi.fn(), downloadBlob: vi.fn() }))

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock('@/services/snapshotQuarantine', () => ({
    readQuarantinedSnapshot: mocks.readQuarantinedSnapshot,
}))
// The shared helper revokes the object URL only after the browser took the file.
vi.mock('@/services/backupService', () => ({
    backupService: { downloadBlob: mocks.downloadBlob },
}))

import { SetAsideSnapshotPanel } from './SetAsideSnapshotPanel'
import { redactSnapshotTextForDownload } from '@/services/persistedSnapshotFormat'

const KEPT = '{"version":6,"settings":{"settings":{}},"simulation":{"plants":{"ids":["p1"]}}}'

describe('SetAsideSnapshotPanel (#666)', () => {
    afterEach(() => {
        vi.restoreAllMocks()
        mocks.downloadBlob.mockReset()
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

        render(<SetAsideSnapshotPanel onRestore={onRestore} />)

        expect(await screen.findByText('settingsView.data.setAside.title')).toBeInTheDocument()
        expect(screen.getByText('settingsView.data.setAside.description')).toBeInTheDocument()

        fireEvent.click(screen.getByText('settingsView.data.setAside.download'))
        expect(mocks.downloadBlob).toHaveBeenCalledOnce()
        const [blob, filename] = mocks.downloadBlob.mock.calls[0] as [Blob, string]
        await expect(blob.text()).resolves.toBe(KEPT)
        expect(filename).toMatch(/^cannaguide-set-aside-\d{4}-\d{2}-\d{2}\.json$/)

        fireEvent.click(screen.getByText('settingsView.data.setAside.restore'))
        expect(onRestore).toHaveBeenCalledWith(KEPT)
    })

    it('leaves the app PIN and the sync key out of the download, but restores the copy as kept (#872)', async () => {
        const withSecrets = JSON.stringify({
            version: 6,
            settings: {
                settings: {
                    privacy: { pin: '4711', localOnly: true },
                    data: { cloudSync: { encryptionKeyBase64: 'c2VjcmV0', enabled: false } },
                },
            },
            simulation: { plants: { ids: ['p1'] } },
        })
        mocks.readQuarantinedSnapshot.mockResolvedValueOnce(withSecrets)
        const onRestore = vi.fn()

        render(<SetAsideSnapshotPanel onRestore={onRestore} />)
        fireEvent.click(await screen.findByText('settingsView.data.setAside.download'))

        const downloaded = await (mocks.downloadBlob.mock.calls[0]?.[0] as Blob).text()
        expect(downloaded).not.toContain('4711')
        expect(downloaded).not.toContain('c2VjcmV0')
        expect(JSON.parse(downloaded)).toMatchObject({
            settings: {
                settings: {
                    privacy: { pin: null, localOnly: true },
                    data: { cloudSync: { encryptionKeyBase64: null, enabled: false } },
                },
            },
            simulation: { plants: { ids: ['p1'] } },
        })

        fireEvent.click(screen.getByText('settingsView.data.setAside.restore'))
        expect(onRestore).toHaveBeenCalledWith(withSecrets)
    })
})

describe('redactSnapshotTextForDownload (#872)', () => {
    it('scrubs the PIN and the sync key from a copy that is not valid JSON', () => {
        const truncated =
            '{"settings":{"settings":{"privacy":{"pin":"4711"},"data":{"cloudSync":{"encryptionKeyBase64":"c2Vj'
        const scrubbed = redactSnapshotTextForDownload(truncated)

        expect(scrubbed).not.toContain('4711')
        expect(scrubbed).not.toContain('c2Vj')
        expect(scrubbed).toContain('"pin":null')
    })

    it('leaves a copy without those fields unchanged in content', () => {
        expect(JSON.parse(redactSnapshotTextForDownload('{"version":6,"notes":[1]}'))).toEqual({
            version: 6,
            notes: [1],
        })
    })
})
