import React from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslations } from '@/hooks/useTranslations';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';

export const GrowConfirmationModal: React.FC = () => {
    const { t } = useTranslations();
    const { finalizeNewGrow, cancelNewGrow } = useAppStore(state => ({
        finalizeNewGrow: state.finalizeNewGrow,
        cancelNewGrow: state.cancelNewGrow,
    }));

    const footer = (
        <>
            <Button variant="secondary" onClick={cancelNewGrow}>{t('common.cancel')}</Button>
            <Button onClick={finalizeNewGrow}>{t('plantsView.confirmationModal.confirmButton')}</Button>
        </>
    );

    return (
        <Modal 
            isOpen={true} 
            onClose={cancelNewGrow} 
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
