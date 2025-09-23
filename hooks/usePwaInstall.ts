import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslations } from '@/hooks/useTranslations';

export const usePwaInstall = () => {
    const addNotification = useAppStore(state => state.addNotification);
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
            addNotification(t('common.installPwaSuccess'), 'success');
        };
        window.addEventListener('appinstalled', appInstalledHandler);

        return () => {
            window.removeEventListener('beforeinstallprompt', beforeInstallPromptHandler);
            window.removeEventListener('appinstalled', appInstalledHandler);
        };
    }, [t, addNotification]);

    const handleInstallClick = useCallback(async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                // The 'appinstalled' event will handle the success notification.
            } else {
                addNotification(t('common.installPwaDismissed'), 'info');
            }
            setDeferredPrompt(null);
        }
    }, [deferredPrompt, addNotification, t]);

    return { deferredPrompt, handleInstallClick, isInstalled };
};
