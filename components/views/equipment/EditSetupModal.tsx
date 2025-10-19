import React, { useState, useId } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useTranslation } from 'react-i18next';
import { SavedSetup, RecommendationCategory, RecommendationItem } from '@/types';
import { Input, FormSection } from '@/components/ui/ThemePrimitives';

interface EditSetupModalProps {
    setup: SavedSetup;
    onClose: () => void;
    onSave: (updatedSetup: SavedSetup) => void;
}

const FormTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, ...props }) => {
     const id = useId();
    return (
     <div>
        <label htmlFor={id} className="block text-xs font-semibold text-slate-300 mb-1">{label}</label>
        <Input as="textarea" rows={2} id={id} {...props} />
    </div>
    );
};


export const EditSetupModal: React.FC<EditSetupModalProps> = ({ setup, onClose, onSave }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState<SavedSetup>(setup);
    
    const handleRecommendationChange = (category: RecommendationCategory | 'proTip', field: keyof RecommendationItem | 'proTip', value: string | number) => {
        setFormData(prev => {
            if (!prev.recommendation) return prev;
            const newRecommendation = { ...prev.recommendation };
            if (field === 'proTip' && category === 'proTip') {
                (newRecommendation as any).proTip = value as string;
            } else if (category !== 'proTip' && newRecommendation[category]) {
                 const item = { ...newRecommendation[category] };
                 (item as any)[field] = (field === 'price' || field === 'watts') ? Number(value) : value;
                 newRecommendation[category] = item;
            }
            return { ...prev, recommendation: newRecommendation as any };
        });
    };

    const handleSave = () => {
        // Recalculate total cost before saving
        const totalCost = formData.recommendation ? (Object.values(formData.recommendation) as (RecommendationItem | string)[])
            .reduce((sum, item) => (typeof item === 'object' && item.price) ? sum + item.price : sum, 0) : 0;
        
        onSave({ ...formData, totalCost });
    };

    const footer = (
        <>
            <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
            <Button onClick={handleSave}>{t('common.save')}</Button>
        </>
    );

    const categoryOrder: RecommendationCategory[] = ['tent', 'light', 'ventilation', 'circulationFan', 'pots', 'soil', 'nutrients', 'extra'];

    return (
        <Modal isOpen={true} onClose={onClose} title={t('equipmentView.savedSetups.editTitle')} footer={footer} size="2xl">
            <div className="space-y-4">
                <Input 
                    label={t('common.name')}
                    value={formData.name}
                    onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                />
                
                {formData.recommendation && categoryOrder.map(key => {
                    const item = formData.recommendation[key];
                     if (!item || typeof item !== 'object') return null;
                     const categoryLabel = t(`equipmentView.configurator.categories.${key}`);
                     
                     return (
                         <FormSection title={categoryLabel} key={key}>
                            <Input label={t('equipmentView.savedSetups.pdfReport.product')} value={item.name} onChange={e => handleRecommendationChange(key, 'name', e.target.value)} />
                             <Input label={t('equipmentView.savedSetups.pdfReport.price')} type="number" value={item.price} onChange={e => handleRecommendationChange(key, 'price', e.target.value)} />
                             {item.watts !== undefined && <Input label={t('common.units.watt')} type="number" value={item.watts} onChange={e => handleRecommendationChange(key, 'watts', e.target.value)} />}
                             <div className="sm:col-span-2">
                                <FormTextarea label={t('equipmentView.savedSetups.pdfReport.rationale')} value={item.rationale} onChange={e => handleRecommendationChange(key, 'rationale', e.target.value)} />
                             </div>
                         </FormSection>
                     );
                })}

                 {formData.recommendation?.proTip && <FormSection title={t('strainsView.tips.form.categories.proTip')}>
                      <div className="sm:col-span-2">
                        <FormTextarea label="Pro-Tip" value={formData.recommendation.proTip} onChange={e => handleRecommendationChange('proTip', 'proTip', e.target.value)} />
                      </div>
                 </FormSection>}
                 {!formData.recommendation && (
                     <p className="text-sm text-slate-400 text-center py-4">{t('equipmentView.savedSetups.noDetails')}</p>
                 )}
            </div>
        </Modal>
    );
};
