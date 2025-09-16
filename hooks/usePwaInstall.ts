import { useState, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useTranslations } from './useTranslations';

export const usePwaInstall = () => {
    const { addNotification } = useNotifications();
    const { t } = useTranslations();
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        const handleAppInstalled = () => {
            setDeferredPrompt(null);
        };

        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
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
    };

    return { deferredPrompt, handleInstallClick };
};
