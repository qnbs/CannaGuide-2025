import React, { useEffect, useId, useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useTranslation } from 'react-i18next';
import { SavedSetup, RecommendationCategory, RecommendationItem } from '@/types';
import { Input, FormSection } from '@/components/ui/form';
import { Card } from '@/components/common/Card';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';

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
    const [formData, setFormData] = useState(setup);

    useEffect(() => {
        setFormData(setup);
    }, [setup]);

    const handleRecommendationChange = (category: RecommendationCategory | 'proTip', field: keyof RecommendationItem | 'proTip', value: string | number) => {
        setFormData(prev => {
            if (!prev.recommendation) return prev;
            const newRecommendation = { ...prev.recommendation };
            if (field === 'proTip' && category === 'proTip') {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                newRecommendation.proTip = value as string;
            } else if (category !== 'proTip' && newRecommendation[category]) {
                 // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                 const item = { ...newRecommendation[category] } as Record<string, string | number | undefined>;
                 // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                 item[field] = (field === 'price' || field === 'watts') ? Number(value) : value as string;
                 // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                 newRecommendation[category] = item as unknown as RecommendationItem;
            }
            return { ...prev, recommendation: newRecommendation };
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
                <Card className="overflow-hidden border-white/10 bg-[linear-gradient(135deg,rgba(14,116,144,0.14),rgba(15,23,42,0.9))]">
                    <div className="surface-badge text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary-200">
                        <PhosphorIcons.PencilSimple className="h-3.5 w-3.5" />
                        {t('equipmentView.savedSetups.editTitle')}
                    </div>
                    <p className="mt-3 text-sm text-slate-300">{t('equipmentView.configurator.setupNamePrompt')}</p>
                </Card>
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
                        <FormTextarea label={t('common.proTip')} value={formData.recommendation.proTip} onChange={e => handleRecommendationChange('proTip', 'proTip', e.target.value)} />
                      </div>
                 </FormSection>}
                 {!formData.recommendation && (
                     <p className="text-sm text-slate-400 text-center py-4">{t('equipmentView.savedSetups.noDetails')}</p>
                 )}
            </div>
        </Modal>
    );
};
