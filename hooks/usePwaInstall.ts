import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch } from '../stores/store';
import { useTranslation } from 'react-i18next';
import { addNotification } from '../stores/slices/uiSlice';
import { BeforeInstallPromptEvent } from '@/types';

const PWA_INSTALLED_KEY = 'cannaGuidePwaInstalled';

export const usePwaInstall = () => {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(
        () =>
            localStorage.getItem(PWA_INSTALLED_KEY) === 'true' ||
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true
    );

    useEffect(() => {
        const beforeInstallPromptHandler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // If the prompt appears, we know it's not truly installed.
            // This is a good place to clear the flag in case of uninstallation.
            localStorage.removeItem(PWA_INSTALLED_KEY);
            setIsInstalled(false);
        };

        window.addEventListener('beforeinstallprompt', beforeInstallPromptHandler);

        const appInstalledHandler = () => {
            setDeferredPrompt(null);
            setIsInstalled(true);
            localStorage.setItem(PWA_INSTALLED_KEY, 'true'); // Also set here for robustness
            dispatch(addNotification({ message: t('common.installPwaSuccess'), type: 'success' }));
        };
        window.addEventListener('appinstalled', appInstalledHandler);

        return () => {
            window.removeEventListener('beforeinstallprompt', beforeInstallPromptHandler);
            window.removeEventListener('appinstalled', appInstalledHandler);
        };
    }, [t, dispatch]);

    const handleInstallClick = useCallback(async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                // The 'appinstalled' event will fire, but we can set the flag here for quicker UI feedback.
                localStorage.setItem(PWA_INSTALLED_KEY, 'true');
                setIsInstalled(true); // Manually update state
            } else {
                dispatch(addNotification({ message: t('common.installPwaDismissed'), type: 'info' }));
            }
            setDeferredPrompt(null);
        }
    }, [deferredPrompt, dispatch, t]);

    return { deferredPrompt, handleInstallClick, isInstalled };
};
