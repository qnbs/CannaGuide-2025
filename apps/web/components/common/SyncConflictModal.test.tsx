import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SyncConflictModal } from './SyncConflictModal'
import type { DivergenceInfo } from '@/services/crdtService'

vi.mock('@sentry/react', () => ({
    addBreadcrumb: vi.fn(),
}))

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}))

vi.mock('@/components/ui/dialog', () => ({
    Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
        open ? <div data-testid="dialog">{children}</div> : null,
    DialogContent: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="dialog-content">{children}</div>
    ),
    DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
    DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}))

vi.mock('@/components/ui/button', () => ({
    Button: ({
        children,
        onClick,
        ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
        <button onClick={onClick} {...props}>
            {children}
        </button>
    ),
}))

vi.mock('@/components/common/ConfirmDialog', () => ({
    ConfirmDialog: ({
        open,
        onConfirm,
        title,
    }: {
        open: boolean
        onConfirm: () => void
        title: string
    }) =>
        open ? (
            <div data-testid="confirm-dialog">
                <span>{title}</span>
                <button onClick={onConfirm} data-testid="confirm-btn">
                    Confirm
                </button>
            </div>
        ) : null,
}))

vi.mock('@/components/icons/PhosphorIcons', () => ({
    PhosphorIcons: {
        Warning: ({ className }: { className?: string }) => (
            <span className={className} data-testid="warning-icon" />
        ),
        GitMerge: ({ className }: { className?: string }) => (
            <span className={className} data-testid="merge-icon" />
        ),
    },
}))

const baseInfo: DivergenceInfo = {
    localOnlyChanges: 2,
    remoteOnlyChanges: 3,
    conflictingKeys: ['plants.plant-1', 'nutrient-schedule.sched-1'],
}

describe('SyncConflictModal', () => {
    const onClose = vi.fn()
    const onMerge = vi.fn()
    const onKeepLocal = vi.fn()
    const onUseCloud = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('does not render when open is false', () => {
        render(
            <SyncConflictModal
                open={false}
                onClose={onClose}
                conflictInfo={baseInfo}
                onMerge={onMerge}
                onKeepLocal={onKeepLocal}
                onUseCloud={onUseCloud}
            />,
        )

        expect(screen.queryByTestId('dialog')).toBeNull()
    })

    it('renders conflict stats when open', () => {
        render(
            <SyncConflictModal
                open={true}
                onClose={onClose}
                conflictInfo={baseInfo}
                onMerge={onMerge}
                onKeepLocal={onKeepLocal}
                onUseCloud={onUseCloud}
            />,
        )

        // Title and description rendered
        expect(screen.getByText('settingsView.data.sync.conflictTitle')).toBeInTheDocument()
        expect(screen.getByText('settingsView.data.sync.conflictDescription')).toBeInTheDocument()

        // All 3 action buttons rendered
        expect(screen.getByText('settingsView.data.sync.merge')).toBeInTheDocument()
        expect(screen.getByText('settingsView.data.sync.keepLocal')).toBeInTheDocument()
        expect(screen.getByText('settingsView.data.sync.useCloud')).toBeInTheDocument()

        // Stat label cards rendered
        expect(
            screen.getByText((content) => content.includes('settingsView.data.sync.localChanges')),
        ).toBeInTheDocument()
        expect(
            screen.getByText((content) =>
                content.includes('settingsView.data.sync.remoteChanges'),
            ),
        ).toBeInTheDocument()
    })

    it('calls onMerge and onClose when merge button is clicked', () => {
        render(
            <SyncConflictModal
                open={true}
                onClose={onClose}
                conflictInfo={baseInfo}
                onMerge={onMerge}
                onKeepLocal={onKeepLocal}
                onUseCloud={onUseCloud}
            />,
        )

        fireEvent.click(screen.getByText('settingsView.data.sync.merge'))
        expect(onMerge).toHaveBeenCalledTimes(1)
        expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('shows view details and lists conflicting keys', () => {
        render(
            <SyncConflictModal
                open={true}
                onClose={onClose}
                conflictInfo={baseInfo}
                onMerge={onMerge}
                onKeepLocal={onKeepLocal}
                onUseCloud={onUseCloud}
            />,
        )

        fireEvent.click(screen.getByText(/settingsView\.data\.sync\.viewDetails/))
        expect(screen.getByText('plants.plant-1')).toBeInTheDocument()
        expect(screen.getByText('nutrient-schedule.sched-1')).toBeInTheDocument()
    })

    it('hides view details when no conflicting keys', () => {
        const noConflictInfo: DivergenceInfo = {
            localOnlyChanges: 1,
            remoteOnlyChanges: 2,
            conflictingKeys: [],
        }

        render(
            <SyncConflictModal
                open={true}
                onClose={onClose}
                conflictInfo={noConflictInfo}
                onMerge={onMerge}
                onKeepLocal={onKeepLocal}
                onUseCloud={onUseCloud}
            />,
        )

        expect(screen.queryByText(/settingsView\.data\.sync\.viewDetails/)).toBeNull()
    })
})
