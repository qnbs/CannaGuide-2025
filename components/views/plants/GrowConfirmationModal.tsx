import React from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useAppDispatch } from '@/stores/store';
import { cancelNewGrow } from '@/stores/slices/uiSlice';
import { startNewPlant } from '@/stores/slices/simulationSlice';

export const GrowConfirmationModal: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();

    const handleConfirm = () => {
        dispatch(startNewPlant());
    };

    const footer = (
        <>
            <Button variant="secondary" onClick={() => dispatch(cancelNewGrow())}>{t('common.cancel')}</Button>
            <Button onClick={handleConfirm}>{t('plantsView.confirmationModal.confirmButton')}</Button>
        </>
    );

    return (
        <Modal 
            isOpen={true} 
            onClose={() => dispatch(cancelNewGrow())} 
            title={t('plantsView.confirmationModal.title')}
            footer={footer}
            size="lg"
        >
            <div className="text-center space-y-4">
                <PhosphorIcons.Sparkle className="w-16 h-16 text-primary-400 mx-auto" />
                <p className="text-slate-300">{t('plantsView.confirmationModal.text')}</p>
            </div>
        </Modal>
    );
};