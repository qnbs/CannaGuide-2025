import React, { useTransition, Suspense, lazy, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { KnowledgeViewTab } from '@/types'
import { useUIStore } from '@/stores/useUIStore'
import { Card } from '@/components/common/Card'
import { usePlantById } from '@/hooks/useSimulationBridge'
import { SkeletonLoader } from '../common/SkeletonLoader'
import { KnowledgeSubNav } from './knowledge/KnowledgeSubNav'

// Lazy load the sub-views for better initial load performance
const MentorChatView = lazy(() =>
    import('./knowledge/MentorChatView').then((m) => ({ default: m.MentorChatView })),
)
const MentorView = lazy(() => import('./knowledge/MentorView'))
const GuideView = lazy(() => import('./knowledge/GuideView'))
const ArchiveView = lazy(() => import('./knowledge/ArchiveView'))
const BreedingView = lazy(() => import('./knowledge/BreedingView'))
const SandboxView = lazy(() => import('./knowledge/SandboxView'))
const GrowTechView = lazy(() => import('./knowledge/GrowTechView'))

export const KnowledgeView: React.FC = () => {
    const { t } = useTranslation()
    const activeTab = useUIStore((s) => s.knowledgeViewTab)
    const activeMentorPlantId = useUIStore((s) => s.activeMentorPlantId)
    const [isPending, startTransition] = useTransition()
    const contentOpacityClass = isPending ? 'opacity-50' : 'opacity-100'

    const activeMentorPlant = usePlantById(activeMentorPlantId)

    const viewIcons = useMemo(
        () => ({
            [KnowledgeViewTab.Mentor]: (
                <PhosphorIcons.Brain className="w-16 h-16 mx-auto text-purple-400" />
            ),
            [KnowledgeViewTab.Guide]: (
                <PhosphorIcons.Book className="w-16 h-16 mx-auto text-blue-400" />
            ),
            [KnowledgeViewTab.Archive]: (
                <PhosphorIcons.Archive className="w-16 h-16 mx-auto text-amber-400" />
            ),
            [KnowledgeViewTab.Breeding]: (
                <PhosphorIcons.TestTube className="w-16 h-16 mx-auto text-green-400" />
            ),
            [KnowledgeViewTab.Sandbox]: (
                <PhosphorIcons.Flask className="w-16 h-16 mx-auto text-rose-400" />
            ),
            [KnowledgeViewTab.GrowTech]: (
                <PhosphorIcons.Lightning className="w-16 h-16 mx-auto text-yellow-400" />
            ),
        }),
        [],
    )

    const viewTitles = useMemo(
        () => ({
            [KnowledgeViewTab.Mentor]: t('knowledgeView.tabs.mentor'),
            [KnowledgeViewTab.Guide]: t('knowledgeView.tabs.guide'),
            [KnowledgeViewTab.Archive]: t('knowledgeView.tabs.archive'),
            [KnowledgeViewTab.Breeding]: t('knowledgeView.tabs.breeding'),
            [KnowledgeViewTab.Sandbox]: t('knowledgeView.tabs.sandbox'),
            [KnowledgeViewTab.GrowTech]: t('knowledgeView.tabs.growTech'),
        }),
        [t],
    )

    // If a chat is active, render the chat view exclusively
    if (activeMentorPlant) {
        return (
            <Suspense fallback={<SkeletonLoader count={3} />}>
                <MentorChatView
                    plant={activeMentorPlant}
                    onClose={() => useUIStore.getState().setActiveMentorPlantId(null)}
                />
            </Suspense>
        )
    }

    const handleSetTab = (id: KnowledgeViewTab) => {
        startTransition(() => {
            useUIStore.getState().setKnowledgeViewTab(id)
        })
    }

    const renderContent = () => {
        switch (activeTab) {
            case KnowledgeViewTab.Mentor:
                return <MentorView />
            case KnowledgeViewTab.Guide:
                return <GuideView />
            case KnowledgeViewTab.Archive:
                return <ArchiveView />
            case KnowledgeViewTab.Breeding:
                return <BreedingView />
            case KnowledgeViewTab.Sandbox:
                return <SandboxView />
            case KnowledgeViewTab.GrowTech:
                return <GrowTechView />
            default:
                return <MentorView />
        }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6 animate-fade-in">
                {viewIcons[activeTab]}
                <h2 className="text-3xl font-bold font-display text-slate-100 mt-2">
                    {viewTitles[activeTab]}
                </h2>
            </div>

            <KnowledgeSubNav activeTab={activeTab} onTabChange={handleSetTab} />

            <section className={`transition-opacity duration-300 ${contentOpacityClass}`}>
                <Card>
                    <Suspense fallback={<SkeletonLoader count={5} />}>{renderContent()}</Suspense>
                </Card>
            </section>
        </div>
    )
}

export default KnowledgeView
