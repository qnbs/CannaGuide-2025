import React from 'react';
import { useAppSelector, useAppDispatch } from '@/stores/store';
import { closeSaveSetupModal, setEquipmentViewTab } from '@/stores/slices/uiSlice';
import { addSetup } from '@/stores/slices/savedItemsSlice';
import { SaveSetupModal } from './SaveSetupModal';
import { EquipmentViewTab } from '@/types';
import { selectIsSaveSetupModalOpen, selectSetupToSave } from '@/stores/selectors';

export const SaveSetupModalContainer: React.FC = () => {
    const dispatch = useAppDispatch();
    const isSaveSetupModalOpen = useAppSelector(selectIsSaveSetupModalOpen);
    const setupToSave = useAppSelector(selectSetupToSave);

    const handleSave = (name: string) => {
        if (setupToSave) {
            dispatch(addSetup({ ...setupToSave, name }))
                .unwrap()
                .then(() => {
                    dispatch(closeSaveSetupModal());
                    dispatch(setEquipmentViewTab(EquipmentViewTab.Setups));
                });
        }
    };

    if (!isSaveSetupModalOpen || !setupToSave) {
        return null;
    }

    return (
        <SaveSetupModal
            isOpen={true}
            onClose={() => dispatch(closeSaveSetupModal())}
            onSave={handleSave}
            setupToSave={setupToSave}
        />
    );
};