// ---------------------------------------------------------------------------
// RelatedKnowledgePanel -- Cross-module knowledge link suggestions
//
// Renders related knowledge items from the Knowledge Graph, enabling
// direct navigation to Lexikon, Disease Atlas, Learning Paths, etc.
// Used in DetailedPlantView, DiseaseAtlasView, and other contexts.
// ---------------------------------------------------------------------------

import React, { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useKnowledgeGraph } from '@/hooks/useKnowledgeGraph'
import type { CrossModuleLink, GraphNodeType } from '@/services/knowledgeGraphService'
import { useUIStore } from '@/stores/useUIStore'
import { View, KnowledgeViewTab, type PlantStage } from '@/types'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { cn } from '@/lib/utils'

// -- Icon mapping for node types -------------------------------------------

const NODE_TYPE_ICON_MAP: Record<GraphNodeType, React.FC<{ className?: string }>> = {
    disease: PhosphorIcons.FirstAidKit,
    lexicon: PhosphorIcons.Book,
    learningPath: PhosphorIcons.GraduationCap,
    calculator: PhosphorIcons.Calculator,
    nutrient: PhosphorIcons.Flask,
    terpene: PhosphorIcons.Leafy,
    stage: PhosphorIcons.ChartLineUp,
    strain: PhosphorIcons.Plant,
    guide: PhosphorIcons.BookOpenText,
    plant: PhosphorIcons.Plant,
    journal: PhosphorIcons.FileText,
}

// -- Navigation target resolution ------------------------------------------

function resolveNavTarget(link: CrossModuleLink): {
    view: View
    tab?: KnowledgeViewTab
} {
    switch (link.nodeType) {
        case 'disease':
            return { view: View.Knowledge, tab: KnowledgeViewTab.Atlas }
        case 'lexicon':
            return { view: View.Knowledge, tab: KnowledgeViewTab.Lexikon }
        case 'learningPath':
            return { view: View.Knowledge, tab: KnowledgeViewTab.Lernpfad }
        case 'calculator':
            return { view: View.Knowledge, tab: KnowledgeViewTab.Rechner }
        case 'guide':
            return { view: View.Knowledge, tab: KnowledgeViewTab.Guide }
        case 'strain':
            return { view: View.Strains }
        default:
            return { view: View.Knowledge }
    }
}

// -- Props -----------------------------------------------------------------

interface RelatedKnowledgePanelProps {
    /** Plant ID to scope related knowledge */
    readonly plantId?: string
    /** Current growth stage for stage-relevant links */
    readonly currentStage?: PlantStage
    /** Maximum links to show */
    readonly maxResults?: number
    /** Additional CSS classes */
    readonly className?: string
    /** Compact mode (fewer items, smaller text) */
    readonly compact?: boolean
}

// -- Component -------------------------------------------------------------

export const RelatedKnowledgePanel: React.FC<RelatedKnowledgePanelProps> = memo(
    ({ plantId, currentStage, maxResults = 6, className, compact = false }) => {
        const { t } = useTranslation()
        const { relatedLinks, isReady } = useKnowledgeGraph(plantId, currentStage, maxResults)
        const setActiveView = useUIStore((s) => s.setActiveView)
        const setKnowledgeViewTab = useUIStore((s) => s.setKnowledgeViewTab)

        const handleNavigate = useCallback(
            (link: CrossModuleLink) => {
                const target = resolveNavTarget(link)
                setActiveView(target.view)
                if (target.tab !== undefined) {
                    setKnowledgeViewTab(target.tab)
                }
            },
            [setActiveView, setKnowledgeViewTab],
        )

        if (!isReady || relatedLinks.length === 0) {
            return null
        }

        return (
            <div
                className={cn(
                    'rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm',
                    compact ? 'p-3' : 'p-4',
                    className,
                )}
            >
                <h3
                    className={cn(
                        'mb-3 font-semibold text-white/90',
                        compact ? 'text-sm' : 'text-base',
                    )}
                >
                    {t('analytics.relatedKnowledge', 'Related Knowledge')}
                </h3>
                <ul className="space-y-1.5">
                    {relatedLinks.map((link) => (
                        <li key={link.id}>
                            <button
                                type="button"
                                onClick={() => handleNavigate(link)}
                                className={cn(
                                    'flex w-full items-center gap-2 rounded-lg px-3 py-2',
                                    'text-left text-white/80 transition-colors',
                                    'hover:bg-white/10 hover:text-white',
                                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                                    compact ? 'text-xs' : 'text-sm',
                                )}
                            >
                                <span className="shrink-0" aria-hidden="true">
                                    {React.createElement(
                                        NODE_TYPE_ICON_MAP[link.nodeType] ??
                                            PhosphorIcons.BookOpenText,
                                        { className: 'h-4 w-4' },
                                    )}
                                </span>
                                <span className="min-w-0 flex-1 truncate">{link.label}</span>
                                <span className="shrink-0 text-xs text-white/40">
                                    {Math.round(link.relevanceScore * 100)}%
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        )
    },
)

RelatedKnowledgePanel.displayName = 'RelatedKnowledgePanel'
