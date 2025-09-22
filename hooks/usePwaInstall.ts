import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { useTranslations } from '@/hooks/useTranslations';

export const usePwaInstall = () => {
    const { addNotification } = useNotifications();
    const { t } = useTranslations();
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        const checkInstalledStatus = () => {
            if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
                setIsInstalled(true);
                setDeferredPrompt(null);
            }
        };

        checkInstalledStatus();

        const beforeInstallPromptHandler = (e: Event) => {
            e.preventDefault();
            // Stash the event so it can be triggered later, only if not already installed.
            checkInstalledStatus(); // Re-check just in case
            if (!isInstalled) {
                 setDeferredPrompt(e);
            }
        };

        window.addEventListener('beforeinstallprompt', beforeInstallPromptHandler);

        const appInstalledHandler = () => {
            setDeferredPrompt(null);
            setIsInstalled(true);
        };
        window.addEventListener('appinstalled', appInstalledHandler);

        return () => {
            window.removeEventListener('beforeinstallprompt', beforeInstallPromptHandler);
            window.removeEventListener('appinstalled', appInstalledHandler);
        };
    }, [isInstalled]);

    const handleInstallClick = useCallback(async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                addNotification(t('common.installPwaSuccess'), 'success');
            } else {
                addNotification(t('common.installPwaDismissed'), 'info');
            }
            setDeferredPrompt(null);
        }
    }, [deferredPrompt, addNotification, t]);

    return { deferredPrompt, handleInstallClick, isInstalled };
};