import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch } from '../stores/store';
import { useTranslation } from 'react-i18next';
import { addNotification } from '../stores/slices/uiSlice';
import { BeforeInstallPromptEvent } from '@/types';

export const usePwaInstall = () => {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(
        () => window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
    );

    useEffect(() => {
        const beforeInstallPromptHandler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setIsInstalled(false);
        };

        window.addEventListener('beforeinstallprompt', beforeInstallPromptHandler);

        const appInstalledHandler = () => {
            setDeferredPrompt(null);
            setIsInstalled(true);
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
                // The 'appinstalled' event will handle success notification.
            } else {
                dispatch(addNotification({ message: t('common.installPwaDismissed'), type: 'info' }));
            }
            setDeferredPrompt(null);
        }
    }, [deferredPrompt, dispatch, t]);

    return { deferredPrompt, handleInstallClick, isInstalled };
};