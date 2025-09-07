

import React, { useState, useEffect } from 'react';
import { Plant, AIResponse, ArchivedAdvisorResponse } from '../../../../types';
import { Card } from '../../../common/Card';
import { Button } from '../../../common/Button';
import { geminiService } from '../../../../services/geminiService';
import { useTranslations } from '../../../../hooks/useTranslations';
import { PhosphorIcons } from '../../../icons/PhosphorIcons';
import { EditResponseModal } from '../../../common/EditResponseModal';

interface AiTabProps {
    plant: Plant;
    archive: ArchivedAdvisorResponse[];
    addResponse: (plantId: string, response: AIResponse, query: string) => void;
    updateResponse: (updatedResponse: ArchivedAdvisorResponse) => void;
    deleteResponse: (plantId: string, responseId: string) => void;
}

export const AiTab: React.FC<AiTabProps> = ({ plant, archive, addResponse, updateResponse, deleteResponse }) => {
    const { t } = useTranslations();
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState<AIResponse | null>(null);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [editingResponse, setEditingResponse] = useState<ArchivedAdvisorResponse | null>(null);

    const plantQueryData = JSON.stringify({ age: plant.age, stage: plant.stage, vitals: plant.vitals, environment: plant.environment, problems: plant.problems, journal: plant.journal.slice(-5) }, null, 2);

    useEffect(() => {
        if (isLoading) {
            const messages = geminiService.getDynamicLoadingMessages({ useCase: 'advisor', data: { plant } });
            let messageIndex = 0;
            
            const updateLoadingMessage = () => {
                const { key, params } = messages[messageIndex % messages.length];
                
                const translatedParams = {...params};
                if (translatedParams && translatedParams.stage) {
                    translatedParams.stage = t(`plantStages.${translatedParams.stage}`);
                }

                setLoadingMessage(t(key, translatedParams));
                messageIndex++;
            };
            
            updateLoadingMessage(); // Set initial message
            const intervalId = setInterval(updateLoadingMessage, 2000);

            return () => clearInterval(intervalId);
        }
    }, [isLoading, plant, t]);

    const handleGetAdvice = async () => {
        setIsLoading(true);
        setResponse(null);
        try {
            const res = await geminiService.getAiPlantAdvisorResponse(plant);
            setResponse(res);
        } catch (error) {
            console.error("AI Advisor Error:", error);
            setResponse({ title: t('common.error'), content: t('ai.error') });
        }
        setIsLoading(false);
    };
    
    const sortedArchive = [...archive].sort((a, b) => b.createdAt - a.createdAt);

    return (
        <div className="space-y-6">
             {editingResponse && (
                <EditResponseModal 
                    response={editingResponse} 
                    onClose={() => setEditingResponse(null)} 
                    onSave={(updated) => {
                        updateResponse(updated);
                        setEditingResponse(null);
                    }}
                />
            )}
            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400 mb-2 flex items-center gap-2">
                    <PhosphorIcons.Brain className="w-6 h-6" /> {t('ai.advisor')}
                </h3>
                <p className="text-sm text-slate-400 mb-4">{t('plantsView.aiAdvisor.description')}</p>
                <Button onClick={handleGetAdvice} disabled={isLoading} className="w-full">
                    {isLoading ? t('ai.generating') : t('ai.getAdvice')}
                </Button>

                <div className="mt-4">
                    {isLoading && (
                        <div className="text-center p-4">
                            <p className="text-slate-400 animate-pulse">{loadingMessage}</p>
                        </div>
                    )}
                    {response && (
                        <Card className="bg-slate-800 animate-fade-in">
                            <h4 className="font-bold text-primary-300">{response.title}</h4>
                            <p className="text-sm text-slate-200">{response.content}</p>
                            <div className="text-right mt-2">
                               <Button size="sm" variant="secondary" onClick={() => addResponse(plant.id, response, plantQueryData)}>{t('knowledgeView.archive.saveButton')}</Button>
                            </div>
                        </Card>
                    )}
                </div>
                <p className="text-xs text-slate-500 mt-4 text-center">{t('ai.disclaimer')}</p>
            </Card>

            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400 flex items-center gap-2">
                    <PhosphorIcons.Archive className="w-6 h-6"/> {t('plantsView.aiAdvisor.archiveTitle')}
                </h3>
                 <div className="space-y-4 mt-4">
                    {sortedArchive.length > 0 ? (
                        sortedArchive.map(res => (
                             <Card key={res.id} className="bg-slate-800">
                                 <p className="text-xs text-slate-400">{new Date(res.createdAt).toLocaleString()} - {t(`plantStages.${res.plantStage}`)}</p>
                                <h4 className="font-bold text-primary-300 mt-1">{res.title}</h4>
                                <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: res.content }}></div>
                                 <div className="flex justify-end items-center gap-2 mt-2">
                                    <Button size="sm" variant="secondary" onClick={() => setEditingResponse(res)}>
                                        <PhosphorIcons.PencilSimple className="w-4 h-4"/>
                                    </Button>
                                    <Button size="sm" variant="danger" onClick={() => deleteResponse(plant.id, res.id)}>
                                        <PhosphorIcons.TrashSimple className="w-4 h-4"/>
                                    </Button>
                                </div>
                            </Card>
                        ))
                    ) : <p className="text-slate-400 text-sm">{t('plantsView.aiAdvisor.archiveEmpty')}</p>}
                </div>
            </Card>
        </div>
    );
};