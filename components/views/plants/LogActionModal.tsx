import React, { useState } from 'react';
import {
  Plant,
  ModalType,
  JournalEntryType,
  TrainingType,
  AmendmentType,
  PhotoCategory,
} from '@/types';
import { Button } from '@/components/common/Button';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/common/Modal';
import { useAppDispatch } from '@/stores/store';
import { addJournalEntry, applyWateringAction, applyTrainingAction, applyPestControlAction, applyAmendmentAction } from '@/stores/slices/simulationSlice';
import { Input, Select } from '@/components/ui/ThemePrimitives';
import { CameraModal } from '@/components/common/CameraModal';
import { dbService } from '@/services/dbService';
import { addNotification } from '@/stores/slices/uiSlice';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';

interface LogActionModalProps {
  plant: Plant;
  type: ModalType;
  onClose: () => void;
  onLearnMore: (topic: string) => void;
}

export const LogActionModal: React.FC<LogActionModalProps> = ({
  plant,
  type,
  onClose,
  onLearnMore,
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [notes, setNotes] = useState('');
  const [details, setDetails] = useState<any>({});
  const [image, setImage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handleSubmit = async () => {
    let entryType: JournalEntryType;
    let finalDetails = { ...details };

    if (type === 'photo' && image) {
      entryType = JournalEntryType.Photo;
      const imageId = `photo-${plant.id}-${Date.now()}`;
      try {
        await dbService.addImage({ id: imageId, data: image, createdAt: Date.now() });
        finalDetails.imageId = imageId;
        finalDetails.imageUrl = image; // For immediate optimistic UI update
      } catch (e) {
        dispatch(addNotification({ message: t('plantsView.aiDiagnostics.saveImageError'), type: 'error'}));
      }
    } else {
        const typeMapping: Record<ModalType, JournalEntryType> = {
            'watering': JournalEntryType.Watering,
            'feeding': JournalEntryType.Feeding,
            'training': JournalEntryType.Training,
            'pestControl': JournalEntryType.PestControl,
            'observation': JournalEntryType.Observation,
            'photo': JournalEntryType.Photo,
            'amendment': JournalEntryType.Amendment,
        }
        entryType = typeMapping[type] || JournalEntryType.Observation;
    }
    
    const finalNotes = notes || t(`plantsView.actionModals.defaultNotes.${type}`, { defaultValue: `${type} logged.` });

    // --- RING 3 GATEWAY ---
    // Instead of dispatching addJournalEntry directly, call the validating thunks for actions that affect simulation state.
    switch (type) {
        case 'watering':
            // The modal doesn't collect specific data yet, so we pass an empty object.
            // The thunk's schema will validate it (and pass if fields are optional).
            dispatch(applyWateringAction({ plantId: plant.id, data: {}, notes: finalNotes }));
            break;
        case 'training':
            dispatch(applyTrainingAction({ plantId: plant.id, data: finalDetails, notes: finalNotes }));
            break;
        case 'pestControl':
            // The modal only has notes for this, so we'll pass that as the 'method'.
            dispatch(applyPestControlAction({ plantId: plant.id, data: { method: finalNotes }, notes: finalNotes }));
            break;
        case 'amendment':
             dispatch(applyAmendmentAction({ plantId: plant.id, data: finalDetails, notes: finalNotes }));
             break;
        case 'feeding':
        case 'observation':
        case 'photo':
        default:
             // For actions without specific simulation effects or complex validation, we can still use addJournalEntry.
             dispatch(
              addJournalEntry({
                plantId: plant.id,
                entry: {
                  type: entryType,
                  notes: finalNotes,
                  details: finalDetails,
                },
              })
            );
    }

    onClose();
  };

  const title = t(`plantsView.actionModals.log${type.charAt(0).toUpperCase() + type.slice(1)}`);
    
  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        {t('common.cancel')}
      </Button>
      <Button onClick={handleSubmit} glow={true}>{t('common.save')}</Button>
    </>
  );

  return (
    <>
      {isCameraOpen && <CameraModal isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onCapture={(data) => { setImage(data); setIsCameraOpen(false); }} />}
      <Modal isOpen={true} onClose={onClose} title={title} footer={footer}>
        <div className="space-y-4">
          {type === 'training' && (
            <Select
              label="Training Type"
              value={details.type || ''}
              onChange={(e) => setDetails({ type: e.target.value })}
              options={(['LST', 'Topping', 'FIMing', 'Defoliation'] as TrainingType[]).map((tValue) => ({ value: tValue, label: t(`plantsView.actionModals.trainingTypes.${tValue}`) }))}
            />
          )}
          {type === 'amendment' && (
             <Select
                label="Amendment Type"
                value={details.type || ''}
                onChange={(e) => setDetails({ type: e.target.value })}
                options={(['Mycorrhizae', 'WormCastings'] as AmendmentType[]).map((a) => ({ value: a, label: t(`plantsView.actionModals.amendmentTypes.${a}`) }))}
            />
          )}
          {type === 'photo' && (
            <>
              <Select
                label={t('plantsView.actionModals.photo.category')}
                value={details.photoCategory || ''}
                onChange={(e) => setDetails({ ...details, photoCategory: e.target.value })}
                // FIX: Use Object.values on the PhotoCategory enum to dynamically generate options.
                // This resolves a TypeScript error that occurs when trying to map a type alias.
                options={Object.values(PhotoCategory).map((c) => ({ value: c, label: t(`plantsView.actionModals.photo.categories.${c}`) }))}
              />
              {image ? (
                <div className="relative">
                  <img src={image} alt="preview" className="rounded-md" />
                  <Button variant="danger" size="sm" className="!p-1 absolute top-2 right-2" onClick={() => setImage(null)}><PhosphorIcons.X /></Button>
                </div>
              ) : (
                <div className="flex gap-2">
                    <Button variant="secondary" className="flex-1" onClick={() => document.getElementById('photo-upload')?.click()}>
                        <PhosphorIcons.UploadSimple/> {t('plantsView.actionModals.photo.selectImage')}
                    </Button>
                    <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={e => {
                        if(e.target.files?.[0]) {
                            const reader = new FileReader();
                            reader.onload = () => setImage(reader.result as string);
                            reader.readAsDataURL(e.target.files[0]);
                        }
                    }} />
                    <Button variant="secondary" className="flex-1" onClick={() => setIsCameraOpen(true)}><PhosphorIcons.Camera/> {t('plantsView.aiDiagnostics.capture')}</Button>
                </div>
              )}
            </>
          )}
          <Input
            as="textarea"
            label={t('common.notes')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('plantsView.actionModals.photo.notesPlaceholder')}
            rows={3}
          />
        </div>
      </Modal>
    </>
  );
};