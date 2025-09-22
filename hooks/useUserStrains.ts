import { useState, useEffect, useCallback, useMemo } from 'react';
import { Strain } from '@/types';
import { storageService } from '@/services/storageService';
import { useNotifications } from '@/context/NotificationContext';
import { useTranslations } from '@/hooks/useTranslations';

const STORAGE_KEY = 'user_added_strains';

export const useUserStrains = () => {
  const [userStrains, setUserStrains] = useState<Strain[]>(() =>
    storageService.getItem<Strain[]>(STORAGE_KEY, [])
  );
  const { addNotification } = useNotifications();
  const { t } = useTranslations();

  // Memoize a map for O(1) lookups by ID, useful for checking existence or direct access.
  const userStrainsById = useMemo(() => {
    return new Map(userStrains.map(strain => [strain.id, strain]));
  }, [userStrains]);

  useEffect(() => {
    // Persist changes to localStorage. This is a crucial side effect.
    storageService.setItem(STORAGE_KEY, userStrains);
  }, [userStrains]);

  const addUserStrain = useCallback((strain: Strain) => {
    // Prevent adding duplicates by ID or name (case-insensitive).
    if (userStrainsById.has(strain.id) || userStrains.some(s => s.name.toLowerCase() === strain.name.toLowerCase())) {
      addNotification(t('strainsView.addStrainModal.validation.duplicate', { name: strain.name }), 'error');
      return;
    }
    setUserStrains(prev => [...prev, strain].sort((a,b) => a.name.localeCompare(b.name)));
    addNotification(t('strainsView.addStrainModal.validation.addSuccess', { name: strain.name }), 'success');
  }, [userStrains, userStrainsById, addNotification, t]);

  const updateUserStrain = useCallback((updatedStrain: Strain) => {
    if (!userStrainsById.has(updatedStrain.id)) {
      addNotification(t('strainsView.addStrainModal.validation.updateNotFound'), 'error');
      return;
    }
    // Check if another strain with the new name already exists.
    if (userStrains.some(s => s.id !== updatedStrain.id && s.name.toLowerCase() === updatedStrain.name.toLowerCase())) {
        addNotification(t('strainsView.addStrainModal.validation.duplicate', { name: updatedStrain.name }), 'error');
        return;
    }
    setUserStrains(prev => prev.map(s => s.id === updatedStrain.id ? updatedStrain : s).sort((a,b) => a.name.localeCompare(b.name)));
    addNotification(t('strainsView.addStrainModal.validation.updateSuccess', { name: updatedStrain.name }), 'success');
  }, [userStrains, userStrainsById, addNotification, t]);

  const deleteUserStrain = useCallback((strainId: string) => {
    const strainToDelete = userStrainsById.get(strainId);
    if (!strainToDelete) return; 
    
    if (window.confirm(t('strainsView.addStrainModal.validation.deleteConfirm', { name: strainToDelete.name }))) {
        setUserStrains(prev => prev.filter(s => s.id !== strainId));
        addNotification(t('strainsView.addStrainModal.validation.deleteSuccess', { name: strainToDelete.name }), 'info');
    }
  }, [userStrainsById, addNotification, t]);
  
  const isUserStrain = useCallback((strainId: string): boolean => {
      return userStrainsById.has(strainId);
  }, [userStrainsById]);

  return { 
      userStrains, 
      userStrainsById,
      addUserStrain, 
      updateUserStrain, 
      deleteUserStrain,
      isUserStrain
    };
};