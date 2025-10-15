// FIX: Add `useMemo` to the `react` import to resolve the "Cannot find name 'useMemo'" error.
import React, { useTransition, Suspense, lazy, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
// FIX: The PhosphorIcons import was incorrect. Correcting it to use the proper export structure.
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { KnowledgeViewTab } from '@/types';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { setKnowledgeViewTab, setActiveMentorPlantId } from '@/stores/slices/uiSlice';
import { selectUi } from '@/stores/selectors';
import { Card } from '@/components/common/Card';
import { usePlantById } from '@/hooks/useSimulationBridge';
import { MentorChatView } from './MentorChatView';
import { SkeletonLoader } from '../common/SkeletonLoader';
import { KnowledgeSubNav } from './KnowledgeSubNav';

// Lazy load the sub-views for better initial load performance
const MentorView = lazy(() => import('./MentorView'));
const GuideView = lazy(() => import('./GuideView'));
const ArchiveView = lazy(() => import('./ArchiveView'));
const BreedingView = lazy(() => import('./BreedingView'));
const SandboxView = lazy(() => import('./SandboxView'));


export const KnowledgeView: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { knowledgeViewTab: activeTab, activeMentorPlantId } = useAppSelector(selectUi);
    const [isPending, startTransition] = useTransition();

    const activeMentorPlant = usePlantById(activeMentorPlantId);

    const viewIcons = useMemo(() => ({
        [KnowledgeViewTab.Mentor]: <PhosphorIcons.Brain className="w-16 h-16 mx-auto text-fuchsia-400" />,
        [KnowledgeViewTab.Guide]: <PhosphorIcons.Book className="w-16 h-16 mx-auto text-rose-400" />,
        [KnowledgeViewTab.Archive]: <PhosphorIcons.Archive className="w-16 h-16 mx-auto text-stone-400" />,
        [KnowledgeViewTab.Breeding]: <PhosphorIcons.TestTube className="w-16 h-16 mx-auto text-violet-400" />,
        [KnowledgeViewTab.Sandbox]: <PhosphorIcons.Flask className="w-16 h-16 mx-auto text-emerald-400" />,
    }), []);
    
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
                <h2 className="text-3xl font-bold font-display text-slate-100 mt-2">{t('knowledgeView.title')}</h2>
                <p className="text-slate-400 mt-1">{t('knowledgeView.subtitle')}</p>
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