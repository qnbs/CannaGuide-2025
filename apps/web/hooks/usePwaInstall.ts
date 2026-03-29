import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getUISnapshot } from '../stores/useUIStore'
import { BeforeInstallPromptEvent } from '@/types'
import { PWA_INSTALLED_KEY } from '@/constants'

const PWA_INSTALL_HINT_KEY = 'cg.pwa.install_hint.dismissed_at'
const PWA_UPDATE_DISMISSED_KEY = 'cg.pwa.update.dismissed_at'
const INSTALL_HINT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000
const UPDATE_DISMISSAL_COOLDOWN_MS = 60 * 60 * 1000 // 1 hour

/**
 * A custom hook to manage the PWA installation prompt and status.
 * It reliably tracks whether the app is installed using a combination of
 * browser APIs and a localStorage flag for persistence.
 */
export const usePwaInstall = () => {
    const { t } = useTranslation()
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

    // The initial state checks both the persistent flag and the current display mode.
    const [isInstalled, setIsInstalled] = useState(
        () =>
            localStorage.getItem(PWA_INSTALLED_KEY) === 'true' ||
            window.matchMedia('(display-mode: standalone)').matches,
    )
    const [updateAvailable, setUpdateAvailable] = useState(false)

    useEffect(() => {
        // This event fires if the app is installable but not yet installed.
        const beforeInstallPromptHandler = (e: Event) => {
            console.debug('[PWA] beforeinstallprompt event fired.')
            e.preventDefault() // Prevent the mini-infobar from appearing automatically.
            setDeferredPrompt(e as BeforeInstallPromptEvent)

            const lastDismissedAt = Number(localStorage.getItem(PWA_INSTALL_HINT_KEY) || 0)
            if (Date.now() - lastDismissedAt > INSTALL_HINT_COOLDOWN_MS) {
                getUISnapshot().addNotification({
                    message: t('common.installPwaHint'),
                    type: 'info',
                })
            }

            // If this event fires, it means the app is not installed,
            // so we ensure our state and flag reflect that. This handles uninstallation cases.
            setIsInstalled(false)
            localStorage.removeItem(PWA_INSTALLED_KEY)
        }

        // This event fires after the user has accepted the installation prompt.
        const appInstalledHandler = () => {
            // Clear the prompt and update the state/flag to reflect installation.
            setDeferredPrompt(null)
            setIsInstalled(true)
            localStorage.setItem(PWA_INSTALLED_KEY, 'true')
            getUISnapshot().addNotification({
                message: t('common.installPwaSuccess'),
                type: 'success',
            })
        }

        window.addEventListener('beforeinstallprompt', beforeInstallPromptHandler)
        window.addEventListener('appinstalled', appInstalledHandler)

        // SW update detection: register-sw.js dispatches 'swUpdate' when a new SW is waiting.
        // The existing controllerchange listener in register-sw.js auto-reloads the page;
        // this handler shows a brief info toast so the user understands the imminent reload.
        const swUpdateHandler = () => {
            setUpdateAvailable(true)

            // Avoid spamming notifications if user dismissed recently
            const lastDismissed = Number(localStorage.getItem(PWA_UPDATE_DISMISSED_KEY) || 0)
            if (Date.now() - lastDismissed < UPDATE_DISMISSAL_COOLDOWN_MS) {
                return
            }

            getUISnapshot().addNotification({
                message: `${t('common.swUpdateAvailable')} (v${__APP_VERSION__})`,
                type: 'info',
            })
        }
        window.addEventListener('swUpdate', swUpdateHandler)

        return () => {
            window.removeEventListener('beforeinstallprompt', beforeInstallPromptHandler)
            window.removeEventListener('appinstalled', appInstalledHandler)
            window.removeEventListener('swUpdate', swUpdateHandler)
        }
    }, [t])

    const handleInstallClick = useCallback(async () => {
        if (!deferredPrompt) {
            return
        }

        // Show the native installation prompt.
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
            // The 'appinstalled' event will handle the final state change.
            console.debug('PWA installation accepted by user.')
        } else {
            console.debug('PWA installation dismissed by user.')
            getUISnapshot().addNotification({
                message: t('common.installPwaDismissed'),
                type: 'info',
            })
            localStorage.setItem(PWA_INSTALL_HINT_KEY, String(Date.now()))
        }

        // The prompt can only be used once.
        setDeferredPrompt(null)
    }, [deferredPrompt, t])

    return { deferredPrompt, handleInstallClick, isInstalled, updateAvailable }
}
