/**
 * CloudSyncPanel.test.tsx
 *
 * Covers the CLOUD_SYNC_DISABLED gating this component adds: the toggle
 * button, description, and banner branches for a fresh (sync-off) session
 * and for a user who already had sync enabled before the feature was
 * disabled. Push/pull network behavior itself is exercised by
 * syncService.test.ts; this file is about the render-time branches.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import CloudSyncPanel from './CloudSyncPanel'

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}))

const mockDispatch = vi.fn()
const mockAddNotification = vi.fn()

vi.mock('@/stores/store', () => ({
    useAppDispatch: () => mockDispatch,
    useAppSelector: (selector: (s: unknown) => unknown) => selector(mockReduxState),
}))

vi.mock('@/stores/selectors', () => ({
    selectSettings: (s: { settings: unknown }) => s.settings,
}))

vi.mock('@/stores/useUIStore', () => ({
    useUIStore: (selector: (s: Record<string, unknown>) => unknown) => selector(mockUIState),
    getUISnapshot: () => ({ addNotification: mockAddNotification }),
}))

vi.mock('@/services/syncService', () => ({
    syncService: {
        pushToGist: vi.fn(),
        pullFromGist: vi.fn(),
        forceLocalToGist: vi.fn(),
        forceRemoteToLocal: vi.fn(),
    },
}))

vi.mock('@/services/syncEncryptionService', () => ({
    generateSyncEncryptionKey: vi.fn(),
}))

vi.mock('@/services/offlineSyncQueueService', () => ({
    offlineSyncQueueService: { queueSyncWhenOnline: vi.fn() },
}))

vi.mock('@/stores/indexedDBStorage', () => ({
    indexedDBStorage: { setItem: vi.fn(), getItem: vi.fn() },
}))

vi.mock('@/components/common/ConfirmDialog', () => ({
    ConfirmDialog: () => null,
}))

vi.mock('@/components/common/SyncConflictModal', () => ({
    SyncConflictModal: () => null,
}))

let mockReduxState: {
    settings: {
        data: { cloudSync: Record<string, unknown> }
        privacy: { localOnlyMode: boolean }
    }
}

let mockUIState: {
    syncState: {
        status: string
        pendingRetries: number
        conflictInfo: unknown
        errorMessage?: string
        lastSyncAt: number | null
        remotePayload: unknown
    }
    setSyncStatus: ReturnType<typeof vi.fn>
    setSyncConflict: ReturnType<typeof vi.fn>
    clearSyncConflict: ReturnType<typeof vi.fn>
    setSyncLastSyncAt: ReturnType<typeof vi.fn>
}

const baseCloudSync = {
    provider: 'none',
    enabled: false,
    gistId: null as string | null,
    encryptionKeyBase64: null as string | null,
    lastSyncAt: null as number | null,
}

function setState(overrides: {
    cloudSync?: Partial<typeof baseCloudSync>
    localOnlyMode?: boolean
    syncStatus?: string
    pendingRetries?: number
}): void {
    mockReduxState = {
        settings: {
            data: { cloudSync: { ...baseCloudSync, ...overrides.cloudSync } },
            privacy: { localOnlyMode: overrides.localOnlyMode ?? false },
        },
    }
    mockUIState = {
        syncState: {
            status: overrides.syncStatus ?? 'idle',
            pendingRetries: overrides.pendingRetries ?? 0,
            conflictInfo: null,
            lastSyncAt: null,
            remotePayload: null,
        },
        setSyncStatus: vi.fn(),
        setSyncConflict: vi.fn(),
        clearSyncConflict: vi.fn(),
        setSyncLastSyncAt: vi.fn(),
    }
}

describe('CloudSyncPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        setState({})
    })

    it('disables the toggle and shows the unavailable copy for a fresh (sync-off) session', () => {
        render(<CloudSyncPanel />)

        expect(screen.getByTestId('cloud-sync-toggle')).toBeDisabled()
        expect(screen.getByTestId('cloud-sync-unavailable-description')).toBeVisible()
        expect(screen.getByTestId('cloud-sync-unavailable-banner')).toBeVisible()
        // Push/Pull only render inside the isSyncEnabled block.
        expect(screen.queryByTestId('cloud-sync-push')).not.toBeInTheDocument()
        expect(screen.queryByTestId('cloud-sync-pull')).not.toBeInTheDocument()
    })

    it('clicking the disabled-state toggle does not dispatch (newly enabling is blocked)', () => {
        render(<CloudSyncPanel />)

        fireEvent.click(screen.getByTestId('cloud-sync-toggle'))

        expect(mockDispatch).not.toHaveBeenCalled()
    })

    it('leaves the toggle enabled and shows push/pull (disabled) for a user who already had sync on', () => {
        setState({ cloudSync: { provider: 'gist', enabled: true, gistId: 'abc123def456' } })
        render(<CloudSyncPanel />)

        const toggle = screen.getByTestId('cloud-sync-toggle')
        expect(toggle).not.toBeDisabled()
        expect(toggle).toHaveTextContent('settingsView.data.sync.disableSync')

        expect(screen.getByTestId('cloud-sync-push')).toBeDisabled()
        expect(screen.getByTestId('cloud-sync-pull')).toBeDisabled()
    })

    it('turning an already-enabled sync off still dispatches (that direction stays safe)', () => {
        setState({ cloudSync: { provider: 'gist', enabled: true } })
        render(<CloudSyncPanel />)

        fireEvent.click(screen.getByTestId('cloud-sync-toggle'))

        expect(mockDispatch).toHaveBeenCalledTimes(2)
    })

    it('shows the Local-Only-blocked banner in addition to the unavailable banner', () => {
        setState({ localOnlyMode: true })
        render(<CloudSyncPanel />)

        expect(screen.getByTestId('cloud-sync-unavailable-banner')).toBeVisible()
        expect(screen.getByText('settingsView.data.sync.blockedByLocalOnly')).toBeVisible()
    })

    it('shows the E2EE generate-key prompt when no key is set', () => {
        setState({ cloudSync: { provider: 'gist', enabled: true } })
        render(<CloudSyncPanel />)
        expect(screen.getByText('settingsView.data.sync.e2ee.generateKey')).toBeVisible()
    })

    it('shows the E2EE active state once a key is set', () => {
        // CloudSyncPanel is a no-props React.memo component, so rerender() on
        // the same instance is a shallow-equal no-op -- a fresh render is
        // required to pick up the new mocked state, matching this file's
        // other tests.
        setState({
            cloudSync: { provider: 'gist', enabled: true, encryptionKeyBase64: 'a-key' },
        })
        render(<CloudSyncPanel />)
        expect(screen.getByText('settingsView.data.sync.e2ee.active')).toBeVisible()
    })

    it('shows a pending-retries badge when a queued sync is waiting', () => {
        setState({ cloudSync: { provider: 'gist', enabled: true }, pendingRetries: 2 })
        render(<CloudSyncPanel />)

        expect(screen.getByText('settingsView.data.sync.pendingSync')).toBeVisible()
    })

    it('shows a sync-status indicator once status leaves idle', () => {
        setState({ cloudSync: { provider: 'gist', enabled: true }, syncStatus: 'synced' })
        render(<CloudSyncPanel />)

        expect(screen.getByText(/settingsView.data.sync.synced/)).toBeVisible()
    })
})
