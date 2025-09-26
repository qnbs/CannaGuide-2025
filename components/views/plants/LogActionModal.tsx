import React, { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Plant, JournalEntry, TrainingType } from '@/types';
import { useTranslations } from '@/hooks/useTranslations';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { dbService } from '@/services/dbService';
import { CameraModal } from '@/components/common/CameraModal';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';

export type ModalType = 'watering' | 'feeding' | 'training' | 'pestControl' | 'observation' | 'photo';

interface LogActionModalProps {
    plant: Plant;
    type: ModalType;
    onClose: () => void;
    onLearnMore: (topic: string) => void;
}

export const LogActionModal: React.FC<LogActionModalProps> = ({ plant, type, onClose, onLearnMore }) => {
    const { t } = useTranslations();
    const { addJournalEntry, waterPlant, settings, addNotification, topPlant, applyLst, applyPestControl } = useAppStore(state => ({
        addJournalEntry: state.addJournalEntry,
        waterPlant: state.waterPlant,
        settings: state.settings,
        addNotification: state.addNotification,
        topPlant: state.topPlant,
        applyLst: state.applyLst,
        applyPestControl: state.applyPestControl,
    }));
    
    const [notes, setNotes] = useState(settings.defaultJournalNotes[type as keyof typeof settings.defaultJournalNotes] || '');
    const [waterAmount, setWaterAmount] = useState(500);
    const [ph, setPh] = useState(6.5);
    const [ec, setEc] = useState(1.2);
    const [trainingType, setTrainingType] = useState<TrainingType>('LST');
    const [isCameraOpen, setIsCameraOpen] = useState(type === 'photo');
    const [imageData, setImageData] = useState<{id: string, url: string} | null>(null);

    const titleMap: Record<ModalType, string> = {
        watering: t('plantsView.actionModals.logWatering'),
        feeding: t('plantsView.actionModals.logFeeding'),
        training: t('plantsView.actionModals.logTraining'),
        pestControl: t('plantsView.actionModals.logPestControl'),
        observation: t('plantsView.actionModals.logObservation'),
        photo: t('plantsView.actionModals.logPhoto'),
    };
    
    const handleSave = () => {
        let entry: Omit<JournalEntry, 'id' | 'createdAt'> | null = null;
        switch(type) {
            case 'watering':
                waterPlant(plant.id, waterAmount, ph);
                entry = { type: 'WATERING', notes, details: { waterAmount, ph } };
                break;
            case 'feeding':
                entry = { type: 'FEEDING', notes, details: { waterAmount, ph, ec } };
                break;
            case 'training':
                if (trainingType === 'Topping') topPlant(plant.id);
                else if (trainingType === 'LST') applyLst(plant.id);
                entry = { type: 'TRAINING', notes, details: { trainingType } };
                break;
             case 'pestControl':
                applyPestControl(plant.id, notes);
                entry = { type: 'PEST_CONTROL', notes };
                break;
            case 'observation':
                entry = { type: 'OBSERVATION', notes };
                break;
            case 'photo':
                if (imageData) {
                     entry = { type: 'PHOTO', notes, details: { imageId: imageData.id } };
                }
                break;
        }
        if (entry) {
            addJournalEntry(plant.id, entry);
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
            addNotification("Failed to save image", 'error');
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
                <select value={trainingType} onChange={e => setTrainingType(e.target.value as TrainingType)} className="w-full input-base">
                    <option>LST</option><option>Topping</option><option>FIMing</option><option>Defoliation</option>
                </select>
                <Button variant="secondary" onClick={() => handleLearnMoreClick(trainingType)}>
                    <PhosphorIcons.GraduationCap className="w-4 h-4 mr-1.5"/> {t('common.learnMore')}
                </Button>
            </div>;
            case 'photo': return <>
                {imageData ? (
                    <div className="relative">
                        <img src={imageData.url} alt="captured" className="rounded-md" />
                        <Button size="sm" variant="danger" onClick={() => setImageData(null)} className="absolute top-2 right-2 !p-1.5"><PhosphorIcons.X/></Button>
                    </div>
                ) : <p className="text-center text-slate-400">Please capture an image.</p>}
            </>;
            default: return null;
        }
    };

    if (isCameraOpen && type === 'photo') {
        return <CameraModal isOpen={isCameraOpen} onClose={onClose} onCapture={handleCapture} />;
    }

    return (
        <Modal isOpen={true} onClose={onClose} title={titleMap[type]} footer={<><Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button onClick={handleSave}>{t('common.save')}</Button></>}>
            <div className="space-y-4">
                {renderContent()}
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes..." className="w-full min-h-[80px] input-base" />
            </div>
        </Modal>
    );
};