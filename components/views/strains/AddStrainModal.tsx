import React, { useEffect, useId } from 'react';
import { Strain, StrainType, DifficultyLevel, YieldLevel, HeightLevel } from '@/types';
import { Button } from '@/components/common/Button';
import { useAppStore } from '@/stores/useAppStore';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslations } from '@/hooks/useTranslations';
import { useForm } from '@/hooks/useForm';
import { Modal } from '@/components/common/Modal';

interface AddStrainModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddStrain: (strain: Strain) => void;
    onUpdateStrain: (strain: Strain) => void;
    strainToEdit: Strain | null;
}

const strainToFormValues = (strain: Partial<Strain>) => ({
    name: strain.name || '',
    type: strain.type || 'Hybrid',
    typeDetails: strain.typeDetails || '',
    genetics: strain.genetics || '',
    isAutoflower: strain.geneticsDetails?.isAutoflower || false,
    thc: strain.thc || 20,
    cbd: strain.cbd || 1,
    thcRange: strain.thcRange || '',
    cbdRange: strain.cbdRange || '',
    floweringTime: strain.floweringTime || 9,
    floweringTimeRange: strain.floweringTimeRange || '',
    description: strain.description || '',
    aromasString: (strain.aromas || []).join(', '),
    terpenesString: (strain.dominantTerpenes || []).join(', '),
    difficulty: strain.agronomic?.difficulty || 'Medium',
    yield: strain.agronomic?.yield || 'Medium',
    height: strain.agronomic?.height || 'Medium',
    yieldIndoor: strain.agronomic?.yieldDetails?.indoor || '',
    yieldOutdoor: strain.agronomic?.yieldDetails?.outdoor || '',
    heightIndoor: strain.agronomic?.heightDetails?.indoor || '',
    heightOutdoor: strain.agronomic?.heightDetails?.outdoor || '',
});

const defaultStrainValues = strainToFormValues({
    agronomic: { difficulty: 'Medium', yield: 'Medium', height: 'Medium' }
});

const FormSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => (
    <details open={defaultOpen} className="group">
        <summary className="text-lg font-semibold text-primary-400 cursor-pointer mb-3 list-none flex items-center gap-2">
            <PhosphorIcons.ChevronDown className="w-5 h-5 transition-transform duration-200 group-open:rotate-90" />
            {title}
        </summary>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-4 border-l-2 border-slate-700 pl-5">
            {children}
        </div>
    </details>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, id: providedId, ...props }) => {
    const fallbackId = useId();
    const id = providedId || fallbackId;
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-semibold text-slate-300 mb-1">{label}</label>
            <input id={id} {...props} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
    );
};

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, id: providedId, ...props }) => {
    const fallbackId = useId();
    const id = providedId || fallbackId;
    return (
        <div className="sm:col-span-2">
            <label htmlFor={id} className="block text-sm font-semibold text-slate-300 mb-1">{label}</label>
            <textarea id={id} {...props} rows={3} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
    );
};

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: { value: string; label: string }[] }> = ({ label, options, id: providedId, ...props }) => {
    const fallbackId = useId();
    const id = providedId || fallbackId;
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-semibold text-slate-300 mb-1">{label}</label>
            <select id={id} {...props} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
    )
}

export const AddStrainModal: React.FC<AddStrainModalProps> = ({ isOpen, onAddStrain, onUpdateStrain, strainToEdit, ...props }) => {
    const { t } = useTranslations();
    const addNotification = useAppStore(state => state.addNotification);
    const isEditMode = !!strainToEdit;

    const validate = (values: any) => {
        const errors: any = {};
        if (!values.name?.trim()) errors.name = t('strainsView.addStrainModal.validation.name');
        const thc = parseFloat(values.thc);
        if (isNaN(thc) || thc < 0 || thc > 50) errors.thc = t('strainsView.addStrainModal.validation.thc');
        const floweringTime = parseFloat(values.floweringTime);
        if (isNaN(floweringTime) || floweringTime < 4 || floweringTime > 20) errors.floweringTime = t('strainsView.addStrainModal.validation.floweringTime');
        const rangeRegex = /^(?:[<~>]?\s*\d{1,2}(?:\.\d+)?\s*%?)$|^(?:\d{1,2}(?:\.\d+)?\s*-\s*\d{1,2}(?:\.\d+)?\s*%?)$/;
        if (values.thcRange && !rangeRegex.test(values.thcRange)) errors.thcRange = t('strainsView.addStrainModal.validation.thcRange');
        if (values.cbdRange && !rangeRegex.test(values.cbdRange)) errors.cbdRange = t('strainsView.addStrainModal.validation.cbdRange');
        return errors;
    };
    
    const onSubmit = (values: any) => {
        const parseStringToArray = (str: string = '') => str ? str.split(/\s*,\s*/).filter(Boolean) : [];
        const finalStrain: Strain = {
            id: isEditMode ? strainToEdit.id : `${values.name.toLowerCase().replace(/\s/g, '-')}-${Date.now()}`,
            name: values.name,
            type: values.type as StrainType,
            typeDetails: values.typeDetails,
            genetics: values.genetics,
            geneticsDetails: {
                isAutoflower: values.isAutoflower,
            },
            thc: parseFloat(values.thc),
            cbd: parseFloat(values.cbd || 1),
            thcRange: values.thcRange,
            cbdRange: values.cbdRange,
            floweringTime: parseFloat(values.floweringTime),
            floweringTimeRange: values.floweringTimeRange,
            description: values.description,
            aromas: parseStringToArray(values.aromasString),
            dominantTerpenes: parseStringToArray(values.terpenesString),
            agronomic: {
                difficulty: values.difficulty as DifficultyLevel,
                yield: values.yield as YieldLevel,
                height: values.height as HeightLevel,
                yieldDetails: { indoor: values.yieldIndoor, outdoor: values.yieldOutdoor },
                heightDetails: { indoor: values.heightIndoor, outdoor: values.heightOutdoor }
            }
        };

        if (isEditMode) {
            onUpdateStrain(finalStrain);
        } else {
            onAddStrain(finalStrain);
        }
    };
    
    const { values, errors, handleChange, handleSubmit } = useForm({
        initialValues: isEditMode ? strainToFormValues(strainToEdit) : defaultStrainValues,
        validate,
        onSubmit
    });

    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            addNotification(Object.values(errors).join(' '), 'error');
        }
    }, [errors, addNotification]);

    const modalTitle = isEditMode ? t('strainsView.addStrainModal.editTitle') : t('strainsView.addStrainModal.title');

    return (
        <Modal
            isOpen={isOpen}
            onClose={props.onClose}
            title={modalTitle}
            size="2xl"
        >
            <form onSubmit={handleSubmit} id="add-strain-form" className="flex flex-col h-full">
                <div className="space-y-6">
                    <FormSection title={t('strainsView.addStrainModal.generalInfo')} defaultOpen={true}>
                        <Input label={`${t('strainsView.addStrainModal.strainName')} *`} value={values.name} onChange={(e) => handleChange('name', e.target.value)} required />
                        <Select label={t('common.type')} value={values.type} onChange={(e) => handleChange('type', e.target.value)} options={[{value: 'Sativa', label: t('strainsView.sativa')}, {value: 'Indica', label: t('strainsView.indica')}, {value: 'Hybrid', label: t('strainsView.hybrid')}]}/>
                        <Input label={t('common.typeDetails')} value={values.typeDetails} onChange={(e) => handleChange('typeDetails', e.target.value)} placeholder={t('strainsView.addStrainModal.typeDetailsPlaceholder')} />
                        <Input label={t('common.genetics')} value={values.genetics} onChange={(e) => handleChange('genetics', e.target.value)} />
                        <div className="flex items-center gap-2 pt-2">
                            <input
                                id="isAutoflower"
                                type="checkbox"
                                name="isAutoflower"
                                checked={values.isAutoflower}
                                onChange={(e) => handleChange('isAutoflower', e.target.checked)}
                                className="h-4 w-4 rounded border-slate-500 bg-transparent text-primary-500 focus:ring-primary-500"
                            />
                            <label htmlFor="isAutoflower" className="text-sm font-semibold text-slate-300 cursor-pointer">
                                Autoflower
                            </label>
                        </div>
                    </FormSection>

                    <FormSection title={t('strainsView.addStrainModal.cannabinoids')}>
                        <Input label={`${t('strainsView.addStrainModal.thcPercent')} *`} type="number" step="0.1" value={values.thc} onChange={(e) => handleChange('thc', e.target.value)} required />
                        <Input label={t('strainsView.addStrainModal.cbdPercent')} type="number" step="0.1" value={values.cbd} onChange={(e) => handleChange('cbd', e.target.value)} />
                        <Input label={t('strainsView.addStrainModal.thcRange')} value={values.thcRange} onChange={(e) => handleChange('thcRange', e.target.value)} placeholder={t('strainsView.addStrainModal.thcRangePlaceholder')} />
                        <Input label={t('strainsView.addStrainModal.cbdRange')} value={values.cbdRange} onChange={(e) => handleChange('cbdRange', e.target.value)} placeholder={t('strainsView.addStrainModal.cbdRangePlaceholder')} />
                    </FormSection>

                    <FormSection title={t('strainsView.addStrainModal.growData')}>
                        <Input label={`${t('strainsView.addStrainModal.floweringTimeWeeks')} *`} type="number" step="0.5" value={values.floweringTime} onChange={(e) => handleChange('floweringTime', e.target.value)} required />
                        <Input label={t('strainsView.addStrainModal.floweringTimeRange')} value={values.floweringTimeRange} onChange={(e) => handleChange('floweringTimeRange', e.target.value)} placeholder={t('strainsView.addStrainModal.floweringTimeRangePlaceholder')}/>
                        <Select label={t('strainsView.table.level')} value={values.difficulty} onChange={(e) => handleChange('difficulty', e.target.value)} options={[{value: 'Easy', label: t('strainsView.difficulty.easy')}, {value: 'Medium', label: t('strainsView.difficulty.medium')}, {value: 'Hard', label: t('strainsView.difficulty.hard')}]}/>
                        <Select label={t('strainsView.addStrainModal.yield')} value={values.yield} onChange={(e) => handleChange('yield', e.target.value)} options={[{value: 'Low', label: t('strainsView.addStrainModal.yields.low')}, {value: 'Medium', label: t('strainsView.addStrainModal.yields.medium')}, {value: 'High', label: t('strainsView.addStrainModal.yields.high')}]}/>
                        <Select label={t('strainsView.addStrainModal.height')} value={values.height} onChange={(e) => handleChange('height', e.target.value)} options={[{value: 'Short', label: t('strainsView.addStrainModal.heights.short')}, {value: 'Medium', label: t('strainsView.addStrainModal.heights.medium')}, {value: 'Tall', label: t('strainsView.addStrainModal.heights.tall')}]}/>
                        <Input label={t('strainsView.strainModal.yieldIndoor')} value={values.yieldIndoor} onChange={(e) => handleChange('yieldIndoor', e.target.value)} placeholder={t('strainsView.addStrainModal.yieldIndoorPlaceholder')}/>
                        <Input label={t('strainsView.strainModal.yieldOutdoor')} value={values.yieldOutdoor} onChange={(e) => handleChange('yieldOutdoor', e.target.value)} placeholder={t('strainsView.addStrainModal.yieldOutdoorPlaceholder')}/>
                        <Input label={t('strainsView.strainModal.heightIndoor')} value={values.heightIndoor} onChange={(e) => handleChange('heightIndoor', e.target.value)} placeholder={t('strainsView.addStrainModal.heightIndoorPlaceholder')}/>
                        <Input label={t('strainsView.strainModal.heightOutdoor')} value={values.heightOutdoor} onChange={(e) => handleChange('heightOutdoor', e.target.value)} placeholder={t('strainsView.addStrainModal.heightOutdoorPlaceholder')}/>
                    </FormSection>

                    <FormSection title={t('strainsView.addStrainModal.profile')}>
                        <Textarea label={t('common.description')} value={values.description} onChange={(e) => handleChange('description', e.target.value)} />
                        <Input label={t('strainsView.strainModal.aromas')} value={values.aromasString} onChange={(e) => handleChange('aromasString', e.target.value)} placeholder={t('strainsView.addStrainModal.aromasPlaceholder')} />
                        <Input label={t('strainsView.strainModal.dominantTerpenes')} value={values.terpenesString} onChange={(e) => handleChange('terpenesString', e.target.value)} placeholder={t('strainsView.addStrainModal.terpenesPlaceholder')} />
                    </FormSection>
                </div>
                 <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-slate-700">
                    <Button type="button" variant="secondary" onClick={props.onClose}>{t('common.cancel')}</Button>
                    <Button type="submit" form="add-strain-form">{t('common.save')}</Button>
                </div>
            </form>
        </Modal>
    );
};