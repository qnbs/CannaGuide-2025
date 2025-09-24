import React, { useState, useEffect, useMemo } from 'react';
import { Plant, AIResponse, ArchivedAdvisorResponse } from '@/types';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useTranslations } from '@/hooks/useTranslations';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { EditResponseModal } from '@/components/common/EditResponseModal';
import { useAppStore } from '@/stores/useAppStore';

interface AiTabProps {
    plant: Plant;
    archive: ArchivedAdvisorResponse[];
    addResponse: (plantId: string, response: AIResponse, query: string) => void;
    updateResponse: (updatedResponse: ArchivedAdvisorResponse) => void;
    deleteResponse: (plantId: string, responseId: string) => void;
}

export const AiTab: React.FC<AiTabProps> = ({ plant, archive, addResponse, updateResponse, deleteResponse }) => {
    const { t } = useTranslations();
    const { getPlantAdvisorResponse, plantAdvisorTask, resetAiTask } = useAppStore(state => ({
        getPlantAdvisorResponse: state.getPlantAdvisorResponse,
        plantAdvisorTask: state.plantAdvisorTask,
        resetAiTask: state.resetAiTask,
    }));

    const [editingResponse, setEditingResponse] = useState<ArchivedAdvisorResponse | null>(null);

    const { status: taskStatus, result: response, loadingMessage } = plantAdvisorTask;
    const isLoading = taskStatus === 'loading';

    // Reset task state if component unmounts or plant changes
    useEffect(() => {
        return () => {
            resetAiTask('plantAdvisorTask');
        }
    }, [plant.id, resetAiTask]);
    
    const isCurrentResponseSaved = useMemo(() => {
        if (!response) return false;
        return archive.some(r => r.content === response.content);
    }, [response, archive]);

    const handleGetAdvice = async () => {
        getPlantAdvisorResponse(plant);
    };
    
    const plantQueryData = JSON.stringify({ age: plant.age, stage: plant.stage, vitals: plant.vitals, environment: plant.environment, problems: plant.problems, journal: plant.journal.slice(-5) }, null, 2);
    
    const handleSaveResponse = () => {
        if (response) {
            addResponse(plant.id, response, plantQueryData);
        }
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
                    {isLoading ? loadingMessage : t('ai.getAdvice')}
                </Button>

                <div className="mt-4">
                    {isLoading && (
                        <div className="text-center p-4">
                            <p className="text-slate-400 animate-pulse">{loadingMessage}</p>
                        </div>
                    )}
                    {response && (taskStatus === 'success' || taskStatus === 'error') && (
                        <Card className="bg-slate-800 animate-fade-in">
                            <h4 className="font-bold text-primary-300">{response.title}</h4>
                            <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: response.content }}></div>
                             {taskStatus === 'success' && (
                                <div className="text-right mt-2">
                                    <Button size="sm" variant="secondary" onClick={handleSaveResponse} disabled={isCurrentResponseSaved}>
                                        {isCurrentResponseSaved ? 
                                            <><PhosphorIcons.CheckCircle className="w-4 h-4 mr-1.5" />{t('strainsView.tips.saved')}</> :
                                            <><PhosphorIcons.ArchiveBox className="w-4 h-4 mr-1.5" />{t('knowledgeView.archive.saveButton')}</>
                                        }
                                    </Button>
                                </div>
                            )}
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
                                    <Button size="sm" variant="secondary" onClick={() => setEditingResponse(res)} aria-label={t('common.edit')}>
                                        <PhosphorIcons.PencilSimple className="w-4 h-4"/>
                                    </Button>
                                    <Button size="sm" variant="danger" onClick={() => deleteResponse(plant.id, res.id)} aria-label={t('common.deleteResponse')}>
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