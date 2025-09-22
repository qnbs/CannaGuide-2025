import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslations } from '@/hooks/useTranslations';

export const usePwaInstall = () => {
    const addNotification = useAppStore(state => state.addNotification);
    const { t } = useTranslations();
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Function to check the current installation status
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
            // Re-check status inside the handler to ensure it's not stale.
            // Do not show the install prompt if the app is already running standalone.
            if (checkInstalledStatus()) {
                return;
            }
            setDeferredPrompt(e);
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
    }, []); // This effect should only run once to set up event listeners.

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
