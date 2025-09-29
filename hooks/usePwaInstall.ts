import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch } from '../stores/store';
import { useTranslation } from 'react-i18next';
import { addNotification } from '../stores/slices/uiSlice';
import { BeforeInstallPromptEvent } from '@/types';
import { storageService } from '@/services/storageService';

export const usePwaInstall = () => {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(() => storageService.getItem('isPwaInstalled', false));

    useEffect(() => {
        const beforeInstallPromptHandler = (e: Event) => {
            e.preventDefault();
            if (isInstalled) {
                return;
            }
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', beforeInstallPromptHandler);

        const appInstalledHandler = () => {
            storageService.setItem('isPwaInstalled', true);
            setDeferredPrompt(null);
            setIsInstalled(true);
            dispatch(addNotification({ message: t('common.installPwaSuccess'), type: 'success' }));
        };
        window.addEventListener('appinstalled', appInstalledHandler);

        return () => {
            window.removeEventListener('beforeinstallprompt', beforeInstallPromptHandler);
            window.removeEventListener('appinstalled', appInstalledHandler);
        };
    }, [t, dispatch, isInstalled]);

    const handleInstallClick = useCallback(async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                // The 'appinstalled' event will handle success notification and storage.
            } else {
                dispatch(addNotification({ message: t('common.installPwaDismissed'), type: 'info' }));
            }
            setDeferredPrompt(null);
        }
    }, [deferredPrompt, dispatch, t]);

    return { deferredPrompt, handleInstallClick, isInstalled };
};
