import React, { useEffect } from 'react';
import { Strain, StrainType, DifficultyLevel, YieldLevel, HeightLevel } from '@/types';
import { Button } from '@/components/common/Button';
import { useTranslation } from 'react-i18next';
import { useForm } from '@/hooks/useForm';
import { Modal } from '@/components/common/Modal';
import { useAppDispatch } from '@/stores/store';
import { addNotification } from '@/stores/slices/uiSlice';
import { Input, Select, FormSection } from '@/components/ui/ThemePrimitives';
import { createStrainObject } from '@/services/strainFactory';

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
    isAutoflower: strain.floweringType === 'Autoflower',
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

const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label htmlFor={props.id || props.name} className="block text-sm font-semibold text-slate-300 mb-1">{label}</label>
        <Input id={props.id || props.name} {...props} />
    </div>
);

const FormTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, ...props }) => (
     <div className="sm:col-span-2">
        <label htmlFor={props.id || props.name} className="block text-sm font-semibold text-slate-300 mb-1">{label}</label>
        <Input as="textarea" rows={3} id={props.id || props.name} {...props} />
    </div>
);


export const AddStrainModal: React.FC<AddStrainModalProps> = ({ isOpen, onAddStrain, onUpdateStrain, strainToEdit, ...props }) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const isEditMode = !!strainToEdit;

    const validate = (values: ReturnType<typeof strainToFormValues>) => {
        const errors: Partial<Record<keyof typeof values, string>> = {};
        if (!values.name?.trim()) errors.name = t('strainsView.addStrainModal.validation.name');
        
        const thc = Number(values.thc);
        if (isNaN(thc) || thc < 0 || thc > 50) errors.thc = t('strainsView.addStrainModal.validation.thc');
        
        const floweringTime = Number(values.floweringTime);
        if (isNaN(floweringTime) || floweringTime < 4 || floweringTime > 20) errors.floweringTime = t('strainsView.addStrainModal.validation.floweringTime');
        
        const rangeRegex = /^(?:[<~>]?\s*\d{1,2}(?:\.\d+)?\s*%?)$|^(?:\d{1,2}(?:\.\d+)?\s*-\s*\d{1,2}(?:\.\d+)?\s*%?)$/;
        if (values.thcRange && !rangeRegex.test(values.thcRange)) errors.thcRange = t('strainsView.addStrainModal.validation.thcRange');
        if (values.cbdRange && !rangeRegex.test(values.cbdRange)) errors.cbdRange = t('strainsView.addStrainModal.validation.cbdRange');
        return errors;
    };
    
    const onSubmit = (values: ReturnType<typeof strainToFormValues>) => {
        const parseStringToArray = (str: string = '') => str ? str.split(/\s*,\s*/).filter(Boolean) : [];
        
        const partialStrainData: Partial<Strain> = {
            id: isEditMode ? strainToEdit.id : `${values.name.toLowerCase().replace(/\s/g, '-')}-${Date.now()}`,
            name: values.name,
            type: values.type as StrainType,
            typeDetails: values.typeDetails,
            genetics: values.genetics,
            floweringType: values.isAutoflower ? 'Autoflower' : 'Photoperiod',
            thc: Number(values.thc),
            cbd: Number(values.cbd || 1),
            thcRange: values.thcRange,
            cbdRange: values.cbdRange,
            floweringTime: Number(values.floweringTime),
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
            },
        };

        const finalStrain = createStrainObject(partialStrainData);

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
            dispatch(addNotification({ message: Object.values(errors).join(' '), type: 'error' }));
        }
    }, [errors, dispatch]);

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
                        <FormInput label={`${t('strainsView.addStrainModal.strainName')} *`} value={values.name} onChange={(e) => handleChange('name', e.target.value)} required />
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-1">{t('common.type')}</label>
                            <Select value={values.type} onChange={(e) => handleChange('type', e.target.value as StrainType)} options={[{value: 'Sativa', label: t('strainsView.sativa')}, {value: 'Indica', label: t('strainsView.indica')}, {value: 'Hybrid', label: t('strainsView.hybrid')}]}/>
                        </div>
                        <FormInput label={t('common.typeDetails')} value={values.typeDetails} onChange={(e) => handleChange('typeDetails', e.target.value)} placeholder={t('strainsView.addStrainModal.typeDetailsPlaceholder')} />
                        <FormInput label={t('common.genetics')} value={values.genetics} onChange={(e) => handleChange('genetics', e.target.value)} />
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
                        <FormInput label={`${t('strainsView.addStrainModal.thcPercent')} *`} type="number" step="0.1" value={values.thc} onChange={(e) => handleChange('thc', Number(e.target.value))} required />
                        <FormInput label={t('strainsView.addStrainModal.cbdPercent')} type="number" step="0.1" value={values.cbd} onChange={(e) => handleChange('cbd', Number(e.target.value))} />
                        <FormInput label={t('strainsView.addStrainModal.thcRange')} value={values.thcRange} onChange={(e) => handleChange('thcRange', e.target.value)} placeholder={t('strainsView.addStrainModal.thcRangePlaceholder')} />
                        <FormInput label={t('strainsView.addStrainModal.cbdRange')} value={values.cbdRange} onChange={(e) => handleChange('cbdRange', e.target.value)} placeholder={t('strainsView.addStrainModal.cbdRangePlaceholder')} />
                    </FormSection>

                    <FormSection title={t('strainsView.addStrainModal.growData')}>
                        <FormInput label={`${t('strainsView.addStrainModal.floweringTimeWeeks')} *`} type="number" step="0.5" value={values.floweringTime} onChange={(e) => handleChange('floweringTime', Number(e.target.value))} required />
                        <FormInput label={t('strainsView.addStrainModal.floweringTimeRange')} value={values.floweringTimeRange} onChange={(e) => handleChange('floweringTimeRange', e.target.value)} placeholder={t('strainsView.addStrainModal.floweringTimeRangePlaceholder')}/>
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-1">{t('strainsView.table.level')}</label>
                            <Select value={values.difficulty} onChange={(e) => handleChange('difficulty', e.target.value as DifficultyLevel)} options={[{value: 'Easy', label: t('strainsView.difficulty.easy')}, {value: 'Medium', label: t('strainsView.difficulty.medium')}, {value: 'Hard', label: t('strainsView.difficulty.hard')}]}/>
                        </div>
                         <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-1">{t('strainsView.addStrainModal.yield')}</label>
                            <Select value={values.yield} onChange={(e) => handleChange('yield', e.target.value as YieldLevel)} options={[{value: 'Low', label: t('strainsView.addStrainModal.yields.low')}, {value: 'Medium', label: t('strainsView.addStrainModal.yields.medium')}, {value: 'High', label: t('strainsView.addStrainModal.yields.high')}]}/>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-1">{t('strainsView.addStrainModal.height')}</label>
                            <Select value={values.height} onChange={(e) => handleChange('height', e.target.value as HeightLevel)} options={[{value: 'Short', label: t('strainsView.addStrainModal.heights.short')}, {value: 'Medium', label: t('strainsView.addStrainModal.heights.medium')}, {value: 'Tall', label: t('strainsView.addStrainModal.heights.tall')}]}/>
                        </div>
                        <FormInput label={t('strainsView.strainModal.yieldIndoor')} value={values.yieldIndoor} onChange={(e) => handleChange('yieldIndoor', e.target.value)} placeholder={t('strainsView.addStrainModal.yieldIndoorPlaceholder')}/>
                        <FormInput label={t('strainsView.strainModal.yieldOutdoor')} value={values.yieldOutdoor} onChange={(e) => handleChange('yieldOutdoor', e.target.value)} placeholder={t('strainsView.addStrainModal.yieldOutdoorPlaceholder')}/>
                        <FormInput label={t('strainsView.strainModal.heightIndoor')} value={values.heightIndoor} onChange={(e) => handleChange('heightIndoor', e.target.value)} placeholder={t('strainsView.addStrainModal.heightIndoorPlaceholder')}/>
                        <FormInput label={t('strainsView.strainModal.heightOutdoor')} value={values.heightOutdoor} onChange={(e) => handleChange('heightOutdoor', e.target.value)} placeholder={t('strainsView.addStrainModal.heightOutdoorPlaceholder')}/>
                    </FormSection>

                    <FormSection title={t('strainsView.addStrainModal.profile')}>
                        <FormTextarea label={t('common.description')} value={values.description} onChange={(e) => handleChange('description', e.target.value)} />
                        <FormInput label={t('strainsView.strainModal.aromas')} value={values.aromasString} onChange={(e) => handleChange('aromasString', e.target.value)} placeholder={t('strainsView.addStrainModal.aromasPlaceholder')} />
                        <FormInput label={t('strainsView.strainModal.dominantTerpenes')} value={values.terpenesString} onChange={(e) => handleChange('terpenesString', e.target.value)} placeholder={t('strainsView.addStrainModal.terpenesPlaceholder')} />
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