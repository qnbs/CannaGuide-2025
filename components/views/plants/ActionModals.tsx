import React, { useState } from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { JournalEntry, TrainingType } from '../../../types';
import { useTranslations } from '../../../hooks/useTranslations';

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

    const handleConfirm = () => {
        // In a real app, this would involve camera access and image upload.
        // Here, we simulate it by providing a placeholder image URL.
        const placeholderImages = [
            'https://source.unsplash.com/random/400x300/?cannabis,leaf',
            'https://source.unsplash.com/random/400x300/?cannabis,plant',
            'https://source.unsplash.com/random/400x300/?marijuana,closeup',
            'https://source.unsplash.com/random/400x300/?cannabis,bud',
        ];
        const imageUrl = placeholderImages[Math.floor(Math.random() * placeholderImages.length)];
        const noteText = notes.trim() || t('plantsView.detailedView.journalFilters.photo');
        onConfirm({ imageUrl }, noteText);
        onClose();
    };

    return (
        <ModalBase title={t('plantsView.actionModals.photoTitle')} onClose={onClose}>
             <div className="space-y-4">
                <InputField label={t('plantsView.actionModals.photoNotes')} type="text" value={notes} onChange={setNotes} />
                <p className="text-xs text-center text-slate-500">{t('plantsView.actionModals.photoSimulated')}</p>
            </div>
             <div className="flex justify-end gap-4 mt-8">
                <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
                <Button onClick={handleConfirm}>{t('common.add')}</Button>
            </div>
        </ModalBase>
    );
};
