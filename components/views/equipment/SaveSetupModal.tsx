import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useTranslation } from 'react-i18next';
import { SavedSetup } from '@/types';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/common/Card';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';

interface SaveSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string) => void;
    setupToSave: Omit<SavedSetup, 'id' | 'createdAt' | 'name'>;
}

export const SaveSetupModal: React.FC<SaveSetupModalProps> = ({ isOpen, onClose, onSave, setupToSave }) => {
    const { t } = useTranslation();
    const { plantCount, experience, budget } = setupToSave.sourceDetails;
    const suggestedName = useMemo(
        () => `${t('equipmentView.configurator.plantCount', { count: parseInt(plantCount, 10) })} - ${t(`strainsView.tips.form.experienceOptions.${experience}`)} - ${budget}€`,
        [budget, experience, plantCount, t],
    );
    const [name, setName] = useState(suggestedName);

    useEffect(() => {
        if (isOpen) {
            setName(suggestedName);
        }
    }, [isOpen, suggestedName]);

    const handleSave = () => {
        if (name.trim()) {
            onSave(name.trim());
        }
    };

    const footer = (
        <>
            <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={!name.trim()} glow={true}>{t('common.save')}</Button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('equipmentView.configurator.saveSetup')}
            footer={footer}
            size="xl"
        >
            <div className="space-y-4">
                <Card className="overflow-hidden border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(30,41,59,0.78))]">
                    <div className="flex items-start gap-3">
                        <div className="surface-badge text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary-200">
                            <PhosphorIcons.ArchiveBox className="h-3.5 w-3.5" />
                            {t('equipmentView.configurator.saveSetup')}
                        </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{t('equipmentView.configurator.setupNamePrompt')}</p>
                </Card>
                <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                    className="min-h-12"
                />
            </div>
        </Modal>
    );
};
