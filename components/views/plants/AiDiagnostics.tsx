import React, { useState, useRef } from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { useTranslations } from '../../../hooks/useTranslations';
import { geminiService } from '../../../services/geminiService';
import { AIResponse } from '../../../types';
import { SkeletonLoader } from '../../common/SkeletonLoader';
import { useNotifications } from '../../../context/NotificationContext';

const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};


export const AiDiagnostics: React.FC = () => {
    const { t, locale } = useTranslations();
    const { addNotification } = useNotifications();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState<AIResponse | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setResponse(null);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleDiagnose = async () => {
        if (!file) return;
        setIsLoading(true);
        setResponse(null);
        try {
            const part = await fileToGenerativePart(file);
            const res = await geminiService.diagnosePlantProblem(part.inlineData.data, part.inlineData.mimeType, locale);
            setResponse(res);
        } catch (error) {
            console.error("Diagnosis failed:", error);
            addNotification(t('plantsView.aiDiagnostics.error'), 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setImagePreview(null);
        setResponse(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <Card>
            <h3 className="text-xl font-bold mb-2 text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <PhosphorIcons.Virus className="w-6 h-6 text-primary-500" />
                {t('plantsView.aiDiagnostics.title')}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t('plantsView.aiDiagnostics.description')}</p>
            
            <div className="space-y-4">
                {!imagePreview && (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                        <PhosphorIcons.UploadSimple className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                        <p className="text-sm text-slate-600 dark:text-slate-300 font-semibold">{t('plantsView.aiDiagnostics.buttonLabel')}</p>
                        <p className="text-xs text-slate-400">{t('plantsView.aiDiagnostics.prompt')}</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>
                )}

                {imagePreview && (
                    <div className="relative">
                        <img src={imagePreview} alt="Leaf preview" className="rounded-lg w-full max-h-60 object-contain" />
                        <button onClick={handleReset} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70" aria-label={t('common.close')}>
                            <PhosphorIcons.X className="w-4 h-4" />
                        </button>
                    </div>
                )}
                
                {file && !response && (
                    <Button onClick={handleDiagnose} disabled={isLoading} className="w-full">
                        {isLoading ? (
                            <>
                                <PhosphorIcons.ArrowClockwise className="w-5 h-5 mr-2 animate-spin"/>
                                {t('plantsView.aiDiagnostics.analyzing')}
                            </>
                        ) : t('plantsView.aiDiagnostics.diagnoseButton')}
                    </Button>
                )}

                {isLoading && !response && <SkeletonLoader count={4} />}
                
                {response && (
                    <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-lg animate-fade-in">
                        <article className="prose prose-sm dark:prose-invert max-w-none">
                             <h4 className="!text-primary-600 dark:!text-primary-300 !mt-0">{response.title === 'Error' ? t('common.error') : response.title}</h4>
                             <div dangerouslySetInnerHTML={{ __html: response.content === 'The AI could not generate a response. Please try again later or rephrase your request.' ? t('common.aiResponseError') : response.content }} />
                        </article>
                    </div>
                )}
            </div>
        </Card>
    );
};