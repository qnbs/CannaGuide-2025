import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useTranslation } from 'react-i18next';
import { SavedSetup } from '@/types';
import { Input } from '@/components/ui/ThemePrimitives';

interface SaveSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string) => void;
    setupToSave: Omit<SavedSetup, 'id' | 'createdAt' | 'name'>;
}

export const SaveSetupModal: React.FC<SaveSetupModalProps> = ({ isOpen, onClose, onSave, setupToSave }) => {
    const { t } = useTranslation();
    const suggestedName = `${t(`equipmentView.configurator.budgets.${setupToSave.sourceDetails.budget}`)} - ${setupToSave.sourceDetails.area}`;
    const [name, setName] = useState(suggestedName);

    const handleSave = () => {
        if (name.trim()) {
            onSave(name.trim());
        }
    };

    const footer = (
        <>
            <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={!name.trim()}>{t('common.save')}</Button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('equipmentView.configurator.saveSetup')}
            footer={footer}
        >
            <div className="space-y-4">
                <p className="text-sm text-slate-400">{t('equipmentView.configurator.setupNamePrompt')}</p>
                <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                />
            </div>
        </Modal>
    );
};