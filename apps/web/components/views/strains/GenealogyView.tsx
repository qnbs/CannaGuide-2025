import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import * as d3 from 'd3'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { selectGenealogyState } from '@/stores/selectors'
import {
    fetchAndBuildGenealogy,
    setSelectedGenealogyStrain,
    setGenealogyZoom,
    setGenealogyLayout,
    toggleGenealogyNode,
    resetGenealogyCache,
    resetGenealogy,
    isGenealogyStateCorrupt,
} from '@/stores/slices/genealogySlice'
import { type Strain, type GenealogyNode, StrainType } from '@/types'
import { StrainTreeNode } from './StrainTreeNode'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { Select } from '@/components/ui/form'
import { geneticsService } from '@/services/geneticsService'
import { SkeletonLoader } from '@/components/common/SkeletonLoader'
import { Modal } from '@/components/common/Modal'
import { StrainCompactItem } from './StrainCompactItem'
import { GENEALOGY_NODE_SIZE } from '@/constants'
import { compareText } from './compareText'
import {
    getNextLayoutOrientation,
    getNodeGroupClass,
    toSelectedStrainId,
    type HighlightMode,
} from './genealogyViewUtils'
import { workerBus } from '@/services/workerBus'

interface GenealogyLayoutNode {
    data: GenealogyNode
    depth: number
    x: number
    y: number
}

interface GenealogyLayoutLink {
    sourceIndex: number
    targetIndex: number
}

interface GenealogyViewProps {
    allStrains: Strain[]
    onNodeClick: (strain: Strain) => void
}

// ---------------------------------------------------------------------------
// Error-Fallback – wird angezeigt, wenn ein lokaler Fehler aufgetreten ist.
// ---------------------------------------------------------------------------
const GenealogyError: React.FC<{ message: string; onReset: () => void }> = ({
    message,
    onReset,
}) => {
    const { t } = useTranslation()
    return (
        <Card className="text-center py-10">
            <PhosphorIcons.WarningCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
            <p className="text-red-300 font-semibold">{message}</p>
            <p className="text-slate-400 text-sm mt-2">
                {t('strainsView.genealogyView.pleaseReloadOrContact')}
            </p>
            <Button variant="danger" size="sm" className="mt-4" onClick={onReset}>
                <PhosphorIcons.ArrowClockwise className="mr-1" /> {t('common.resetState')}
            </Button>
        </Card>
    )
}

// ---------------------------------------------------------------------------
// GenealogyLink – smooth cubic-bézier curves between node edges.
// ---------------------------------------------------------------------------
const HALF_W = GENEALOGY_NODE_SIZE.width / 2
const HALF_H = GENEALOGY_NODE_SIZE.height / 2

const GenealogyLink = React.memo<{
    source: GenealogyLayoutNode
    target: GenealogyLayoutNode
    orientation: 'horizontal' | 'vertical'
}>(({ source, target, orientation }) => {
    let pathData = ''
    try {
        if (
            source?.x == null ||
            source?.y == null ||
            target?.x == null ||
            target?.y == null ||
            !Number.isFinite(source.x) ||
            !Number.isFinite(source.y) ||
            !Number.isFinite(target.x) ||
            !Number.isFinite(target.y)
        ) {
            return null
        }
        if (orientation === 'horizontal') {
            const sx = source.y + HALF_W
            const sy = source.x
            const tx = target.y - HALF_W
            const ty = target.x
            const mx = (sx + tx) / 2
            pathData = `M${sx},${sy} C${mx},${sy} ${mx},${ty} ${tx},${ty}`
        } else {
            const sx = source.x
            const sy = source.y + HALF_H
            const tx = target.x
            const ty = target.y - HALF_H
            const my = (sy + ty) / 2
            pathData = `M${sx},${sy} C${sx},${my} ${tx},${my} ${tx},${ty}`
        }
    } catch {
        return null
    }
    if (!pathData) return null
    return <path className="genealogy-link" d={pathData} />
})
GenealogyLink.displayName = 'GenealogyLink'

// ---------------------------------------------------------------------------
// AnalysisPanel – genetische Beiträge, Lineage-Filter + Nachfahren-Button.
// ---------------------------------------------------------------------------

const AnalysisPanel = React.memo<{
    tree: GenealogyNode | null
    onShowDescendants: () => void
    highlightMode: HighlightMode
    onHighlightModeChange: (mode: HighlightMode) => void
}>(({ tree, onShowDescendants, highlightMode, onHighlightModeChange }) => {
    const { t } = useTranslation()

    const [contributions, setContributions] = useState<{ name: string; contribution: number }[]>([])

    useEffect(() => {
        if (!tree) {
            setContributions([])
            return
        }
        const workerName = `genealogy-contributions-${crypto.randomUUID()}`
        workerBus.register(
            workerName,
            new Worker(new URL('../../../workers/genealogy.worker.ts', import.meta.url), {
                type: 'module',
            }),
        )

        let cancelled = false
        workerBus
            .dispatch<{ contributions: { name: string; contribution: number }[] }>(
                workerName,
                'CONTRIBUTIONS',
                { tree },
            )
            .then((data) => {
                if (!cancelled) {
                    setContributions(
                        Array.isArray(data.contributions) ? data.contributions.slice(0, 5) : [],
                    )
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    console.debug('[AnalysisPanel] worker error:', err)
                    setContributions([])
                }
            })
            .finally(() => workerBus.unregister(workerName))

        return () => {
            cancelled = true
            workerBus.unregister(workerName)
        }
    }, [tree])

    const toggleMode = (mode: HighlightMode) => {
        onHighlightModeChange(highlightMode === mode ? 'none' : mode)
    }

    const highlightOptions: Array<{
        mode: Exclude<HighlightMode, 'none'>
        activeClass: string
        Icon: React.ComponentType<{ className?: string }>
        label: string
    }> = [
        {
            mode: 'landraces',
            activeClass: 'bg-green-900/50 text-green-300 ring-1 ring-green-500/40',
            Icon: PhosphorIcons.Leafy,
            label: t('strainsView.genealogyView.highlightLandraces'),
        },
        {
            mode: 'sativa',
            activeClass: 'bg-amber-900/50 text-amber-300 ring-1 ring-amber-500/40',
            Icon: PhosphorIcons.Sun,
            label: t('strainsView.genealogyView.traceSativa'),
        },
        {
            mode: 'indica',
            activeClass: 'bg-indigo-900/50 text-indigo-300 ring-1 ring-indigo-500/40',
            Icon: PhosphorIcons.Star,
            label: t('strainsView.genealogyView.traceIndica'),
        },
    ]

    return (
        <div className="space-y-4">
            {/* Analysis Tools */}
            <Card className="!p-3">
                <h4 className="font-bold text-slate-200 mb-3 text-sm uppercase tracking-wider">
                    {t('strainsView.genealogyView.analysisTools')}
                </h4>
                <div className="space-y-1.5">
                    {highlightOptions.map(({ mode, activeClass, Icon, label }) => {
                        const isActive = highlightMode === mode
                        const buttonClass = isActive
                            ? activeClass
                            : 'text-slate-300 hover:bg-slate-700/50'

                        return (
                            <button
                                key={mode}
                                type="button"
                                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${buttonClass}`}
                                onClick={() => toggleMode(mode)}
                            >
                                <Icon className="w-4 h-4 inline-block mr-2 -mt-0.5" />
                                {label}
                            </button>
                        )
                    })}
                    {highlightMode !== 'none' && (
                        <button
                            type="button"
                            className="w-full text-left px-3 py-1.5 rounded-md text-xs text-slate-500 hover:text-slate-300 transition-colors"
                            onClick={() => onHighlightModeChange('none')}
                        >
                            <PhosphorIcons.X className="w-3 h-3 inline-block mr-1 -mt-0.5" />
                            {t('strainsView.genealogyView.clearHighlight')}
                        </button>
                    )}
                </div>
            </Card>

            {/* Genetic Influence */}
            <Card className="!p-3">
                <h4 className="font-bold text-slate-200 mb-2 text-sm uppercase tracking-wider">
                    {t('strainsView.genealogyView.geneticInfluence')}
                </h4>
                {contributions.length > 0 ? (
                    <ul className="space-y-1.5 text-sm">
                        {contributions.map((c, idx) => (
                            <li
                                key={`contrib-${c?.name ?? idx}`}
                                className="flex justify-between items-center gap-2"
                            >
                                <span className="text-slate-300 truncate" title={c?.name ?? ''}>
                                    {c?.name ?? '—'}
                                </span>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary-500 rounded-full"
                                            style={{
                                                width: `${Math.min(100, c?.contribution ?? 0)}%`,
                                            }}
                                        />
                                    </div>
                                    <span className="font-mono text-primary-300 text-xs w-12 text-right tabular-nums">
                                        {typeof c?.contribution === 'number'
                                            ? c.contribution.toFixed(1)
                                            : '0.0'}
                                        %
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-slate-500 text-xs">
                        {t('strainsView.genealogyView.noStrainSelected')}
                    </p>
                )}
            </Card>

            {/* Descendants */}
            <Button variant="secondary" size="sm" className="w-full" onClick={onShowDescendants}>
                <PhosphorIcons.ShareNetwork className="w-4 h-4 mr-1.5" />
                {t('strainsView.genealogyView.showDescendants')}
            </Button>
        </div>
    )
})
AnalysisPanel.displayName = 'GenealogyAnalysisPanel'

// ---------------------------------------------------------------------------
// GenealogyView – Hauptkomponente (extrem bulletproof)
//
// Design-Prinzipien:
//   1. KEIN synchroner d3-Aufruf im Render-Pfad.
//      d3.hierarchy + d3.tree laufen in useEffect -> State (layoutNodes/layoutLinks).
//   2. JEDER potenziell fehlerhafter Block ist in try/catch gewrappt.
//      Bei Fehler -> setLocalError -> nur Error-Fallback-UI.
//   3. Optional chaining (.?) an JEDER Stelle wo Daten aus State kommen.
//   4. key-Prop auf JEDEM map() und conditional Render.
//   5. Debug-Logging am Mount für Diagnose.
// ---------------------------------------------------------------------------
export const GenealogyView = React.memo<GenealogyViewProps>(({ allStrains, onNodeClick }) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const genealogyState = useAppSelector(selectGenealogyState)
    const hasLoggedMountStateRef = useRef(false)

    // ── Debug: State beim Mount loggen ────────────────────────────────
    useEffect(() => {
        if (hasLoggedMountStateRef.current) {
            return
        }

        try {
            console.debug(
                '[GenealogyView] mount – genealogyState:',
                JSON.stringify(genealogyState, null, 2),
            )
        } catch {
            console.debug('[GenealogyView] mount – genealogyState could not be serialized')
        }
        hasLoggedMountStateRef.current = true
    }, [genealogyState])

    // ── Defensive Destructuring ──────────────────────────────────────
    const computedTrees = useMemo(
        () => genealogyState?.computedTrees ?? {},
        [genealogyState?.computedTrees],
    )
    const status = genealogyState?.status ?? 'idle'
    const selectedStrainId = genealogyState?.selectedStrainId ?? null
    const zoomTransform = genealogyState?.zoomTransform ?? null
    const layoutOrientation = genealogyState?.layoutOrientation ?? 'horizontal'

    // ── Lokaler State ────────────────────────────────────────────────
    const [localError, setLocalError] = useState<string | null>(null)
    const [wasReset, setWasReset] = useState(false)
    const [dataReady, setDataReady] = useState(false)
    const [descendants, setDescendants] = useState<{
        children: Strain[]
        grandchildren: Strain[]
    } | null>(null)
    const [highlightMode, setHighlightMode] = useState<HighlightMode>('none')

    // d3-Layout-Ergebnisse: werden im Worker berechnet, NIE im Render
    const [layoutNodes, setLayoutNodes] = useState<GenealogyLayoutNode[]>([])
    const [layoutLinks, setLayoutLinks] = useState<GenealogyLayoutLink[]>([])

    // Refs
    const svgRef = useRef<SVGSVGElement>(null)
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
    const zoomTransformRef = useRef(zoomTransform)
    zoomTransformRef.current = zoomTransform

    // ── Mount-Check: Datenbereitschaft ───────────────────────────────
    useEffect(() => {
        try {
            if (Array.isArray(allStrains) && allStrains.length > 0) {
                setDataReady(true)
            }
        } catch {
            setDataReady(false)
        }
    }, [allStrains])

    // ── Mount-Check: korrupten persisted State zurücksetzen ──────────
    // Only run on initial mount -- not on every state change, because
    // status='loading' is a valid runtime state but would be flagged
    // as corrupt if checked mid-flight (e.g. after navigation from
    // strain detail view).
    useEffect(() => {
        if (wasReset) {
            return
        }

        try {
            if (isGenealogyStateCorrupt(genealogyState)) {
                console.debug(
                    '[GenealogyView] Corrupt persisted state detected on mount – resetting.',
                )
                dispatch(resetGenealogy())
                setWasReset(true)
            }
        } catch (err) {
            console.debug('[GenealogyView] Corruption check itself failed:', err)
            try {
                dispatch(resetGenealogy())
            } catch {
                /* letzte Rettung fehlgeschlagen */
            }
            setWasReset(true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: only check on mount
    }, [])

    // ── Tree aus computedTrees ableiten (sicher) ─────────────────────
    const tree = useMemo(() => {
        try {
            if (!selectedStrainId) return null
            const cached = computedTrees?.[selectedStrainId]
            return cached ?? null
        } catch (err) {
            console.debug('[GenealogyView] tree derivation error:', err)
            return null
        }
    }, [computedTrees, selectedStrainId])

    // ── Tree laden wenn nicht gecacht ─────────────────────────────────
    useEffect(() => {
        if (!selectedStrainId || !dataReady) return
        try {
            if (computedTrees?.[selectedStrainId] === undefined) {
                dispatch(fetchAndBuildGenealogy({ strainId: selectedStrainId, allStrains }))
            }
        } catch (err) {
            console.debug('[GenealogyView] fetchAndBuildGenealogy dispatch error:', err)
            setLocalError(t('strainsView.genealogyView.errorLoadingTree'))
        }
    }, [selectedStrainId, allStrains, dataReady, computedTrees, dispatch, t])

    // ── d3-Layout-Berechnung im Worker (NICHT im Render) ──────────
    useEffect(() => {
        if (!tree) {
            setLayoutNodes([])
            setLayoutLinks([])
            return
        }
        const workerName = `genealogy-layout-${crypto.randomUUID()}`
        workerBus.register(
            workerName,
            new Worker(new URL('../../../workers/genealogy.worker.ts', import.meta.url), {
                type: 'module',
            }),
        )

        let cancelled = false
        workerBus
            .dispatch<{
                nodes: GenealogyLayoutNode[]
                links: GenealogyLayoutLink[]
            }>(workerName, 'LAYOUT', { tree, orientation: layoutOrientation })
            .then((data) => {
                if (!cancelled) {
                    setLayoutNodes(data.nodes)
                    setLayoutLinks(data.links)
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    console.debug('[GenealogyView] worker error:', err)
                    setLocalError(t('strainsView.genealogyView.errorCalculatingTree'))
                    setLayoutNodes([])
                    setLayoutLinks([])
                }
            })
            .finally(() => workerBus.unregister(workerName))

        return () => {
            cancelled = true
            workerBus.unregister(workerName)
        }
    }, [tree, layoutOrientation, t])

    // ── Handler (alle in try/catch) ──────────────────────────────────
    const handleNodeClick = useCallback(
        (nodeData: GenealogyNode) => {
            try {
                const strain = allStrains?.find((s) => s?.id === nodeData?.id)
                if (strain) onNodeClick(strain)
            } catch (err) {
                console.debug('[GenealogyView] handleNodeClick error:', err)
            }
        },
        [allStrains, onNodeClick],
    )

    const getLayoutPosition = useCallback(
        (x: number | undefined, y: number | undefined): { x: number; y: number } => {
            if (layoutOrientation === 'horizontal') {
                return { x: y ?? 0, y: x ?? 0 }
            }
            return { x: x ?? 0, y: y ?? 0 }
        },
        [layoutOrientation],
    )

    const getInitialZoomOffset = useCallback(
        (width: number, height: number): [number, number] => {
            if (layoutOrientation === 'horizontal') {
                return [width * 0.1, height / 2]
            }
            return [width / 2, height * 0.1]
        },
        [layoutOrientation],
    )

    const handleNodeFocus = useCallback(
        (nodeData: GenealogyNode) => {
            if (!svgRef.current || !zoomRef.current) return
            try {
                const target = layoutNodes?.find((n) => n?.data?.id === nodeData?.id)
                if (!target) return
                const { width, height } = svgRef.current.getBoundingClientRect()
                const { x: nodeX, y: nodeY } = getLayoutPosition(target?.x, target?.y)
                if (!Number.isFinite(nodeX) || !Number.isFinite(nodeY)) return
                const currentK = d3.zoomTransform(svgRef.current).k
                const scale = Math.max(Number.isFinite(currentK) ? currentK : 1, 0.8)
                const tx = width / 2 - nodeX * scale
                const ty = height / 2 - nodeY * scale
                d3.select(svgRef.current)
                    .transition()
                    .duration(600)
                    .ease(d3.easeCubicInOut)
                    .call(zoomRef.current.transform, d3.zoomIdentity.translate(tx, ty).scale(scale))
            } catch (err) {
                console.debug('[GenealogyView] handleNodeFocus error:', err)
            }
        },
        [getLayoutPosition, layoutNodes],
    )

    const handleToggle = useCallback(
        (nodeId: string) => {
            try {
                if (selectedStrainId && typeof nodeId === 'string') {
                    dispatch(toggleGenealogyNode({ strainId: selectedStrainId, nodeId }))
                }
            } catch (err) {
                console.debug('[GenealogyView] handleToggle error:', err)
            }
        },
        [dispatch, selectedStrainId],
    )

    const handleSelectChange = useCallback(
        (e: { target: { value: string | number } }) => {
            try {
                const selectedValue = toSelectedStrainId(e?.target?.value)
                dispatch(setSelectedGenealogyStrain(selectedValue))
            } catch (err) {
                console.debug('[GenealogyView] handleSelectChange error:', err)
            }
        },
        [dispatch],
    )

    const handleToggleLayout = useCallback(() => {
        try {
            dispatch(setGenealogyLayout(getNextLayoutOrientation(layoutOrientation)))
        } catch (err) {
            console.debug('[GenealogyView] layout toggle error:', err)
        }
    }, [dispatch, layoutOrientation])

    const handleResetGenealogyCache = useCallback(() => {
        try {
            dispatch(resetGenealogyCache())
        } catch (err) {
            console.debug('[GenealogyView] resetGenealogyCache error:', err)
        }
    }, [dispatch])

    const handleShowDescendants = useCallback(() => {
        if (!selectedStrainId) return
        try {
            const data = geneticsService.findDescendants(selectedStrainId, allStrains ?? [])
            setDescendants(data ?? null)
        } catch (err) {
            console.debug('[GenealogyView] findDescendants error:', err)
        }
    }, [selectedStrainId, allStrains])

    const handleDescendantClick = useCallback(
        (strain: Strain) => {
            try {
                setDescendants(null)
                onNodeClick(strain)
            } catch (err) {
                console.debug('[GenealogyView] handleDescendantClick error:', err)
            }
        },
        [onNodeClick],
    )

    const handleResetError = useCallback(() => {
        try {
            setLocalError(null)
            dispatch(resetGenealogy())
            setWasReset(true)
        } catch {
            // Letzte Rettung – zumindest Error-State aufräumen
            setLocalError(null)
        }
    }, [dispatch])

    const sortedStrains = useMemo(() => {
        try {
            if (!Array.isArray(allStrains)) return []
            return allStrains.toSorted((a, b) => compareText(a?.name, b?.name))
        } catch {
            return []
        }
    }, [allStrains])

    // ── Zoom-Setup (useEffect) ───────────────────────────────────────
    useEffect(() => {
        const svgEl = svgRef.current
        if (!svgEl) return

        let zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown>

        try {
            const svg = d3.select(svgEl)
            const g = svg.select<SVGGElement>('g.genealogy-content')

            zoomBehavior = d3
                .zoom<SVGSVGElement, unknown>()
                .scaleExtent([0.1, 2])
                .on('zoom', (event) => {
                    try {
                        if (!g.empty()) {
                            g.attr('transform', event?.transform?.toString?.() ?? '')
                        }
                    } catch {
                        // Veraltete Selektion – ignorieren
                    }
                })
                .on('end', (event) => {
                    try {
                        if (event?.sourceEvent) {
                            const tr = event?.transform
                            if (
                                tr &&
                                typeof tr.k === 'number' &&
                                Number.isFinite(tr.k) &&
                                typeof tr.x === 'number' &&
                                Number.isFinite(tr.x) &&
                                typeof tr.y === 'number' &&
                                Number.isFinite(tr.y)
                            ) {
                                dispatch(setGenealogyZoom({ k: tr.k, x: tr.x, y: tr.y }))
                            }
                        }
                    } catch {
                        // Dispatch-Fehler darf den Zoom nicht crashen
                    }
                })

            svg.call(zoomBehavior)
            zoomRef.current = zoomBehavior

            const savedTransform = zoomTransformRef.current
            if (savedTransform === null) {
                const { width, height } = svgEl.getBoundingClientRect()
                const [ix, iy] = getInitialZoomOffset(width, height)
                svg.transition()
                    .duration(750)
                    .call(zoomBehavior.transform, d3.zoomIdentity.translate(ix, iy))
            } else if (
                Number.isFinite(savedTransform.k) &&
                Number.isFinite(savedTransform.x) &&
                Number.isFinite(savedTransform.y) &&
                savedTransform.k > 0
            ) {
                svg.call(
                    zoomBehavior.transform,
                    d3.zoomIdentity
                        .translate(savedTransform.x, savedTransform.y)
                        .scale(savedTransform.k),
                )
            } else {
                const { width, height } = svgEl.getBoundingClientRect()
                const [ix, iy] = getInitialZoomOffset(width, height)
                svg.transition()
                    .duration(750)
                    .call(zoomBehavior.transform, d3.zoomIdentity.translate(ix, iy))
            }
        } catch (err) {
            console.debug('[GenealogyView] d3 zoom setup error:', err)
            setLocalError(t('strainsView.genealogyView.errorInitZoom'))
        }

        // ── ResizeObserver: re-center bei Container-Resize (nur ohne gespeicherten Zoom)
        let resizeObserver: ResizeObserver | undefined
        try {
            let resizeRafId = 0
            resizeObserver = new ResizeObserver(() => {
                cancelAnimationFrame(resizeRafId)
                resizeRafId = requestAnimationFrame(() => {
                    try {
                        if (!svgEl || !zoomRef.current || zoomTransformRef.current !== null) return
                        const { width, height } = svgEl.getBoundingClientRect()
                        if (width === 0 || height === 0) return
                        const [ix, iy] = getInitialZoomOffset(width, height)
                        const zoom = zoomRef.current
                        if (!zoom) return
                        d3.select(svgEl)
                            .transition()
                            .duration(300)
                            .call(zoom.transform, d3.zoomIdentity.translate(ix, iy))
                    } catch {
                        // ResizeObserver-Callback-Fehler ignorieren
                    }
                })
            })
            resizeObserver.observe(svgEl)
        } catch {
            // ResizeObserver nicht verfügbar
        }

        return () => {
            try {
                resizeObserver?.disconnect()
            } catch {
                /* ResizeObserver cleanup */
            }
            try {
                if (svgEl) d3.select(svgEl).on('.zoom', null)
            } catch {
                // Cleanup-Fehler abfangen
            }
            zoomRef.current = null
        }
    }, [dispatch, getInitialZoomOffset, tree, t])

    const handleResetZoom = useCallback(() => {
        if (!svgRef.current || !zoomRef.current) return
        try {
            const { width, height } = svgRef.current.getBoundingClientRect()
            const [ix, iy] = getInitialZoomOffset(width, height)
            d3.select(svgRef.current)
                .transition()
                .duration(750)
                .call(zoomRef.current.transform, d3.zoomIdentity.translate(ix, iy))
        } catch (err) {
            console.debug('[GenealogyView] handleResetZoom error:', err)
        }
    }, [getInitialZoomOffset])

    // ── Sichere Render-Helfer ────────────────────────────────────────
    const MAX_RENDERED_NODES = 500
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
            console.debug('[GenealogyView] renderLinks error:', err)
            return null
        }
    }

    const renderNodes = (): React.ReactNode => {
        try {
            if (!Array.isArray(visibleNodes) || visibleNodes.length === 0) return null
            return visibleNodes.map((node, idx) => {
                try {
                    if (!node?.data) return null
                    const { x, y } = getLayoutPosition(node?.x, node?.y)
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
                                    onNodeClick={handleNodeClick}
                                    onNodeFocus={handleNodeFocus}
                                    onToggle={handleToggle}
                                />
                            </foreignObject>
                        </g>
                    )
                } catch {
                    return null
                }
            })
        } catch (err) {
            console.debug('[GenealogyView] renderNodes error:', err)
            return null
        }
    }

    // ── RENDER ────────────────────────────────────────────────────────
    // Priorität 1: Lokaler Fehler -> nur Error-Fallback zeigen
    if (localError) {
        return <GenealogyError message={localError} onReset={handleResetError} />
    }

    // Priorität 2: Daten noch nicht bereit
    if (!dataReady) {
        return (
            <Card key="data-loading" className="text-center py-10 text-slate-400">
                <SkeletonLoader count={3} />
                <p className="mt-4">{t('strainsView.genealogyView.dataLoading')}</p>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {/* ── Fallback-Banner: State wurde automatisch zurückgesetzt ── */}
            {wasReset && (
                <Card key="reset-banner" className="!bg-amber-900/30 border border-amber-600/40">
                    <div className="flex items-center gap-3">
                        <PhosphorIcons.WarningCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                        <div className="flex-grow">
                            <p className="text-amber-200 text-sm font-semibold">
                                {t('strainsView.genealogyView.stateAutoReset')}
                            </p>
                            <p className="text-amber-300/70 text-xs mt-0.5">
                                {t('strainsView.genealogyView.stateCorrupted')}
                            </p>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => setWasReset(false)}>
                            OK
                        </Button>
                    </div>
                </Card>
            )}

            {/* ── Nachfahren-Modal ─────────────────────────────────── */}
            {descendants && selectedStrainId && (
                <Modal
                    key="descendants-modal"
                    isOpen={!!descendants}
                    onClose={() => setDescendants(null)}
                    title={`${t('strainsView.genealogyView.knownDescendants', {
                        name: computedTrees?.[selectedStrainId]?.name ?? '',
                    })}`}
                    size="lg"
                >
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {(descendants?.children?.length ?? 0) > 0 && (
                            <div key="children-section">
                                <h3 className="font-bold text-lg text-primary-300 mb-2">
                                    {t('strainsView.genealogyView.children')}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {descendants?.children
                                        ?.filter((strain): strain is Strain => !!strain)
                                        .map((strain) => (
                                            <StrainCompactItem
                                                key={`child-${strain.id}`}
                                                strain={strain}
                                                onClick={() => handleDescendantClick(strain)}
                                            />
                                        ))}
                                </div>
                            </div>
                        )}
                        {(descendants?.grandchildren?.length ?? 0) > 0 && (
                            <div key="grandchildren-section">
                                <h3 className="font-bold text-lg text-primary-300 mb-2 mt-4">
                                    {t('strainsView.genealogyView.grandchildren')}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {descendants?.grandchildren
                                        ?.filter((strain): strain is Strain => !!strain)
                                        .map((strain) => (
                                            <StrainCompactItem
                                                key={`grandchild-${strain.id}`}
                                                strain={strain}
                                                onClick={() => handleDescendantClick(strain)}
                                            />
                                        ))}
                                </div>
                            </div>
                        )}
                        {(descendants?.children?.length ?? 0) === 0 &&
                            (descendants?.grandchildren?.length ?? 0) === 0 && (
                                <p key="no-descendants" className="text-slate-400 text-center py-8">
                                    {t('strainsView.genealogyView.noDescendantsFound')}
                                </p>
                            )}
                    </div>
                </Modal>
            )}

            {/* ── Steuerleiste ─────────────────────────────────────── */}
            <Card key="controls" className="relative z-10">
                <h3 className="text-xl font-bold font-display text-primary-400">
                    {t('strainsView.genealogyView.title')}
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                    {t('strainsView.genealogyView.description')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <Select
                        className="flex-grow"
                        value={selectedStrainId ?? ''}
                        onChange={handleSelectChange}
                        options={[
                            { value: '', label: t('strainsView.genealogyView.selectStrain') },
                            ...sortedStrains.map((s) => ({
                                value: s?.id ?? '',
                                label: s?.name ?? '',
                            })),
                        ]}
                    />
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" onClick={handleResetZoom}>
                            <PhosphorIcons.ArrowClockwise />{' '}
                            {t('strainsView.genealogyView.resetView')}
                        </Button>
                        <Button variant="secondary" onClick={handleToggleLayout}>
                            <PhosphorIcons.TreeStructure />{' '}
                            {t('strainsView.genealogyView.toggleLayout')}
                        </Button>
                        <Button
                            variant="danger"
                            size="sm"
                            title={t('strainsView.genealogyView.resetCache')}
                            onClick={handleResetGenealogyCache}
                        >
                            <PhosphorIcons.TrashSimple />
                        </Button>
                    </div>
                </div>
            </Card>

            {/* ── Loading ──────────────────────────────────────────── */}
            {status === 'loading' && (
                <Card key="loading-state">
                    <SkeletonLoader count={3} />
                </Card>
            )}

            {/* ── Failed ───────────────────────────────────────────── */}
            {status === 'failed' && (
                <Card key="failed-state" className="text-center py-10 text-red-400">
                    <PhosphorIcons.TreeStructure className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-semibold">{t('common.error')}</p>
                    <p className="text-sm text-slate-400 mt-1">
                        {t('strainsView.genealogyView.noStrainSelected')}
                    </p>
                    <Button variant="danger" size="sm" className="mt-4" onClick={handleResetError}>
                        <PhosphorIcons.ArrowClockwise className="mr-1" /> {t('common.resetState')}
                    </Button>
                </Card>
            )}

            {/* ── Kein Strain ausgewählt ───────────────────────────── */}
            {status !== 'loading' && !selectedStrainId && (
                <Card key="no-selection" className="text-center py-10 text-slate-500">
                    <PhosphorIcons.TreeStructure className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                    <p>{t('strainsView.genealogyView.noStrainSelected')}</p>
                </Card>
            )}

            {/* ── Strain gewählt aber kein Baum ────────────────────── */}
            {status === 'succeeded' && selectedStrainId && !tree && (
                <Card key="tree-null" className="text-center py-10 text-slate-400">
                    <PhosphorIcons.TreeStructure className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t('strainsView.genealogyView.noStrainSelected')}</p>
                </Card>
            )}

            {/* ── Baum rendern ─────────────────────────────────────── */}
            {status !== 'loading' && selectedStrainId && tree && (
                <div
                    key={`tree-${selectedStrainId}`}
                    className="grid grid-cols-1 lg:grid-cols-4 gap-4"
                >
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
                    <div className="lg:col-span-1 space-y-4">
                        <AnalysisPanel
                            tree={tree}
                            onShowDescendants={handleShowDescendants}
                            highlightMode={highlightMode}
                            onHighlightModeChange={setHighlightMode}
                        />
                    </div>
                </div>
            )}
        </div>
    )
})
GenealogyView.displayName = 'GenealogyView'

export default GenealogyView
