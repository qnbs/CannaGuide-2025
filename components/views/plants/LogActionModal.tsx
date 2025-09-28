import React, { useState } from 'react';
import { Plant, JournalEntry, TrainingType, JournalEntryType, PhotoCategory } from '@/types';
import { useTranslations } from '@/hooks/useTranslations';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { dbService } from '@/services/dbService';
import { CameraModal } from '@/components/common/CameraModal';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { selectSettings } from '@/stores/selectors';
import { addNotification } from '@/stores/slices/uiSlice';
import { waterPlant, topPlant, applyLst, addJournalEntry, applyPestControl } from '@/stores/slices/simulationSlice';

export type ModalType = 'watering' | 'feeding' | 'training' | 'pestControl' | 'observation' | 'photo' | 'amendment';

interface LogActionModalProps {
    plant: Plant;
    type: ModalType;
    onClose: () => void;
    onLearnMore: (topic: string) => void;
}

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-semibold text-slate-300 mb-1">{label}</label>
        <textarea {...props} className="w-full min-h-[80px] input-base" />
    </div>
);

export const LogActionModal: React.FC<LogActionModalProps> = ({ plant, type, onClose, onLearnMore }) => {
    const { t } = useTranslations();
    const dispatch = useAppDispatch();
    const settings = useAppSelector(selectSettings);
    
    const [notes, setNotes] = useState(t(settings.defaultJournalNotes[type as keyof typeof settings.defaultJournalNotes] || '') || '');
    const [waterAmount, setWaterAmount] = useState(500);
    const [ph, setPh] = useState(6.5);
    const [ec, setEc] = useState(1.2);
    const [trainingType, setTrainingType] = useState<TrainingType>('LST');
    const [amendmentType, setAmendmentType] = useState('Mycorrhizae');
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [imageData, setImageData] = useState<{id: string, url: string} | null>(null);
    const [details, setDetails] = useState<{ photoCategory: PhotoCategory }>({ photoCategory: PhotoCategory.FullPlant });


    const titleMap: Record<ModalType, string> = {
        watering: t('plantsView.actionModals.logWatering'),
        feeding: t('plantsView.actionModals.logFeeding'),
        training: t('plantsView.actionModals.logTraining'),
        pestControl: t('plantsView.actionModals.logPestControl'),
        observation: t('plantsView.actionModals.logObservation'),
        photo: t('plantsView.actionModals.logPhoto'),
        amendment: t('plantsView.actionModals.logAmendment'),
    };
    
    const handleSave = () => {
        let entry: Omit<JournalEntry, 'id' | 'createdAt'> | null = null;
        switch(type) {
            case 'watering':
                dispatch(waterPlant({ plantId: plant.id, amount: waterAmount, ph }));
                entry = { type: JournalEntryType.Watering, notes, details: { waterAmount, ph } };
                break;
            case 'feeding':
                dispatch(waterPlant({ plantId: plant.id, amount: waterAmount, ph, ec }));
                entry = { type: JournalEntryType.Feeding, notes, details: { waterAmount, ph, ec } };
                break;
            case 'training':
                if (trainingType === 'Topping') dispatch(topPlant({ plantId: plant.id }));
                else if (trainingType === 'LST') dispatch(applyLst({ plantId: plant.id }));
                entry = { type: JournalEntryType.Training, notes, details: { trainingType } };
                break;
             case 'pestControl':
                dispatch(applyPestControl({ plantId: plant.id, notes }));
                entry = { type: JournalEntryType.PestControl, notes };
                break;
            case 'observation':
                entry = { type: JournalEntryType.Observation, notes };
                break;
            case 'photo':
                if (imageData) {
                     entry = { type: JournalEntryType.Photo, notes, details: { imageId: imageData.id, photoCategory: details.photoCategory } };
                }
                break;
            case 'amendment':
                entry = { type: JournalEntryType.Amendment, notes, details: { amendmentType } };
                break;
        }
        if (entry) {
            dispatch(addJournalEntry({ plantId: plant.id, entry }));
        }
        onClose();
    };
    
    const handleCapture = async (dataUrl: string) => {
        const imageId = `photo-${plant.id}-${Date.now()}`;
        try {
            await dbService.addImage({ id: imageId, data: dataUrl, createdAt: Date.now() });
            setImageData({ id: imageId, url: dataUrl });
            setIsCameraOpen(false);
            if (notes.trim() === '') {
                setNotes(`Photo on day ${plant.age}`);
            }
        } catch (error) {
            console.error("Failed to save image to DB", error);
            dispatch(addNotification({ message: "Failed to save image", type: 'error' }));
        }
    };

    const handleLearnMoreClick = (topic: string) => {
        onClose();
        onLearnMore(topic);
    }
    
    const renderContent = () => {
        switch(type) {
            case 'watering': return <>
                <input type="number" value={waterAmount} onChange={e => setWaterAmount(Number(e.target.value))} placeholder="Amount (ml)" className="w-full input-base" />
                <input type="number" value={ph} step="0.1" onChange={e => setPh(Number(e.target.value))} placeholder="pH" className="w-full input-base" />
            </>;
            case 'feeding': return <>
                 <input type="number" value={waterAmount} onChange={e => setWaterAmount(Number(e.target.value))} placeholder="Amount (ml)" className="w-full input-base" />
                <input type="number" value={ph} step="0.1" onChange={e => setPh(Number(e.target.value))} placeholder="pH" className="w-full input-base" />
                <input type="number" value={ec} step="0.1" onChange={e => setEc(Number(e.target.value))} placeholder="EC" className="w-full input-base" />
            </>;
            case 'training': return <div className="flex items-end gap-2">
                <select value={trainingType} onChange={e => setTrainingType(e.target.value as TrainingType)} className="w-full select-input">
                    <option>LST</option><option>Topping</option><option>FIMing</option><option>Defoliation</option>
                </select>
                <Button variant="secondary" onClick={() => handleLearnMoreClick(trainingType)}>
                    <PhosphorIcons.GraduationCap className="w-4 h-4 mr-1.5"/> {t('common.learnMore')}
                </Button>
            </div>;
            case 'amendment': return <>
                <select value={amendmentType} onChange={e => setAmendmentType(e.target.value)} className="w-full select-input">
                    <option>Mycorrhizae</option>
                    <option>Worm Castings</option>
                </select>
            </>;
            case 'photo': return <div className="space-y-4">
                {imageData ? (
                    <div className="relative">
                        <img src={imageData.url} alt="Preview" className="rounded-lg w-full" />
                        <Button size="sm" variant="danger" onClick={() => setImageData(null)} className="absolute top-2 right-2 !p-1.5"><PhosphorIcons.X/></Button>
                    </div>
                ) : (
                    <Button onClick={() => setIsCameraOpen(true)} variant="secondary" className="w-full">
                        <PhosphorIcons.Camera className="w-5 h-5 mr-2" />
                        {t('plantsView.actionModals.photo.selectImage')}
                    </Button>
                )}

                <div>
                    <label htmlFor="photo-category" className="block text-sm font-semibold mb-1">
                        {t('plantsView.actionModals.photo.category')}
                    </label>
                    <select 
                      id="photo-category"
                      value={details.photoCategory}
                      onChange={(e) => setDetails(prev => ({ ...prev, photoCategory: e.target.value as PhotoCategory }))}
                      className="w-full select-input"
                    >
                      {Object.values(PhotoCategory).map(cat => (
                          <option key={cat} value={cat}>{t(`plantsView.actionModals.photo.categories.${cat}`)}</option>
                      ))}
                    </select>
                </div>
            </div>;
            default: return null;
        }
    };

    if (isCameraOpen && type === 'photo') {
        return <CameraModal isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onCapture={handleCapture} />;
    }

    return (
        <Modal isOpen={true} onClose={onClose} title={titleMap[type]} footer={<><Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button onClick={handleSave}>{t('common.save')}</Button></>}>
            <div className="space-y-4">
                {renderContent()}
                 <Textarea
                    label={t('common.notes')}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={type === 'photo' ? t('plantsView.actionModals.photo.notesPlaceholder') : t('common.notes')}
                />
            </div>
        </Modal>
    );
};