import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getUISnapshot } from '../stores/useUIStore'
import { getT } from '@/i18n'
import type { BeforeInstallPromptEvent } from '@/types'
import { PWA_INSTALLED_KEY } from '@/constants'

const PWA_INSTALL_HINT_KEY = 'cg.pwa.install_hint.dismissed_at'
const PWA_UPDATE_DISMISSED_KEY = 'cg.pwa.update.dismissed_at'
const INSTALL_HINT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000
const UPDATE_DISMISSAL_COOLDOWN_MS = 60 * 60 * 1000

// ---------------------------------------------------------------------------
// Module-level singleton -- shared across ALL hook instances so that lazy-
// loaded views (e.g. SettingsView) always see the current install state.
// Event listeners are registered once at module-load time, guaranteeing that
// the 'beforeinstallprompt' event is captured before any lazy view mounts.
// ---------------------------------------------------------------------------
let _deferredPrompt: BeforeInstallPromptEvent | null = null
let _isInstalled: boolean =
    typeof window !== 'undefined'
        ? (typeof localStorage !== 'undefined' &&
              localStorage.getItem(PWA_INSTALLED_KEY) === 'true') ||
          (typeof window.matchMedia === 'function' &&
              window.matchMedia('(display-mode: standalone)').matches)
        : false
let _updateAvailable = false
/** SW registration reference for user-initiated SKIP_WAITING */
let _swRegistration: ServiceWorkerRegistration | null = null
/** Deferred install-hint flag: set at event time, flushed when a hook instance mounts. */
let _pendingInstallHint = false

const _subs = new Set<() => void>()
const _emit = (): void => _subs.forEach((fn) => fn())

if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
        console.debug('[PWA] beforeinstallprompt event fired.')
        e.preventDefault()
        if ('prompt' in e) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- BeforeInstallPromptEvent extends Event, runtime-checked via 'prompt' in e
            _deferredPrompt = e as BeforeInstallPromptEvent
        }
        _isInstalled = false
        localStorage.removeItem(PWA_INSTALLED_KEY)
        const lastDismissedAt = Number(localStorage.getItem(PWA_INSTALL_HINT_KEY) ?? 0)
        if (Date.now() - lastDismissedAt > INSTALL_HINT_COOLDOWN_MS) {
            _pendingInstallHint = true
        }
        _emit()
    })

    window.addEventListener('appinstalled', () => {
        _deferredPrompt = null
        _isInstalled = true
        localStorage.setItem(PWA_INSTALLED_KEY, 'true')
        _emit()
        // getT() is safe here -- 'appinstalled' requires prior user interaction,
        // so i18n is guaranteed to be initialized by this point.
        getUISnapshot().addNotification({
            message: getT()('common.installPwaSuccess'),
            type: 'success',
        })
    })

    window.addEventListener('swUpdate', (e: Event) => {
        _updateAvailable = true
        if (e instanceof CustomEvent && e.detail instanceof ServiceWorkerRegistration) {
            _swRegistration = e.detail
        }
        _emit()
        const lastDismissed = Number(localStorage.getItem(PWA_UPDATE_DISMISSED_KEY) ?? 0)
        if (Date.now() - lastDismissed < UPDATE_DISMISSAL_COOLDOWN_MS) return
        getUISnapshot().addNotification({
            message: `${getT()('common.swUpdateAvailable')} (v${__APP_VERSION__})`,
            type: 'info',
        })
    })
}

/**
 * A custom hook to manage the PWA installation prompt and status.
 * All instances share a module-level singleton so that lazy-loaded views
 * (e.g. SettingsView) always reflect the latest install state.
 */
export const usePwaInstall = () => {
    const { t } = useTranslation()
    const [, forceUpdate] = useState(0)

    // Subscribe to module-level state changes.
    useEffect(() => {
        const trigger = () => forceUpdate((n) => n + 1)
        _subs.add(trigger)
        return () => {
            _subs.delete(trigger)
        }
    }, [])

    // Flush the deferred install-hint once i18n is ready and this hook mounts.
    useEffect(() => {
        if (_pendingInstallHint) {
            _pendingInstallHint = false
            getUISnapshot().addNotification({
                message: t('common.installPwaHint'),
                type: 'info',
            })
        }
    }, [t])

    const handleInstallClick = useCallback(async () => {
        if (!_deferredPrompt) return
        const prompt = _deferredPrompt
        prompt.prompt()
        const { outcome } = await prompt.userChoice

        if (outcome === 'accepted') {
            console.debug('PWA installation accepted by user.')
            // 'appinstalled' event handles the notification and state update.
        } else {
            console.debug('PWA installation dismissed by user.')
            getUISnapshot().addNotification({
                message: t('common.installPwaDismissed'),
                type: 'info',
            })
            localStorage.setItem(PWA_INSTALL_HINT_KEY, String(Date.now()))
        }

        // The prompt can only be used once.
        _deferredPrompt = null
        _emit()
    }, [t])

    const handleUpdateClick = useCallback(() => {
        if (_swRegistration?.waiting) {
            _swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' })
        } else {
            // Fallback: force reload if no waiting worker is present
            window.location.reload()
        }
    }, [])

    return {
        deferredPrompt: _deferredPrompt,
        handleInstallClick,
        handleUpdateClick,
        isInstalled: _isInstalled,
        updateAvailable: _updateAvailable,
    }
}
