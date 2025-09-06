
import React, { useState, useRef } from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { JournalEntry, TrainingType } from '../../../types';
import { useTranslations } from '../../../hooks/useTranslations';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { dbService } from '../../../services/dbService';

interface ModalProps {
    onClose: () => void;
    onConfirm: (details: JournalEntry['details'], notes: string) => void;
}

const ModalBase: React.FC<{title: string, onClose: () => void, children: React.ReactNode}> = ({ title, onClose, children }) => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
        <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-primary-500 dark:text-primary-400 mb-6">{title}</h2>
            {children}
        </Card>
    </div>
);

const InputField: React.FC<{label: string, type: string, value: string, onChange: (val: string) => void, step?: string}> = ({label, type, value, onChange, step}) => (
    <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            step={step}
            className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        />
    </div>
);


export const WateringModal: React.FC<ModalProps> = ({ onClose, onConfirm }) => {
    const { t } = useTranslations();
    const [waterAmount, setWaterAmount] = useState('500');
    const [ph, setPh] = useState('6.5');
    const [notes, setNotes] = useState('');

    const handleConfirm = () => {
        const details = {
            waterAmount: parseFloat(waterAmount) || 0,
            ph: parseFloat(ph) || 6.5,
        };
        const noteText = notes.trim() || t('plantsView.actionModals.defaultNotes.watering');
        onConfirm(details, noteText);
        onClose();
    };

    return (
        <ModalBase title={t('plantsView.actionModals.wateringTitle')} onClose={onClose}>
            <div className="space-y-4">
                <InputField label={t('plantsView.actionModals.waterAmount')} type="number" value={waterAmount} onChange={setWaterAmount} />
                <InputField label={t('plantsView.actionModals.phValue')} type="number" value={ph} onChange={setPh} step="0.1" />
                <InputField label={t('common.notes')} type="text" value={notes} onChange={setNotes} />
            </div>
            <div className="flex justify-end gap-4 mt-8">
                <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
                <Button onClick={handleConfirm}>{t('common.confirm')}</Button>
            </div>
        </ModalBase>
    );
};

export const FeedingModal: React.FC<ModalProps> = ({ onClose, onConfirm }) => {
    const { t } = useTranslations();
    const [waterAmount, setWaterAmount] = useState('500');
    const [ph, setPh] = useState('6.2');
    const [ec, setEc] = useState('1.2');
    const [notes, setNotes] = useState('');

    const handleConfirm = () => {
        const details = {
            waterAmount: parseFloat(waterAmount) || 0,
            ph: parseFloat(ph) || 6.2,
            ec: parseFloat(ec) || 1.2,
        };
        const noteText = notes.trim() || t('plantsView.actionModals.defaultNotes.feeding');
        onConfirm(details, noteText);
        onClose();
    };

     return (
        <ModalBase title={t('plantsView.actionModals.feedingTitle')} onClose={onClose}>
            <div className="space-y-4">
                <InputField label={t('plantsView.actionModals.waterAmount')} type="number" value={waterAmount} onChange={setWaterAmount} />
                <InputField label={t('plantsView.actionModals.phValue')} type="number" value={ph} onChange={setPh} step="0.1" />
                <InputField label={t('plantsView.actionModals.ecValue')} type="number" value={ec} onChange={setEc} step="0.1" />
                <InputField label={t('common.notes')} type="text" value={notes} onChange={setNotes} />
            </div>
            <div className="flex justify-end gap-4 mt-8">
                <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
                <Button onClick={handleConfirm}>{t('common.confirm')}</Button>
            </div>
        </ModalBase>
    );
}

export const ObservationModal: React.FC<ModalProps> = ({ onClose, onConfirm }) => {
    const { t } = useTranslations();
    const [notes, setNotes] = useState('');

    const handleConfirm = () => {
        if(!notes.trim()) return;
        onConfirm({}, notes);
        onClose();
    };

    return (
        <ModalBase title={t('plantsView.actionModals.observationTitle')} onClose={onClose}>
             <div className="space-y-4">
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('plantsView.actionModals.observationPlaceholder')}
                    className="w-full h-32 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                />
            </div>
             <div className="flex justify-end gap-4 mt-8">
                <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
                <Button onClick={handleConfirm}>{t('common.confirm')}</Button>
            </div>
        </ModalBase>
    );
};

export const TrainingModal: React.FC<ModalProps> = ({ onClose, onConfirm }) => {
    const { t } = useTranslations();
    const [trainingType, setTrainingType] = useState<TrainingType>('LST');
    const [notes, setNotes] = useState('');

    const trainingLabels: Record<TrainingType, string> = {
        'Topping': t('plantsView.actionModals.trainingTypes.topping'),
        'LST': t('plantsView.actionModals.trainingTypes.lst'),
        'Defoliation': t('plantsView.actionModals.trainingTypes.defoliation'),
    };

    const handleConfirm = () => {
        const noteText = notes.trim() || trainingLabels[trainingType];
        onConfirm({ trainingType }, noteText);
        onClose();
    };

    return (
        <ModalBase title={t('plantsView.actionModals.trainingTitle')} onClose={onClose}>
             <div className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('plantsView.actionModals.trainingType')}</label>
                    <div className="flex gap-2">
                        {(['Topping', 'LST', 'Defoliation'] as TrainingType[]).map(type => (
                            <button key={type} onClick={() => setTrainingType(type)} className={`flex-1 py-2 px-2 text-sm rounded-md transition-colors ${trainingType === type ? 'bg-primary-600 text-white font-bold' : 'bg-slate-200 dark:bg-slate-700'}`}>{trainingLabels[type]}</button>
                        ))}
                    </div>
                </div>
                <InputField label={t('common.notes')} type="text" value={notes} onChange={setNotes} />
            </div>
             <div className="flex justify-end gap-4 mt-8">
                <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
                <Button onClick={handleConfirm}>{t('common.confirm')}</Button>
            </div>
        </ModalBase>
    );
};

export const PhotoModal: React.FC<ModalProps> = ({ onClose, onConfirm }) => {
    const { t } = useTranslations();
    const [notes, setNotes] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleConfirm = async () => {
        if (!imageFile || !imagePreview) return;
        
        const imageId = `img-${Date.now()}`;
        try {
            await dbService.addImage(imageId, imagePreview);
            const noteText = notes.trim() || t('plantsView.detailedView.journalFilters.photo');
            onConfirm({ imageId, imageUrl: imagePreview }, noteText); // also pass imageUrl for immediate preview
            onClose();
        } catch (error) {
            console.error("Failed to save image to IndexedDB", error);
            onClose();
        }
    };

    const handleReset = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <ModalBase title={t('plantsView.actionModals.photoTitle')} onClose={onClose}>
             <div className="space-y-4">
                <InputField label={t('plantsView.actionModals.photoNotes')} type="text" value={notes} onChange={setNotes} />
                
                {!imagePreview ? (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                        <PhosphorIcons.UploadSimple className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                        <p className="text-sm text-slate-600 dark:text-slate-300 font-semibold">{t('plantsView.aiDiagnostics.buttonLabel')}</p>
                        <p className="text-xs text-slate-400">{t('plantsView.aiDiagnostics.prompt')}</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>
                ) : (
                    <div className="relative">
                        <img src={imagePreview} alt="Preview" className="rounded-lg w-full max-h-60 object-contain" />
                        <button onClick={handleReset} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70" aria-label={t('common.delete')}>
                            <PhosphorIcons.X className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
             <div className="flex justify-end gap-4 mt-8">
                <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
                <Button onClick={handleConfirm} disabled={!imageFile}>{t('common.add')}</Button>
            </div>
        </ModalBase>
    );
};
