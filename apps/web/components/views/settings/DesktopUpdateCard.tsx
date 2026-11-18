import { memo, useCallback, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/ui/button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import {
    desktopUpdater as defaultUpdater,
    type DesktopUpdateFailure,
    type DesktopUpdater,
    type DesktopUpdateSnapshot,
    type DownloadProgress,
} from '@/services/desktopLifecycleService'
import { isLocalOnlyMode } from '@/services/localOnlyModeService'

interface DesktopUpdateCardProps {
    updater?: DesktopUpdater | undefined
    localOnly?: (() => boolean) | undefined
}

const percentOf = ({ downloaded, total }: DownloadProgress): number | null =>
    total && total > 0 ? Math.min(100, Math.round((downloaded / total) * 100)) : null

const REASON_MESSAGE_KEYS: Partial<Record<DesktopUpdateFailure, string>> = {
    'not-saved': 'settingsView.about.update.notSaved',
    'local-only': 'settingsView.about.update.localOnly',
    offline: 'settingsView.about.update.offline',
    cancelled: 'settingsView.about.update.cancelled',
}

/** Steps start here and nowhere else; their outcome arrives through the snapshot. */
const ignoreRejection = (step: Promise<unknown>): void => {
    step.catch(() => undefined)
}

/**
 * Desktop-only: check for, download and install an app update. Every step is a
 * click; installing first saves the latest changes and restarts the app. The card
 * only shows the updater's state, so it is never a stale copy of it: a download that
 * finished while About was closed, or a newer release found by the startup check,
 * shows here as soon as it happens.
 */
export const DesktopUpdateCard = memo(
    ({ updater = defaultUpdater, localOnly = isLocalOnlyMode }: DesktopUpdateCardProps) => {
        const { t } = useTranslation()
        const snapshot: DesktopUpdateSnapshot = useSyncExternalStore(
            updater.subscribe,
            updater.getSnapshot,
        )
        const blocked = localOnly()
        const { stage, operation, progress, error } = snapshot

        const check = useCallback(() => ignoreRejection(updater.check()), [updater])
        const download = useCallback(() => ignoreRejection(updater.download()), [updater])
        // Resolves only if the app did not restart (macOS/Linux restart from inside the
        // command; Windows exits during the install).
        const install = useCallback(() => ignoreRejection(updater.installAndRestart()), [updater])
        const cancel = useCallback(() => ignoreRejection(updater.cancelDownload()), [updater])

        const errorText = (): string | null => {
            if (!error) return null
            const key = REASON_MESSAGE_KEYS[error.reason]
            return key ? t(key) : t('settingsView.about.update.error', { message: error.message })
        }

        const statusText = (): string | null => {
            if (operation === 'checking') return t('settingsView.about.update.checking')
            if (operation === 'installing') return t('settingsView.about.update.installing')
            if (operation === 'downloading') {
                const percent = progress ? percentOf(progress) : null
                return percent === null
                    ? t('settingsView.about.update.downloadingUnknown')
                    : t('settingsView.about.update.downloading', { percent })
            }
            const failure = errorText()
            if (failure) return failure
            if (stage?.kind === 'ready') {
                return t('settingsView.about.update.ready', { version: stage.info.version })
            }
            if (stage?.kind === 'available') {
                return t('settingsView.about.update.available', { version: stage.info.version })
            }
            return snapshot.upToDate ? t('settingsView.about.update.upToDate') : null
        }

        const idle = operation === 'idle'
        // After a failed step the stage still says what can be retried: a failed or
        // cancelled download leaves "available", a failed install leaves "ready".
        const offerDownload = idle && stage?.kind === 'available'
        const offerInstall = idle && stage?.kind === 'ready'
        const offerCheck = idle && !offerDownload && !offerInstall
        const showsError = idle && error !== null
        const text = statusText()

        return (
            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400 mb-3 flex items-center gap-2 border-b border-slate-700/50 pb-2">
                    <PhosphorIcons.ArrowClockwise />
                    {t('settingsView.about.update.title')}
                </h3>
                {blocked && error?.reason !== 'local-only' ? (
                    <p className="text-sm text-slate-300">
                        {t('settingsView.about.update.localOnly')}
                    </p>
                ) : null}
                <p
                    className="text-sm text-slate-300 min-h-5"
                    role={showsError ? 'alert' : 'status'}
                    aria-live="polite"
                >
                    {text}
                </p>
                {stage?.info.notes ? (
                    <details className="mt-2 text-sm text-slate-300">
                        <summary className="cursor-pointer">
                            {t('settingsView.about.update.notes')}
                        </summary>
                        <p className="whitespace-pre-line mt-1">{stage.info.notes}</p>
                    </details>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                    {offerDownload ? (
                        <Button onClick={download} disabled={blocked}>
                            {t('settingsView.about.update.download')}
                        </Button>
                    ) : null}
                    {operation === 'downloading' && snapshot.cancellable ? (
                        <Button variant="secondary" onClick={cancel}>
                            {t('settingsView.about.update.cancel')}
                        </Button>
                    ) : null}
                    {offerInstall ? (
                        <Button onClick={install}>{t('settingsView.about.update.install')}</Button>
                    ) : null}
                    {offerCheck ? (
                        <Button variant="secondary" onClick={check} disabled={blocked}>
                            {t('settingsView.about.update.check')}
                        </Button>
                    ) : null}
                </div>
            </Card>
        )
    },
)
DesktopUpdateCard.displayName = 'DesktopUpdateCard'
