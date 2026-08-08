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

vi.mock('@/services/persistedStateService', () => ({
    replacePrimaryPersistedSnapshot: vi.fn().mockResolvedValue(true),
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
        // Sync being off is not the same as Local-Only Mode being on -- other
        // outbound features (cloud AI, TTS) could still be active here, so
        // the "all data stays on this device" badge must NOT show by default.
        expect(screen.queryByText('settingsView.data.localOnlyBadge')).not.toBeInTheDocument()
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
        // Local-Only Mode is off (default) and sync is genuinely active here,
        // so the "all data stays on this device" badge must not show.
        expect(screen.queryByText('settingsView.data.localOnlyBadge')).not.toBeInTheDocument()

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

    it('shows the Local-Only badge when Local-Only Mode is actually on', () => {
        setState({ localOnlyMode: true })
        render(<CloudSyncPanel />)

        expect(screen.getByText('settingsView.data.localOnlyBadge')).toBeVisible()
    })

    it('does not show the Local-Only badge with Local-Only Mode off, even with sync disabled', () => {
        // Regression test: !isSyncEnabled alone is true here too (sync was
        // never on), but Local-Only Mode being off means other outbound
        // features (cloud AI, TTS) could still be active -- the badge would
        // misrepresent that as "all data stays on this device."
        setState({ localOnlyMode: false, cloudSync: { provider: 'none' } })
        render(<CloudSyncPanel />)

        expect(screen.queryByText('settingsView.data.localOnlyBadge')).not.toBeInTheDocument()
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
