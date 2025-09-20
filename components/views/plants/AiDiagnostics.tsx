import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { useNotifications } from '../../../context/NotificationContext';
import { useTranslations } from '../../../hooks/useTranslations';
import { geminiService } from '../../../services/geminiService';
import { SkeletonLoader } from '../../common/SkeletonLoader';
import { AIResponse, Plant } from '../../../types';

interface AiDiagnosticsProps {
    plant: Plant | null;
}

export const AiDiagnostics: React.FC<AiDiagnosticsProps> = ({ plant }) => {
    const { t } = useTranslations();
    const { addNotification } = useNotifications();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [image, setImage] = useState<{file: File, preview: string} | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState<AIResponse | null>(null);
    const [loadingMessage, setLoadingMessage] = useState('');

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
            const preview = URL.createObjectURL(file);
            setImage({ file, preview });
            setResponse(null);
        }
    };

    const handleDiagnose = async () => {
        if (!image) return;

        setIsLoading(true);
        setResponse(null);
        try {
            const base64Image = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(image.file);
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = error => reject(error);
            });
            
            const plantContext = plant ? `The plant is a ${plant.strain.name}, ${plant.age} days old, in the ${plant.stage} stage.` : 'No specific plant context provided.';
            const res = await geminiService.diagnosePlantProblem(base64Image, image.file.type, plantContext, t);
            setResponse(res);
        } catch (error) {
            console.error(error);
            const errorMessageKey = error instanceof Error ? error.message : 'ai.error.unknown';
            const errorMessage = t(errorMessageKey) === errorMessageKey ? t('ai.error.unknown') : t(errorMessageKey);
            addNotification(errorMessage, 'error');
            setResponse({ title: t('common.error'), content: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReset = () => {
        setImage(null);
        setResponse(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <Card>
            <h3 className="text-xl font-bold mb-4 text-slate-100 flex items-center gap-2">
                <PhosphorIcons.MagicWand className="w-6 h-6 text-primary-400" /> {t('plantsView.aiDiagnostics.title')}
            </h3>
            {!image && (
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:bg-slate-800/50">
                    <PhosphorIcons.UploadSimple className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                    <p className="text-sm text-slate-300 font-semibold">{t('plantsView.aiDiagnostics.buttonLabel')}</p>
                    <p className="text-xs text-slate-400">{t('plantsView.aiDiagnostics.prompt')}</p>
                </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            
            {image && (
                <div className="space-y-4">
                    <div className="relative">
                        <img src={image.preview} alt="Plant preview" className="rounded-lg max-h-60 w-full object-contain" />
                        <Button size="sm" variant="secondary" onClick={handleReset} className="absolute top-2 right-2 !p-1.5" aria-label={t('common.removeImage')}>
                            <PhosphorIcons.X className="w-4 h-4" />
                        </Button>
                    </div>
                    <Button onClick={handleDiagnose} disabled={isLoading} className="w-full">
                        {isLoading ? t('ai.generating') : t('plantsView.aiDiagnostics.diagnoseButton')}
                    </Button>
                </div>
            )}

            {isLoading && (
                 <div className="text-center p-4">
                    <p className="text-slate-400 animate-pulse">{loadingMessage}</p>
                </div>
            )}
            {response && (
                 <Card className="mt-4 bg-slate-800 animate-fade-in">
                    <h4 className="font-bold text-primary-300">{response.title}</h4>
                    <p className="text-sm text-slate-200">{response.content}</p>
                 </Card>
            )}
            <p className="text-xs text-slate-500 mt-2 text-center">{t('ai.disclaimer')}</p>
        </Card>
    );
};