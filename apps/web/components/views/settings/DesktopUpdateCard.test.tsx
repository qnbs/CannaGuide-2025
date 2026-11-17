/**
 * DesktopUpdateCard.test.tsx
 *
 * The card shows the updater's shared state and starts one step per click: check,
 * download, then install and restart. These tests drive the real updater
 * (createDesktopUpdater) over a fake native bridge, so what the card shows is what
 * the service holds. desktopLifecycleService.test.ts covers the rules behind it.
 */
import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

import { DesktopUpdateCard } from './DesktopUpdateCard'
import {
    createDesktopUpdater,
    type DesktopUpdateInfo,
    type PersistFlush,
    type TauriBridge,
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

type Responder = (args?: Record<string, unknown>) => unknown

const setup = (
    responses: Record<string, Responder> = {},
    options: { flush?: PersistFlush; offline?: boolean } = {},
) => {
    const calls: string[] = []
    const bridge: TauriBridge = {
        invoke: async <T,>(command: string, args?: Record<string, unknown>) => {
            calls.push(command)
            const respond = responses[command]
            return (respond ? await respond(args) : undefined) as T
        },
        channel: <T,>(onMessage: (message: T) => void) => ({ onMessage }),
    }
    const updater = createDesktopUpdater({
        isDesktop: () => true,
        isLocalOnly: () => false,
        isOnline: () => !options.offline,
        loadBridge: async () => bridge,
        getFlush: () => options.flush ?? (async () => true),
    })
    return { updater, calls }
}

const button = (name: string) => screen.getByRole('button', { name })
const queryButton = (name: string) => screen.queryByRole('button', { name })
const click = (name: string) => fireEvent.click(button(name))

describe('DesktopUpdateCard', () => {
    it('checks, downloads and installs, one click per step', async () => {
        const { updater, calls } = setup({
            update_check: () => INFO,
            update_download: (args) => {
                const channel = args?.onEvent as { onMessage: (message: unknown) => void }
                channel.onMessage({ event: 'progress', data: { downloaded: 50, total: 100 } })
            },
        })
        render(<DesktopUpdateCard updater={updater} localOnly={() => false} />)

        click('settingsView.about.update.check')
        await screen.findByText(/settingsView\.about\.update\.available .*1\.12\.0/)
        expect(calls).toEqual(['update_check'])

        click('settingsView.about.update.download')
        await screen.findByText(/settingsView\.about\.update\.ready .*1\.12\.0/)
        expect(calls).not.toContain('update_install')

        click('settingsView.about.update.install')
        await waitFor(() => expect(calls).toContain('update_install'))
    })

    it('says so when the app is up to date', async () => {
        const { updater } = setup({ update_check: () => null })
        render(<DesktopUpdateCard updater={updater} localOnly={() => false} />)
        click('settingsView.about.update.check')
        await screen.findByText('settingsView.about.update.upToDate')
        expect(queryButton('settingsView.about.update.download')).toBeNull()
    })

    it('in Local-Only mode explains why and cannot check', () => {
        const { updater, calls } = setup()
        render(<DesktopUpdateCard updater={updater} localOnly={() => true} />)
        expect(screen.getByText('settingsView.about.update.localOnly')).toBeTruthy()
        const check = button('settingsView.about.update.check') as HTMLButtonElement
        expect(check.disabled).toBe(true)
        fireEvent.click(check)
        expect(calls).toEqual([])
    })

    it('a card mounted during a running download follows it to Install', async () => {
        // Codex, CodeAnt and CodeRabbit on #878: reopening About mid-download showed a
        // stale card that offered a second download and never reached Install.
        let finish: () => void = () => undefined
        const { updater } = setup({
            update_check: () => INFO,
            update_download: () => new Promise<void>((resolve) => (finish = resolve)),
        })
        await updater.check()
        const download = updater.download()
        await waitFor(() => expect(updater.getSnapshot().operation).toBe('downloading'))
        render(<DesktopUpdateCard updater={updater} localOnly={() => false} />)
        expect(button('settingsView.about.update.cancel')).toBeTruthy()
        expect(queryButton('settingsView.about.update.download')).toBeNull()
        await act(async () => {
            finish()
            await download
        })
        expect(button('settingsView.about.update.install')).toBeTruthy()
    })

    it('a release found by the startup check while the card is open replaces the old one', async () => {
        let next: DesktopUpdateInfo = INFO
        const { updater } = setup({ update_check: () => next })
        render(<DesktopUpdateCard updater={updater} localOnly={() => false} />)
        click('settingsView.about.update.check')
        await screen.findByText(/1\.12\.0/)
        next = { ...INFO, version: '1.12.1' }
        await act(async () => {
            await updater.check({ background: true })
        })
        expect(screen.getByText(/settingsView\.about\.update\.available .*1\.12\.1/)).toBeTruthy()
    })

    it('Cancel stops the download and offers it again', async () => {
        let rejectPending: (reason: unknown) => void = () => undefined
        const { updater, calls } = setup({
            update_check: () => INFO,
            update_download: () => new Promise((_resolve, reject) => (rejectPending = reject)),
            update_cancel: () => {
                rejectPending('update request cancelled')
                return true
            },
        })
        render(<DesktopUpdateCard updater={updater} localOnly={() => false} />)
        click('settingsView.about.update.check')
        await screen.findByRole('button', { name: 'settingsView.about.update.download' })
        click('settingsView.about.update.download')
        await screen.findByRole('button', { name: 'settingsView.about.update.cancel' })
        click('settingsView.about.update.cancel')
        const alert = await screen.findByRole('alert')
        expect(alert.textContent).toBe('settingsView.about.update.cancelled')
        expect(calls).toContain('update_cancel')
        expect(button('settingsView.about.update.download')).toBeTruthy()
    })

    it('explains offline instead of a raw error', async () => {
        const { updater } = setup({}, { offline: true })
        render(<DesktopUpdateCard updater={updater} localOnly={() => false} />)
        click('settingsView.about.update.check')
        const alert = await screen.findByRole('alert')
        expect(alert.textContent).toBe('settingsView.about.update.offline')
    })

    it('after a failed save nothing is installed and Install is offered again', async () => {
        const { updater, calls } = setup({ update_check: () => INFO }, { flush: async () => false })
        render(<DesktopUpdateCard updater={updater} localOnly={() => false} />)
        click('settingsView.about.update.check')
        await screen.findByRole('button', { name: 'settingsView.about.update.download' })
        click('settingsView.about.update.download')
        await screen.findByRole('button', { name: 'settingsView.about.update.install' })
        click('settingsView.about.update.install')
        const alert = await screen.findByRole('alert')
        expect(alert.textContent).toBe('settingsView.about.update.notSaved')
        expect(calls).not.toContain('update_install')
        expect(button('settingsView.about.update.install')).toBeTruthy()
        expect(queryButton('settingsView.about.update.download')).toBeNull()
    })
})
