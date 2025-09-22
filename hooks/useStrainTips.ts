import { useState, useEffect, useCallback } from 'react';
import { SavedStrainTip, AIResponse, Strain } from '@/types';
import { storageService } from '@/services/storageService';
import { useNotifications } from '@/context/NotificationContext';
import { useTranslations } from '@/hooks/useTranslations';

const STORAGE_KEY = 'strain_tips';

export const useStrainTips = () => {
    const { addNotification } = useNotifications();
    const { t } = useTranslations();
    const [savedTips, setSavedTips] = useState<SavedStrainTip[]>(() =>
        storageService.getItem<SavedStrainTip[]>(STORAGE_KEY, [])
    );

    useEffect(() => {
        storageService.setItem(STORAGE_KEY, savedTips);
    }, [savedTips]);

    const addTip = useCallback((strain: Strain, tip: AIResponse) => {
        const newTip: SavedStrainTip = {
            ...tip,
            id: `tip-${strain.id}-${Date.now()}`,
            createdAt: Date.now(),
            strainId: strain.id,
            strainName: strain.name,
        };
        setSavedTips(prev => [newTip, ...prev].slice(0, 100)); // Keep max 100 tips
        addNotification(t('strainsView.tips.saveSuccess', { name: strain.name }), 'success');
    }, [addNotification, t]);

    const updateTip = useCallback((updatedTip: SavedStrainTip) => {
        setSavedTips(prev => prev.map(tip => (tip.id === updatedTip.id ? updatedTip : tip)));
        addNotification(t('strainsView.tips.updateSuccess'), 'success');
    }, [addNotification, t]);

    const deleteTip = useCallback((tipId: string) => {
        if (window.confirm(t('strainsView.tips.deleteConfirm'))) {
            setSavedTips(prev => prev.filter(tip => tip.id !== tipId));
            addNotification(t('strainsView.tips.deleteSuccess'), 'info');
        }
    }, [addNotification, t]);

    return { savedTips, addTip, updateTip, deleteTip };
};