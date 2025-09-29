import React, { useState, useCallback, useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { AiLoadingIndicator } from '@/components/common/AiLoadingIndicator';
import { CameraModal } from '@/components/common/CameraModal';
import { useActivePlants } from '@/hooks/useSimulationBridge';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { selectDiagnosticsState } from '@/stores/selectors';
// FIX: Corrected imports for Redux actions.
import { startDiagnostics } from '@/stores/slices/aiSlice';
import { addNotification } from '@/stores/slices/uiSlice';
import { addJournalEntry } from '@/stores/slices/simulationSlice';


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

export const AiDiagnostics: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { isLoading, response, error } = useAppSelector(selectDiagnosticsState);
    const activePlants = useActivePlants();

    const [image, setImage] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [plantContextId, setPlantContextId] = useState<string>('general');
    const [userNotes, setUserNotes] = useState('');

    const handleFile = useCallback((file: File) => {
        if (!file.type.startsWith('image/')) {
            dispatch(addNotification({ message: t('plantsView.aiDiagnostics.validation.imageOnly'), type: 'error' }));
            return;
        }
        const reader = new FileReader();
        reader.onload = () => setImage(reader.result as string);
        reader.readAsDataURL(file);
    }, [dispatch, t]);
    
    const handleDrag = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
    const handleDragIn = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
    const handleDragOut = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
    const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) { handleFile(e.dataTransfer.files[0]); } }, [handleFile]);

    const handleGetDiagnosis = () => {
        if (!image) return;
        const base64Data = image.split(',')[1];
        const mimeType = base64ToMimeType(base64Data);
        const selectedPlant = activePlants.find(p => p.id === plantContextId);
        const context = selectedPlant ? { name: selectedPlant.name, age: selectedPlant.age, stage: selectedPlant.stage, notes: userNotes } : { notes: userNotes };
        dispatch(startDiagnostics({ base64Image: base64Data, mimeType, context }));
    };

    const handleSaveToJournal = () => {
        if (response && plantContextId !== 'general') {
            const content = `
                ### ${t('plantsView.aiDiagnostics.diagnosis')}: ${response.title} (${(response.confidence * 100).toFixed(0)}%)
                **${t('plantsView.aiDiagnostics.actions')}:** ${response.immediateActions}
                **${t('plantsView.aiDiagnostics.solution')}:** ${response.longTermSolution}
            `;
            dispatch(addJournalEntry({ plantId: plantContextId, entry: { type: 'OBSERVATION', notes: `AI Diagnosis: ${response.title}`, details: { diagnosis: content } }}));
            dispatch(addNotification({ message: t('plantsView.aiDiagnostics.savedToJournal'), type: 'success' }));
        }
    };
    
    const plantOptions = useMemo(() => ([
        { id: 'general', name: t('plantsView.aiDiagnostics.generalContext') },
        ...activePlants.map(p => ({ id: p.id, name: p.name }))
    ]), [activePlants, t]);

    return (
        <Card>
            {isCameraOpen && <CameraModal isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onCapture={(dataUrl) => { setImage(dataUrl); setIsCameraOpen(false); }} />}
            <h3 className="text-xl font-bold font-display text-primary-400 mb-2 flex items-center gap-2">
                <PhosphorIcons.Sparkle className="w-6 h-6" /> {t('plantsView.aiDiagnostics.title')}
            </h3>
            <p className="text-sm text-slate-400 mb-4">{t('plantsView.aiDiagnostics.description')}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                    {!image ? (
                         <div
                            onDragEnter={handleDragIn}
                            onDragLeave={handleDragOut}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragging ? 'border-primary-500 bg-primary-900/20' : 'border-slate-600 hover:border-slate-500'}`}
                            onClick={() => document.getElementById('image-upload-input')?.click()}
                        >
                            <PhosphorIcons.UploadSimple className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                            <p className="font-semibold text-slate-300">{t('plantsView.aiDiagnostics.dragDrop')}</p>
                        </div>
                    ) : (
                        <div className="relative">
                            <img src={image} alt="plant preview" className="w-full h-auto rounded-lg" />
                            <Button size="sm" variant="danger" className="absolute top-2 right-2 !p-1.5" onClick={() => setImage(null)} aria-label={t('common.removeImage')}><PhosphorIcons.X /></Button>
                        </div>
                    )}
                    <input id="image-upload-input" type="file" accept="image/*" className="hidden" onChange={e => e.target.files && handleFile(e.target.files[0])} />
                    <Button onClick={() => setIsCameraOpen(true)} variant="secondary" className="w-full"><PhosphorIcons.Camera className="w-5 h-5 mr-1.5" />{t('plantsView.aiDiagnostics.capture')}</Button>
                    <select value={plantContextId} onChange={e => setPlantContextId(e.target.value)} className="w-full input-base" aria-label={t('plantsView.aiDiagnostics.plantContext')}>
                        {plantOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <textarea value={userNotes} onChange={e => setUserNotes(e.target.value)} placeholder={t('plantsView.aiDiagnostics.userNotesPlaceholder')} className="w-full input-base min-h-[60px]" />
                    <Button onClick={handleGetDiagnosis} disabled={!image || isLoading}>{isLoading ? t('ai.generating') : t('ai.diagnostics')}</Button>
                </div>
                
                <div className="min-h-[200px]">
                    {isLoading && <AiLoadingIndicator loadingMessage={t('ai.loading.diagnostics.analyzing')} />}
                    {error && <div className="text-red-400 p-4 bg-red-900/20 rounded-lg">{error}</div>}
                    {response && !isLoading && (
                        <div className="space-y-3">
                            <div className="flex justify-between items-baseline">
                                <h4 className="text-lg font-bold text-primary-300">{response.title}</h4>
                                <span className="text-sm font-mono bg-slate-700 px-2 py-0.5 rounded">{t('plantsView.aiDiagnostics.confidence')}: {(response.confidence * 100).toFixed(0)}%</span>
                            </div>
                            <p className="text-sm text-slate-300"><strong className="text-slate-100">{t('plantsView.aiDiagnostics.diagnosis')}:</strong> {response.diagnosis}</p>
                            <p className="text-sm text-slate-300"><strong className="text-slate-100">{t('plantsView.aiDiagnostics.actions')}:</strong> {response.immediateActions}</p>
                            <p className="text-sm text-slate-300"><strong className="text-slate-100">{t('plantsView.aiDiagnostics.solution')}:</strong> {response.longTermSolution}</p>
                            <p className="text-sm text-slate-300"><strong className="text-slate-100">{t('plantsView.aiDiagnostics.prevention')}:</strong> {response.prevention}</p>
                            {plantContextId !== 'general' && <Button onClick={handleSaveToJournal} size="sm" variant="secondary" className="mt-2">{t('common.save')} to Journal</Button>}
                        </div>
                    )}
                     {!response && !isLoading && !error && (
                        <div className="flex items-center justify-center h-full text-center text-slate-500">
                           <p>{t('plantsView.aiDiagnostics.waitingDesc')}</p>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};