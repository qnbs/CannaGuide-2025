import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch } from '../stores/store';
import { useTranslations } from './useTranslations';
import { addNotification } from '../stores/slices/uiSlice';

export const usePwaInstall = () => {
    const dispatch = useAppDispatch();
    const { t } = useTranslations();
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        const checkInstalledStatus = () => {
            const isAppInstalled = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
            setIsInstalled(isAppInstalled);
            if (isAppInstalled) {
                setDeferredPrompt(null);
            }
            return isAppInstalled;
        };

        checkInstalledStatus();

        const beforeInstallPromptHandler = (e: Event) => {
            e.preventDefault();
            if (checkInstalledStatus()) {
                return;
            }
            setDeferredPrompt(e);
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
                // The 'appinstalled' event will handle the success notification.
            } else {
                dispatch(addNotification({ message: t('common.installPwaDismissed'), type: 'info' }));
            }
            setDeferredPrompt(null);
        }
    }, [deferredPrompt, dispatch, t]);

    return { deferredPrompt, handleInstallClick, isInstalled };
};
