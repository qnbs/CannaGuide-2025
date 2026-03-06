import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import * as d3 from 'd3';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import {
    selectGenealogyState,
} from '@/stores/selectors';
import {
    fetchAndBuildGenealogy,
    setSelectedGenealogyStrain,
    setGenealogyZoom,
    setGenealogyLayout,
    toggleGenealogyNode,
    resetGenealogyCache,
    resetGenealogy,
    isGenealogyStateCorrupt,
} from '@/stores/slices/genealogySlice';
import { Strain, GenealogyNode } from '@/types';
import { StrainTreeNode } from './StrainTreeNode';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { Select } from '@/components/ui/form';
import { geneticsService } from '@/services/geneticsService';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { Modal } from '@/components/common/Modal';
import { StrainCompactItem } from './StrainCompactItem';
import { GENEALOGY_NODE_SIZE, GENEALOGY_NODE_SEPARATION } from '@/constants';


interface GenealogyViewProps {
    allStrains: Strain[];
    onNodeClick: (strain: Strain) => void;
}

// ---------------------------------------------------------------------------
// Error-Fallback – wird angezeigt, wenn ein lokaler Fehler aufgetreten ist.
// ---------------------------------------------------------------------------
const GenealogyError: React.FC<{ message: string; onReset: () => void }> = ({ message, onReset }) => {
    const { t } = useTranslation();
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
    );
};

// ---------------------------------------------------------------------------
// GenealogyLink – rechtwinklige Verbindungslinien zwischen Knoten.
// Vollständig in try/catch – bei jeglichem Fehler wird null gerendert.
// ---------------------------------------------------------------------------
const GenealogyLink = React.memo<{
    link: d3.HierarchyLink<GenealogyNode>;
    orientation: 'horizontal' | 'vertical';
}>(({ link, orientation }) => {
    let pathData = '';
    try {
        const source = link?.source as d3.HierarchyPointNode<GenealogyNode> | undefined;
        const target = link?.target as d3.HierarchyPointNode<GenealogyNode> | undefined;
        if (
            source?.x == null || source?.y == null ||
            target?.x == null || target?.y == null ||
            !isFinite(source.x) || !isFinite(source.y) ||
            !isFinite(target.x) || !isFinite(target.y)
        ) {
            return null;
        }
        if (orientation === 'horizontal') {
            const midY = source.y + (target.y - source.y) / 2;
            pathData = `M${source.y},${source.x} L${midY},${source.x} L${midY},${target.x} L${target.y},${target.x}`;
        } else {
            const midY = source.y + (target.y - source.y) / 2;
            pathData = `M${source.x},${source.y} L${source.x},${midY} L${target.x},${midY} L${target.x},${target.y}`;
        }
    } catch {
        return null;
    }
    if (!pathData) return null;
    return <path className="genealogy-link" d={pathData} />;
});
GenealogyLink.displayName = 'GenealogyLink';

// ---------------------------------------------------------------------------
// AnalysisPanel – genetische Beiträge + Nachfahren-Button.
// ---------------------------------------------------------------------------
const AnalysisPanel = React.memo<{ tree: GenealogyNode | null; onShowDescendants: () => void }>(
    ({ tree, onShowDescendants }) => {
        const { t } = useTranslation();

        const [contributions, setContributions] = useState<
            { name: string; contribution: number }[]
        >([]);

        useEffect(() => {
            if (!tree) {
                setContributions([]);
                return;
            }
            try {
                const result = geneticsService.calculateGeneticContribution(tree);
                setContributions(Array.isArray(result) ? result.slice(0, 5) : []);
            } catch (err) {
                console.error('[AnalysisPanel] calculateGeneticContribution error:', err);
                setContributions([]);
            }
        }, [tree]);

        return (
            <Card className="!p-3">
                <h4 className="font-bold text-slate-200 mb-2">
                    {t('strainsView.genealogyView.geneticInfluence')}
                </h4>
                <ul className="space-y-1 text-sm">
                    {contributions.map((c, idx) => (
                        <li key={`contrib-${c?.name ?? idx}`} className="flex justify-between items-center">
                            <span className="text-slate-300 truncate" title={c?.name ?? ''}>
                                {c?.name ?? '—'}
                            </span>
                            <span className="font-mono text-primary-300 flex-shrink-0 ml-2">
                                {typeof c?.contribution === 'number' ? c.contribution.toFixed(1) : '0.0'}%
                            </span>
                        </li>
                    ))}
                </ul>
                <Button variant="secondary" size="sm" className="w-full mt-4" onClick={onShowDescendants}>
                    {t('strainsView.genealogyView.showDescendants')}
                </Button>
            </Card>
        );
    },
);
AnalysisPanel.displayName = 'GenealogyAnalysisPanel';

// ---------------------------------------------------------------------------
// GenealogyView – Hauptkomponente (extrem bulletproof)
//
// Design-Prinzipien:
//   1. KEIN synchroner d3-Aufruf im Render-Pfad.
//      d3.hierarchy + d3.tree laufen in useEffect → State (layoutNodes/layoutLinks).
//   2. JEDER potenziell fehlerhafter Block ist in try/catch gewrappt.
//      Bei Fehler → setLocalError → nur Error-Fallback-UI.
//   3. Optional chaining (.?) an JEDER Stelle wo Daten aus State kommen.
//   4. key-Prop auf JEDEM map() und conditional Render.
//   5. Debug-Logging am Mount für Diagnose.
// ---------------------------------------------------------------------------
export const GenealogyView = React.memo<GenealogyViewProps>(({ allStrains, onNodeClick }) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const genealogyState = useAppSelector(selectGenealogyState);

    // ── Debug: State beim Mount loggen ────────────────────────────────
    useEffect(() => {
        try {
            console.debug(
                '[GenealogyView] mount – genealogyState:',
                JSON.stringify(genealogyState, null, 2),
            );
        } catch {
            console.debug('[GenealogyView] mount – genealogyState could not be serialized');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Defensive Destructuring ──────────────────────────────────────
    const computedTrees = useMemo(() => genealogyState?.computedTrees ?? {}, [genealogyState?.computedTrees]);
    const status = genealogyState?.status ?? 'idle';
    const selectedStrainId = genealogyState?.selectedStrainId ?? null;
    const zoomTransform = genealogyState?.zoomTransform ?? null;
    const layoutOrientation = genealogyState?.layoutOrientation ?? 'horizontal';

    // ── Lokaler State ────────────────────────────────────────────────
    const [localError, setLocalError] = useState<string | null>(null);
    const [wasReset, setWasReset] = useState(false);
    const [dataReady, setDataReady] = useState(false);
    const [descendants, setDescendants] = useState<{
        children: Strain[];
        grandchildren: Strain[];
    } | null>(null);

    // d3-Layout-Ergebnisse: werden async in useEffect berechnet, NIE im Render
    const [layoutNodes, setLayoutNodes] = useState<d3.HierarchyPointNode<GenealogyNode>[]>([]);
    const [layoutLinks, setLayoutLinks] = useState<d3.HierarchyLink<GenealogyNode>[]>([]);

    // Refs
    const svgRef = useRef<SVGSVGElement>(null);
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
    const zoomTransformRef = useRef(zoomTransform);
    zoomTransformRef.current = zoomTransform;

    // ── Mount-Check: Datenbereitschaft ───────────────────────────────
    useEffect(() => {
        try {
            if (Array.isArray(allStrains) && allStrains.length > 0) {
                setDataReady(true);
            }
        } catch {
            setDataReady(false);
        }
    }, [allStrains]);

    // ── Mount-Check: korrupten persisted State zurücksetzen ──────────
    useEffect(() => {
        try {
            if (isGenealogyStateCorrupt(genealogyState)) {
                console.warn('[GenealogyView] Corrupt persisted state detected on mount – resetting.');
                dispatch(resetGenealogy());
                setWasReset(true);
            }
        } catch (err) {
            console.error('[GenealogyView] Corruption check itself failed:', err);
            try {
                dispatch(resetGenealogy());
            } catch { /* letzte Rettung fehlgeschlagen */ }
            setWasReset(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch]);

    // ── Tree aus computedTrees ableiten (sicher) ─────────────────────
    const tree = useMemo(() => {
        try {
            if (!selectedStrainId) return null;
            const cached = computedTrees?.[selectedStrainId];
            return cached ?? null;
        } catch (err) {
            console.error('[GenealogyView] tree derivation error:', err);
            return null;
        }
    }, [computedTrees, selectedStrainId]);

    // ── Tree laden wenn nicht gecacht ─────────────────────────────────
    useEffect(() => {
        if (!selectedStrainId || !dataReady) return;
        try {
            if (computedTrees?.[selectedStrainId] === undefined) {
                dispatch(fetchAndBuildGenealogy({ strainId: selectedStrainId, allStrains }));
            }
        } catch (err) {
            console.error('[GenealogyView] fetchAndBuildGenealogy dispatch error:', err);
            setLocalError(t('strainsView.genealogyView.errorLoadingTree'));
        }
    }, [selectedStrainId, allStrains, dataReady, computedTrees, dispatch, t]);

    // ── d3-Layout-Berechnung in useEffect (NICHT im Render) ──────────
    useEffect(() => {
        if (!tree) {
            setLayoutNodes([]);
            setLayoutLinks([]);
            return;
        }
        try {
            const root = d3.hierarchy(tree, (d) => d?.children);
            const treeLayout = d3.tree<GenealogyNode>().nodeSize(
                layoutOrientation === 'horizontal'
                    ? [
                          GENEALOGY_NODE_SIZE.height + GENEALOGY_NODE_SEPARATION.y,
                          GENEALOGY_NODE_SIZE.width + GENEALOGY_NODE_SEPARATION.x,
                      ]
                    : [
                          GENEALOGY_NODE_SIZE.width + GENEALOGY_NODE_SEPARATION.x,
                          GENEALOGY_NODE_SIZE.height + GENEALOGY_NODE_SEPARATION.y,
                      ],
            );
            treeLayout(root);
            setLayoutNodes(root.descendants() as d3.HierarchyPointNode<GenealogyNode>[]);
            setLayoutLinks(root.links());
        } catch (err) {
            console.error('[GenealogyView] d3 hierarchy/tree layout error:', err);
            setLocalError(t('strainsView.genealogyView.errorCalculatingTree'));
            setLayoutNodes([]);
            setLayoutLinks([]);
        }
    }, [tree, layoutOrientation, t]);

    // ── Handler (alle in try/catch) ──────────────────────────────────
    const handleNodeClick = useCallback(
        (nodeData: GenealogyNode) => {
            try {
                const strain = allStrains?.find((s) => s?.id === nodeData?.id);
                if (strain) onNodeClick(strain);
            } catch (err) {
                console.error('[GenealogyView] handleNodeClick error:', err);
            }
        },
        [allStrains, onNodeClick],
    );

    const handleNodeFocus = useCallback(
        (nodeData: GenealogyNode) => {
            if (!svgRef.current || !zoomRef.current) return;
            try {
                const target = layoutNodes?.find((n) => n?.data?.id === nodeData?.id);
                if (!target) return;
                const { width, height } = svgRef.current.getBoundingClientRect();
                const isHorizontal = layoutOrientation === 'horizontal';
                const nodeX = isHorizontal ? (target?.y ?? 0) : (target?.x ?? 0);
                const nodeY = isHorizontal ? (target?.x ?? 0) : (target?.y ?? 0);
                if (!isFinite(nodeX) || !isFinite(nodeY)) return;
                const currentK = d3.zoomTransform(svgRef.current).k;
                const scale = Math.max(isFinite(currentK) ? currentK : 1, 0.8);
                const tx = width / 2 - nodeX * scale;
                const ty = height / 2 - nodeY * scale;
                d3.select(svgRef.current)
                    .transition()
                    .duration(600)
                    .ease(d3.easeCubicInOut)
                    .call(
                        zoomRef.current.transform,
                        d3.zoomIdentity.translate(tx, ty).scale(scale),
                    );
            } catch (err) {
                console.error('[GenealogyView] handleNodeFocus error:', err);
            }
        },
        [layoutNodes, layoutOrientation],
    );

    const handleToggle = useCallback(
        (nodeId: string) => {
            try {
                if (selectedStrainId && typeof nodeId === 'string') {
                    dispatch(toggleGenealogyNode({ strainId: selectedStrainId, nodeId }));
                }
            } catch (err) {
                console.error('[GenealogyView] handleToggle error:', err);
            }
        },
        [dispatch, selectedStrainId],
    );

    const handleSelectChange = useCallback(
        (e: { target: { value: string | number } }) => {
            try {
                dispatch(
                    setSelectedGenealogyStrain(
                        e?.target?.value ? String(e.target.value) : null,
                    ),
                );
            } catch (err) {
                console.error('[GenealogyView] handleSelectChange error:', err);
            }
        },
        [dispatch],
    );

    const handleShowDescendants = useCallback(() => {
        if (!selectedStrainId) return;
        try {
            const data = geneticsService.findDescendants(selectedStrainId, allStrains ?? []);
            setDescendants(data ?? null);
        } catch (err) {
            console.error('[GenealogyView] findDescendants error:', err);
        }
    }, [selectedStrainId, allStrains]);

    const handleDescendantClick = useCallback(
        (strain: Strain) => {
            try {
                setDescendants(null);
                onNodeClick(strain);
            } catch (err) {
                console.error('[GenealogyView] handleDescendantClick error:', err);
            }
        },
        [onNodeClick],
    );

    const handleResetError = useCallback(() => {
        try {
            setLocalError(null);
            dispatch(resetGenealogy());
            setWasReset(true);
        } catch {
            // Letzte Rettung – zumindest Error-State aufräumen
            setLocalError(null);
        }
    }, [dispatch]);

    const sortedStrains = useMemo(() => {
        try {
            if (!Array.isArray(allStrains)) return [];
            return [...allStrains].sort((a, b) =>
                (a?.name ?? '').localeCompare(b?.name ?? ''),
            );
        } catch {
            return [];
        }
    }, [allStrains]);

    // ── Zoom-Setup (useEffect) ───────────────────────────────────────
    useEffect(() => {
        const svgEl = svgRef.current;
        if (!svgEl) return;

        let zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown>;

        try {
            const svg = d3.select(svgEl);
            const g = svg.select<SVGGElement>('g.genealogy-content');

            zoomBehavior = d3
                .zoom<SVGSVGElement, unknown>()
                .scaleExtent([0.1, 2])
                .on('zoom', (event) => {
                    try {
                        if (!g.empty()) {
                            g.attr('transform', event?.transform?.toString?.() ?? '');
                        }
                    } catch {
                        // Veraltete Selektion – ignorieren
                    }
                })
                .on('end', (event) => {
                    try {
                        if (event?.sourceEvent) {
                            const tr = event?.transform;
                            if (
                                tr &&
                                typeof tr.k === 'number' &&
                                isFinite(tr.k) &&
                                typeof tr.x === 'number' &&
                                isFinite(tr.x) &&
                                typeof tr.y === 'number' &&
                                isFinite(tr.y)
                            ) {
                                dispatch(setGenealogyZoom({ k: tr.k, x: tr.x, y: tr.y }));
                            }
                        }
                    } catch {
                        // Dispatch-Fehler darf den Zoom nicht crashen
                    }
                });

            svg.call(zoomBehavior);
            zoomRef.current = zoomBehavior;

            const savedTransform = zoomTransformRef.current;
            if (savedTransform === null) {
                const { width, height } = svgEl.getBoundingClientRect();
                const [ix, iy] =
                    layoutOrientation === 'horizontal'
                        ? [width * 0.1, height / 2]
                        : [width / 2, height * 0.1];
                svg.transition()
                    .duration(750)
                    .call(
                        zoomBehavior.transform,
                        d3.zoomIdentity.translate(ix, iy),
                    );
            } else {
                svg.call(
                    zoomBehavior.transform,
                    d3.zoomIdentity
                        .translate(savedTransform.x, savedTransform.y)
                        .scale(savedTransform.k),
                );
            }
        } catch (err) {
            console.error('[GenealogyView] d3 zoom setup error:', err);
            setLocalError(t('strainsView.genealogyView.errorInitZoom'));
        }

        return () => {
            try {
                if (svgEl) d3.select(svgEl).on('.zoom', null);
            } catch {
                // Cleanup-Fehler abfangen
            }
            zoomRef.current = null;
        };
    }, [dispatch, tree, layoutOrientation, t]);

    const handleResetZoom = useCallback(() => {
        if (!svgRef.current || !zoomRef.current) return;
        try {
            const { width, height } = svgRef.current.getBoundingClientRect();
            const [ix, iy] =
                layoutOrientation === 'horizontal'
                    ? [width * 0.1, height / 2]
                    : [width / 2, height * 0.1];
            d3.select(svgRef.current)
                .transition()
                .duration(750)
                .call(
                    zoomRef.current.transform,
                    d3.zoomIdentity.translate(ix, iy),
                );
        } catch (err) {
            console.error('[GenealogyView] handleResetZoom error:', err);
        }
    }, [layoutOrientation]);

    // ── Sichere Render-Helfer ────────────────────────────────────────
    const renderLinks = (): React.ReactNode => {
        try {
            if (!Array.isArray(layoutLinks) || layoutLinks.length === 0) return null;
            return layoutLinks.map((link, i) => {
                try {
                    return (
                        <GenealogyLink
                            key={`link-${link?.source?.data?.id ?? 'src'}-${link?.target?.data?.id ?? 'tgt'}-${i}`}
                            link={link}
                            orientation={layoutOrientation}
                        />
                    );
                } catch {
                    return null;
                }
            });
        } catch (err) {
            console.error('[GenealogyView] renderLinks error:', err);
            return null;
        }
    };

    const renderNodes = (): React.ReactNode => {
        try {
            if (!Array.isArray(layoutNodes) || layoutNodes.length === 0) return null;
            return layoutNodes.map((node, idx) => {
                try {
                    if (!node?.data) return null;
                    const isHorizontal = layoutOrientation === 'horizontal';
                    const x = isHorizontal ? (node?.y ?? 0) : (node?.x ?? 0);
                    const y = isHorizontal ? (node?.x ?? 0) : (node?.y ?? 0);
                    if (!isFinite(x) || !isFinite(y)) return null;
                    return (
                        <g
                            key={`node-${node?.data?.id ?? 'unknown'}-${node?.depth ?? 0}-${idx}`}
                            transform={`translate(${x}, ${y})`}
                            style={{ transition: 'transform 0.4s ease-in-out' }}
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
                    );
                } catch {
                    return null;
                }
            });
        } catch (err) {
            console.error('[GenealogyView] renderNodes error:', err);
            return null;
        }
    };

    // ── RENDER ────────────────────────────────────────────────────────
    // Priorität 1: Lokaler Fehler → nur Error-Fallback zeigen
    if (localError) {
        return <GenealogyError message={localError} onReset={handleResetError} />;
    }

    // Priorität 2: Daten noch nicht bereit
    if (!dataReady) {
        return (
            <Card key="data-loading" className="text-center py-10 text-slate-400">
                <SkeletonLoader count={3} />
                <p className="mt-4">{t('strainsView.genealogyView.dataLoading')}</p>
            </Card>
        );
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
                                    {descendants?.children?.map((strain) => (
                                        <StrainCompactItem
                                            key={`child-${strain?.id ?? 'unknown'}`}
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
                                    {descendants?.grandchildren?.map((strain) => (
                                        <StrainCompactItem
                                            key={`grandchild-${strain?.id ?? 'unknown'}`}
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
                        <Button
                            variant="secondary"
                            onClick={() => {
                                try {
                                    dispatch(
                                        setGenealogyLayout(
                                            layoutOrientation === 'horizontal'
                                                ? 'vertical'
                                                : 'horizontal',
                                        ),
                                    );
                                } catch (err) {
                                    console.error('[GenealogyView] layout toggle error:', err);
                                }
                            }}
                        >
                            <PhosphorIcons.TreeStructure />{' '}
                            {t('strainsView.genealogyView.toggleLayout')}
                        </Button>
                        <Button
                            variant="danger"
                            size="sm"
                            title={t('strainsView.genealogyView.resetCache')}
                            onClick={() => {
                                try {
                                    dispatch(resetGenealogyCache());
                                } catch (err) {
                                    console.error('[GenealogyView] resetGenealogyCache error:', err);
                                }
                            }}
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
                    <Button
                        variant="danger"
                        size="sm"
                        className="mt-4"
                        onClick={handleResetError}
                    >
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
                        <Card className="!p-0 h-[60vh] overflow-hidden bg-slate-900/50">
                            <svg ref={svgRef} className="w-full h-full cursor-move">
                                <g className="genealogy-content">
                                    {renderLinks()}
                                    {renderNodes()}
                                </g>
                            </svg>
                        </Card>
                    </div>
                    <div className="lg:col-span-1 space-y-4">
                        <AnalysisPanel tree={tree} onShowDescendants={handleShowDescendants} />
                    </div>
                </div>
            )}
        </div>
    );
});
GenealogyView.displayName = 'GenealogyView';

export default GenealogyView;
