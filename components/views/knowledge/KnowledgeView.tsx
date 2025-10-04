import React, { useState, useMemo, useEffect, useTransition } from 'react';
import { Card } from '../common/Card';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '../icons/PhosphorIcons';
import { Plant, KnowledgeArticle, KnowledgeViewTab, SandboxState } from '@/types';
import { knowledgeBase } from '@/data/knowledgebase';
import { MentorChatView } from './MentorChatView';
import { Button } from '../common/Button';
import { Tabs } from '../common/Tabs';
import { GuideTab } from './GuideTab';
import { MentorArchiveTab } from './MentorArchiveTab';
import { BreedingView } from './BreedingView';
import { useActivePlants, usePlantById } from '@/hooks/useSimulationBridge';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { selectUi, selectSandboxState } from '@/stores/selectors';
import { setKnowledgeViewTab, setActiveMentorPlantId } from '@/stores/slices/uiSlice';
import { SandboxView } from './SandboxView';
import { SkeletonLoader } from '../common/SkeletonLoader';

const getRelevantArticles = (plant: Plant): KnowledgeArticle[] => {
    return knowledgeBase.filter(article => {
        const { triggers } = article;
        let isRelevant = true;

        if (triggers.plantStage) {
            const stages = Array.isArray(triggers.plantStage) ? triggers.plantStage : [triggers.plantStage];
            if (!stages.includes(plant.stage)) isRelevant = false;
        }
        if (isRelevant && triggers.ageInDays) {
            if (plant.age < triggers.ageInDays.min || plant.age > triggers.ageInDays.max) isRelevant = false;
        }
        if (isRelevant && triggers.activeProblems) {
            const activeProblemTypes = plant.problems.filter(p => p.status === 'active').map(p => p.type);
            if (!triggers.activeProblems.some(p => activeProblemTypes.includes(p))) isRelevant = false;
        }
        
        return isRelevant;
    });
};


export const KnowledgeView: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { knowledgeViewTab: activeTab, activeMentorPlantId } = useAppSelector(selectUi);
    const { isLoading: isSandboxLoading } = useAppSelector(selectSandboxState) as SandboxState;

    const [isTabLoading, startTabTransition] = useTransition();
    
    const activePlants = useActivePlants() as Plant[];
    const activeMentorPlant = usePlantById(activeMentorPlantId);

    const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
    
    useEffect(() => {
        if (activePlants.length > 0 && (!selectedPlantId || !activePlants.some(p => p.id === selectedPlantId))) {
            setSelectedPlantId(activePlants[0].id);
        } else if (activePlants.length === 0) {
            setSelectedPlantId(null);
        }
    }, [activePlants, selectedPlantId]);
    
    const selectedPlantForHub = useMemo(() => activePlants.find(p => p.id === selectedPlantId), [activePlants, selectedPlantId]);
    
    const relevantArticles = useMemo(() => {
        if (!selectedPlantForHub) return [];
        return getRelevantArticles(selectedPlantForHub);
    }, [selectedPlantForHub]);
    
    if (activeMentorPlant) {
        return <MentorChatView plant={activeMentorPlant} onClose={() => dispatch(setActiveMentorPlantId(null))} />;
    }

    const handleSetTab = (id: string) => {
        startTabTransition(() => {
            dispatch(setKnowledgeViewTab(id as KnowledgeViewTab));
        });
    };

    const tabs = [
        { id: KnowledgeViewTab.Mentor, label: t('knowledgeView.tabs.mentor'), icon: <PhosphorIcons.Brain /> },
        { id: KnowledgeViewTab.Guide, label: t('knowledgeView.tabs.guide'), icon: <PhosphorIcons.Book /> },
        { id: KnowledgeViewTab.Archive, label: t('knowledgeView.tabs.archive'), icon: <PhosphorIcons.Archive /> },
        { id: KnowledgeViewTab.Breeding, label: t('knowledgeView.tabs.breeding'), icon: <PhosphorIcons.TestTube /> },
        { id: KnowledgeViewTab.Sandbox, label: t('knowledgeView.tabs.sandbox'), icon: <PhosphorIcons.Flask /> },
    ];

    const renderContent = () => {
        if (isTabLoading) {
            return <Card><SkeletonLoader count={4} /></Card>;
        }

        switch (activeTab) {
            case KnowledgeViewTab.Mentor:
                 return (
                    <Card>
                        <div className="mb-4">
                             <h3 className="text-xl font-bold font-display text-primary-400 flex items-center gap-2">
                                <PhosphorIcons.Brain className="w-6 h-6"/> {t('knowledgeView.aiMentor.title')}
                            </h3>
                            <p className="text-sm text-slate-400 mt-2">{t('knowledgeView.aiMentor.plantContextSubtitle')}</p>
                        </div>
                         {activePlants.length > 0 ? (
                            <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-800/50 p-3 rounded-lg">
                                <label htmlFor="mentor-plant-selector" className="text-sm font-semibold text-slate-300 flex-shrink-0">{t('knowledgeView.hub.selectPlant')}:</label>
                                <select id="mentor-plant-selector" value={selectedPlantId || ''} onChange={e => setSelectedPlantId(e.target.value)} className="w-full sm:flex-grow select-input">
                                    {activePlants.map(p => <option key={p.id} value={p.id}>{p.name} ({t(`plantStages.${p.stage}`)})</option>)}
                                </select>
                                <Button onClick={() => dispatch(setActiveMentorPlantId(selectedPlantId))} disabled={!selectedPlantId} className="w-full sm:w-auto">
                                   {t('knowledgeView.aiMentor.startChat')} <PhosphorIcons.ArrowRight className="w-4 h-4 ml-1.5" />
                                </Button>
                            </div>
                        ) : (
                            <p className="text-slate-400 text-sm">{t('knowledgeView.hub.noPlants')}</p>
                        )}

                        {selectedPlantForHub && relevantArticles.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-lg font-bold text-slate-200 mb-2">{t('knowledgeView.hub.todaysFocus', { plantName: selectedPlantForHub.name })}</h3>
                                <GuideTab articles={relevantArticles} />
                            </div>
                        )}
                    </Card>
                );
            case KnowledgeViewTab.Guide:
                return <Card><GuideTab articles={knowledgeBase} /></Card>;
            case KnowledgeViewTab.Archive:
                return <MentorArchiveTab />;
            case KnowledgeViewTab.Breeding:
                return <BreedingView />;
            case KnowledgeViewTab.Sandbox:
                return (
                    <Card>
                        {isSandboxLoading ? <SkeletonLoader count={3} /> : <SandboxView />}
                    </Card>
                );
            default:
                return null;
        }
    };


    return (
        <div className="space-y-6">
            <Card>
                <h2 className="text-3xl font-bold font-display text-slate-100">{t('knowledgeView.title')}</h2>
                <p className="text-slate-400 mt-1">{t('knowledgeView.subtitle')}</p>
            </Card>
            
            <Card>
                <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={handleSetTab} />
            </Card>

            {renderContent()}
        </div>
    );
};