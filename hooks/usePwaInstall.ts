import { useState, useEffect, useCallback } from 'react'
import { useAppDispatch } from '../stores/store'
import { useTranslation } from 'react-i18next'
import { addNotification } from '../stores/slices/uiSlice'
import { BeforeInstallPromptEvent } from '@/types'
import { PWA_INSTALLED_KEY } from '@/constants';

const PWA_INSTALL_HINT_KEY = 'cg.pwa.install_hint.dismissed_at'
const INSTALL_HINT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000

/**
 * A custom hook to manage the PWA installation prompt and status.
 * It reliably tracks whether the app is installed using a combination of
 * browser APIs and a localStorage flag for persistence.
 */
export const usePwaInstall = () => {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

    // The initial state checks both the persistent flag and the current display mode.
    const [isInstalled, setIsInstalled] = useState(() =>
        localStorage.getItem(PWA_INSTALLED_KEY) === 'true' ||
        window.matchMedia('(display-mode: standalone)').matches
    );

    useEffect(() => {
        // This event fires if the app is installable but not yet installed.
        const beforeInstallPromptHandler = (e: Event) => {
            console.log('[PWA] beforeinstallprompt event fired.');
            e.preventDefault(); // Prevent the mini-infobar from appearing automatically.
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            const lastDismissedAt = Number(localStorage.getItem(PWA_INSTALL_HINT_KEY) || 0)
            if (Date.now() - lastDismissedAt > INSTALL_HINT_COOLDOWN_MS) {
                dispatch(addNotification({ message: t('common.installPwaHint'), type: 'info' }))
            }
            
            // If this event fires, it means the app is not installed,
            // so we ensure our state and flag reflect that. This handles uninstallation cases.
            setIsInstalled(false);
            localStorage.removeItem(PWA_INSTALLED_KEY);
        };
        
        // This event fires after the user has accepted the installation prompt.
        const appInstalledHandler = () => {
            // Clear the prompt and update the state/flag to reflect installation.
            setDeferredPrompt(null);
            setIsInstalled(true);
            localStorage.setItem(PWA_INSTALLED_KEY, 'true');
            dispatch(addNotification({ message: t('common.installPwaSuccess'), type: 'success' }));
        };

        window.addEventListener('beforeinstallprompt', beforeInstallPromptHandler);
        window.addEventListener('appinstalled', appInstalledHandler);

        // SW update detection: register-sw.js dispatches 'swUpdate' when a new SW is waiting.
        // The existing controllerchange listener in register-sw.js auto-reloads the page;
        // this handler shows a brief info toast so the user understands the imminent reload.
        const swUpdateHandler = () => {
            dispatch(addNotification({
                message: t('common.swUpdateAvailable'),
                type: 'info',
            }));
        };
        window.addEventListener('swUpdate', swUpdateHandler);

        return () => {
            window.removeEventListener('beforeinstallprompt', beforeInstallPromptHandler);
            window.removeEventListener('appinstalled', appInstalledHandler);
            window.removeEventListener('swUpdate', swUpdateHandler);
        };
    }, [t, dispatch]);

    const handleInstallClick = useCallback(async () => {
        if (!deferredPrompt) {
            return;
        }
        
        // Show the native installation prompt.
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            // The 'appinstalled' event will handle the final state change.
            console.log('PWA installation accepted by user.');
        } else {
            console.log('PWA installation dismissed by user.');
            dispatch(addNotification({ message: t('common.installPwaDismissed'), type: 'info' }));
            localStorage.setItem(PWA_INSTALL_HINT_KEY, String(Date.now()))
        }
        
        // The prompt can only be used once.
        setDeferredPrompt(null);

    }, [deferredPrompt, dispatch, t]);

    return { deferredPrompt, handleInstallClick, isInstalled };
};