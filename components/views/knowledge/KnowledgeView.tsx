// FIX: Add `useMemo` to the `react` import to resolve the "Cannot find name 'useMemo'" error.
import React, { useTransition, Suspense, lazy, useRef, useLayoutEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '../icons/PhosphorIcons';
import { KnowledgeViewTab } from '@/types';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { setKnowledgeViewTab, setActiveMentorPlantId } from '@/stores/slices/uiSlice';
import { selectUi } from '@/stores/selectors';
import { Card } from '@/components/common/Card';
import { usePlantById } from '@/hooks/useSimulationBridge';
import { MentorChatView } from './knowledge/MentorChatView';
import { SkeletonLoader } from '../common/SkeletonLoader';

// Lazy load the sub-views for better initial load performance
const MentorView = lazy(() => import('./knowledge/MentorView'));
const GuideView = lazy(() => import('./knowledge/GuideView'));
const ArchiveView = lazy(() => import('./knowledge/ArchiveView'));
const BreedingView = lazy(() => import('./knowledge/BreedingView'));
const SandboxView = lazy(() => import('./knowledge/SandboxView'));


export const KnowledgeView: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { knowledgeViewTab: activeTab, activeMentorPlantId } = useAppSelector(selectUi);
    const [isPending, startTransition] = useTransition();

    const activeMentorPlant = usePlantById(activeMentorPlantId);

    const navRef = useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = useState({});

    const tabs = useMemo(() => [
        { id: KnowledgeViewTab.Mentor, label: t('knowledgeView.tabs.mentor'), icon: <PhosphorIcons.Brain /> },
        { id: KnowledgeViewTab.Guide, label: t('knowledgeView.tabs.guide'), icon: <PhosphorIcons.Book /> },
        { id: KnowledgeViewTab.Archive, label: t('knowledgeView.tabs.archive'), icon: <PhosphorIcons.Archive /> },
        { id: KnowledgeViewTab.Breeding, label: t('knowledgeView.tabs.breeding'), icon: <PhosphorIcons.TestTube /> },
        { id: KnowledgeViewTab.Sandbox, label: t('knowledgeView.tabs.sandbox'), icon: <PhosphorIcons.Flask /> },
    ], [t]);
    
    useLayoutEffect(() => {
        if (navRef.current) {
            const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
            // FIX: Corrected index to account for the indicator div being the first child.
            // This prevents an error when trying to access offsetTop on an undefined element,
            // which was the likely cause of the infinite render loop (React Error #185).
            const activeButton = navRef.current.children[activeIndex + 1] as HTMLElement;
            if (activeButton) {
                setIndicatorStyle({
                    top: `${activeButton.offsetTop}px`,
                    height: `${activeButton.offsetHeight}px`,
                });
            }
        }
    }, [activeTab, tabs]);


    // If a chat is active, render the chat view exclusively
    if (activeMentorPlant) {
        return <MentorChatView plant={activeMentorPlant} onClose={() => dispatch(setActiveMentorPlantId(null))} />;
    }

    const handleSetTab = (id: string) => {
        startTransition(() => {
            dispatch(setKnowledgeViewTab(id as KnowledgeViewTab));
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
                <PhosphorIcons.BookOpenText className="w-16 h-16 mx-auto text-primary-400" />
                <h2 className="text-3xl font-bold font-display text-slate-100 mt-2">{t('knowledgeView.title')}</h2>
                <p className="text-slate-400 mt-1">{t('knowledgeView.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <nav ref={navRef} className="lg:col-span-1 space-y-2 side-nav-container">
                     <div className="side-nav-indicator" style={indicatorStyle}></div>
                    {tabs.map(tab => {
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleSetTab(tab.id)}
                                className={`w-full p-3 rounded-lg text-left transition-all duration-200 flex items-center gap-3 relative ring-1 ring-inset ring-white/20 ${
                                    activeTab === tab.id
                                        ? 'bg-slate-700 text-primary-300 font-semibold'
                                        : 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-200'
                                }`}
                            >
                                <div className="w-6 h-6">{tab.icon}</div>
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </nav>
                <main className={`lg:col-span-3 transition-opacity duration-300 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
                    <Card>
                         <Suspense fallback={<SkeletonLoader count={5} />}>
                            {renderContent()}
                        </Suspense>
                    </Card>
                </main>
            </div>
        </div>
    );
};

export default KnowledgeView;