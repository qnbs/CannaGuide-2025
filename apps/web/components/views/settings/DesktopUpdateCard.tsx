import { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/ui/button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import {
    desktopUpdater as defaultUpdater,
    DesktopUpdateError,
    type DesktopUpdateInfo,
    type DesktopUpdater,
    type DownloadProgress,
} from '@/services/desktopLifecycleService'
import { isLocalOnlyMode } from '@/services/localOnlyModeService'

type Status =
    | { kind: 'idle' }
    | { kind: 'checking' }
    | { kind: 'upToDate' }
    | { kind: 'available'; info: DesktopUpdateInfo }
    | { kind: 'downloading'; info: DesktopUpdateInfo; progress: DownloadProgress | null }
    | { kind: 'ready'; info: DesktopUpdateInfo }
    | { kind: 'installing'; info: DesktopUpdateInfo }
    | { kind: 'error'; message: string; info: DesktopUpdateInfo | null }

interface DesktopUpdateCardProps {
    updater?: DesktopUpdater
    localOnly?: () => boolean
}

const percentOf = ({ downloaded, total }: DownloadProgress): number | null =>
    total && total > 0 ? Math.min(100, Math.round((downloaded / total) * 100)) : null

/**
 * Desktop-only: check for, download and install an app update. Every step is a
 * click; installing first saves the latest changes and restarts the app.
 */
export const DesktopUpdateCard = memo(
    ({ updater = defaultUpdater, localOnly = isLocalOnlyMode }: DesktopUpdateCardProps) => {
        const { t } = useTranslation()
        const [status, setStatus] = useState<Status>({ kind: 'idle' })
        const blocked = localOnly()

        const failed = useCallback(
            (error: unknown, info: DesktopUpdateInfo | null) => {
                const message =
                    error instanceof DesktopUpdateError && error.reason === 'not-saved'
                        ? t('settingsView.about.update.notSaved')
                        : t('settingsView.about.update.error', {
                              message: error instanceof Error ? error.message : String(error),
                          })
                setStatus({ kind: 'error', message, info })
            },
            [t],
        )

        const check = useCallback(async () => {
            setStatus({ kind: 'checking' })
            try {
                const info = await updater.check()
                setStatus(info ? { kind: 'available', info } : { kind: 'upToDate' })
            } catch (error) {
                failed(error, null)
            }
        }, [updater, failed])

        const download = useCallback(
            async (info: DesktopUpdateInfo) => {
                setStatus({ kind: 'downloading', info, progress: null })
                try {
                    await updater.download((progress) =>
                        setStatus({ kind: 'downloading', info, progress }),
                    )
                    setStatus({ kind: 'ready', info })
                } catch (error) {
                    failed(error, info)
                }
            },
            [updater, failed],
        )

        const install = useCallback(
            async (info: DesktopUpdateInfo) => {
                setStatus({ kind: 'installing', info })
                try {
                    // Resolves only if the app did not restart (macOS/Linux restart
                    // from inside the command; Windows exits during the install).
                    await updater.installAndRestart()
                } catch (error) {
                    failed(error, info)
                }
            },
            [updater, failed],
        )

        const busy =
            status.kind === 'checking' ||
            status.kind === 'downloading' ||
            status.kind === 'installing'

        const statusText = (): string | null => {
            switch (status.kind) {
                case 'checking':
                    return t('settingsView.about.update.checking')
                case 'upToDate':
                    return t('settingsView.about.update.upToDate')
                case 'available':
                    return t('settingsView.about.update.available', {
                        version: status.info.version,
                    })
                case 'downloading': {
                    const percent = status.progress ? percentOf(status.progress) : null
                    return percent === null
                        ? t('settingsView.about.update.downloadingUnknown')
                        : t('settingsView.about.update.downloading', { percent })
                }
                case 'ready':
                    return t('settingsView.about.update.ready', { version: status.info.version })
                case 'installing':
                    return t('settingsView.about.update.installing')
                case 'error':
                    return status.message
                default:
                    return null
            }
        }

        const info = 'info' in status ? status.info : null
        const text = statusText()

        return (
            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400 mb-3 flex items-center gap-2 border-b border-slate-700/50 pb-2">
                    <PhosphorIcons.ArrowClockwise />
                    {t('settingsView.about.update.title')}
                </h3>
                {blocked ? (
                    <p className="text-sm text-slate-300">
                        {t('settingsView.about.update.localOnly')}
                    </p>
                ) : null}
                <p
                    className="text-sm text-slate-300 min-h-5"
                    role={status.kind === 'error' ? 'alert' : 'status'}
                    aria-live="polite"
                >
                    {text}
                </p>
                {info?.notes ? (
                    <details className="mt-2 text-sm text-slate-300">
                        <summary className="cursor-pointer">
                            {t('settingsView.about.update.notes')}
                        </summary>
                        <p className="whitespace-pre-line mt-1">{info.notes}</p>
                    </details>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                    {status.kind === 'available' ||
                    (status.kind === 'error' && status.info && !blocked) ? (
                        <Button
                            onClick={() => {
                                if (info) void download(info)
                            }}
                            disabled={busy || blocked}
                        >
                            {t('settingsView.about.update.download')}
                        </Button>
                    ) : null}
                    {status.kind === 'ready' ? (
                        <Button onClick={() => void install(status.info)} disabled={busy}>
                            {t('settingsView.about.update.install')}
                        </Button>
                    ) : null}
                    {status.kind !== 'ready' && status.kind !== 'available' ? (
                        <Button
                            variant="secondary"
                            onClick={() => void check()}
                            disabled={busy || blocked}
                        >
                            {t('settingsView.about.update.check')}
                        </Button>
                    ) : null}
                </div>
            </Card>
        )
    },
)
DesktopUpdateCard.displayName = 'DesktopUpdateCard'
