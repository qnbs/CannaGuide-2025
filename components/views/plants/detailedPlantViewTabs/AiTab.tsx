import React, { useState, useEffect } from 'react';
import { Plant, AIResponse, ArchivedAdvisorResponse } from '@/types';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { geminiService } from '@/services/geminiService';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { EditResponseModal } from '@/components/common/EditResponseModal';
import { AiLoadingIndicator } from '@/components/common/AiLoadingIndicator';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { selectArchivedAdvisorResponsesForPlant } from '@/stores/selectors';
import { addNotification } from '@/stores/slices/uiSlice';
import { useGetPlantAdviceMutation, useGetProactiveDiagnosisMutation } from '@/stores/api';
import { addArchivedAdvisorResponse, updateArchivedAdvisorResponse, deleteArchivedAdvisorResponse } from '@/stores/slices/archivesSlice';

interface AiTabProps {
    plant: Plant;
}

export const AiTab: React.FC<AiTabProps> = ({ plant }) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    
    const archive = useAppSelector(state => selectArchivedAdvisorResponsesForPlant(state, plant.id));
    const [getPlantAdvice, advisorState] = useGetPlantAdviceMutation();
    const [getProactiveDiagnosis, diagnosisState] = useGetProactiveDiagnosisMutation();

    const [loadingMessage, setLoadingMessage] = useState('');
    const [editingResponse, setEditingResponse] = useState<ArchivedAdvisorResponse | null>(null);
    const [isCurrentResponseSaved, setIsCurrentResponseSaved] = useState(false);
    const [isDiagnosisSaved, setIsDiagnosisSaved] = useState(false);

    const plantQueryData = JSON.stringify({ age: plant.age, stage: plant.stage, medium: plant.medium, environment: plant.environment, problems: plant.problems, journal: plant.journal.slice(-5) }, null, 2);

    useEffect(() => {
        if (advisorState.isLoading) {
            const messages = geminiService.getDynamicLoadingMessages({ useCase: 'advisor', data: { plantName: plant.name } });
            let messageIndex = 0;
            const intervalId = setInterval(() => {
                setLoadingMessage(messages[messageIndex % messages.length]);
                messageIndex++;
            }, 2000);
            return () => clearInterval(intervalId);
        }
        if(diagnosisState.isLoading) {
             const messages = geminiService.getDynamicLoadingMessages({ useCase: 'proactiveDiagnosis', data: { plantName: plant.name } });
            let messageIndex = 0;
            const intervalId = setInterval(() => {
                setLoadingMessage(messages[messageIndex % messages.length]);
                messageIndex++;
            }, 2000);
            return () => clearInterval(intervalId);
        }
    }, [advisorState.isLoading, diagnosisState.isLoading, plant.name, t]);

    const handleGetAdvice = () => {
        setIsCurrentResponseSaved(false);
        getPlantAdvice(plant);
    };
    
    const handleGetDiagnosis = () => {
        setIsDiagnosisSaved(false);
        getProactiveDiagnosis(plant);
    }

    const handleSaveResponse = () => {
        if (advisorState.data) {
            dispatch(addArchivedAdvisorResponse({ plant, response: advisorState.data, query: plantQueryData }));
            setIsCurrentResponseSaved(true);
        }
    };
    
    const handleSaveDiagnosisResponse = () => {
        if (diagnosisState.data) {
            dispatch(addArchivedAdvisorResponse({ plant, response: diagnosisState.data, query: t('ai.proactiveDiagnosis') }));
            setIsDiagnosisSaved(true);
        }
    };

    const sortedArchive = [...archive].sort((a, b) => b.createdAt - a.createdAt);

    return (
        <div className="space-y-6">
             {editingResponse && (
                <EditResponseModal 
                    response={editingResponse} 
                    onClose={() => setEditingResponse(null)} 
                    // FIX: Construct a valid ArchivedAdvisorResponse object for the action payload by merging the updated fields with the original object.
                    onSave={(updated) => {
                        if (editingResponse) {
                            dispatch(updateArchivedAdvisorResponse({ ...editingResponse, ...updated }));
                        }
                        setEditingResponse(null);
                    }}
                />
            )}
            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400 mb-2 flex items-center gap-2">
                    <PhosphorIcons.Sparkle className="w-6 h-6" /> {t('plantsView.aiAdvisor.proactiveDiagnosisTitle')}
                </h3>
                <p className="text-sm text-slate-400 mb-4">{t('plantsView.aiAdvisor.proactiveDiagnosisDescription')}</p>
                <Button onClick={handleGetDiagnosis} disabled={diagnosisState.isLoading} className="w-full">
                    {diagnosisState.isLoading ? loadingMessage : t('plantsView.aiAdvisor.runDiagnosis')}
                </Button>

                <div className="mt-4">
                    {diagnosisState.isLoading && <AiLoadingIndicator loadingMessage={loadingMessage} />}
                    {diagnosisState.data && !diagnosisState.isLoading && (
                        <Card className="bg-slate-800 animate-fade-in">
                            <h4 className="font-bold text-primary-300">{diagnosisState.data.title}</h4>
                            <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: diagnosisState.data.content }}></div>
                             <div className="text-right mt-2">
                                   <Button size="sm" variant="secondary" onClick={handleSaveDiagnosisResponse} disabled={isDiagnosisSaved}>
                                       {isDiagnosisSaved ? 
                                        <><PhosphorIcons.CheckCircle className="w-4 h-4 mr-1.5" />{t('strainsView.tips.saved')}</> :
                                        <><PhosphorIcons.ArchiveBox className="w-4 h-4 mr-1.5" />{t('knowledgeView.archive.saveButton')}</>
                                       }
                                   </Button>
                                </div>
                        </Card>
                    )}
                </div>
            </Card>

            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400 mb-2 flex items-center gap-2">
                    <PhosphorIcons.Brain className="w-6 h-6" /> {t('ai.advisor')}
                </h3>
                <p className="text-sm text-slate-400 mb-4">{t('plantsView.aiAdvisor.description')}</p>
                <Button onClick={handleGetAdvice} disabled={advisorState.isLoading} className="w-full">
                    {advisorState.isLoading ? loadingMessage : t('ai.getAdvice')}
                </Button>

                <div className="mt-4">
                    {advisorState.isLoading && <AiLoadingIndicator loadingMessage={loadingMessage} />}
                    {advisorState.data && !advisorState.isLoading && (
                        <Card className="bg-slate-800 animate-fade-in">
                            <h4 className="font-bold text-primary-300">{advisorState.data.title}</h4>
                            <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: advisorState.data.content }}></div>
                            {!advisorState.error && (
                                <div className="text-right mt-2">
                                   <Button size="sm" variant="secondary" onClick={handleSaveResponse} disabled={isCurrentResponseSaved}>
                                       {isCurrentResponseSaved ? 
                                        <><PhosphorIcons.CheckCircle className="w-4 h-4 mr-1.5" weight="fill" />{t('strainsView.tips.saved')}</> :
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
                                    <Button size="sm" variant="danger" onClick={() => dispatch(deleteArchivedAdvisorResponse({plantId: plant.id, responseId: res.id}))} aria-label={t('common.deleteResponse')}>
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
