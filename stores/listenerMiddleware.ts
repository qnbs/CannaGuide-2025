import { createListenerMiddleware, isAnyOf, TypedStartListening } from '@reduxjs/toolkit';
import type { RootState, AppDispatch } from './store';
import { i18nInstance, getT } from '@/i18n';
import { Language, Strain } from '@/types';
import { setSetting, exportAllData, resetAllData } from './slices/settingsSlice';
import { plantStateUpdated, resetPlants, addJournalEntry } from './slices/simulationSlice';
import { addNotification, setOnboardingStep } from './slices/uiSlice';
import { indexedDBStorage } from './indexedDBStorage';

// Import actions to listen for
import { addUserStrain, updateUserStrain, deleteUserStrain } from './slices/userStrainsSlice';
import { addExport, updateExport, deleteExport, addStrainTip, updateStrainTip, deleteStrainTip, addSetup, updateSetup, deleteSetup } from './slices/savedItemsSlice';
import { addArchivedMentorResponse, addArchivedAdvisorResponse, clearArchives } from './slices/archivesSlice';
import { toggleFavorite, addMultipleToFavorites, removeMultipleFromFavorites } from './slices/favoritesSlice';

export const listenerMiddleware = createListenerMiddleware();
const REDUX_STATE_KEY = 'cannaguide-redux-storage';

type AppStartListening = TypedStartListening<RootState, AppDispatch>;
const startAppListening = listenerMiddleware.startListening as AppStartListening;


// --- State-of-the-art Persistence Logic ---

/**
 * Listener to handle state persistence to IndexedDB.
 * This is a more modern and robust approach than a manual store.subscribe().
 */
startAppListening({
  // Listen to all actions, but not the ones from RTK Query which are internal
  predicate: (action) => !action.type.startsWith('geminiApi/'),
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    try {
        const stateToSave = {
            version: state.settings.version,
            settings: state.settings,
            simulation: state.simulation,
            strainsView: state.strainsView,
            userStrains: state.userStrains,
            favorites: state.favorites,
            notes: state.notes,
            archives: state.archives,
            savedItems: state.savedItems,
            knowledge: state.knowledge,
            breeding: state.breeding,
            sandbox: state.sandbox,
            filters: state.filters,
            genealogy: state.genealogy,
        };
        const serializedState = JSON.stringify(stateToSave);
        await indexedDBStorage.setItem(REDUX_STATE_KEY, serializedState);
    } catch (e) {
        console.error("Could not save state to IndexedDB", e);
    }
  },
});


/**
 * Listener to automatically change the i18n language when the setting is updated.
 */
startAppListening({
  actionCreator: setSetting,
  effect: async (action) => {
    if (action.payload.path === 'language') {
      const newLang = action.payload.value as Language;
      if (i18nInstance.language !== newLang) {
        await i18nInstance.changeLanguage(newLang);
      }
    }
  },
});

/**
 * Listener to create notifications when a new plant problem is detected.
 */
startAppListening({
  actionCreator: plantStateUpdated,
  effect: async (action, listenerApi) => {
      const { updatedPlant } = action.payload;
      const previousState = listenerApi.getOriginalState() as RootState;
      const oldPlant = previousState.simulation.plants.entities[updatedPlant.id];
      
      if (!oldPlant) return;

      const oldProblems = new Set(oldPlant.problems.filter(p => p.status === 'active').map(p => p.type));
      const newProblems = updatedPlant.problems.filter(p => p.status === 'active');

      newProblems.forEach(problem => {
          if (!oldProblems.has(problem.type)) {
              const t = getT();
              const message = `${updatedPlant.name}: ${t(`problemMessages.${problem.type.charAt(0).toLowerCase() + problem.type.slice(1)}.message`)}`;
              listenerApi.dispatch(addNotification({ message, type: 'error' }));
          }
      });
  }
});


// --- Centralized Notification Listeners ---
const t = getT();

startAppListening({
  matcher: isAnyOf(addUserStrain, updateUserStrain),
  effect: (action, { dispatch }) => {
    const type = action.type.includes('addUser') ? 'add' : 'update';
    // The payload for userStrainsAdapter actions is the strain object itself.
    const strain = action.payload as Strain;
    dispatch(addNotification({ message: t(`strainsView.addStrainModal.validation.${type}Success`, { name: strain.name }), type: 'success' }));
  }
});

startAppListening({
  actionCreator: addSetup.fulfilled,
  effect: (action, { dispatch }) => {
    dispatch(addNotification({ message: t('equipmentView.configurator.setupSaveSuccess', { name: action.payload.name }), type: 'success' }));
  }
});

startAppListening({
  actionCreator: addExport,
  effect: (action, { dispatch }) => {
      dispatch(addNotification({
          message: t('common.successfullyExported_other', { count: action.payload.strainIds.length, format: action.payload.data.format.toUpperCase() }),
          type: 'success',
      }));
  }
});

startAppListening({
    matcher: isAnyOf(deleteExport, deleteSetup, deleteStrainTip, deleteUserStrain),
    effect: (action, { dispatch }) => {
        let message = 'Item removed.';
        if (action.type.includes('Export')) message = t('strainsView.exportsManager.exportRemoved');
        // Add more specific messages if needed for other types
        dispatch(addNotification({ message, type: 'info' }));
    }
});

startAppListening({
    matcher: isAnyOf(updateExport, updateSetup, updateStrainTip),
    effect: (action, { dispatch }) => {
        const payload = (action.payload as any).changes || action.payload;
        const name = payload.name || payload.title;
        let message = `Item "${name}" updated.`;
        if (action.type.includes('Export')) message = t('strainsView.exportsManager.updateExportSuccess', { name });
        dispatch(addNotification({ message, type: 'success' }));
    }
});

startAppListening({
  actionCreator: addStrainTip,
  effect: (action, { dispatch }) => {
    dispatch(addNotification({ message: t('strainsView.tips.saveSuccess', { name: action.payload.strain.name }), type: 'success' }));
  }
});

startAppListening({
  actionCreator: addMultipleToFavorites,
  effect: (action, { dispatch }) => {
    dispatch(addNotification({ message: t('strainsView.bulkActions.addedToFavorites', { count: action.payload.length }), type: 'success' }));
  }
});

startAppListening({
  actionCreator: removeMultipleFromFavorites,
  effect: (action, { dispatch }) => {
    dispatch(addNotification({ message: t('strainsView.bulkActions.removedFromFavorites', { count: action.payload.length }), type: 'info' }));
  }
});

startAppListening({
  actionCreator: addArchivedMentorResponse,
  effect: (_, { dispatch }) => {
    dispatch(addNotification({ message: t('knowledgeView.archive.saveSuccess'), type: 'success' }));
  }
});

startAppListening({
  actionCreator: addJournalEntry,
  effect: (action, { dispatch }) => {
    if(action.payload.entry.details && 'diagnosis' in action.payload.entry.details) {
        dispatch(addNotification({ message: t('plantsView.aiDiagnostics.savedToJournal'), type: 'success' }));
    }
  }
});

startAppListening({
  actionCreator: clearArchives,
  effect: (_, { dispatch }) => {
    dispatch(addNotification({ message: t('settingsView.data.clearArchivesSuccess'), type: 'success' }));
  }
});

startAppListening({
  actionCreator: resetPlants,
  effect: (_, { dispatch }) => {
    dispatch(addNotification({ message: t('settingsView.data.resetPlantsSuccess'), type: 'success' }));
  }
});

startAppListening({
  actionCreator: exportAllData.fulfilled,
  effect: (_, { dispatch }) => {
    dispatch(addNotification({ message: t('settingsView.data.exportSuccess'), type: 'success' }));
  }
});

startAppListening({
  actionCreator: resetAllData.fulfilled,
  effect: (_, { dispatch }) => {
      dispatch(addNotification({ message: t('settingsView.data.resetAllSuccess'), type: 'success' }));
  }
});

startAppListening({
  matcher: isAnyOf(setOnboardingStep),
  effect: (action, listenerApi) => {
    if (action.payload === 0 && (listenerApi.getOriginalState() as RootState).settings.settings.onboardingCompleted) {
        listenerApi.dispatch(addNotification({ message: t('settingsView.data.replayOnboardingSuccess'), type: 'success' }));
    }
  }
});