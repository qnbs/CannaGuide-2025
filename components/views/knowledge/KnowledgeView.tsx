import React, { useState, useMemo, useDeferredValue } from 'react';
import { Card } from '@/components/common/Card';
import { useTranslations } from '@/hooks/useTranslations';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useAppStore } from '@/stores/useAppStore';
import { selectActivePlants, selectPlantById } from '@/stores/selectors';
import { Plant, KnowledgeArticle } from '@/types';
import { knowledgeBase } from '@/data/knowledgebase';
import { MentorChatView } from './knowledge/MentorChatView';
import { Button } from '@/components/common/Button';

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

const ArticleItem: React.FC<{ article: KnowledgeArticle }> = ({ article }) => {
    const { t } = useTranslations();
    const title = t(article.titleKey);
    const content = t(article.contentKey);
    
    return (
        <details className="group glass-pane rounded-lg overflow-hidden">
            <summary className="list-none flex justify-between items-center p-3 cursor-pointer">
                <h4 className="font-semibold text-slate-100">{title}</h4>
                <PhosphorIcons.ChevronDown className="w-5 h-5 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="p-3 border-t border-slate-700/50">
                <div className="prose prose-sm dark:prose-invert max-w-none prose-h3:text-primary-400 prose-strong:text-slate-100" dangerouslySetInnerHTML={{ __html: content }} />
                <div className="flex flex-wrap gap-2 mt-4">
                    {article.tags.map(tag => <span key={tag} className="bg-slate-700 text-slate-300 text-xs font-medium px-2 py-0.5 rounded-full">{tag}</span>)}
                </div>
            </div>
        </details>
    );
};

export const KnowledgeView: React.FC = () => {
    const { t } = useTranslations();
    const { activePlants, activeMentorPlantId, setActiveMentorPlantId } = useAppStore(state => ({
        activePlants: selectActivePlants(state),
        activeMentorPlantId: state.activeMentorPlantId,
        setActiveMentorPlantId: state.setActiveMentorPlantId,
    }));
    
    const activeMentorPlant = useAppStore(state => selectPlantById(activeMentorPlantId)(state));

    const [selectedPlantId, setSelectedPlantId] = useState<string | null>(activePlants[0]?.id || null);
    const [searchTerm, setSearchTerm] = useState('');
    const deferredSearchTerm = useDeferredValue(searchTerm);

    const selectedPlantForHub = useMemo(() => activePlants.find(p => p.id === selectedPlantId), [activePlants, selectedPlantId]);
    
    const relevantArticles = useMemo(() => {
        if (!selectedPlantForHub) return [];
        return getRelevantArticles(selectedPlantForHub);
    }, [selectedPlantForHub]);

    const searchedArticles = useMemo(() => {
        const lowerCaseSearch = deferredSearchTerm.toLowerCase();
        if (!lowerCaseSearch) return knowledgeBase;

        return knowledgeBase.filter(article => {
            const title = t(article.titleKey).toLowerCase();
            const tags = article.tags.join(' ').toLowerCase();
            return title.includes(lowerCaseSearch) || tags.includes(lowerCaseSearch);
        });
    }, [deferredSearchTerm, t]);
    
    if (activeMentorPlant) {
        return <MentorChatView plant={activeMentorPlant} onClose={() => setActiveMentorPlantId(null)} />;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold font-display text-slate-100">{t('knowledgeView.title')}</h2>
                <p className="text-slate-400 mt-1">{t('knowledgeView.subtitle')}</p>
            </div>

            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400 flex items-center gap-2">
                    <PhosphorIcons.Brain className="w-6 h-6"/> {t('knowledgeView.aiMentor.title')}
                </h3>
                <p className="text-sm text-slate-400 mt-2 mb-4">{t('knowledgeView.aiMentor.plantContextSubtitle')}</p>
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
            </Card>

            {selectedPlantForHub && (
                <Card>
                    <h3 className="text-xl font-bold font-display text-primary-400 mb-4">{t('knowledgeView.hub.todaysFocus', { plantName: selectedPlantForHub.name })}</h3>
                    {relevantArticles.length > 0 ? (
                        <div className="space-y-3">
                            {relevantArticles.map(article => <ArticleItem key={article.id} article={article} />)}
                        </div>
                    ) : (
                        <p className="text-slate-400 text-sm">{t('knowledgeView.hub.noRelevantArticles', { plantName: selectedPlantForHub.name })}</p>
                    )}
                </Card>
            )}

            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400 mb-4">{t('knowledgeView.hub.browseAll')}</h3>
                 <div className="relative mb-4">
                    <PhosphorIcons.MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={t('knowledgeView.hub.searchPlaceholder')} className="w-full pl-10 pr-4 py-2 border border-slate-700 rounded-lg bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"/>
                </div>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                    {searchedArticles.map(article => <ArticleItem key={article.id} article={article} />)}
                </div>
            </Card>
        </div>
    );
};