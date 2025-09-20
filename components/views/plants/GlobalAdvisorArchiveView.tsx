import React, { useMemo, useState } from 'react';
import { ArchivedAdvisorResponse, Plant } from '../../../types';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { useTranslations } from '../../../hooks/useTranslations';
import { EditResponseModal } from '../../common/EditResponseModal';

interface GlobalAdvisorArchiveViewProps {
    archive: Record<string, ArchivedAdvisorResponse[]>;
    plants: Plant[];
    updateResponse: (updatedResponse: ArchivedAdvisorResponse) => void;
    deleteResponse: (plantId: string, responseId: string) => void;
}

export const GlobalAdvisorArchiveView: React.FC<GlobalAdvisorArchiveViewProps> = ({ archive, plants, updateResponse, deleteResponse }) => {
    const { t } = useTranslations();
    const [editingResponse, setEditingResponse] = useState<ArchivedAdvisorResponse | null>(null);

    const allResponses = useMemo(() => {
        return Object.values(archive)
            .flat()
            .sort((a, b) => b.createdAt - a.createdAt);
    }, [archive]);
    
    const getPlantName = (plantId: string) => {
        const plant = plants.find(p => p.id === plantId);
        return plant ? plant.name : t('plantsView.aiAdvisor.unknownPlant');
    };

    return (
        <div className="space-y-4">
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
            {allResponses.length > 0 ? (
                allResponses.map(res => (
                     <Card key={res.id} className="bg-slate-800">
                        <div className="flex justify-between items-start">
                             <div>
                                <h4 className="font-bold text-lg text-primary-300">{res.title}</h4>
                                <p className="text-sm font-semibold text-slate-300 mb-1">{getPlantName(res.plantId)}</p>
                                <p className="text-xs text-slate-400">{new Date(res.createdAt).toLocaleString()} - {t(`plantStages.${res.plantStage}`)}</p>
                             </div>
                             <div className="flex items-center gap-2">
                                <Button size="sm" variant="secondary" onClick={() => setEditingResponse(res)} aria-label={t('common.edit')}>
                                    <PhosphorIcons.PencilSimple className="w-4 h-4"/>
                                </Button>
                                <Button size="sm" variant="danger" onClick={() => deleteResponse(res.plantId, res.id)} aria-label={t('common.deleteResponse')}>
                                    <PhosphorIcons.TrashSimple className="w-4 h-4"/>
                                </Button>
                            </div>
                        </div>
                        <div className="prose prose-sm dark:prose-invert max-w-none mt-3" dangerouslySetInnerHTML={{ __html: res.content }}></div>
                    </Card>
                ))
            ) : (
                 <Card className="text-center py-10 text-slate-500">
                    <PhosphorIcons.Archive className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                    <h3 className="font-semibold">{t('plantsView.aiAdvisor.archiveEmptyGlobal.title')}</h3>
                    <p className="text-sm">{t('plantsView.aiAdvisor.archiveEmptyGlobal.subtitle')}</p>
                </Card>
            )}
        </div>
    );
};
