import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Strain, GenealogyNode, GeneticContribution, StrainType } from '@/types';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/ui/ThemePrimitives';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { hierarchy, tree, HierarchyNode } from 'd3-hierarchy';
import { geneticsService } from '@/services/geneticsService';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { zoom, zoomIdentity, ZoomBehavior, D3ZoomEvent, select, zoomTransform } from 'd3';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import {
    fetchAndBuildGenealogy,
    setSelectedGenealogyStrain,
    setGenealogyZoom,
    resetGenealogyZoom,
    setGenealogyLayout,
    resetGenealogy,
} from '@/stores/slices/genealogySlice';
import { selectGenealogyState } from '@/stores/selectors';

interface GenealogyViewProps {
    allStrains: Strain[];
    onNodeClick: (strain: Strain) => void;
}

const Link: React.FC<{ linkData: any; orientation: 'vertical' | 'horizontal' }> = ({
    linkData,
    orientation,
}) => {
    const { source, target } = linkData;
    let path: string;
    if (orientation === 'vertical') {
        path = `M${source.x},${source.y} C${source.x},${source.y + 50} ${target.x},${
            target.y - 50
        } ${target.x},${target.y}`;
    } else {
        path = `M${source.y},${source.x} C${source.y + 75},${source.x} ${
            target.y - 75
        },${target.x} ${target.y},${target.x}`;
    }
    return <path className="genealogy-link" d={path} />;
};

type AnalysisMode = 'none' | 'landrace' | 'indica' | 'sativa';

export const GenealogyView: React.FC<GenealogyViewProps> = ({ allStrains, onNodeClick }) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();

    const {
        computedTrees,
        status,
        selectedStrainId,
        zoomTransform: reduxZoomTransform,
        layoutOrientation,
    } = useAppSelector(selectGenealogyState);

    const treeData = selectedStrainId ? computedTrees[selectedStrainId] : null;

    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const zoomBehaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('none');

    const strainOptions = useMemo(
        () =>
            allStrains
                .map((s) => ({ value: s.id, label: s.name }))
                .sort((a, b) => a.label.localeCompare(b.label)),
        [allStrains]
    );

    useEffect(() => {
        if (selectedStrainId) {
            dispatch(fetchAndBuildGenealogy({ strainId: selectedStrainId, allStrains }));
        }
    }, [selectedStrainId, allStrains, dispatch]);

    const treeLayout = useMemo(() => {
        if (!treeData) return null;
        const hierarchyData = hierarchy(treeData);
        const treeGenerator = tree().nodeSize(
            layoutOrientation === 'vertical' ? [160, 120] : [120, 220]
        );
        return treeGenerator(hierarchyData);
    }, [treeData, layoutOrientation]);

    const { contributions, descendants } = useMemo(() => {
        if (!treeData || !selectedStrainId) return { contributions: [], descendants: null };
        const contribs = geneticsService.calculateGeneticContribution(treeData).slice(0, 5);
        const desc = geneticsService.findDescendants(selectedStrainId, allStrains);
        return { contributions: contribs, descendants: desc };
    }, [treeData, selectedStrainId, allStrains]);

    const handleStrainSelect = (id: string) => {
        setAnalysisMode('none');
        dispatch(setSelectedGenealogyStrain(id));
    };

    const handleNodeClick = useCallback(
        (nodeData: GenealogyNode) => {
            const strain = allStrains.find((s) => s.id === nodeData.id);
            if (strain) onNodeClick(strain);
        },
        [allStrains, onNodeClick]
    );
    const handleToggleLayout = () =>
        dispatch(setGenealogyLayout(layoutOrientation === 'vertical' ? 'horizontal' : 'vertical'));
    const handleResetView = () => dispatch(resetGenealogyZoom());
    
    const lineagePaths = useMemo(() => {
        const paths: { indica: Set<string>, sativa: Set<string> } = { indica: new Set(), sativa: new Set() };
        if (!treeLayout) return paths;

        const traverse = (node: HierarchyNode<GenealogyNode>, type: StrainType) => {
            if (node.data.type === type) {
                let current: HierarchyNode<GenealogyNode> | null = node;
                while (current) {
                    paths[type.toLowerCase() as 'indica' | 'sativa'].add(current.data.id);
                    current = current.parent;
                }
            }
            if (node.children) {
                node.children.forEach(child => traverse(child, type));
            }
        };

        traverse(treeLayout, StrainType.Indica);
        traverse(treeLayout, StrainType.Sativa);
        return paths;
    }, [treeLayout]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const resizeObserver = new ResizeObserver((entries) => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                setDimensions({ width, height });
            }
        });
        resizeObserver.observe(container);
        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        const svg = select(svgRef.current!);
        const zoomBehavior = zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 2])
            .on('zoom', (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
                const { k, x, y } = event.transform;
                dispatch(setGenealogyZoom({ k, x, y }));
            });

        zoomBehaviorRef.current = zoomBehavior;
        svg.call(zoomBehavior);

        return () => {
            svg.on('.zoom', null);
        };
    }, [dispatch]);

    useEffect(() => {
        const zoomBehavior = zoomBehaviorRef.current;
        const svgEl = svgRef.current;
        if (!zoomBehavior || !svgEl) return;

        const svg = select(svgEl);

        if (reduxZoomTransform === null) {
            if (treeLayout && dimensions.width > 0) {
                const initialTransform =
                    layoutOrientation === 'vertical'
                        ? zoomIdentity.translate(dimensions.width / 2, 80).scale(0.8)
                        : zoomIdentity.translate(150, dimensions.height / 2).scale(0.7);
                svg.transition().duration(750).call(zoomBehavior.transform, initialTransform);
            }
        } else {
            const currentD3Transform = zoomTransform(svgEl);
            if (
                currentD3Transform.k !== reduxZoomTransform.k ||
                currentD3Transform.x !== reduxZoomTransform.x ||
                currentD3Transform.y !== reduxZoomTransform.y
            ) {
                const newTransform = zoomIdentity
                    .translate(reduxZoomTransform.x, reduxZoomTransform.y)
                    .scale(reduxZoomTransform.k);
                svg.call(zoomBehavior.transform, newTransform);
            }
        }
    }, [reduxZoomTransform, treeLayout, dimensions, layoutOrientation]);

    const handleZoomAction = (direction: 'in' | 'out') => {
        const zoomBehavior = zoomBehaviorRef.current;
        if (!zoomBehavior || !svgRef.current) return;
        const svg = select(svgRef.current);
        const duration = 250;
        const scaleFactor = direction === 'in' ? 1.3 : 1 / 1.3;
        svg.transition().duration(duration).call(zoomBehavior.scaleBy, scaleFactor);
    };

    const transformString = reduxZoomTransform
        ? `translate(${reduxZoomTransform.x}, ${reduxZoomTransform.y}) scale(${reduxZoomTransform.k})`
        : '';

    return (
        <div className="space-y-4">
            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400">
                    {t('strainsView.genealogyView.title')}
                </h3>
                <p className="text-sm text-slate-400">
                    {t('strainsView.genealogyView.description')}
                </p>
                <div className="mt-4">
                    <Select
                        options={strainOptions}
                        value={selectedStrainId || ''}
                        onChange={(e) => handleStrainSelect(e.target.value)}
                    />
                </div>
            </Card>

            {status === 'loading' && !treeLayout && <Card><SkeletonLoader count={3} /></Card>}
            {status === 'failed' && <Card><p className="text-red-400">Error loading genealogy.</p></Card>}
            
            {!selectedStrainId && status !== 'loading' && (
                <Card className="text-center py-10 text-slate-500">
                    <PhosphorIcons.TreeStructure className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                    <h3 className="font-semibold">{t('strainsView.genealogyView.noStrainSelected')}</h3>
                </Card>
            )}

            {treeLayout && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <Card ref={containerRef} className="lg:col-span-2 genealogy-container !p-0">
                        <svg ref={svgRef} className="w-full h-full rounded-xl">
                            <g transform={transformString}>
                                {treeLayout.links().map((link: any, i: number) => (
                                    <Link key={i} linkData={link} orientation={layoutOrientation} />
                                ))}
                                {treeLayout.descendants().map((node: any) => {
                                    const isLandrace = analysisMode === 'landrace' && node.data.isLandrace;
                                    const isIndica = analysisMode === 'indica' && lineagePaths.indica.has(node.data.id);
                                    const isSativa = analysisMode === 'sativa' && lineagePaths.sativa.has(node.data.id);
                                    const nodeClass = `genealogy-node ${isLandrace ? 'highlight-landrace' : ''} ${isIndica ? 'highlight-indica' : ''} ${isSativa ? 'highlight-sativa' : ''}`;
                                    const [x, y] = layoutOrientation === 'vertical' ? [node.x, node.y] : [node.y, node.x];
                                    
                                    return (
                                        <g key={node.data.id} transform={`translate(${x},${y})`} className={nodeClass} onClick={() => handleNodeClick(node.data)}>
                                            <circle r="8" />
                                            <text dy=".31em" x={node.children ? -12 : 12} style={{ textAnchor: node.children ? 'end' : 'start' }}>
                                                {node.data.name}
                                            </text>
                                        </g>
                                    );
                                })}
                            </g>
                        </svg>
                        <div className="genealogy-zoom-controls">
                            <Button size="sm" variant="secondary" onClick={handleToggleLayout} title={t('strainsView.genealogyView.toggleLayout')} className="!p-2"><PhosphorIcons.TreeStructure className={`w-5 h-5 transition-transform duration-300 ${layoutOrientation === 'horizontal' ? 'transform -rotate-90' : ''}`} /></Button>
                            <Button size="sm" variant="secondary" onClick={() => handleZoomAction('in')} className="!p-2"><PhosphorIcons.Plus /></Button>
                            <Button size="sm" variant="secondary" onClick={() => handleZoomAction('out')} className="!p-2"><PhosphorIcons.Minus /></Button>
                            <Button size="sm" variant="secondary" onClick={handleResetView} title={t('strainsView.genealogyView.resetView')} className="!p-2"><PhosphorIcons.ArrowClockwise className="w-5 h-5" /></Button>
                        </div>
                    </Card>

                    <div className="space-y-4">
                        <Card>
                             <h4 className="font-bold text-lg text-primary-300 mb-2">{t('strainsView.genealogyView.analysisTools')}</h4>
                             <div className="space-y-2">
                                <Button variant={analysisMode === 'landrace' ? 'primary' : 'secondary'} onClick={() => setAnalysisMode(analysisMode === 'landrace' ? 'none' : 'landrace')} className="w-full">{t('strainsView.genealogyView.highlightLandraces')}</Button>
                                <Button variant={analysisMode === 'indica' ? 'primary' : 'secondary'} onClick={() => setAnalysisMode(analysisMode === 'indica' ? 'none' : 'indica')} className="w-full">{t('strainsView.genealogyView.traceIndica')}</Button>
                                <Button variant={analysisMode === 'sativa' ? 'primary' : 'secondary'} onClick={() => setAnalysisMode(analysisMode === 'sativa' ? 'none' : 'sativa')} className="w-full">{t('strainsView.genealogyView.traceSativa')}</Button>
                             </div>
                        </Card>
                        <Card>
                            <h4 className="font-bold text-lg text-primary-300 mb-2">{t('strainsView.genealogyView.geneticInfluence')}</h4>
                            <p className="text-xs text-slate-400 mb-2">{t('strainsView.genealogyView.topAncestors')}</p>
                            <ul className="space-y-1 text-sm">{contributions.map(c => (<li key={c.name} className="flex justify-between items-center"><span className="text-slate-300 truncate" title={c.name}>{c.name}</span><span className="font-mono text-slate-100 flex-shrink-0 ml-2">{c.contribution.toFixed(1)}%</span></li>))}</ul>
                        </Card>
                        {descendants && (descendants.children.length > 0 || descendants.grandchildren.length > 0) && (
                             <Card>
                                <h4 className="font-bold text-lg text-primary-300 mb-2">{t('strainsView.genealogyView.knownDescendants', { name: treeLayout.data.name })}</h4>
                                {descendants.children.length > 0 && <div className="mb-2">
                                    <h5 className="font-semibold text-slate-300 text-sm">{t('strainsView.genealogyView.children')}</h5>
                                    <div className="flex flex-wrap gap-1 mt-1">{descendants.children.map(d => <Button size="sm" variant="secondary" key={d.id} onClick={() => handleStrainSelect(d.id)}>{d.name}</Button>)}</div>
                                </div>}
                                {descendants.grandchildren.length > 0 && <div>
                                    <h5 className="font-semibold text-slate-300 text-sm">{t('strainsView.genealogyView.grandchildren')}</h5>
                                     <div className="flex flex-wrap gap-1 mt-1">{descendants.grandchildren.map(d => <Button size="sm" variant="secondary" key={d.id} onClick={() => handleStrainSelect(d.id)}>{d.name}</Button>)}</div>
                                </div>}
                            </Card>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};