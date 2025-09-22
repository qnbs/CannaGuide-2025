import React, { useState, useRef, useId } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Plant, JournalEntry, TrainingType } from '@/types';
import { useTranslations } from '@/hooks/useTranslations';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { dbService } from '@/services/dbService';
import { useSettings } from '@/hooks/useSettings';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { CameraModal } from '@/components/common/CameraModal';
import { PLANT_STAGE_DETAILS } from '@/constants';


interface ModalProps {
    plant: Plant;
    onClose: () => void;
    onConfirm: (details: JournalEntry['details'], notes: string) => void;
}

const ModalBase: React.FC<{title: string, onClose: () => void, children: React.ReactNode}> = ({ title, onClose, children }) => {
    const modalRef = useFocusTrap(true);
    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-50 p-4 modal-overlay-animate" onClick={onClose}>
            <Card ref={modalRef} className="w-full max-w-md modal-content-animate" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold font-display text-primary-400 mb-6">{title}</h2>
                {children}
            </Card>
        </div>
    );
};

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string, unit?: string, context?: string }> = ({ label, unit, context, ...props }) => {
    const id = useId();
    return (
        <div className="flex-1">
            <label htmlFor={id} className="block text-sm font-semibold text-slate-300 mb-1">{label}</label>
            <div className="relative">
                <input id={id} {...props} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50" />
                {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{unit}</span>}
            </div>
            {context && <p className="text-xs text-slate-400 mt-1">{context}</p>}
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


const isDefaultNoteKey = (str: string) => str.startsWith('plantsView.actionModals.defaultNotes.');

export const WateringModal: React.FC<ModalProps> = ({ plant, onClose, onConfirm }) => {
    const { t } = useTranslations();
    const { settings } = useSettings();
    const [waterAmount, setWaterAmount] = useState('500');
    const [ph, setPh] = useState('6.5');
    const [notes, setNotes] = useState(() => {
        const defaultNoteKey = settings.defaultJournalNotes.watering;
        return defaultNoteKey && isDefaultNoteKey(defaultNoteKey) ? t(defaultNoteKey) : (defaultNoteKey || '');
    });
    const [runoffPh, setRunoffPh] = useState('');
    const [runoffEc, setRunoffEc] = useState('');

    const handleConfirm = () => {
        const details: JournalEntry['details'] = {
            waterAmount: parseFloat(waterAmount) || 0,
            ph: parseFloat(ph) || 6.5,
            runoffPh: runoffPh ? parseFloat(runoffPh) : undefined,
            runoffEc: runoffEc ? parseFloat(runoffEc) : undefined,
        };
        const noteText = notes.trim() || t('plantsView.actionModals.defaultNotes.watering');
        onConfirm(details, noteText);
        onClose();
    };

    return (
        <ModalBase title={t('plantsView.actionModals.wateringTitle')} onClose={onClose}>
             <div className="space-y-4">
                <InputField label={t('plantsView.actionModals.waterAmount')} type="number" value={waterAmount} onChange={(e) => setWaterAmount(e.target.value)} unit={t('common.units.ml')} />
                <div className="flex gap-4">
                    <InputField label={t('plantsView.actionModals.phValue')} type="number" value={ph} onChange={(e) => setPh(e.target.value)} step="0.1" context={`${t('plantsView.actionModals.current')}: ${plant.vitals.ph.toFixed(1)}`} />
                    <InputField label={t('plantsView.actionModals.runoffPh')} type="number" value={runoffPh} onChange={(e) => setRunoffPh(e.target.value)} step="0.1" />
                </div>
                 <div className="flex gap-4">
                     <InputField label={t('plantsView.actionModals.ecValue')} type="number" value={plant.vitals.ec.toFixed(1)} onChange={() => {}} step="0.1" context={`${t('plantsView.actionModals.current')}: ${plant.vitals.ec.toFixed(1)}`} disabled/>
                    <InputField label={t('plantsView.actionModals.runoffEc')} type="number" value={runoffEc} onChange={(e) => setRunoffEc(e.target.value)} step="0.1" />
                </div>
                <TextareaField label={t('common.notes')} value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 mt-6">
                <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
                <Button onClick={handleConfirm}>{t('common.confirm')}</Button>
            </div>
        </ModalBase>
    );
};

export const FeedingModal: React.FC<ModalProps> = ({ plant, onClose, onConfirm }) => {
    const { t } = useTranslations();
    const { settings } = useSettings();
    const [waterAmount, setWaterAmount] = useState('500');
    const [ph, setPh] = useState('6.2');
    const [ec, setEc] = useState('1.2');
    const [notes, setNotes] = useState(() => {
        const defaultNoteKey = settings.defaultJournalNotes.feeding;
        return defaultNoteKey && isDefaultNoteKey(defaultNoteKey) ? t(defaultNoteKey) : (defaultNoteKey || '');
    });
    const [nutrientDetails, setNutrientDetails] = useState('');
    const [runoffPh, setRunoffPh] = useState('');
    const [runoffEc, setRunoffEc] = useState('');

    const idealVitals = PLANT_STAGE_DETAILS[plant.stage].idealVitals;

    const handleConfirm = () => {
        const details: JournalEntry['details'] = {
            waterAmount: parseFloat(waterAmount) || 0,
            ph: parseFloat(ph) || 6.2,
            ec: parseFloat(ec) || 1.2,
            nutrientDetails: nutrientDetails.trim() || undefined,
            runoffPh: runoffPh ? parseFloat(runoffPh) : undefined,
            runoffEc: runoffEc ? parseFloat(runoffEc) : undefined,
        };
        const noteText = notes.trim() || t('plantsView.actionModals.defaultNotes.feeding');
        onConfirm(details, noteText);
        onClose();
    };

    return (
        <ModalBase title={t('plantsView.actionModals.feedingTitle')} onClose={onClose}>
            <div className="space-y-4">
                <InputField label={t('plantsView.actionModals.waterAmount')} type="number" value={waterAmount} onChange={e => setWaterAmount(e.target.value)} unit={t('common.units.ml')} />
                <div className="flex gap-4">
                    <InputField label={t('plantsView.actionModals.phValue')} type="number" value={ph} onChange={e => setPh(e.target.value)} step="0.1" context={`${t('plantsView.actionModals.idealRange', {min: idealVitals.ph.min, max: idealVitals.ph.max})}`} />
                    <InputField label={t('plantsView.actionModals.runoffPh')} type="number" value={runoffPh} onChange={e => setRunoffPh(e.target.value)} step="0.1" />
                </div>
                 <div className="flex gap-4">
                    <InputField label={t('plantsView.actionModals.ecValue')} type="number" value={ec} onChange={e => setEc(e.target.value)} step="0.1" context={`${t('plantsView.actionModals.idealRange', {min: idealVitals.ec.min, max: idealVitals.ec.max})}`} />
                    <InputField label={t('plantsView.actionModals.runoffEc')} type="number" value={runoffEc} onChange={e => setRunoffEc(e.target.value)} step="0.1" />
                </div>
                <InputField label={t('plantsView.actionModals.nutrientDetails')} type="text" value={nutrientDetails} onChange={e => setNutrientDetails(e.target.value)} placeholder={t('plantsView.actionModals.nutrientDetailsPlaceholder')} />
                <TextareaField label={t('common.notes')} value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 mt-6">
                <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
                <Button onClick={handleConfirm}>{t('common.confirm')}</Button>
            </div>
        </ModalBase>
    );
}

export const ObservationModal: React.FC<ModalProps> = ({ plant, onClose, onConfirm }) => {
    const { t } = useTranslations();
    const [notes, setNotes] = useState('');
    const [healthStatus, setHealthStatus] = useState<'Excellent' | 'Good' | 'Showing Issues'>('Good');
    const [tags, setTags] = useState('');
    
    const handleConfirm = () => {
        if (!notes.trim()) return;
        const observationTags = tags.split(',').map(t => t.trim()).filter(Boolean);
        onConfirm({ healthStatus, observationTags }, notes.trim());
        onClose();
    };

    return (
        <ModalBase title={t('plantsView.actionModals.observationTitle')} onClose={onClose}>
             <div className="space-y-4">
                <TextareaField label={t('common.notes')} value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('plantsView.actionModals.observationPlaceholder')} />
                <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1">{t('plantsView.actionModals.healthStatus')}</label>
                    <select value={healthStatus} onChange={e => setHealthStatus(e.target.value as any)} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white">
                       {Object.keys(t('plantsView.actionModals.healthStatuses')).map(key => <option key={key} value={key}>{t(`plantsView.actionModals.healthStatuses.${key}`)}</option>)}
                    </select>
                </div>
                <InputField label={t('plantsView.actionModals.observationTags')} type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder={t('plantsView.actionModals.observationTagsPlaceholder')} />
            </div>
             <div className="flex justify-end gap-2 mt-6">
                <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
                <Button onClick={handleConfirm}>{t('common.confirm')}</Button>
            </div>
        </ModalBase>
    );
};

export const TrainingModal: React.FC<ModalProps> = ({ plant, onClose, onConfirm }) => {
    const { t } = useTranslations();
    const [trainingType, setTrainingType] = useState<TrainingType>('LST');
    const [notes, setNotes] = useState('');

    const trainingOptions: { type: TrainingType, label: string, tooltip: string }[] = (['LST', 'Topping', 'Defoliation', 'FIMing', 'SCROG', 'SuperCropping'] as TrainingType[]).map(type => ({
        type,
        label: t(`plantsView.actionModals.trainingTypes.${type.toLowerCase()}.label`),
        tooltip: t(`plantsView.actionModals.trainingTypes.${type.toLowerCase()}.tooltip`),
    }));
    
    const handleConfirm = () => {
        const noteText = notes.trim() || trainingOptions.find(o => o.type === trainingType)!.label;
        onConfirm({ trainingType }, noteText);
        onClose();
    };

    return (
        <ModalBase title={t('plantsView.actionModals.trainingTitle')} onClose={onClose}>
             <div className="space-y-4">
                <div>
                    <p className="block text-sm font-semibold text-slate-300 mb-2">{t('plantsView.actionModals.trainingType')}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {trainingOptions.map(opt => (
                            <div key={opt.type} className="group relative">
                                <button onClick={() => setTrainingType(opt.type)} className={`w-full py-2 px-2 text-sm rounded-md transition-colors ${trainingType === opt.type ? 'bg-primary-600 text-white font-bold' : 'bg-slate-700 hover:bg-slate-600'}`}>{opt.label}</button>
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-slate-900 text-slate-200 text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">{opt.tooltip}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <TextareaField label={t('common.notes')} value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
             <div className="flex justify-end gap-2 mt-6">
                <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
                <Button onClick={handleConfirm}>{t('common.confirm')}</Button>
            </div>
        </ModalBase>
    );
};

export const PhotoModal: React.FC<ModalProps> = ({ plant, onClose, onConfirm }) => {
    const { t } = useTranslations();
    const [notes, setNotes] = useState('');
    const [category, setCategory] = useState<'Full Plant' | 'Bud' | 'Leaf' | 'Problem' | 'Trichomes'>('Full Plant');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const fileInputId = useId();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleCameraCapture = (dataUrl: string) => {
        setImagePreview(dataUrl);
        setIsCameraOpen(false);
    };

    const handleConfirm = async () => {
        if (!imagePreview) return;
        const imageId = `img-${Date.now()}`;
        await dbService.addImage(imageId, imagePreview);
        onConfirm({ imageId, imageUrl: imagePreview, photoCategory: category }, notes.trim() || t('plantsView.detailedView.journalFilters.photo'));
        onClose();
    };
    
    return (
        <ModalBase title={t('plantsView.actionModals.photoTitle')} onClose={onClose}>
            <CameraModal isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onCapture={handleCameraCapture} />
             <div className="space-y-4">
                {!imagePreview ? (
                    <div className="flex gap-2">
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" id={fileInputId}/>
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
            <div className="flex justify-end gap-2 mt-6">
                <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
                <Button onClick={handleConfirm} disabled={!imagePreview}>{t('common.confirm')}</Button>
            </div>
        </ModalBase>
    );
};