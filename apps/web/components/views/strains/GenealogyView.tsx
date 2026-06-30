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
import { type Strain, type GenealogyNode } from '@/types'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { Select } from '@/components/ui/form'
import { geneticsService } from '@/services/geneticsService'
import { SkeletonLoader } from '@/components/common/SkeletonLoader'
import { compareText } from './compareText'
import {
    getNextLayoutOrientation,
    layoutPosition,
    toSelectedStrainId,
    type HighlightMode,
} from './genealogyViewUtils'
import { workerBus } from '@/services/workerBus'
import {
    GenealogyError,
    type GenealogyLayoutLink,
    type GenealogyLayoutNode,
} from './genealogy/genealogyParts'
import { AnalysisPanel } from './genealogy/AnalysisPanel'
import { DescendantsModal } from './genealogy/DescendantsModal'
import { GenealogyTree } from './genealogy/GenealogyTree'

interface GenealogyViewProps {
    allStrains: Strain[]
    onNodeClick: (strain: Strain) => void
}

// ---------------------------------------------------------------------------
// GenealogyView – orchestrates state, d3 zoom + worker layout, and delegates
// rendering to GenealogyTree / AnalysisPanel / DescendantsModal.
//
// Design principles:
//   1. NO synchronous d3 call in the render path (layout runs in a worker).
//   2. Every fault-prone block is wrapped in try/catch -> Error fallback UI.
//   3. Optional chaining on all state-derived data.
// ---------------------------------------------------------------------------
export const GenealogyView = React.memo<GenealogyViewProps>(({ allStrains, onNodeClick }) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const genealogyState = useAppSelector(selectGenealogyState)
    const hasLoggedMountStateRef = useRef(false)

    // ── Debug: log state on mount ────────────────────────────────────
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

    // ── Defensive destructuring ──────────────────────────────────────
    const computedTrees = useMemo(
        () => genealogyState?.computedTrees ?? {},
        [genealogyState?.computedTrees],
    )
    const status = genealogyState?.status ?? 'idle'
    const selectedStrainId = genealogyState?.selectedStrainId ?? null
    const zoomTransform = genealogyState?.zoomTransform ?? null
    const layoutOrientation = genealogyState?.layoutOrientation ?? 'horizontal'

    // ── Local state ──────────────────────────────────────────────────
    const [localError, setLocalError] = useState<string | null>(null)
    const [wasReset, setWasReset] = useState(false)
    const [dataReady, setDataReady] = useState(false)
    const [descendants, setDescendants] = useState<{
        children: Strain[]
        grandchildren: Strain[]
    } | null>(null)
    const [highlightMode, setHighlightMode] = useState<HighlightMode>('none')

    // d3 layout results: computed in a worker, NEVER in render
    const [layoutNodes, setLayoutNodes] = useState<GenealogyLayoutNode[]>([])
    const [layoutLinks, setLayoutLinks] = useState<GenealogyLayoutLink[]>([])

    // Refs
    const svgRef = useRef<SVGSVGElement>(null)
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
    const zoomTransformRef = useRef(zoomTransform)
    zoomTransformRef.current = zoomTransform

    // ── Mount check: data readiness ──────────────────────────────────
    useEffect(() => {
        try {
            if (Array.isArray(allStrains) && allStrains.length > 0) {
                setDataReady(true)
            }
        } catch {
            setDataReady(false)
        }
    }, [allStrains])

    // ── Mount check: reset corrupt persisted state ───────────────────
    // Only run on initial mount -- not on every state change, because
    // status='loading' is a valid runtime state but would be flagged
    // as corrupt if checked mid-flight.
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
                /* last resort failed */
            }
            setWasReset(true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: only check on mount
    }, [])

    // ── Derive tree from computedTrees (safe) ────────────────────────
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

    // ── Load tree when not cached ────────────────────────────────────
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

    // ── d3 layout computation in worker (NOT in render) ──────────────
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

    // ── Handlers (all in try/catch) ──────────────────────────────────
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
                const { x: nodeX, y: nodeY } = layoutPosition(
                    layoutOrientation,
                    target?.x,
                    target?.y,
                )
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
        [layoutOrientation, layoutNodes],
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
            // Last resort – at least clear the error state
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

    // ── Zoom setup (useEffect) ───────────────────────────────────────
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
                        // Stale selection – ignore
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
                        // Dispatch error must not crash the zoom
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

        // ── ResizeObserver: re-center on container resize (only without saved zoom)
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
                        // ResizeObserver callback error – ignore
                    }
                })
            })
            resizeObserver.observe(svgEl)
        } catch {
            // ResizeObserver unavailable
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
                // Cleanup error – swallow
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

    // ── RENDER ────────────────────────────────────────────────────────
    // Priority 1: local error -> show only the error fallback
    if (localError) {
        return <GenealogyError message={localError} onReset={handleResetError} />
    }

    // Priority 2: data not ready yet
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
            {/* ── Fallback banner: state was auto-reset ── */}
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

            {/* ── Descendants modal ── */}
            {descendants && selectedStrainId && (
                <DescendantsModal
                    descendants={descendants}
                    name={computedTrees?.[selectedStrainId]?.name ?? ''}
                    onClose={() => setDescendants(null)}
                    onDescendantClick={handleDescendantClick}
                />
            )}

            {/* ── Control bar ── */}
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
                            size="icon"
                            title={t('strainsView.genealogyView.resetCache')}
                            aria-label={t('strainsView.genealogyView.resetCache')}
                            onClick={handleResetGenealogyCache}
                        >
                            <PhosphorIcons.TrashSimple />
                        </Button>
                    </div>
                </div>
            </Card>

            {/* ── Loading ── */}
            {status === 'loading' && (
                <Card key="loading-state">
                    <SkeletonLoader count={3} />
                </Card>
            )}

            {/* ── Failed ── */}
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

            {/* ── No strain selected ── */}
            {status !== 'loading' && !selectedStrainId && (
                <Card key="no-selection" className="text-center py-10 text-slate-500">
                    <PhosphorIcons.TreeStructure className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                    <p>{t('strainsView.genealogyView.noStrainSelected')}</p>
                </Card>
            )}

            {/* ── Strain selected but no tree ── */}
            {status === 'succeeded' && selectedStrainId && !tree && (
                <Card key="tree-null" className="text-center py-10 text-slate-400">
                    <PhosphorIcons.TreeStructure className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t('strainsView.genealogyView.noStrainSelected')}</p>
                </Card>
            )}

            {/* ── Render tree ── */}
            {status !== 'loading' && selectedStrainId && tree && (
                <div
                    key={`tree-${selectedStrainId}`}
                    className="grid grid-cols-1 lg:grid-cols-4 gap-4"
                >
                    <GenealogyTree
                        svgRef={svgRef}
                        layoutNodes={layoutNodes}
                        layoutLinks={layoutLinks}
                        layoutOrientation={layoutOrientation}
                        highlightMode={highlightMode}
                        onNodeClick={handleNodeClick}
                        onNodeFocus={handleNodeFocus}
                        onToggle={handleToggle}
                    />
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
