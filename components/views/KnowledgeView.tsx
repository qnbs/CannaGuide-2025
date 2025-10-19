import React, { useTransition, Suspense, lazy, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { KnowledgeViewTab } from '@/types';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { setKnowledgeViewTab, setActiveMentorPlantId } from '@/stores/slices/uiSlice';
import { selectKnowledgeViewTab, selectActiveMentorPlantId } from '@/stores/selectors';
import { Card } from '@/components/common/Card';
import { usePlantById } from '@/hooks/useSimulationBridge';
import { MentorChatView } from './knowledge/MentorChatView';
import { SkeletonLoader } from '../common/SkeletonLoader';
import { KnowledgeSubNav } from './knowledge/KnowledgeSubNav';

// Lazy load the sub-views for better initial load performance
const MentorView = lazy(() => import('./knowledge/MentorView'));
const GuideView = lazy(() => import('./knowledge/GuideView'));
const ArchiveView = lazy(() => import('./knowledge/ArchiveView'));
const BreedingView = lazy(() => import('./knowledge/BreedingView'));
const SandboxView = lazy(() => import('./knowledge/SandboxView'));


export const KnowledgeView: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const activeTab = useAppSelector(selectKnowledgeViewTab);
    const activeMentorPlantId = useAppSelector(selectActiveMentorPlantId);
    const [isPending, startTransition] = useTransition();

    const activeMentorPlant = usePlantById(activeMentorPlantId);

    const viewIcons = useMemo(
        () => ({
            [KnowledgeViewTab.Mentor]: <PhosphorIcons.Brain className="w-16 h-16 mx-auto text-purple-400" />,
            [KnowledgeViewTab.Guide]: <PhosphorIcons.Book className="w-16 h-16 mx-auto text-blue-400" />,
            [KnowledgeViewTab.Archive]: <PhosphorIcons.Archive className="w-16 h-16 mx-auto text-amber-400" />,
            [KnowledgeViewTab.Breeding]: <PhosphorIcons.TestTube className="w-16 h-16 mx-auto text-green-400" />,
            [KnowledgeViewTab.Sandbox]: <PhosphorIcons.Flask className="w-16 h-16 mx-auto text-rose-400" />,
        }),
        [],
    );

    const viewTitles = useMemo(() => ({
        [KnowledgeViewTab.Mentor]: t('knowledgeView.tabs.mentor'),
        [KnowledgeViewTab.Guide]: t('knowledgeView.tabs.guide'),
        [KnowledgeViewTab.Archive]: t('knowledgeView.tabs.archive'),
        [KnowledgeViewTab.Breeding]: t('knowledgeView.tabs.breeding'),
        [KnowledgeViewTab.Sandbox]: t('knowledgeView.tabs.sandbox'),
    }), [t]);
    
    // If a chat is active, render the chat view exclusively
    if (activeMentorPlant) {
        return <MentorChatView plant={activeMentorPlant} onClose={() => dispatch(setActiveMentorPlantId(null))} />;
    }

    const handleSetTab = (id: KnowledgeViewTab) => {
        startTransition(() => {
            dispatch(setKnowledgeViewTab(id));
        });
    };

    const renderContent = () => {
        switch (activeTab) {
            case KnowledgeViewTab.Mentor: return <MentorView />;
            case KnowledgeViewTab.Guide: return <GuideView />;
            case KnowledgeViewTab.Archive: return <ArchiveView />;
            case KnowledgeViewTab.Breeding: return <BreedingView />;
            case KnowledgeViewTab.Sandbox: return <SandboxView />;
            default: return <MentorView />;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6 animate-fade-in">
                {viewIcons[activeTab]}
                <h2 className="text-3xl font-bold font-display text-slate-100 mt-2">{viewTitles[activeTab]}</h2>
            </div>

            <KnowledgeSubNav activeTab={activeTab} onTabChange={handleSetTab} />

            <main className={`transition-opacity duration-300 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
                <Card>
                     <Suspense fallback={<SkeletonLoader count={5} />}>
                        {renderContent()}
                    </Suspense>
                </Card>
            </main>
        </div>
    );
};

export default KnowledgeView;