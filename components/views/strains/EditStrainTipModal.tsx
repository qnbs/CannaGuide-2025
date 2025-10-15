import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useTranslation } from 'react-i18next';
import { SavedStrainTip } from '@/types';
import { Input } from '@/components/ui/ThemePrimitives';

interface EditStrainTipModalProps {
    tip: SavedStrainTip;
    onClose: () => void;
    onSave: (updatedTip: SavedStrainTip) => void;
}

const TipTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-semibold text-slate-300 mb-1">{label}</label>
        <Input as="textarea" rows={3} {...props} />
    </div>
);

export const EditStrainTipModal: React.FC<EditStrainTipModalProps> = ({ tip, onClose, onSave }) => {
    const { t } = useTranslation();
    const [editedTip, setEditedTip] = useState(tip);

    const handleChange = (field: keyof SavedStrainTip, value: string) => {
        setEditedTip(prev => ({ ...prev, [field]: value }));
    };

    const footer = (
        <>
            <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
            <Button onClick={() => onSave(editedTip)} glow>{t('common.save')}</Button>
        </>
    );

    return (
        <Modal isOpen={true} onClose={onClose} title={t('strainsView.tips.editTipTitle')} size="lg" footer={footer}>
            <div className="space-y-4">
                <Input
                    label={t('common.name')}
                    type="text"
                    value={editedTip.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                />
                <TipTextarea label={t('strainsView.tips.form.categories.nutrientTip')} value={editedTip.nutrientTip} onChange={e => handleChange('nutrientTip', e.target.value)} />
                <TipTextarea label={t('strainsView.tips.form.categories.trainingTip')} value={editedTip.trainingTip} onChange={e => handleChange('trainingTip', e.target.value)} />
                <TipTextarea label={t('strainsView.tips.form.categories.environmentalTip')} value={editedTip.environmentalTip} onChange={e => handleChange('environmentalTip', e.target.value)} />
                <TipTextarea label={t('strainsView.tips.form.categories.proTip')} value={editedTip.proTip} onChange={e => handleChange('proTip', e.target.value)} />
            </div>
        </Modal>
    );
};