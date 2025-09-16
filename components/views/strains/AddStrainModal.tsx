import React, { useState, useEffect, useId } from 'react';
import { Strain } from '../../../types';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { useNotifications } from '../../../context/NotificationContext';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { useTranslations } from '../../../hooks/useTranslations';

interface AddStrainModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddStrain: (strain: Strain) => void;
    onUpdateStrain: (strain: Strain) => void;
    strainToEdit: Strain | null;
}

const defaultStrainData: Partial<Strain> = {
    type: 'Hybrid',
    thc: 20,
    cbd: 1,
    floweringTime: 9,
    agronomic: {
        difficulty: 'Medium',
        yield: 'Medium',
        height: 'Medium',
    },
};

const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h3 className="text-lg font-semibold text-primary-600 dark:text-primary-400 border-b border-primary-200 dark:border-primary-800 pb-1 mb-3">{title}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {children}
        </div>
    </div>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, id: providedId, ...props }) => {
    const fallbackId = useId();
    const id = providedId || fallbackId;
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</label>
            <input id={id} {...props} className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
    );
};

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, id: providedId, ...props }) => {
    const fallbackId = useId();
    const id = providedId || fallbackId;
    return (
        <div className="sm:col-span-2">
            <label htmlFor={id} className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</label>
            <textarea id={id} {...props} rows={3} className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
    );
};

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: { value: string; label: string }[] }> = ({ label, options, id: providedId, ...props }) => {
    const fallbackId = useId();
    const id = providedId || fallbackId;
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</label>
            <select id={id} {...props} className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
    )
}

export const AddStrainModal: React.FC<AddStrainModalProps> = ({ isOpen, onClose, onAddStrain, onUpdateStrain, strainToEdit }) => {
    const { t } = useTranslations();
    const { addNotification } = useNotifications();
    const [strainData, setStrainData] = useState<any>({});
    
    const isEditMode = !!strainToEdit;

    useEffect(() => {
        if (isOpen) {
            if (isEditMode) {
                 setStrainData({
                    ...strainToEdit,
                    aromasString: (strainToEdit.aromas || []).join(', '),
                    terpenesString: (strainToEdit.dominantTerpenes || []).join(', '),
                    agronomic: {
                        ...strainToEdit.agronomic,
                        yieldIndoor: strainToEdit.agronomic.yieldDetails?.indoor || '',
                        yieldOutdoor: strainToEdit.agronomic.yieldDetails?.outdoor || '',
                        heightIndoor: strainToEdit.agronomic.heightDetails?.indoor || '',
                        heightOutdoor: strainToEdit.agronomic.heightDetails?.outdoor || '',
                    }
                });
            } else {
                setStrainData(defaultStrainData);
            }
        }
    }, [isOpen, strainToEdit, isEditMode]);


    const handleChange = (field: string, value: any) => {
        const keys = field.split('.');
        if (keys.length > 1) {
            setStrainData((prev: any) => ({
                ...prev,
                [keys[0]]: { ...prev[keys[0]], [keys[1]]: value }
            }));
        } else {
            setStrainData((prev: any) => ({ ...prev, [field]: value }));
        }
    };
    
    const parseStringToArray = (str: string = '') => str.split(',').map(s => s.trim()).filter(Boolean);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const errors = [];
        if (!strainData.name?.trim()) errors.push(t('strainsView.addStrainModal.validation.name'));
        
        const thc = parseFloat(strainData.thc);
        if (isNaN(thc) || thc < 0 || thc > 50) errors.push(t('strainsView.addStrainModal.validation.thc'));

        const floweringTime = parseFloat(strainData.floweringTime);
        if (isNaN(floweringTime) || floweringTime < 4 || floweringTime > 20) errors.push(t('strainsView.addStrainModal.validation.floweringTime'));

        if (errors.length > 0) {
            addNotification(errors.join(' '), 'error');
            return;
        }

        const finalStrain: Strain = {
            id: isEditMode ? strainToEdit.id : `${strainData.name.toLowerCase().replace(/\s/g, '-')}-${Date.now()}`,
            name: strainData.name,
            type: strainData.type,
            typeDetails: strainData.typeDetails,
            genetics: strainData.genetics,
            thc: parseFloat(strainData.thc),
            cbd: parseFloat(strainData.cbd || 1),
            thcRange: strainData.thcRange,
            cbdRange: strainData.cbdRange,
            floweringTime: parseFloat(strainData.floweringTime),
            floweringTimeRange: strainData.floweringTimeRange,
            description: strainData.description,
            aromas: parseStringToArray(strainData.aromasString),
            dominantTerpenes: parseStringToArray(strainData.terpenesString),
            agronomic: {
                difficulty: strainData.agronomic.difficulty,
                yield: strainData.agronomic.yield,
                height: strainData.agronomic.height,
                yieldDetails: {
                    indoor: strainData.agronomic.yieldIndoor,
                    outdoor: strainData.agronomic.yieldOutdoor,
                },
                heightDetails: {
                    indoor: strainData.agronomic.heightIndoor,
                    outdoor: strainData.agronomic.heightOutdoor,
                }
            }
        };

        if (isEditMode) {
            onUpdateStrain(finalStrain);
        } else {
            onAddStrain(finalStrain);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <Card className="w-full max-w-2xl modal-content-animate" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <div className="flex justify-between items-start">
                        <h2 className="text-2xl font-bold text-primary-500 dark:text-primary-400 mb-4">
                            {isEditMode ? t('strainsView.addStrainModal.editTitle') : t('strainsView.addStrainModal.title')}
                        </h2>
                        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label={t('common.close')}>
                            <PhosphorIcons.X className="w-6 h-6" />
                        </button>
                    </div>
                    
                    <div className="overflow-y-auto pr-2 flex-grow" style={{maxHeight: '70vh'}}>
                        <div className="space-y-6">
                           <FormSection title={t('strainsView.addStrainModal.generalInfo')}>
                                <Input label={`${t('strainsView.addStrainModal.strainName')} *`} value={strainData.name || ''} onChange={(e) => handleChange('name', e.target.value)} required />
                                <Select label={t('common.type')} value={strainData.type} onChange={(e) => handleChange('type', e.target.value)} options={[{value: 'Sativa', label: t('strainsView.sativa')}, {value: 'Indica', label: t('strainsView.indica')}, {value: 'Hybrid', label: t('strainsView.hybrid')}]}/>
                                <Input label={t('common.typeDetails')} value={strainData.typeDetails || ''} onChange={(e) => handleChange('typeDetails', e.target.value)} placeholder={t('strainsView.addStrainModal.typeDetailsPlaceholder')} />
                                <Input label={t('common.genetics')} value={strainData.genetics || ''} onChange={(e) => handleChange('genetics', e.target.value)} />
                           </FormSection>

                           <FormSection title={t('strainsView.addStrainModal.cannabinoids')}>
                                <Input label={`${t('strainsView.addStrainModal.thcPercent')} *`} type="number" step="0.1" value={strainData.thc || ''} onChange={(e) => handleChange('thc', e.target.value)} required />
                                <Input label={t('strainsView.addStrainModal.cbdPercent')} type="number" step="0.1" value={strainData.cbd || ''} onChange={(e) => handleChange('cbd', e.target.value)} />
                                <Input label={t('strainsView.addStrainModal.thcRange')} value={strainData.thcRange || ''} onChange={(e) => handleChange('thcRange', e.target.value)} placeholder={t('strainsView.addStrainModal.thcRangePlaceholder')} />
                                <Input label={t('strainsView.addStrainModal.cbdRange')} value={strainData.cbdRange || ''} onChange={(e) => handleChange('cbdRange', e.target.value)} placeholder={t('strainsView.addStrainModal.cbdRangePlaceholder')} />
                           </FormSection>

                           <FormSection title={t('strainsView.addStrainModal.growData')}>
                                <Input label={`${t('strainsView.addStrainModal.floweringTimeWeeks')} *`} type="number" step="0.5" value={strainData.floweringTime || ''} onChange={(e) => handleChange('floweringTime', e.target.value)} required />
                                <Input label={t('strainsView.addStrainModal.floweringTimeRange')} value={strainData.floweringTimeRange || ''} onChange={(e) => handleChange('floweringTimeRange', e.target.value)} placeholder={t('strainsView.addStrainModal.floweringTimeRangePlaceholder')}/>
                                <Select label={t('strainsView.table.level')} value={strainData.agronomic?.difficulty} onChange={(e) => handleChange('agronomic.difficulty', e.target.value)} options={[{value: 'Easy', label: t('strainsView.difficulty.easy')}, {value: 'Medium', label: t('strainsView.difficulty.medium')}, {value: 'Hard', label: t('strainsView.difficulty.hard')}]}/>
                                <Select label={t('strainsView.addStrainModal.yield')} value={strainData.agronomic?.yield} onChange={(e) => handleChange('agronomic.yield', e.target.value)} options={[{value: 'Low', label: t('strainsView.addStrainModal.yields.low')}, {value: 'Medium', label: t('strainsView.addStrainModal.yields.medium')}, {value: 'High', label: t('strainsView.addStrainModal.yields.high')}]}/>
                                <Input label={t('strainsView.strainModal.yieldIndoor')} value={strainData.agronomic?.yieldIndoor || ''} onChange={(e) => handleChange('agronomic.yieldIndoor', e.target.value)} placeholder={t('strainsView.addStrainModal.yieldIndoorPlaceholder')}/>
                                <Input label={t('strainsView.strainModal.yieldOutdoor')} value={strainData.agronomic?.yieldOutdoor || ''} onChange={(e) => handleChange('agronomic.yieldOutdoor', e.target.value)} placeholder={t('strainsView.addStrainModal.yieldOutdoorPlaceholder')}/>
                                <Input label={t('strainsView.strainModal.heightIndoor')} value={strainData.agronomic?.heightIndoor || ''} onChange={(e) => handleChange('agronomic.heightIndoor', e.target.value)} placeholder={t('strainsView.addStrainModal.heightIndoorPlaceholder')}/>
                                <Input label={t('strainsView.strainModal.heightOutdoor')} value={strainData.agronomic?.heightOutdoor || ''} onChange={(e) => handleChange('agronomic.heightOutdoor', e.target.value)} placeholder={t('strainsView.addStrainModal.heightOutdoorPlaceholder')}/>
                           </FormSection>

                           <FormSection title={t('strainsView.addStrainModal.profile')}>
                                <Textarea label={t('common.description')} value={strainData.description || ''} onChange={(e) => handleChange('description', e.target.value)} />
                                <Input label={t('strainsView.strainModal.aromas')} value={strainData.aromasString || ''} onChange={(e) => handleChange('aromasString', e.target.value)} placeholder={t('strainsView.addStrainModal.aromasPlaceholder')} />
                                <Input label={t('strainsView.strainModal.dominantTerpenes')} value={strainData.terpenesString || ''} onChange={(e) => handleChange('terpenesString', e.target.value)} placeholder={t('strainsView.addStrainModal.terpenesPlaceholder')} />
                           </FormSection>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
                        <Button type="submit">{t('common.save')}</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};