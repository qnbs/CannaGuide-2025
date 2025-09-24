import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslations } from '@/hooks/useTranslations';
import { useAppStore } from '@/stores/useAppStore';
import { CameraModal } from '@/components/common/CameraModal';
import { selectActivePlants } from '@/stores/selectors';

export const AiDiagnostics: React.FC = () => {
    const { t } = useTranslations();
    const { addNotification, addJournalEntry, diagnosePlant, diagnosticsTask, resetAiTask } = useAppStore(state => ({
        addNotification: state.addNotification,
        addJournalEntry: state.addJournalEntry,
        diagnosePlant: state.diagnosePlant,
        diagnosticsTask: state.diagnosticsTask,
        resetAiTask: state.resetAiTask,
    }));
    const activePlants = useAppStore(selectActivePlants);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);

    const [selectedPlantId, setSelectedPlantId] = useState<string>('');
    const [userNotes, setUserNotes] = useState('');

    const { status: taskStatus, result: response, loadingMessage } = diagnosticsTask;
    const isLoading = taskStatus === 'loading';

    const handleFile = useCallback((file: File) => {
        if (!file.type.startsWith('image/')) {
            addNotification(t('plantsView.aiDiagnostics.validation.imageOnly'), 'error');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const imageDataUrl = reader.result as string;
            setImagePreview(imageDataUrl);
            const base64Data = imageDataUrl.split(',')[1];
            const selectedPlant = activePlants.find(p => p.id === selectedPlantId);
            const context = { plant: selectedPlant, userNotes: userNotes.trim() || undefined };
            diagnosePlant(base64Data, file.type, context);
        };
        reader.readAsDataURL(file);
    }, [addNotification, t, activePlants, selectedPlantId, userNotes, diagnosePlant]);

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
        setIsCameraOpen(false);
        const base64Data = dataUrl.split(',')[1];
        const selectedPlant = activePlants.find(p => p.id === selectedPlantId);
        const context = { plant: selectedPlant, userNotes: userNotes.trim() || undefined };
        diagnosePlant(base64Data, 'image/jpeg', context);
    };

    const handleReset = () => {
        setImagePreview(null);
        resetAiTask('diagnosticsTask');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    
    const handleSaveToJournal = () => {
        if (!response || !selectedPlantId) return;
        const formattedNotes = `**${t('ai.diagnostics')}**: ${response.problemName} (${response.confidence}% ${t('plantsView.aiDiagnostics.confidence')})\n\n**${t('plantsView.aiDiagnostics.diagnosis')}**\n${response.diagnosis}\n\n**${t('plantsView.aiDiagnostics.actions')}**\n${response.immediateActions}`;
        addJournalEntry(selectedPlantId, {
            type: 'OBSERVATION',
            notes: formattedNotes,
            details: { healthStatus: 'Showing Issues', observationTags: [response.problemName, 'AI Diagnosis'] }
        });
        addNotification(t('plantsView.aiDiagnostics.savedToJournal'), 'success');
    };

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
                                onDrop={handleDrop} onDragOver={handleDragEvents} onDragEnter={handleDragEvents} onDragLeave={handleDragEvents}
                                className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragOver ? 'border-primary-500 bg-primary-500/10' : 'border-slate-600 hover:border-slate-500'}`}
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
                            <Button as="label" htmlFor="diagnostics-upload" className="flex-1 cursor-pointer" disabled={isLoading}><PhosphorIcons.UploadSimple className="w-5 h-5 mr-2" />{imagePreview ? t('common.changeImage') : t('plantsView.aiDiagnostics.buttonLabel')}</Button>
                            <Button onClick={() => setIsCameraOpen(true)} variant="secondary" aria-label={t('plantsView.aiDiagnostics.capture')} disabled={isLoading}><PhosphorIcons.Camera className="w-5 h-5"/></Button>
                            {imagePreview && <Button onClick={handleReset} variant="danger" aria-label={t('common.cancel')} disabled={isLoading}><PhosphorIcons.X className="w-5 h-5"/></Button>}
                        </div>
                         <div>
                            <label htmlFor="plant-context" className="block text-sm font-semibold text-slate-300 mb-1">{t('plantsView.aiDiagnostics.plantContext')}</label>
                            <select id="plant-context" value={selectedPlantId} onChange={e => setSelectedPlantId(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white" disabled={isLoading}>
                                <option value="">{t('plantsView.aiDiagnostics.generalContext')}</option>
                                {activePlants.map(p => <option key={p.id} value={p.id}>{p.name} ({t(`plantStages.${p.stage}`)})</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="user-notes" className="block text-sm font-semibold text-slate-300 mb-1">{t('plantsView.aiDiagnostics.userNotes')}</label>
                            <textarea id="user-notes" value={userNotes} onChange={e => setUserNotes(e.target.value)} rows={2} className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white" placeholder={t('plantsView.aiDiagnostics.userNotesPlaceholder')} disabled={isLoading} />
                        </div>
                    </div>
                </Card>
                <Card>
                    {isLoading ? (
                         <div className="text-center p-8 flex flex-col items-center justify-center h-full">
                            <p className="text-slate-400 animate-pulse">{loadingMessage}</p>
                        </div>
                    ) : response ? (
                         <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold text-primary-300">{response.problemName}</h3>
                                <div className="flex items-center gap-2 text-sm font-semibold" title={`${response.confidence}% ${t('plantsView.aiDiagnostics.confidence')}`}>
                                    <PhosphorIcons.CheckCircle weight="fill" className={response.confidence > 75 ? 'text-green-500' : 'text-amber-500'} />
                                    {response.confidence}%
                                </div>
                            </div>
                            <div className="prose prose-sm dark:prose-invert max-w-none space-y-3">
                                <div><h4 className="!mb-1">{t('plantsView.aiDiagnostics.diagnosis')}</h4><div dangerouslySetInnerHTML={{ __html: response.diagnosis }} /></div>
                                <div><h4 className="!mb-1">{t('plantsView.aiDiagnostics.actions')}</h4><div dangerouslySetInnerHTML={{ __html: response.immediateActions }} /></div>
                                <div><h4 className="!mb-1">{t('plantsView.aiDiagnostics.solution')}</h4><div dangerouslySetInnerHTML={{ __html: response.longTermSolution }} /></div>
                                <div><h4 className="!mb-1">{t('plantsView.aiDiagnostics.prevention')}</h4><div dangerouslySetInnerHTML={{ __html: response.prevention }} /></div>
                            </div>
                             {selectedPlantId && <Button onClick={handleSaveToJournal} variant="secondary" size="sm" className="w-full mt-4">{t('plantsView.aiDiagnostics.saveToJournal')}</Button>}
                         </div>
                    ) : (
                         <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                             <PhosphorIcons.Brain className="w-16 h-16 mb-4 text-slate-400" />
                            <h3 className="font-semibold text-lg text-slate-300">{t('plantsView.aiDiagnostics.waiting')}</h3>
                            <p className="text-sm">{t('plantsView.aiDiagnostics.waitingDesc')}</p>
                        </div>
                    )}
                </Card>
            </div>
        </>
    );
};