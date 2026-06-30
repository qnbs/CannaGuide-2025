import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { type GenealogyNode, StrainType } from '@/types'
import { GENEALOGY_NODE_SIZE } from '@/constants'
import { Card } from '@/components/common/Card'
import { StrainTreeNode } from '../StrainTreeNode'
import { getNodeGroupClass, layoutPosition, type HighlightMode } from '../genealogyViewUtils'
import { GenealogyLink, type GenealogyLayoutLink, type GenealogyLayoutNode } from './genealogyParts'

const MAX_RENDERED_NODES = 500

interface GenealogyTreeProps {
    svgRef: React.RefObject<SVGSVGElement | null>
    layoutNodes: GenealogyLayoutNode[]
    layoutLinks: GenealogyLayoutLink[]
    layoutOrientation: 'horizontal' | 'vertical'
    highlightMode: HighlightMode
    onNodeClick: (nodeData: GenealogyNode) => void
    onNodeFocus: (nodeData: GenealogyNode) => void
    onToggle: (nodeId: string) => void
}

export const GenealogyTree: React.FC<GenealogyTreeProps> = ({
    svgRef,
    layoutNodes,
    layoutLinks,
    layoutOrientation,
    highlightMode,
    onNodeClick,
    onNodeFocus,
    onToggle,
}) => {
    const { t } = useTranslation()

    const isTruncated = layoutNodes.length > MAX_RENDERED_NODES
    const visibleNodes = isTruncated ? layoutNodes.slice(0, MAX_RENDERED_NODES) : layoutNodes
    const visibleNodeIds = isTruncated ? new Set(visibleNodes.map((n) => n?.data?.id)) : null

    const nodeMatchesHighlight = useCallback(
        (nodeData: GenealogyNode): boolean => {
            if (highlightMode === 'none') return true
            if (highlightMode === 'landraces') return !!nodeData.isLandrace
            if (highlightMode === 'sativa') return nodeData.type === StrainType.Sativa
            if (highlightMode === 'indica') return nodeData.type === StrainType.Indica
            return true
        },
        [highlightMode],
    )

    const renderLinks = (): React.ReactNode => {
        try {
            if (!Array.isArray(layoutLinks) || layoutLinks.length === 0) return null
            return layoutLinks
                .filter((link) => {
                    if (!visibleNodeIds) return true
                    const source = layoutNodes[link.sourceIndex]
                    const target = layoutNodes[link.targetIndex]
                    return (
                        !!source &&
                        !!target &&
                        visibleNodeIds.has(source?.data?.id) &&
                        visibleNodeIds.has(target?.data?.id)
                    )
                })
                .map((link, i) => {
                    try {
                        const source = layoutNodes[link.sourceIndex]
                        const target = layoutNodes[link.targetIndex]
                        if (!source || !target) return null
                        const isDimmed =
                            highlightMode !== 'none' &&
                            (!nodeMatchesHighlight(source.data) ||
                                !nodeMatchesHighlight(target.data))
                        return (
                            <g
                                key={`link-${source?.data?.id ?? 'src'}-${target?.data?.id ?? 'tgt'}-${i}`}
                                style={
                                    isDimmed
                                        ? { opacity: 0.12, transition: 'opacity 0.3s' }
                                        : { transition: 'opacity 0.3s' }
                                }
                            >
                                <GenealogyLink
                                    source={source}
                                    target={target}
                                    orientation={layoutOrientation}
                                />
                            </g>
                        )
                    } catch {
                        return null
                    }
                })
        } catch (err) {
            console.debug('[GenealogyTree] renderLinks error:', err)
            return null
        }
    }

    const renderNodes = (): React.ReactNode => {
        try {
            if (!Array.isArray(visibleNodes) || visibleNodes.length === 0) return null
            return visibleNodes.map((node, idx) => {
                try {
                    if (!node?.data) return null
                    const { x, y } = layoutPosition(layoutOrientation, node?.x, node?.y)
                    if (!Number.isFinite(x) || !Number.isFinite(y)) return null
                    const matches = nodeMatchesHighlight(node.data)
                    return (
                        <g
                            key={`node-${node?.data?.id ?? 'unknown'}-${node?.depth ?? 0}-${idx}`}
                            transform={`translate(${x}, ${y})`}
                            className={getNodeGroupClass(highlightMode, matches)}
                            style={{ transition: 'transform 0.4s ease-in-out, opacity 0.3s ease' }}
                        >
                            <foreignObject
                                x={-GENEALOGY_NODE_SIZE.width / 2}
                                y={-GENEALOGY_NODE_SIZE.height / 2}
                                width={GENEALOGY_NODE_SIZE.width}
                                height={GENEALOGY_NODE_SIZE.height}
                            >
                                <StrainTreeNode
                                    node={node}
                                    onNodeClick={onNodeClick}
                                    onNodeFocus={onNodeFocus}
                                    onToggle={onToggle}
                                />
                            </foreignObject>
                        </g>
                    )
                } catch {
                    return null
                }
            })
        } catch (err) {
            console.debug('[GenealogyTree] renderNodes error:', err)
            return null
        }
    }

    return (
        <div className="lg:col-span-3">
            <Card className="!p-0 h-[60vh] overflow-hidden bg-slate-900/50 relative">
                {isTruncated && (
                    <div className="absolute top-2 left-2 z-10 bg-amber-900/80 text-amber-200 text-xs px-2 py-1 rounded">
                        {t('strainsView.genealogyView.treeTruncated', {
                            shown: MAX_RENDERED_NODES,
                            total: layoutNodes.length,
                        })}
                    </div>
                )}
                <svg
                    ref={svgRef}
                    className="w-full h-full cursor-move"
                    aria-label={t('common.accessibility.genealogyTree')}
                >
                    <title>{t('common.accessibility.genealogyTree')}</title>
                    <g className="genealogy-content">
                        {renderLinks()}
                        {renderNodes()}
                    </g>
                </svg>
            </Card>
        </div>
    )
}
