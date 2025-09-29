import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Plant, PlantDiagnosisResponse, JournalEntryType, PhotoCategory } from '@/types';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { AiLoadingIndicator } from '@/components/common/AiLoadingIndicator';
import { CameraModal } from '@/components/common/CameraModal';
import { Modal } from '@/components/common/Modal';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { selectDiagnosticsState } from '@/stores/selectors';
import { startDiagnostics } from '@/stores/slices/aiSlice';
import { addNotification } from '@/stores/slices/uiSlice';
import { addJournalEntry } from '@/stores/slices/simulationSlice';
import { Card } from '@/components/common/Card';
import { geminiService } from '@/services/geminiService';
import { dbService } from '@/services/dbService';
import { Input, Select } from '@/components/ui/ThemePrimitives';


const base64ToMimeType = (base64: string): string => {
    const signatures: Record<string, string> = {
      'R0lGODdh': 'image/gif',
      'iVBORw0KGgo': 'image/png',
      '/9j/': 'image/jpeg'
    };
    for (const s in signatures) {
      if (base64.startsWith(s)) {
        return signatures[s];
      }
    }
    return 'image/jpeg'; // fallback
};

interface DiagnosisResultProps {
    response: PlantDiagnosisResponse;
    plantId: string;
    image: string | null;
}

const DiagnosisResult: React.FC<DiagnosisResultProps> = ({ response, plantId, image }) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();

    const handleSaveToJournal = async () => {
        const content = `
### ${t('plantsView.aiDiagnostics.diagnosis')}: ${response.title} (${(response.confidence * 100).toFixed(0)}%)

**${t('plantsView.aiDiagnostics.actions')}:** 
${response.immediateActions}

**${t('plantsView.aiDiagnostics.solution')}:** 
${response.longTermSolution}

**${t('plantsView.aiDiagnostics.prevention')}:** 
${response.prevention}
        `;
        
        const journalDetails: { diagnosis: string, imageId?: string, photoCategory: PhotoCategory } = { 
            diagnosis: content,
            photoCategory: PhotoCategory.ProblemArea,
        };

        if (image) {
            const imageId = `diag-${plantId}-${Date.now()}`;
            try {
                const base64Data = image.split(',')[1];
                const mimeType = base64ToMimeType(base64Data);
                await dbService.addImage({ id: imageId, data: `data:${mimeType};base64,${base64Data}`, createdAt: Date.now() });
                journalDetails.imageId = imageId;
            } catch (error) {
                console.error("Failed to save diagnosis image to DB", error);
                dispatch(addNotification({ message: "Failed to save image.", type: 'error' }));
            }
        }
        
        dispatch(addJournalEntry({ 
            plantId: plantId, 
            entry: { 
                type: JournalEntryType.Observation, 
                notes: t('plantsView.aiDiagnostics.journalTitle', { title: response.title }),
                details: journalDetails 
            }
        }));
        dispatch(addNotification({ message: t('plantsView.aiDiagnostics.savedToJournal'), type: 'success' }));
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <Card className="bg-slate-800/50">
                <div className="flex justify-between items-baseline">
                    <h4 className="text-xl font-bold font-display text-primary-300">{response.title}</h4>
                    <span className="text-sm font-mono bg-slate-700 px-2 py-0.5 rounded-full">{t('plantsView.aiDiagnostics.confidence')}: {(response.confidence * 100).toFixed(0)}%</span>
                </div>
            </Card>

            <Card>
                <h5 className="font-semibold text-slate-100 flex items-center gap-2 mb-2"><PhosphorIcons.FirstAidKit className="w-5 h-5"/>{t('plantsView.aiDiagnostics.diagnosis')}</h5>
                <p className="text-sm text-slate-300">{response.diagnosis}</p>
            </Card>
            
            <Card>
                <h5 className="font-semibold text-slate-100 flex items-center gap-2 mb-2"><PhosphorIcons.Lightning weight="fill" className="w-5 h-5 text-amber-400" />{t('plantsView.aiDiagnostics.actions')}</h5>
                <p className="text-sm text-slate-300 whitespace-pre-line">{response.immediateActions}</p>
            </Card>

            <Card>
                <h5 className="font-semibold text-slate-100 flex items-center gap-2 mb-2"><PhosphorIcons.Plant className="w-5 h-5"/>{t('plantsView.aiDiagnostics.solution')} &amp; {t('plantsView.aiDiagnostics.prevention')}</h5>
                <div className="text-sm text-slate-300 space-y-2 whitespace-pre-line">
                    <p>{response.longTermSolution}</p>
                    <p>{response.prevention}</p>
                </div>
            </Card>

            <div className="text-center pt-2">
                <Button onClick={handleSaveToJournal} variant="secondary">
                    <PhosphorIcons.BookOpenText className="w-5 h-5 mr-2" />
                    {t('common.saveToJournal')}
                </Button>
            </div>
        </div>
    );
};


interface AiDiagnosticsModalProps {
  plant: Plant;
  onClose: () => void;
}

export const AiDiagnosticsModal: React.FC<AiDiagnosticsModalProps> = ({ plant, onClose }) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { isLoading, response, error } = useAppSelector(selectDiagnosticsState);

    const [step, setStep] = useState<'upload' | 'context' | 'result'>('upload');
    const [image, setImage] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [userNotes, setUserNotes] = useState('');
    const [loadingMessage, setLoadingMessage] = useState('');

     useEffect(() => {
        if (isLoading) {
            const messages = geminiService.getDynamicLoadingMessages({ useCase: 'diagnostics', data: {} });
            let i = 0;
            setLoadingMessage(messages[0]);
            const interval = setInterval(() => {
                i++;
                setLoadingMessage(messages[i % messages.length]);
            }, 2500);
            return () => clearInterval(interval);
        }
    }, [isLoading]);

    const handleFile = useCallback((file: File) => {
        if (!file.type.startsWith('image/')) {
            dispatch(addNotification({ message: t('plantsView.aiDiagnostics.validation.imageOnly'), type: 'error' }));
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            setImage(reader.result as string);
            setStep('context');
        };
        reader.readAsDataURL(file);
    }, [dispatch, t]);

    const handleDrag = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
    const handleDragIn = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
    const handleDragOut = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
    const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) { handleFile(e.dataTransfer.files[0]); } }, [handleFile]);

    const handleCapture = (dataUrl: string) => {
        setImage(dataUrl);
        setStep('context');
        setIsCameraOpen(false);
    };

    const handleGetDiagnosis = () => {
        if (!image) return;
        setStep('result');
        const base64Data = image.split(',')[1];
        const mimeType = base64ToMimeType(base64Data);
        dispatch(startDiagnostics({ base64Image: base64Data, mimeType, plant, userNotes }));
    };
    
    return (
        <>
            {isCameraOpen && <CameraModal isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onCapture={handleCapture} />}
            <Modal isOpen={true} onClose={onClose} title={`${t('plantsView.aiDiagnostics.title')} for ${plant.name}`} size="2xl">
                <div className="min-h-[400px]">
                    {step === 'upload' && (
                        <div className="space-y-4 p-4">
                             <div
                                onDragEnter={handleDragIn} onDragLeave={handleDragOut} onDragOver={handleDrag} onDrop={handleDrop}
                                className={`p-10 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragging ? 'border-primary-500 bg-primary-900/20' : 'border-slate-600 hover:border-slate-500'}`}
                                onClick={() => document.getElementById('ai-diag-image-upload')?.click()}
                            >
                                <PhosphorIcons.UploadSimple className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                                <p className="font-semibold text-slate-300">{t('plantsView.aiDiagnostics.dragDrop')}</p>
                            </div>
                            <input id="ai-diag-image-upload" type="file" accept="image/*" className="hidden" onChange={e => e.target.files && handleFile(e.target.files[0])} />
                            <Button onClick={() => setIsCameraOpen(true)} variant="secondary" className="w-full"><PhosphorIcons.Camera className="w-5 h-5 mr-1.5" />{t('plantsView.aiDiagnostics.capture')}</Button>
                        </div>
                    )}
                    {step === 'context' && image && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in p-4">
                            <div className="relative">
                                <img src={image} alt="plant preview" className="w-full h-auto rounded-lg max-h-64 object-contain" />
                                <Button size="sm" variant="danger" className="absolute top-2 right-2 !p-1.5" onClick={() => { setImage(null); setStep('upload'); }} aria-label={t('common.removeImage')}><PhosphorIcons.X /></Button>
                            </div>
                             <div className="space-y-2">
                                 <h4 className="font-semibold text-slate-100">{t('plantsView.aiDiagnostics.stepContextTitle')}</h4>
                                 <p className="text-sm text-slate-400">{t('plantsView.aiDiagnostics.stepContextDesc')}</p>
                                <Input as="textarea" value={userNotes} onChange={e => setUserNotes(e.target.value)} placeholder={t('plantsView.aiDiagnostics.userNotesPlaceholder')} className="min-h-[120px]" />
                                <Button onClick={handleGetDiagnosis} disabled={isLoading} className="w-full">{t('ai.diagnostics')}</Button>
                            </div>
                        </div>
                    )}
                    {step === 'result' && (
                        <div>
                            {isLoading && <AiLoadingIndicator loadingMessage={loadingMessage} />}
                            {error && <div className="text-red-400 p-4 bg-red-900/20 rounded-lg">{error}</div>}
                            {response && !isLoading && (
                                <DiagnosisResult response={response} plantId={plant.id} image={image} />
                            )}
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
};