import React, { useState, useEffect, useId, useMemo } from 'react';
import { Button } from '@/components/common/Button';
import { Plant, JournalEntry, TrainingType, PlantStage, StoredImageData } from '@/types';
import { useTranslations } from '@/hooks/useTranslations';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { dbService } from '@/services/dbService';
import { useAppStore } from '@/stores/useAppStore';
import { CameraModal } from '@/components/common/CameraModal';
import { PLANT_STAGE_DETAILS } from '@/services/plantSimulationService';
import { selectSettings } from '@/stores/selectors';
import { Modal } from '@/components/common/Modal';

export type ModalType = 'watering' | 'feeding' | 'observation' | 'training' | 'photo' | null;

export interface ModalState {
    type: NonNullable<ModalType>;
    plantId: string;
}

interface LogActionModalProps {
    plant: Plant;
    modalState: ModalState;
    setModalState: (state: ModalState | null) => void;
    onAddJournalEntry: (plantId: string, entry: Omit<JournalEntry, 'id' | 'createdAt'>) => void;
}

// --- Reusable Form Components ---

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string, unit?: string }> = ({ label, unit, ...props }) => {
    const id = useId();
    return (
        <div className="flex-1 w-full">
            <label htmlFor={id} className="block text-sm font-semibold text-slate-300 mb-1">{label}</label>
            <div className="relative">
                <input id={id} {...props} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50" />
                {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{unit}</span>}
            </div>
        </div>
    );
};

const TextareaField: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, ...props }) => {
    const id = useId();
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-semibold text-slate-300 mb-1">{label}</label>
            <textarea id={id} {...props} rows={3} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500" />
        </div>
    );
};

const SliderInputField: React.FC<{
    label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    min: number, max: number, step: number, unit?: string,
    idealMin?: number, idealMax?: number, context?: string
}> = ({ label, value, onChange, min, max, step, unit, idealMin, idealMax, context }) => {
    const id = useId();
    const isIdeal = idealMin !== undefined && idealMax !== undefined && parseFloat(value) >= idealMin && parseFloat(value) <= idealMax;
    
    const idealMinPercent = idealMin !== undefined ? ((idealMin - min) / (max - min)) * 100 : 0;
    const idealWidthPercent = (idealMin !== undefined && idealMax !== undefined) ? ((idealMax - idealMin) / (max - min)) * 100 : 0;

    return (
        <div className="flex-1 w-full">
            <div className="flex justify-between items-baseline mb-1">
                <label htmlFor={id} className="block text-sm font-semibold text-slate-300">{label}</label>
                <span className={`font-mono text-sm ${isIdeal ? 'text-green-400' : 'text-amber-400'}`}>{value}{unit}</span>
            </div>
            <div className="relative h-4 flex items-center">
                <div className="relative w-full h-1.5 bg-slate-600 rounded-full">
                    {idealMin !== undefined && idealMax !== undefined && (
                        <div
                            className="absolute h-full bg-green-500/30 rounded-full"
                            style={{ left: `${idealMinPercent}%`, width: `${idealWidthPercent}%` }}
                            title={`Ideal Range: ${idealMin}-${idealMax}`}
                        />
                    )}
                </div>
                <input
                    id={id} type="range" min={min} max={max} step={step} value={value}
                    onChange={onChange}
                    className="absolute w-full h-2 appearance-none bg-transparent cursor-pointer range-slider-input"
                />
            </div>
            {context && <p className="text-xs text-slate-400 mt-1 text-right">{context}</p>}
        </div>
    );
};

// --- Main Modal Component ---

const isDefaultNoteKey = (str: string) => str.startsWith('plantsView.actionModals.defaultNotes.');

export const LogActionModal: React.FC<LogActionModalProps> = ({ plant, modalState, setModalState, onAddJournalEntry }) => {
    const { t } = useTranslations();
    const settings = useAppStore(selectSettings);

    const [notes, setNotes] = useState('');
    
    // Form states
    const [waterAmount, setWaterAmount] = useState('500');
    const [ph, setPh] = useState('6.5');
    const [ec, setEc] = useState('1.2');
    const [nutrientDetails, setNutrientDetails] = useState('');
    const [healthStatus, setHealthStatus] = useState<'Excellent' | 'Good' | 'Showing Issues'>('Good');
    const [tags, setTags] = useState('');
    const [trainingType, setTrainingType] = useState<TrainingType>('LST');
    const [category, setCategory] = useState<'Full Plant' | 'Bud' | 'Leaf' | 'Problem' | 'Trichomes'>('Full Plant');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const fileInputId = useId();

    useEffect(() => {
        // Reset state when modal type changes
        if (modalState.type === 'watering') {
            const defaultNoteKey = settings.defaultJournalNotes.watering;
            setNotes(defaultNoteKey && isDefaultNoteKey(defaultNoteKey) ? t(defaultNoteKey) : (defaultNoteKey || ''));
        } else if (modalState.type === 'feeding') {
            const defaultNoteKey = settings.defaultJournalNotes.feeding;
            setNotes(defaultNoteKey && isDefaultNoteKey(defaultNoteKey) ? t(defaultNoteKey) : (defaultNoteKey || ''));
            const lastFeeding = [...plant.journal].reverse().find(e => e.type === 'FEEDING' && e.details?.nutrientDetails);
            if (lastFeeding?.details?.nutrientDetails) setNutrientDetails(lastFeeding.details.nutrientDetails);
        } else {
            setNotes('');
        }
        setImagePreview(null);
    }, [modalState.type, settings.defaultJournalNotes, t, plant.journal]);


    const handleClose = () => setModalState(null);

    const handleConfirm = () => {
        const typeMap: Record<string, JournalEntry['type']> = {
            watering: 'WATERING', feeding: 'FEEDING', training: 'TRAINING', photo: 'PHOTO', observation: 'OBSERVATION',
        };
        const entryType = typeMap[modalState.type!];
        if(!entryType) return;
        
        let details: JournalEntry['details'] = {};
        let finalNotes = notes.trim();

        switch(modalState.type) {
            case 'watering':
                details = { waterAmount: parseFloat(waterAmount) || 0, ph: parseFloat(ph) || 6.5 };
                finalNotes = finalNotes || t('plantsView.actionModals.defaultNotes.watering');
                break;
            case 'feeding':
                details = { waterAmount: parseFloat(waterAmount) || 0, ph: parseFloat(ph) || 6.2, ec: parseFloat(ec) || 1.2, nutrientDetails: nutrientDetails.trim() || undefined };
                finalNotes = finalNotes || t('plantsView.actionModals.defaultNotes.feeding');
                break;
            case 'observation':
                details = { healthStatus, observationTags: tags.split(',').map(tag => tag.trim()).filter(Boolean) };
                if (!finalNotes) return;
                break;
            case 'training':
                details = { trainingType };
                finalNotes = finalNotes || trainingType;
                break;
            case 'photo':
                if (!imagePreview) return;
                const imageId = `img-${Date.now()}`;
                const imageData: StoredImageData = { id: imageId, plantId: plant.id, createdAt: Date.now(), data: imagePreview };
                dbService.addImage(imageData);
                details = { imageId, imageUrl: imagePreview, photoCategory: category };
                finalNotes = finalNotes || t('plantsView.detailedView.journalFilters.photo');
                break;
        }

        onAddJournalEntry(modalState.plantId, { type: entryType, details, notes: finalNotes });
        handleClose();
    };

    const idealVitals = PLANT_STAGE_DETAILS[plant.stage].idealVitals;

    const modalConfig = useMemo(() => {
        switch (modalState.type) {
            case 'watering': return {
                title: t('plantsView.actionModals.wateringTitle'),
                body: (
                    <div className="space-y-6">
                        <SliderInputField label={t('plantsView.actionModals.waterAmount')} value={waterAmount} onChange={(e) => setWaterAmount(e.target.value)} min={100} max={plant.growSetup.potSize * 500} step={50} unit={t('common.units.ml')} />
                        <SliderInputField label={t('plantsView.actionModals.phValue')} value={ph} onChange={(e) => setPh(e.target.value)} min={5.0} max={8.0} step={0.1} idealMin={idealVitals.ph.min} idealMax={idealVitals.ph.max} context={`${t('plantsView.actionModals.current')}: ${plant.vitals.ph.toFixed(1)}`} />
                        <TextareaField label={t('common.notes')} value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>
                ),
                confirmDisabled: false
            };
            case 'feeding': return {
                title: t('plantsView.actionModals.feedingTitle'),
                body: (
                    <div className="space-y-6">
                        <SliderInputField label={t('plantsView.actionModals.waterAmount')} value={waterAmount} onChange={e => setWaterAmount(e.target.value)} min={100} max={plant.growSetup.potSize * 500} step={50} unit={t('common.units.ml')} />
                        <SliderInputField label={t('plantsView.actionModals.phValue')} value={ph} onChange={e => setPh(e.target.value)} min={5.0} max={8.0} step={0.1} idealMin={idealVitals.ph.min} idealMax={idealVitals.ph.max} context={`${t('plantsView.actionModals.idealRange', {min: idealVitals.ph.min, max: idealVitals.ph.max})}`} />
                        <SliderInputField label={t('plantsView.actionModals.ecValue')} value={ec} onChange={e => setEc(e.target.value)} min={0.2} max={3.0} step={0.1} idealMin={idealVitals.ec.min} idealMax={idealVitals.ec.max} context={`${t('plantsView.actionModals.idealRange', {min: idealVitals.ec.min, max: idealVitals.ec.max})}`} />
                        <InputField label={t('plantsView.actionModals.nutrientDetails')} type="text" value={nutrientDetails} onChange={e => setNutrientDetails(e.target.value)} placeholder={t('plantsView.actionModals.nutrientDetailsPlaceholder')} />
                        <TextareaField label={t('common.notes')} value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>
                ),
                confirmDisabled: false
            };
            case 'observation': return {
                title: t('plantsView.actionModals.observationTitle'),
                body: (
                    <div className="space-y-4">
                        <TextareaField label={t('common.notes')} value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('plantsView.actionModals.observationPlaceholder')} required/>
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-1">{t('plantsView.actionModals.healthStatus')}</label>
                            <select value={healthStatus} onChange={e => setHealthStatus(e.target.value as any)} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white">
                               {Object.keys(t('plantsView.actionModals.healthStatuses')).map(key => <option key={key} value={key}>{t(`plantsView.actionModals.healthStatuses.${key}`)}</option>)}
                            </select>
                        </div>
                        <InputField label={t('plantsView.actionModals.observationTags')} type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder={t('plantsView.actionModals.observationTagsPlaceholder')} />
                    </div>
                ),
                confirmDisabled: !notes.trim()
            };
            case 'training': 
                const trainingOptions: { type: TrainingType, label: string, tooltip: string }[] = 
                    (['LST', 'Topping', 'Defoliation', 'FIMing', 'SCROG', 'SuperCropping'] as TrainingType[]).map(type => ({
                    type,
                    label: t(`plantsView.actionModals.trainingTypes.${type.toLowerCase()}.label`),
                    tooltip: t(`plantsView.actionModals.trainingTypes.${type.toLowerCase()}.tooltip`),
                }));
                return {
                    title: t('plantsView.actionModals.trainingTitle'),
                    body: (
                        <div className="space-y-4">
                            <div>
                                <p className="block text-sm font-semibold text-slate-300 mb-2">{t('plantsView.actionModals.trainingType')}</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {trainingOptions.map(opt => {
                                        const isSelected = trainingType === opt.type;
                                        return (
                                            <div key={opt.type} className="group relative">
                                                <button onClick={() => setTrainingType(opt.type)} className={`w-full py-2 px-2 text-sm rounded-md transition-all ${isSelected ? 'bg-primary-600 text-white font-bold ring-2 ring-primary-400' : 'bg-slate-700 hover:bg-slate-600'}`} aria-pressed={isSelected}>
                                                    {opt.label}
                                                </button>
                                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-slate-900 text-slate-200 text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">{opt.tooltip}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <TextareaField label={t('common.notes')} value={notes} onChange={e => setNotes(e.target.value)} />
                        </div>
                    ),
                    confirmDisabled: false
                };
            case 'photo': 
                return {
                title: t('plantsView.actionModals.photoTitle'),
                body: (
                    <>
                        <CameraModal isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onCapture={(dataUrl) => { setImagePreview(dataUrl); setIsCameraOpen(false); }} />
                        <div className="space-y-4">
                            {!imagePreview ? (
                                <div className="flex gap-2">
                                    <input type="file" accept="image/*" onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => setImagePreview(reader.result as string);
                                            reader.readAsDataURL(file);
                                        }
                                    }} className="hidden" id={fileInputId}/>
                                    <Button as="label" htmlFor={fileInputId} className="flex-1 cursor-pointer"><PhosphorIcons.UploadSimple className="w-5 h-5 mr-2" />{t('plantsView.aiDiagnostics.buttonLabel')}</Button>
                                    <Button onClick={() => setIsCameraOpen(true)} variant="secondary" aria-label={t('plantsView.aiDiagnostics.capture')}><PhosphorIcons.Camera className="w-5 h-5"/></Button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <img src={imagePreview} alt="Preview" className="rounded-lg w-full max-h-60 object-contain" />
                                    <button onClick={() => setImagePreview(null)} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70" aria-label={t('common.removeImage')}>
                                        <PhosphorIcons.X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-1">{t('plantsView.actionModals.photoCategory')}</label>
                                 <select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white">
                                    {Object.keys(t('plantsView.actionModals.photoCategories')).map(key => <option key={key} value={key}>{t(`plantsView.actionModals.photoCategories.${key}`)}</option>)}
                                </select>
                            </div>
                            <TextareaField label={t('plantsView.actionModals.photoNotes')} value={notes} onChange={e => setNotes(e.target.value)} />
                        </div>
                    </>
                ),
                confirmDisabled: !imagePreview
            };
            default: return { title: '', body: null, confirmDisabled: true };
        }
    }, [modalState.type, t, plant, notes, waterAmount, ph, ec, nutrientDetails, healthStatus, tags, trainingType, category, imagePreview, isCameraOpen, idealVitals, fileInputId]);

    if (!modalState.type) return null;

    const { title, body, confirmDisabled } = modalConfig;

    const footer = (
        <>
            <Button variant="secondary" onClick={handleClose}>{t('common.cancel')}</Button>
            <Button onClick={handleConfirm} disabled={confirmDisabled}>{t('common.confirm')}</Button>
        </>
    );

    return (
        <Modal isOpen={true} onClose={handleClose} title={title} size="md" footer={footer}>
            {body}
        </Modal>
    );
};