import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useOnlineStatus } from './useOnlineStatus';
import { usePwaInstall } from './usePwaInstall';
import { useAppDispatch } from '@/stores/store';
import { addNotification } from '@/stores/slices/uiSlice';

export const useGlobalEffects = () => {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const isOffline = useOnlineStatus();
    const { deferredPrompt, handleInstallClick, isInstalled } = usePwaInstall();

    useEffect(() => {
        if (isOffline) {
            dispatch(addNotification({ message: t('common.offlineWarning'), type: 'info' }));
        }
    }, [isOffline, dispatch, t]);

    return { deferredPrompt, handleInstallClick, isInstalled, isOffline };
};
