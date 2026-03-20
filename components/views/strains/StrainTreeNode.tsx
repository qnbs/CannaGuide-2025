import React, { memo, useCallback } from 'react'
import { type GenealogyNode, StrainType } from '@/types'
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { useTranslation } from 'react-i18next'

/** Minimal node shape accepted by StrainTreeNode – compatible with both
 *  d3 HierarchyNode and the plain GenealogyLayoutNode from the worker. */
interface TreeNodeLike {
    data: GenealogyNode
    depth?: number
    x?: number
    y?: number
}

interface StrainTreeNodeProps {
    node: TreeNodeLike
    onNodeClick: (nodeData: GenealogyNode) => void
    onNodeFocus: (nodeData: GenealogyNode) => void
    onToggle: (nodeId: string) => void
}

const typeInfo: Record<StrainType, { icon: React.ReactNode; color: string; accent: string }> = {
    [StrainType.Sativa]: {
        icon: <SativaIcon className="w-full h-full" />,
        color: 'text-amber-400',
        accent: 'genealogy-accent-sativa',
    },
    [StrainType.Indica]: {
        icon: <IndicaIcon className="w-full h-full" />,
        color: 'text-indigo-400',
        accent: 'genealogy-accent-indica',
    },
    [StrainType.Hybrid]: {
        icon: <HybridIcon className="w-full h-full" />,
        color: 'text-blue-400',
        accent: 'genealogy-accent-hybrid',
    },
}

export const StrainTreeNode: React.FC<StrainTreeNodeProps> = memo(
    ({ node, onNodeClick, onNodeFocus, onToggle }) => {
        const { t } = useTranslation()
        const { data } = node
        const isExpandable = !!data._children && data._children.length > 0
        const isCollapsible = !!data.children && data.children.length > 0
        const isPlaceholder = data.isPlaceholder
        const safeType =
            data.type === StrainType.Sativa ||
            data.type === StrainType.Indica ||
            data.type === StrainType.Hybrid
                ? data.type
                : StrainType.Hybrid
        const { icon, color, accent } = typeInfo[safeType] || typeInfo.Hybrid
        const safeName =
            typeof data.name === 'string' && data.name.trim() !== '' ? data.name : 'Unknown Strain'
        const safeThc = typeof data.thc === 'number' && Number.isFinite(data.thc) ? data.thc : 0
        const thcPercentage = Math.min(100, (safeThc / 35) * 100)

        const handleFocusClick = () => {
            if (!isPlaceholder) onNodeFocus(data)
        }

        const handleDetailClick = (e: React.MouseEvent) => {
            e.stopPropagation()
            if (!isPlaceholder) onNodeClick(data)
        }

        const handleKeyDown = useCallback(
            (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    if (!isPlaceholder) onNodeFocus(data)
                }
            },
            [data, isPlaceholder, onNodeFocus],
        )

        try {
            return (
                <div
                    className={`genealogy-node-container ${isPlaceholder ? 'placeholder' : ''}`}
                    onClick={handleFocusClick}
                    onKeyDown={handleKeyDown}
                    role="treeitem"
                    tabIndex={0}
                    aria-label={t('common.accessibility.genealogyTreeNode', {
                        name: safeName,
                        type: safeType,
                        thc: safeThc.toFixed(1),
                    })}
                    aria-expanded={isExpandable || isCollapsible ? isCollapsible : undefined}
                >
                    {/* Left accent stripe – color coded by strain type */}
                    <div className={`genealogy-node-accent ${accent}`} />

                    <div className="genealogy-node-body">
                        {/* Row 1: Type icon + Strain name + Info button */}
                        <div className="flex items-center gap-1.5">
                            <div className={`w-4 h-4 flex-shrink-0 ${color}`}>{icon}</div>
                            <span
                                className="font-bold text-sm leading-tight text-slate-100 truncate flex-1 min-w-0"
                                title={safeName}
                            >
                                {safeName}
                            </span>
                            {!isPlaceholder && (
                                <button
                                    type="button"
                                    className="flex-shrink-0 p-0.5 rounded text-slate-500 hover:text-primary-300 hover:bg-slate-700/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                                    onClick={handleDetailClick}
                                    aria-label={
                                        t('common.accessibility.openStrainDetails') +
                                        ': ' +
                                        safeName
                                    }
                                    title={t('common.accessibility.openStrainDetails')}
                                >
                                    <PhosphorIcons.Info className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Row 2: Type label + Landrace badge + THC percentage */}
                        <div className="flex items-center gap-1.5 text-[11px] leading-tight text-slate-400 mt-0.5">
                            <span>{safeType}</span>
                            {data.isLandrace && (
                                <span
                                    className="inline-flex items-center rounded px-1 py-px bg-green-900/40 text-green-400 text-[10px] font-semibold leading-none"
                                    title={t('strainsView.landraceStrain')}
                                >
                                    Landrace
                                </span>
                            )}
                            {!isPlaceholder && (
                                <span className="ml-auto font-mono text-[11px] text-primary-300 tabular-nums">
                                    {safeThc.toFixed(1)}%
                                </span>
                            )}
                        </div>

                        {/* Row 3: THC progress bar (own row, full width) */}
                        {!isPlaceholder && (
                            <div
                                className="genealogy-node-thc-bar"
                                title={`THC: ${safeThc.toFixed(1)}%`}
                            >
                                <div
                                    className="genealogy-node-thc-fill"
                                    style={{ width: `${thcPercentage}%` }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Expand / Collapse toggle */}
                    {(isExpandable || isCollapsible) && (
                        <button
                            type="button"
                            className="genealogy-node-expand-btn focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                            onClick={(e) => {
                                e.stopPropagation()
                                onToggle(data.id)
                            }}
                            aria-label={
                                isCollapsible
                                    ? t('common.accessibility.collapseAncestors', {
                                          name: safeName,
                                      })
                                    : t('common.accessibility.expandAncestors', { name: safeName })
                            }
                        >
                            {isCollapsible ? (
                                <PhosphorIcons.Minus className="w-3 h-3" />
                            ) : (
                                <PhosphorIcons.Plus className="w-3 h-3" />
                            )}
                        </button>
                    )}
                </div>
            )
        } catch {
            return (
                <div className="text-red-400 text-xs p-1">
                    {t('strainsView.genealogyView.nodeError')}
                </div>
            )
        }
    },
)
StrainTreeNode.displayName = 'StrainTreeNode'
