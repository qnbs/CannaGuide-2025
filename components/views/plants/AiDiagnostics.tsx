import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { useTranslations } from '../../../hooks/useTranslations';
import { useNotifications } from '../../../context/NotificationContext';
import { geminiService } from '../../../services/geminiService';
import { AIResponse } from '../../../types';
import { CameraModal } from '../../common/CameraModal';
import { usePlants } from '../../../hooks/usePlants';

export const AiDiagnostics: React.FC = () => {
    const { t } = useTranslations();
    const { addNotification } = useNotifications();
    const { plants } = usePlants();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState<AIResponse | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageMimeType, setImageMimeType] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [isCameraOpen, setIsCameraOpen] = useState(false);

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

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            handleFile(file);
        }
    };
    
    const handleFile = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
            setImageMimeType(file.type);
            setResponse(null);
        };
        reader.readAsDataURL(file);
    };

    const handleCameraCapture = (dataUrl: string) => {
        setImagePreview(dataUrl);
        // dataUrl for jpegs captured from canvas is 'image/jpeg'
        setImageMimeType('image/jpeg');
        setResponse(null);
        setIsCameraOpen(false);
    };
    
    const handleDiagnose = async () => {
        if (!imagePreview || !imageMimeType) return;

        setIsLoading(true);
        setResponse(null);
        try {
            const base64Data = imagePreview.split(',')[1];
            const activePlants = plants.filter(p => p !== null);
            const plantContext = activePlants.length > 0
              ? `Active plants are in these stages: ${activePlants.map(p => p!.stage).join(', ')}.`
              : 'No active plants are being grown.';

            const res = await geminiService.diagnosePlantProblem(base64Data, imageMimeType, plantContext, t);
            setResponse(res);
        } catch (error) {
            console.error("Diagnosis Error:", error);
            const errorMessageKey = error instanceof Error ? error.message : 'ai.error.unknown';
            const errorMessage = t(errorMessageKey) === errorMessageKey ? t('ai.error.unknown') : t(errorMessageKey);
            setResponse({ title: t('common.error'), content: errorMessage });
            addNotification(errorMessage, 'error');
        }
        setIsLoading(false);
    };

    const handleReset = () => {
        setImagePreview(null);
        setImageMimeType(null);
        setResponse(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <>
            <CameraModal isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onCapture={handleCameraCapture} />
            <Card>
                <h3 className="text-xl font-bold mb-2 text-primary-400 flex items-center gap-2">
                    <PhosphorIcons.Sparkle className="w-6 h-6" /> {t('plantsView.aiDiagnostics.title')}
                </h3>
                <p className="text-sm text-slate-300 mb-4">{t('plantsView.aiDiagnostics.description')}</p>

                {!imagePreview && (
                    <div className="flex gap-2">
                         <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="diagnostics-upload"/>
                        <Button as="label" htmlFor="diagnostics-upload" className="flex-1 cursor-pointer"><PhosphorIcons.UploadSimple className="w-5 h-5 mr-2" />{t('plantsView.aiDiagnostics.buttonLabel')}</Button>
                        <Button onClick={() => setIsCameraOpen(true)} variant="secondary" aria-label={t('plantsView.aiDiagnostics.capture')}><PhosphorIcons.Camera className="w-5 h-5"/></Button>
                    </div>
                )}
                
                {imagePreview && (
                    <div className="space-y-4">
                        <div className="relative">
                            <img src={imagePreview} alt="Plant for diagnosis" className="rounded-lg w-full max-h-60 object-contain"/>
                            <button onClick={handleReset} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70" aria-label={t('common.removeImage')}>
                                <PhosphorIcons.X className="w-4 h-4" />
                            </button>
                        </div>
                        <Button onClick={handleDiagnose} disabled={isLoading} className="w-full">
                           {isLoading ? loadingMessage : t('ai.getAdvice')}
                        </Button>
                    </div>
                )}

                {response && !isLoading && (
                    <Card className="mt-4 bg-slate-800 animate-fade-in">
                        <h4 className="font-bold text-primary-300">{response.title}</h4>
                        <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: response.content }} />
                    </Card>
                )}
            </Card>
        </>
    );
};
