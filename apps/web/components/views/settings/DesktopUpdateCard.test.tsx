/**
 * DesktopUpdateCard.test.tsx
 *
 * The card drives the update flow one click at a time: check, download, then
 * install and restart. desktopLifecycleService.test.ts covers the rules behind it
 * (Local-Only, one step at a time, save before install); this file covers what the
 * user sees and which step each button starts.
 */
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { DesktopUpdateCard } from './DesktopUpdateCard'
import {
    DesktopUpdateError,
    type DesktopUpdateInfo,
    type DesktopUpdater,
} from '@/services/desktopLifecycleService'

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: Record<string, unknown>) =>
            options ? `${key} ${JSON.stringify(options)}` : key,
    }),
}))

const INFO: DesktopUpdateInfo = {
    version: '1.12.0',
    currentVersion: '1.11.0',
    notes: 'Fixes',
    date: null,
}

const updater = (overrides: Partial<DesktopUpdater> = {}): DesktopUpdater => {
    let stage: ReturnType<DesktopUpdater['currentStage']> = null
    return {
        check: vi.fn(async () => {
            stage = { kind: 'available', info: INFO }
            return INFO
        }),
        download: vi.fn(async (onProgress) => {
            onProgress({ downloaded: 50, total: 100 })
            stage = { kind: 'ready', info: INFO }
        }),
        installAndRestart: vi.fn(async () => undefined),
        cancelDownload: vi.fn(async () => true),
        currentStage: () => stage,
        ...overrides,
    }
}

const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }))

describe('DesktopUpdateCard', () => {
    it('checks, downloads and installs, one click per step', async () => {
        const fake = updater()
        render(<DesktopUpdateCard updater={fake} localOnly={() => false} />)

        click('settingsView.about.update.check')
        await screen.findByText(/settingsView\.about\.update\.available .*1\.12\.0/)
        expect(fake.download).not.toHaveBeenCalled()

        click('settingsView.about.update.download')
        await screen.findByText(/settingsView\.about\.update\.ready .*1\.12\.0/)
        expect(fake.installAndRestart).not.toHaveBeenCalled()

        click('settingsView.about.update.install')
        await waitFor(() => expect(fake.installAndRestart).toHaveBeenCalledTimes(1))
    })

    it('says so when the app is up to date', async () => {
        render(
            <DesktopUpdateCard
                updater={updater({ check: vi.fn(async () => null) })}
                localOnly={() => false}
            />,
        )
        click('settingsView.about.update.check')
        await screen.findByText('settingsView.about.update.upToDate')
        expect(
            screen.queryByRole('button', { name: 'settingsView.about.update.download' }),
        ).toBeNull()
    })

    it('in Local-Only mode explains why and cannot check', () => {
        const fake = updater()
        render(<DesktopUpdateCard updater={fake} localOnly={() => true} />)
        expect(screen.getByText('settingsView.about.update.localOnly')).toBeTruthy()
        const button = screen.getByRole('button', { name: 'settingsView.about.update.check' })
        expect((button as HTMLButtonElement).disabled).toBe(true)
        fireEvent.click(button)
        expect(fake.check).not.toHaveBeenCalled()
    })

    it('shows a failed download as an alert and offers the download again', async () => {
        const fake = updater({
            download: vi.fn(async () => {
                throw new DesktopUpdateError('failed', 'signature verification failed')
            }),
        })
        render(<DesktopUpdateCard updater={fake} localOnly={() => false} />)
        click('settingsView.about.update.check')
        await screen.findByRole('button', { name: 'settingsView.about.update.download' })
        click('settingsView.about.update.download')
        const alert = await screen.findByRole('alert')
        expect(alert.textContent).toMatch(/signature verification failed/)
        expect(
            screen.getByRole('button', { name: 'settingsView.about.update.download' }),
        ).toBeTruthy()
    })

    it('resumes a finished download after leaving and reopening Settings > About', () => {
        const fake = updater({ currentStage: () => ({ kind: 'ready', info: INFO }) })
        render(<DesktopUpdateCard updater={fake} localOnly={() => false} />)
        expect(
            screen.getByRole('button', { name: 'settingsView.about.update.install' }),
        ).toBeTruthy()
        expect(fake.check).not.toHaveBeenCalled()
    })

    it('offers Cancel during a download and calls it', async () => {
        let finish: () => void = () => undefined
        const fake = updater({
            download: vi.fn(() => new Promise<void>((resolve) => (finish = resolve))),
        })
        render(<DesktopUpdateCard updater={fake} localOnly={() => false} />)
        click('settingsView.about.update.check')
        await screen.findByRole('button', { name: 'settingsView.about.update.download' })
        click('settingsView.about.update.download')
        click('settingsView.about.update.cancel')
        expect(fake.cancelDownload).toHaveBeenCalledTimes(1)
        finish()
    })

    it('explains offline instead of a raw error', async () => {
        render(
            <DesktopUpdateCard
                updater={updater({
                    check: vi.fn(async () => {
                        throw new DesktopUpdateError('offline', 'the device is offline')
                    }),
                })}
                localOnly={() => false}
            />,
        )
        click('settingsView.about.update.check')
        const alert = await screen.findByRole('alert')
        expect(alert.textContent).toBe('settingsView.about.update.offline')
    })

    it('tells the user that nothing was installed when the save failed', async () => {
        const fake = updater({
            installAndRestart: vi.fn(async () => {
                throw new DesktopUpdateError('not-saved', 'not saved')
            }),
        })
        render(<DesktopUpdateCard updater={fake} localOnly={() => false} />)
        click('settingsView.about.update.check')
        await screen.findByRole('button', { name: 'settingsView.about.update.download' })
        click('settingsView.about.update.download')
        await screen.findByRole('button', { name: 'settingsView.about.update.install' })
        click('settingsView.about.update.install')
        const alert = await screen.findByRole('alert')
        expect(alert.textContent).toBe('settingsView.about.update.notSaved')
        // CodeRabbit on #878: nothing was installed, so Install is offered again.
        expect(
            screen.getByRole('button', { name: 'settingsView.about.update.install' }),
        ).toBeTruthy()
        expect(
            screen.queryByRole('button', { name: 'settingsView.about.update.download' }),
        ).toBeNull()
    })
})
