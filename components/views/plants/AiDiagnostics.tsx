import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslations } from '@/hooks/useTranslations';
import { useAppStore } from '@/stores/useAppStore';
import { geminiService } from '@/services/geminiService';
import { Plant, PlantDiagnosisResponse } from '@/types';
import { CameraModal } from '@/components/common/CameraModal';
import { selectActivePlants } from '@/stores/selectors';
import { AiLoadingIndicator } from '@/components/common/AiLoadingIndicator';

export const AiDiagnostics: React.FC = () => {
    const { t } = useTranslations();
    const { addNotification, addJournalEntry } = useAppStore(state => ({
        addNotification: state.addNotification,
        addJournalEntry: state.addJournalEntry,
    }));
    const activePlants = useAppStore(selectActivePlants);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState<PlantDiagnosisResponse | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageMimeType, setImageMimeType] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);

    const [selectedPlantId, setSelectedPlantId] = useState<string>('');
    const [userNotes, setUserNotes] = useState('');

    useEffect(() => {
        if (isLoading) {
            const messages = geminiService.getDynamicLoadingMessages({ useCase: 'diagnostics' }, t);
            let messageIndex = 0;
            const updateLoadingMessage = () => {
                setLoadingMessage(messages[messageIndex % messages.length]);
                messageIndex++;
            };
            
            updateLoadingMessage();
            const intervalId = setInterval(updateLoadingMessage, 2000);

            return () => clearInterval(intervalId);
        }
    }, [isLoading, t]);
    
    const handleFile = useCallback((file: File) => {
        if (!file.type.startsWith('image/')) {
            addNotification(t('plantsView.aiDiagnostics.validation.imageOnly'), 'error');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
            setImageMimeType(file.type);
            setResponse(null);
            handleDiagnose(reader.result as string, file.type);
        };
        reader.readAsDataURL(file);
    }, [addNotification, t]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) handleFile(file);
    };

    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragOver(false);
        if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
            handleFile(event.dataTransfer.files[0]);
            event.dataTransfer.clearData();
        }
    }, [handleFile]);

    const handleDragEvents = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.type === 'dragenter' || event.type === 'dragover') {
            setIsDragOver(true);
        } else if (event.type === 'dragleave') {
            setIsDragOver(false);
        }
    };
    
    const handleCameraCapture = (dataUrl: string) => {
        setImagePreview(dataUrl);
        setImageMimeType('image/jpeg');
        setResponse(null);
        setIsCameraOpen(false);
        handleDiagnose(dataUrl, 'image/jpeg');
    };
    
    const handleDiagnose = async (imageDataUrl: string, mimeType: string) => {
        if (!imageDataUrl || !mimeType) return;

        setIsLoading(true);
        setResponse(null);
        try {
            const base64Data = imageDataUrl.split(',')[1];
            const selectedPlant = activePlants.find(p => p.id === selectedPlantId);
            
            const context = {
                plant: selectedPlant,
                userNotes: userNotes.trim() || undefined,
            };

            const res = await geminiService.diagnosePlantProblem(base64Data, mimeType, context, t);
            setResponse(res);
        } catch (error) {
            console.error("Diagnosis Error:", error);
            const errorMessageKey = error instanceof Error ? error.message : 'ai.error.unknown';
            const errorMessage = t(errorMessageKey) === errorMessageKey ? t('ai.error.unknown') : t(errorMessageKey);
            addNotification(errorMessage, 'error');
        }
        setIsLoading(false);
    };
    
    const handleSaveToJournal = () => {
        if (!response || !selectedPlantId) return;
        
        const formattedNotes = `**${t('ai.diagnostics')}**: ${response.problemName} (${response.confidence}% ${t('plantsView.aiDiagnostics.confidence')})\n\n**${t('plantsView.aiDiagnostics.diagnosis')}**\n${response.diagnosis}\n\n**${t('plantsView.aiDiagnostics.actions')}**\n${response.immediateActions}`;
        
        addJournalEntry(selectedPlantId, {
            type: 'OBSERVATION',
            notes: formattedNotes,
            details: {
                healthStatus: 'Showing Issues',
                observationTags: [response.problemName, 'AI Diagnosis']
            }
        });
        
        addNotification(t('plantsView.aiDiagnostics.savedToJournal'), 'success');
    };

    const ResultSection: React.FC<{title: string, content: string, icon: React.ReactNode}> = ({ title, content, icon }) => (
        <Card className="bg-slate-800/50">
            <h4 className="font-bold text-lg text-primary-300 flex items-center gap-2 mb-2">
                {icon}
                {title}
            </h4>
            <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
        </Card>
    );

    return (
        <>
            <CameraModal isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onCapture={handleCameraCapture} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="flex flex-col">
                    <h3 className="text-xl font-bold font-display text-primary-400 mb-2 flex items-center gap-2">
                        <PhosphorIcons.Sparkle className="w-6 h-6" /> {t('plantsView.aiDiagnostics.title')}
                    </h3>
                    <p className="text-sm text-slate-300 mb-4">{t('plantsView.aiDiagnostics.description')}</p>
                    
                    <div className="space-y-4">
                        {!imagePreview ? (
                            <div 
                                onDrop={handleDrop}
                                onDragOver={handleDragEvents}
                                onDragEnter={handleDragEvents}
                                onDragLeave={handleDragEvents}
                                className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all duration-300 ${isDragOver ? 'border-primary-500 bg-primary-500/10 scale-105' : 'border-slate-600 hover:border-slate-500'}`}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <PhosphorIcons.UploadSimple className="w-10 h-10 mx-auto text-slate-400 mb-2"/>
                                <p className="font-semibold text-slate-200">{t('plantsView.aiDiagnostics.dragDrop')}</p>
                                <p className="text-xs text-slate-500">{t('plantsView.aiDiagnostics.prompt')}</p>
                            </div>
                        ) : (
                             <div className="relative">
                                <img src={imagePreview} alt="Plant for diagnosis" className="rounded-lg w-full max-h-60 object-contain"/>
                                 {isLoading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg"><PhosphorIcons.Sparkle className="w-12 h-12 text-primary-400 animate-pulse" /></div>}
                            </div>
                        )}
                        <div className="flex gap-2">
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="diagnostics-upload"/>
                            <Button as="label" htmlFor="diagnostics-upload" className="flex-1 cursor-pointer"><PhosphorIcons.UploadSimple className="w-5 h-5 mr-2" />{imagePreview ? t('common.changeImage') : t('plantsView.aiDiagnostics.buttonLabel')}</Button>
                            <Button onClick={() => setIsCameraOpen(true)} variant="secondary" aria-label={t('plantsView.aiDiagnostics.capture')}><PhosphorIcons.Camera className="w-5 h-5"/></Button>
                        </div>
                         <div>
                            <label htmlFor="plant-context" className="block text-sm font-semibold text-slate-300 mb-1">{t('plantsView.aiDiagnostics.plantContext')}</label>
                            <select id="plant-context" value={selectedPlantId} onChange={e => setSelectedPlantId(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white">
                                <option value="">{t('plantsView.aiDiagnostics.generalContext')}</option>
                                {activePlants.map(p => <option key={p.id} value={p.id}>{p.name} ({t(`plantStages.${p.stage}`)})</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="user-notes" className="block text-sm font-semibold text-slate-300 mb-1">{t('plantsView.aiDiagnostics.userNotes')}</label>
                            <textarea id="user-notes" value={userNotes} onChange={e => setUserNotes(e.target.value)} rows={2} className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white" placeholder={t('plantsView.aiDiagnostics.userNotesPlaceholder')} />
                        </div>
                    </div>
                </Card>
                <div className="flex flex-col">
                    {isLoading ? (
                        <Card className="flex-grow flex items-center justify-center">
                            <AiLoadingIndicator loadingMessage={loadingMessage} />
                        </Card>
                    ) : response ? (
                         <div className="space-y-4 max-h-[calc(100vh-200px)] lg:max-h-full overflow-y-auto pr-2 flex-grow">
                             <Card className="bg-slate-800/50">
                                <h4 className="font-bold text-lg text-primary-300 flex items-center gap-2 mb-2">
                                    <PhosphorIcons.MagnifyingGlass className="w-5 h-5"/> 
                                    {response.problemName}
                                    <span className={`ml-auto text-sm font-semibold flex items-center gap-1 ${response.confidence > 75 ? 'text-green-400' : 'text-amber-400'}`}>
                                        {response.confidence}%
                                    </span>
                                </h4>
                                <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: response.diagnosis }} />
                             </Card>
                             <ResultSection title={t('plantsView.aiDiagnostics.actions')} icon={<PhosphorIcons.Lightning className="w-5 h-5"/>} content={response.immediateActions} />
                             <ResultSection title={t('plantsView.aiDiagnostics.solution')} icon={<PhosphorIcons.Wrench className="w-5 h-5"/>} content={response.longTermSolution} />
                             <ResultSection title={t('plantsView.aiDiagnostics.prevention')} icon={<PhosphorIcons.Checks className="w-5 h-5"/>} content={response.prevention} />
                             {selectedPlantId && <Button onClick={handleSaveToJournal} variant="secondary" size="sm" className="w-full mt-4">{t('plantsView.aiDiagnostics.saveToJournal')}</Button>}
                         </div>
                    ) : (
                         <Card className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                             <PhosphorIcons.Brain className="w-16 h-16 mb-4 text-slate-400" />
                            <h3 className="font-semibold text-lg text-slate-300">{t('plantsView.aiDiagnostics.waiting')}</h3>
                            <p className="text-sm">{t('plantsView.aiDiagnostics.waitingDesc')}</p>
                        </Card>
                    )}
                </div>
            </div>
        </>
    );
};