import React, { useState, useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { useTranslations } from '@/hooks/useTranslations';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useAppStore } from '@/stores/useAppStore';
import { selectActivePlants, selectPlantById } from '@/stores/selectors';
import { Plant, KnowledgeArticle } from '@/types';
import { knowledgeBase } from '@/data/knowledgebase';
import { MentorChatView } from './knowledge/MentorChatView';
import { Button } from '@/components/common/Button';
import { Tabs } from '@/components/common/Tabs';
import { GuideTab } from './knowledge/GuideTab';
import { MentorArchiveTab } from './knowledge/MentorArchiveTab';
import { BreedingView } from './knowledge/BreedingView';

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
    const { t } = useTranslations();
    const [activeTab, setActiveTab] = useState('mentor');
    const { activePlants, activeMentorPlantId, setActiveMentorPlantId } = useAppStore(state => ({
        activePlants: selectActivePlants(state),
        activeMentorPlantId: state.activeMentorPlantId,
        setActiveMentorPlantId: state.setActiveMentorPlantId,
    }));
    
    const activeMentorPlant = useAppStore(state => selectPlantById(activeMentorPlantId)(state));

    const [selectedPlantId, setSelectedPlantId] = useState<string | null>(activePlants[0]?.id || null);
    
    const selectedPlantForHub = useMemo(() => activePlants.find(p => p.id === selectedPlantId), [activePlants, selectedPlantId]);
    
    const relevantArticles = useMemo(() => {
        if (!selectedPlantForHub) return [];
        return getRelevantArticles(selectedPlantForHub);
    }, [selectedPlantForHub]);
    
    if (activeMentorPlant) {
        return <MentorChatView plant={activeMentorPlant} onClose={() => setActiveMentorPlantId(null)} />;
    }

    const tabs = [
        { id: 'mentor', label: t('knowledgeView.tabs.mentor'), icon: <PhosphorIcons.Brain /> },
        { id: 'guide', label: t('knowledgeView.tabs.guide'), icon: <PhosphorIcons.Book /> },
        { id: 'archive', label: t('knowledgeView.tabs.archive'), icon: <PhosphorIcons.Archive /> },
        { id: 'breeding', label: t('knowledgeView.tabs.breeding'), icon: <PhosphorIcons.TestTube /> },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'mentor':
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
                                <select id="mentor-plant-selector" value={selectedPlantId || ''} onChange={e => setSelectedPlantId(e.target.value)} className="w-full sm:flex-grow bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white">
                                    {activePlants.map(p => <option key={p.id} value={p.id}>{p.name} ({t(`plantStages.${p.stage}`)})</option>)}
                                </select>
                                <Button onClick={() => setActiveMentorPlantId(selectedPlantId)} disabled={!selectedPlantId} className="w-full sm:w-auto">
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
            case 'guide':
                return <GuideTab />;
            case 'archive':
                return <MentorArchiveTab />;
            case 'breeding':
                return <BreedingView />;
            default:
                return null;
        }
    };


    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold font-display text-slate-100">{t('knowledgeView.title')}</h2>
                <p className="text-slate-400 mt-1">{t('knowledgeView.subtitle')}</p>
            </div>
            
            <Card>
                <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={(id) => setActiveTab(id as string)} />
            </Card>

            {renderContent()}
        </div>
    );
};