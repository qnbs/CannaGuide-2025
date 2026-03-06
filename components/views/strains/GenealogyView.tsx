import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
// Link – rendert rechtwinklige Verbindungslinien zwischen Knoten.
// React.memo verhindert Re-Renders, wenn sich link/orientation nicht ändern.
// ---------------------------------------------------------------------------
const GenealogyLink = React.memo<{
    link: d3.HierarchyLink<GenealogyNode>;
    orientation: 'horizontal' | 'vertical';
}>(({ link, orientation }) => {
    const pathData = useMemo(() => {
        try {
            const source = link.source as d3.HierarchyPointNode<GenealogyNode>;
            const target = link.target as d3.HierarchyPointNode<GenealogyNode>;
            // Abbruch bei fehlenden Koordinaten (z. B. degenerate tree)
            if (source.x == null || source.y == null || target.x == null || target.y == null) return '';

            if (orientation === 'horizontal') {
                const midY = source.y + (target.y - source.y) / 2;
                return `M${source.y},${source.x} L${midY},${source.x} L${midY},${target.x} L${target.y},${target.x}`;
            } else {
                const midY = source.y + (target.y - source.y) / 2;
                return `M${source.x},${source.y} L${source.x},${midY} L${target.x},${midY} L${target.x},${target.y}`;
            }
        } catch {
            // Koordinaten-Fehler dürfen niemals den Render-Zyklus unterbrechen
            return '';
        }
    }, [link, orientation]);

    return <path className="genealogy-link" d={pathData} />;
});
GenealogyLink.displayName = 'GenealogyLink';

// ---------------------------------------------------------------------------
// AnalysisPanel – zeigt genetische Beiträge und Nachfahren-Button.
// try/catch in useMemo verhindert, dass ein Service-Fehler die EB triggert.
// ---------------------------------------------------------------------------
const AnalysisPanel = React.memo<{ tree: GenealogyNode | null; onShowDescendants: () => void }>(
    ({ tree, onShowDescendants }) => {
        const { t } = useTranslation();
        const contributions = useMemo(() => {
            if (!tree) return [];
            try {
                return geneticsService.calculateGeneticContribution(tree).slice(0, 5);
            } catch (err) {
                // Service-Fehler graceful abfangen – kein throw in Render
                console.error('[GenealogyView] calculateGeneticContribution error:', err);
                return [];
            }
        }, [tree]);

        return (
            <Card className="!p-3">
                <h4 className="font-bold text-slate-200 mb-2">{t('strainsView.genealogyView.geneticInfluence')}</h4>
                <ul className="space-y-1 text-sm">
                    {contributions.map(c => (
                        <li key={c.name} className="flex justify-between items-center">
                            <span className="text-slate-300 truncate" title={c.name}>{c.name}</span>
                            <span className="font-mono text-primary-300 flex-shrink-0 ml-2">{c.contribution.toFixed(1)}%</span>
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
// GenealogyView – Hauptkomponente
// React.memo: Re-Render nur bei tatsächlichen Prop-Änderungen
// ---------------------------------------------------------------------------
export const GenealogyView = React.memo<GenealogyViewProps>(({ allStrains, onNodeClick }) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { computedTrees, status, selectedStrainId, zoomTransform, layoutOrientation } = useAppSelector(selectGenealogyState);
    const [descendants, setDescendants] = useState<{ children: Strain[]; grandchildren: Strain[] } | null>(null);

    // SVG-Ref: d3 liest den DOM-Knoten direkt – niemals als State speichern
    const svgRef = useRef<SVGSVGElement>(null);
    // zoomRef hält das aktive ZoomBehavior; wird im Cleanup auf null gesetzt
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
    // Letzten zoomTransform via Ref lesen, um den Zoom-Effect nicht neu auszulösen
    const zoomTransformRef = useRef(zoomTransform);
    zoomTransformRef.current = zoomTransform;

    const tree = useMemo(
        () => (selectedStrainId ? (computedTrees[selectedStrainId] ?? null) : null),
        [computedTrees, selectedStrainId],
    );

    // Baum laden – nur wenn der Key noch völlig fehlt (undefined ≠ null)
    useEffect(() => {
        if (selectedStrainId && computedTrees[selectedStrainId] === undefined) {
            dispatch(fetchAndBuildGenealogy({ strainId: selectedStrainId, allStrains }));
        }
    }, [selectedStrainId, allStrains, computedTrees, dispatch]);

    // d3.hierarchy + d3.tree im useMemo – try/catch absichern, damit ein
    // ungültiger Tree-Zustand nie die ErrorBoundary auslöst
    const { nodes, links } = useMemo<{
        nodes: d3.HierarchyNode<GenealogyNode>[];
        links: d3.HierarchyLink<GenealogyNode>[];
    }>(() => {
        if (!tree) return { nodes: [], links: [] };
        try {
            const root = d3.hierarchy(tree, d => d.children);
            const treeLayout = d3.tree<GenealogyNode>().nodeSize(
                layoutOrientation === 'horizontal'
                    ? [GENEALOGY_NODE_SIZE.height + GENEALOGY_NODE_SEPARATION.y, GENEALOGY_NODE_SIZE.width + GENEALOGY_NODE_SEPARATION.x]
                    : [GENEALOGY_NODE_SIZE.width + GENEALOGY_NODE_SEPARATION.x, GENEALOGY_NODE_SIZE.height + GENEALOGY_NODE_SEPARATION.y],
            );
            treeLayout(root);
            return { nodes: root.descendants(), links: root.links() };
        } catch (err) {
            // d3-Fehler (z. B. zirkulärer Node, ungültige Koordinaten) → leerer Baum
            console.error('[GenealogyView] d3 hierarchy/tree error:', err);
            return { nodes: [], links: [] };
        }
    }, [tree, layoutOrientation]);

    // ------------------------------------------------------------------
    // useCallback für alle Handler – verhindert unnötige Child-Re-Renders
    // ------------------------------------------------------------------
    const handleNodeClick = useCallback(
        (nodeData: GenealogyNode) => {
            const strain = allStrains.find(s => s.id === nodeData.id);
            if (strain) onNodeClick(strain);
        },
        [allStrains, onNodeClick],
    );

    const handleNodeFocus = useCallback(
        (nodeData: GenealogyNode) => {
            if (!svgRef.current || !zoomRef.current) return;
            const target = nodes.find(n => n.data.id === nodeData.id);
            if (!target) return;
            try {
                const { width, height } = svgRef.current.getBoundingClientRect();
                const isHorizontal = layoutOrientation === 'horizontal';
                const nodeX = isHorizontal
                    ? (target as d3.HierarchyPointNode<GenealogyNode>).y
                    : (target as d3.HierarchyPointNode<GenealogyNode>).x;
                const nodeY = isHorizontal
                    ? (target as d3.HierarchyPointNode<GenealogyNode>).x
                    : (target as d3.HierarchyPointNode<GenealogyNode>).y;
                const currentK = d3.zoomTransform(svgRef.current).k;
                const scale = Math.max(isFinite(currentK) ? currentK : 1, 0.8);
                const tx = width / 2 - nodeX * scale;
                const ty = height / 2 - nodeY * scale;
                d3.select(svgRef.current)
                    .transition()
                    .duration(600)
                    .ease(d3.easeCubicInOut)
                    .call(zoomRef.current.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
            } catch (err) {
                console.error('[GenealogyView] handleNodeFocus error:', err);
            }
        },
        [nodes, layoutOrientation],
    );

    const handleToggle = useCallback(
        (nodeId: string) => {
            if (selectedStrainId) {
                dispatch(toggleGenealogyNode({ strainId: selectedStrainId, nodeId }));
            }
        },
        [dispatch, selectedStrainId],
    );

    const handleSelectChange = useCallback(
        (e: { target: { value: string | number } }) => {
            dispatch(setSelectedGenealogyStrain(e.target.value ? String(e.target.value) : null));
        },
        [dispatch],
    );

    const handleShowDescendants = useCallback(() => {
        if (selectedStrainId) {
            try {
                const data = geneticsService.findDescendants(selectedStrainId, allStrains);
                setDescendants(data);
            } catch (err) {
                console.error('[GenealogyView] findDescendants error:', err);
            }
        }
    }, [selectedStrainId, allStrains]);

    const handleDescendantClick = useCallback(
        (strain: Strain) => {
            setDescendants(null);
            onNodeClick(strain);
        },
        [onNodeClick],
    );

    const sortedStrains = useMemo(
        () => [...allStrains].sort((a, b) => a.name.localeCompare(b.name)),
        [allStrains],
    );

    // ------------------------------------------------------------------
    // Zoom-Effect – vollständiges Cleanup auf jedem Exit:
    //   1. svg.on('.zoom', null)  → entfernt alle .zoom-Namespace-Listener
    //   2. zoomRef.current = null → verhindert veraltete Aufrufe im Handler
    // key={`tree-${selectedStrainId}`} auf dem SVG-Wrapper erzwingt
    // ein frisches Mount bei Strain-Wechsel (kein staler d3-State möglich).
    // ------------------------------------------------------------------
    useEffect(() => {
        const svgEl = svgRef.current;
        if (!svgEl) return; // SVG noch nicht gemountet oder bereits ausgehängt

        let zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown>;

        try {
            const svg = d3.select(svgEl);
            // g-Selektion HIER erzeugen, damit die Closure immer auf den
            // aktuell gemounteten DOM-Knoten verweist
            const g = svg.select<SVGGElement>('g.genealogy-content');

            zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
                .scaleExtent([0.1, 2])
                .on('zoom', (event) => {
                    try {
                        // Nur auf g.attr schreiben wenn die Selektion nicht leer ist
                        if (!g.empty()) {
                            g.attr('transform', event.transform.toString());
                        }
                    } catch {
                        // Veraltete Selektion – Zoom-Event einfach ignorieren
                    }
                })
                .on('end', (event) => {
                    try {
                        if (event.sourceEvent) {
                            const t = event.transform;
                            dispatch(setGenealogyZoom({ k: t.k, x: t.x, y: t.y }));
                        }
                    } catch {
                        // Dispatch-Fehler darf den Zoom niemals crashen
                    }
                });

            svg.call(zoomBehavior);
            zoomRef.current = zoomBehavior;

            // Initial-Transform via Ref lesen (Zoom-State ändert es, aber darf
            // diesen Effect nicht neu auslösen)
            const savedTransform = zoomTransformRef.current;
            if (savedTransform === null) {
                // Kein gespeicherter Zoom → auf den Baum zentrieren
                const { width, height } = svgEl.getBoundingClientRect();
                const [ix, iy] = layoutOrientation === 'horizontal'
                    ? [width * 0.1, height / 2]
                    : [width / 2, height * 0.1];
                svg.transition()
                    .duration(750)
                    .call(zoomBehavior.transform, d3.zoomIdentity.translate(ix, iy));
            } else {
                // Gespeicherten Zoom-Stand wiederherstellen
                svg.call(
                    zoomBehavior.transform,
                    d3.zoomIdentity.translate(savedTransform.x, savedTransform.y).scale(savedTransform.k),
                );
            }
        } catch (err) {
            console.error('[GenealogyView] d3 zoom setup error:', err);
        }

        // CLEANUP – wird vor jedem Re-Run und beim Unmount aufgerufen
        return () => {
            try {
                // 1. Alle .zoom-Namespace-Listener vom SVG-Element entfernen
                if (svgEl) {
                    d3.select(svgEl).on('.zoom', null);
                }
            } catch {
                // Kein Fehler nach oben weitergeben
            }
            // 2. ZoomBehavior-Ref nullen – verhindert Aufrufe auf veraltetes Behavior
            zoomRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch, tree, layoutOrientation]); // zoomTransform bewusst ausgelassen – wird via Ref gelesen

    const handleResetZoom = useCallback(() => {
        if (!svgRef.current || !zoomRef.current) return;
        try {
            const { width, height } = svgRef.current.getBoundingClientRect();
            const [ix, iy] = layoutOrientation === 'horizontal'
                ? [width * 0.1, height / 2]
                : [width / 2, height * 0.1];
            d3.select(svgRef.current)
                .transition()
                .duration(750)
                .call(zoomRef.current.transform, d3.zoomIdentity.translate(ix, iy));
        } catch (err) {
            console.error('[GenealogyView] handleResetZoom error:', err);
        }
    }, [layoutOrientation]);

    // ------------------------------------------------------------------
    // Render – kein throw erlaubt; alle Fehlerpfade geben Fallback-UI zurück
    // ------------------------------------------------------------------
    return (
        <div className="space-y-4">
            {descendants && selectedStrainId && (
                <Modal
                    isOpen={!!descendants}
                    onClose={() => setDescendants(null)}
                    title={`${t('strainsView.genealogyView.knownDescendants', { name: computedTrees[selectedStrainId]?.name ?? '' })}`}
                    size="lg"
                >
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {descendants.children.length > 0 && (
                            <div>
                                <h3 className="font-bold text-lg text-primary-300 mb-2">{t('strainsView.genealogyView.children')}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {descendants.children.map(strain => (
                                        <StrainCompactItem key={strain.id} strain={strain} onClick={() => handleDescendantClick(strain)} />
                                    ))}
                                </div>
                            </div>
                        )}
                        {descendants.grandchildren.length > 0 && (
                            <div>
                                <h3 className="font-bold text-lg text-primary-300 mb-2 mt-4">{t('strainsView.genealogyView.grandchildren')}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {descendants.grandchildren.map(strain => (
                                        <StrainCompactItem key={strain.id} strain={strain} onClick={() => handleDescendantClick(strain)} />
                                    ))}
                                </div>
                            </div>
                        )}
                        {descendants.children.length === 0 && descendants.grandchildren.length === 0 && (
                            <p className="text-slate-400 text-center py-8">{t('strainsView.genealogyView.noDescendantsFound')}</p>
                        )}
                    </div>
                </Modal>
            )}

            <Card className="relative z-10">
                <h3 className="text-xl font-bold font-display text-primary-400">{t('strainsView.genealogyView.title')}</h3>
                <p className="text-sm text-slate-400 mt-1">{t('strainsView.genealogyView.description')}</p>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <Select
                        className="flex-grow"
                        value={selectedStrainId || ''}
                        onChange={handleSelectChange}
                        options={[
                            { value: '', label: t('strainsView.genealogyView.selectStrain') },
                            ...sortedStrains.map(s => ({ value: s.id, label: s.name })),
                        ]}
                    />
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" onClick={handleResetZoom}>
                            <PhosphorIcons.ArrowClockwise /> {t('strainsView.genealogyView.resetView')}
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => dispatch(setGenealogyLayout(layoutOrientation === 'horizontal' ? 'vertical' : 'horizontal'))}
                        >
                            <PhosphorIcons.TreeStructure /> {t('strainsView.genealogyView.toggleLayout')}
                        </Button>
                        {/* Cache-Reset: löscht korrupte persisted Trees und baut neu */}
                        <Button
                            variant="danger"
                            size="sm"
                            title="Reset genealogy cache (clears corrupted persisted trees)"
                            onClick={() => dispatch(resetGenealogyCache())}
                        >
                            <PhosphorIcons.TrashSimple />
                        </Button>
                    </div>
                </div>
            </Card>

            {status === 'loading' && <Card><SkeletonLoader count={3} /></Card>}

            {status === 'failed' && (
                <Card className="text-center py-10 text-red-400">
                    <PhosphorIcons.TreeStructure className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-semibold">{t('common.error')}</p>
                    <p className="text-sm text-slate-400 mt-1">{t('strainsView.genealogyView.noStrainSelected')}</p>
                </Card>
            )}

            {status !== 'loading' && !selectedStrainId && (
                <Card className="text-center py-10 text-slate-500">
                    <PhosphorIcons.TreeStructure className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                    <p>{t('strainsView.genealogyView.noStrainSelected')}</p>
                </Card>
            )}

            {status === 'succeeded' && selectedStrainId && !tree && (
                <Card className="text-center py-10 text-slate-400">
                    <PhosphorIcons.TreeStructure className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t('strainsView.genealogyView.noStrainSelected')}</p>
                </Card>
            )}

            {status !== 'loading' && selectedStrainId && tree && (
                // key erzwingt vollständiges Remount bei Strain-Wechsel →
                // kein staler d3-State, keine Race Conditions nach 50+ Wechseln
                <div key={`tree-${selectedStrainId}`} className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <div className="lg:col-span-3">
                        <Card className="!p-0 h-[60vh] overflow-hidden bg-slate-900/50">
                            <svg ref={svgRef} className="w-full h-full cursor-move">
                                <g className="genealogy-content">
                                    {links.map((link, i) => (
                                        <GenealogyLink
                                            key={`${link.source.data.id}-${link.target.data.id}-${i}`}
                                            link={link}
                                            orientation={layoutOrientation}
                                        />
                                    ))}
                                    {nodes.map((node, idx) => {
                                        const isHorizontal = layoutOrientation === 'horizontal';
                                        const x = isHorizontal
                                            ? (node as d3.HierarchyPointNode<GenealogyNode>).y
                                            : (node as d3.HierarchyPointNode<GenealogyNode>).x;
                                        const y = isHorizontal
                                            ? (node as d3.HierarchyPointNode<GenealogyNode>).x
                                            : (node as d3.HierarchyPointNode<GenealogyNode>).y;
                                        // Überspringe Knoten mit ungültigen Koordinaten
                                        if (!isFinite(x) || !isFinite(y)) return null;
                                        return (
                                            <g
                                                key={`${node.data.id}-${node.depth}-${idx}`}
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
                                    })}
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