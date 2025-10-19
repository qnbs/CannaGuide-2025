import React, { useState } from 'react'
import {
    Plant,
    ModalType,
    JournalEntryType,
    TrainingType,
    AmendmentType,
    PhotoCategory,
    JournalEntryDetails,
    PhotoDetails as PhotoDetailsType,
    TrainingDetails,
    AmendmentDetails,
} from '@/types'
import { Button } from '@/components/common/Button'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/common/Modal'
import { useAppDispatch } from '@/stores/store'
import {
    addJournalEntry,
    applyWateringAction,
    applyTrainingAction,
    applyPestControlAction,
    applyAmendmentAction,
} from '@/stores/slices/simulationSlice'
import { Input, Select } from '@/components/ui/ThemePrimitives'
import { CameraModal } from '@/components/common/CameraModal'
import { dbService } from '@/services/dbService'
import { addNotification } from '@/stores/slices/uiSlice'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { resizeImage } from '@/services/imageService'

interface LogActionModalProps {
    plant: Plant
    type: ModalType
    onClose: () => void
    onLearnMore: (topic: string) => void
}

export const LogActionModal: React.FC<LogActionModalProps> = ({
    plant,
    type,
    onClose,
    onLearnMore,
}) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const [notes, setNotes] = useState('')
    const [details, setDetails] = useState<Partial<JournalEntryDetails>>({})
    const [image, setImage] = useState<string | null>(null)
    const [isCameraOpen, setIsCameraOpen] = useState(false)

    const handleSubmit = async () => {
        let entryType: JournalEntryType
        const finalDetails: Partial<JournalEntryDetails> = { ...details }

        const typeMapping: Record<ModalType, JournalEntryType> = {
            watering: JournalEntryType.Watering,
            feeding: JournalEntryType.Feeding,
            training: JournalEntryType.Training,
            observation: JournalEntryType.Observation,
            photo: JournalEntryType.Photo,
            pestControl: JournalEntryType.PestControl,
            amendment: JournalEntryType.Amendment,
        }

        if (type === 'photo' && image) {
            entryType = JournalEntryType.Photo
            const imageId = `photo-${plant.id}-${Date.now()}`
            try {
                await dbService.addImage({ id: imageId, data: image, createdAt: Date.now() })
                const photoDetails = finalDetails as Partial<PhotoDetailsType>
                photoDetails.imageId = imageId
                photoDetails.imageUrl = image // For immediate optimistic UI update
            } catch (e) {
                dispatch(
                    addNotification({
                        message: t('plantsView.aiDiagnostics.saveImageError'),
                        type: 'error',
                    }),
                )
            }
        } else {
            entryType = typeMapping[type] || JournalEntryType.Observation
        }

        const finalNotes =
            notes || t(`plantsView.actionModals.defaultNotes.${type}`, { defaultValue: `${type} logged.` })

        switch (type) {
            case 'watering':
                dispatch(applyWateringAction({ plantId: plant.id, data: finalDetails, notes: finalNotes }))
                break
            case 'training':
                dispatch(applyTrainingAction({ plantId: plant.id, data: finalDetails, notes: finalNotes }))
                break
            case 'pestControl':
                dispatch(
                    applyPestControlAction({
                        plantId: plant.id,
                        data: { method: finalNotes },
                        notes: finalNotes,
                    }),
                )
                break
            case 'amendment':
                dispatch(applyAmendmentAction({ plantId: plant.id, data: finalDetails, notes: finalNotes }))
                break
            case 'feeding':
            case 'observation':
            case 'photo':
            default:
                dispatch(
                    addJournalEntry({
                        plantId: plant.id,
                        entry: {
                            type: entryType,
                            notes: finalNotes,
                            details: finalDetails as JournalEntryDetails,
                        },
                    }),
                )
        }

        onClose()
    }

    const title = t(`plantsView.actionModals.log${type.charAt(0).toUpperCase() + type.slice(1)}`)

    const footer = (
        <>
            <Button variant="secondary" onClick={onClose}>
                {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} glow={true}>
                {t('common.save')}
            </Button>
        </>
    )

    return (
        <>
            {isCameraOpen && (
                <CameraModal
                    isOpen={isCameraOpen}
                    onClose={() => setIsCameraOpen(false)}
                    onCapture={async (dataUrl) => {
                        try {
                            const resizedImage = await resizeImage(dataUrl);
                            setImage(resizedImage);
                        } catch (err) {
                            console.error("Image resizing failed:", err);
                            setImage(dataUrl); // fallback to original
                            dispatch(addNotification({ message: 'Image resizing failed, using original.', type: 'error' }));
                        }
                        setIsCameraOpen(false)
                    }}
                />
            )}
            <Modal isOpen={true} onClose={onClose} title={title} footer={footer}>
                <div className="space-y-4">
                    {type === 'training' && (
                        <Select
                            label="Training Type"
                            value={(details as Partial<TrainingDetails>)?.type || ''}
                            onChange={(e) => setDetails({ type: e.target.value as TrainingType })}
                            options={(['LST', 'Topping', 'FIMing', 'Defoliation'] as TrainingType[]).map(
                                (tValue) => ({
                                    value: tValue,
                                    label: t(`plantsView.actionModals.trainingTypes.${tValue}`),
                                }),
                            )}
                        />
                    )}
                    {type === 'amendment' && (
                        <Select
                            label="Amendment Type"
                            value={(details as Partial<AmendmentDetails>)?.type || ''}
                            onChange={(e) => setDetails({ type: e.target.value as AmendmentType })}
                            options={(['Mycorrhizae', 'WormCastings'] as AmendmentType[]).map((a) => ({
                                value: a,
                                label: t(`plantsView.actionModals.amendmentTypes.${a}`),
                            }))}
                        />
                    )}
                    {type === 'photo' && (
                        <>
                            <Select
                                label={t('plantsView.actionModals.photo.category')}
                                value={(details as PhotoDetailsType)?.photoCategory || ''}
                                onChange={(e) =>
                                    setDetails({
                                        photoCategory: e.target.value as PhotoCategory,
                                    })
                                }
                                options={Object.values(PhotoCategory).map((c) => ({
                                    value: c,
                                    label: t(`plantsView.actionModals.photo.categories.${c}`),
                                }))}
                            />
                            {image ? (
                                <div className="relative">
                                    <img src={image} alt="preview" className="rounded-md" />
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        className="!p-1 absolute top-2 right-2"
                                        onClick={() => setImage(null)}
                                    >
                                        <PhosphorIcons.X />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <Button
                                        variant="secondary"
                                        className="flex-1"
                                        onClick={() =>
                                            document.getElementById('photo-upload')?.click()
                                        }
                                    >
                                        <PhosphorIcons.UploadSimple />{' '}
                                        {t('plantsView.actionModals.photo.selectImage')}
                                    </Button>
                                    <input
                                        id="photo-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={async (e) => {
                                            if (e.target.files?.[0]) {
                                                const reader = new FileReader()
                                                reader.onload = async () => {
                                                    try {
                                                        const resizedImage = await resizeImage(reader.result as string);
                                                        setImage(resizedImage);
                                                    } catch (err) {
                                                        console.error("Image resizing failed:", err);
                                                        setImage(reader.result as string); // fallback to original
                                                        dispatch(addNotification({ message: 'Image resizing failed, using original.', type: 'error' }));
                                                    }
                                                }
                                                reader.readAsDataURL(e.target.files[0])
                                            }
                                        }}
                                    />
                                    <Button
                                        variant="secondary"
                                        className="flex-1"
                                        onClick={() => setIsCameraOpen(true)}
                                    >
                                        <PhosphorIcons.Camera /> {t('plantsView.aiDiagnostics.capture')}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                    <Input
                        as="textarea"
                        label={t('common.notes')}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>
            </Modal>
        </>
    )
}