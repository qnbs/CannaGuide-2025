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
    resetGenealogyZoom,
    setGenealogyLayout,
} from '@/stores/slices/genealogySlice';
import { Strain, GenealogyNode, GeneticContribution } from '@/types';
import { StrainTreeNode } from './StrainTreeNode';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { Select } from '@/components/ui/ThemePrimitives';
import { geneticsService } from '@/services/geneticsService';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';

interface GenealogyViewProps {
    allStrains: Strain[];
    onNodeClick: (strain: Strain) => void;
}

const nodeSize = { width: 220, height: 80 };
const nodeSeparation = { x: 40, y: 40 };

const Link = ({ link, orientation }: { link: d3.HierarchyLink<GenealogyNode>, orientation: 'horizontal' | 'vertical' }) => {
    const d3PathHorizontal = d3.linkHorizontal()
        .x(d => (d as any).y)
        .y(d => (d as any).x);
    
     const d3PathVertical = d3.linkVertical()
        .x(d => (d as any).x)
        .y(d => (d as any).y);

    const pathGenerator = orientation === 'horizontal' ? d3PathHorizontal : d3PathVertical;

    return <path className="genealogy-link" d={pathGenerator(link) || ''} />;
};

const AnalysisPanel: React.FC<{ tree: GenealogyNode | null }> = ({ tree }) => {
    const { t } = useTranslation();
    const contributions = useMemo(() => {
        if (!tree) return [];
        return geneticsService.calculateGeneticContribution(tree).slice(0, 5);
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
        </Card>
    );
};

export const GenealogyView: React.FC<GenealogyViewProps> = ({ allStrains, onNodeClick }) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { computedTrees, status, selectedStrainId, zoomTransform, layoutOrientation } = useAppSelector(selectGenealogyState);
    
    const svgRef = useRef<SVGSVGElement>(null);
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>();

    const tree = useMemo(() => selectedStrainId ? computedTrees[selectedStrainId] : null, [computedTrees, selectedStrainId]);

    useEffect(() => {
        if (selectedStrainId && !computedTrees[selectedStrainId]) {
            dispatch(fetchAndBuildGenealogy({ strainId: selectedStrainId, allStrains }));
        }
    }, [selectedStrainId, allStrains, computedTrees, dispatch]);
    
    // FIX: Explicitly type the return value of useMemo to prevent incorrect type inference (e.g., `never[]`) on early returns.
    const { nodes, links } = useMemo<{ nodes: d3.HierarchyNode<GenealogyNode>[]; links: d3.HierarchyLink<GenealogyNode>[] }>(() => {
        if (!tree) return { nodes: [], links: [] };

        const root = d3.hierarchy(tree, d => d.children);
        const treeLayout = d3.tree<GenealogyNode>().nodeSize(
            layoutOrientation === 'horizontal' 
                ? [nodeSize.height + nodeSeparation.y, nodeSize.width + nodeSeparation.x]
                : [nodeSize.width + nodeSeparation.x, nodeSize.height + nodeSeparation.y]
        );
        treeLayout(root);
        
        return { nodes: root.descendants(), links: root.links() };
    }, [tree, layoutOrientation]);

    const handleNodeClick = useCallback((nodeData: GenealogyNode) => {
        const strain = allStrains.find(s => s.id === nodeData.id);
        if (strain) {
            onNodeClick(strain);
        }
    }, [allStrains, onNodeClick]);
    
    const handleToggle = useCallback((nodeId: string) => {
        // Placeholder for future expand/collapse logic
    }, []);

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        dispatch(setSelectedGenealogyStrain(e.target.value || null));
    };

    const sortedStrains = useMemo(() => [...allStrains].sort((a,b) => a.name.localeCompare(b.name)), [allStrains]);

    useEffect(() => {
        if (!svgRef.current) return;
        const svg = d3.select(svgRef.current);
        const g = svg.select<SVGGElement>('g.genealogy-content');

        const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 2])
            .on('zoom', (event) => {
                g.attr('transform', event.transform.toString());
            })
            .on('end', (event) => {
                dispatch(setGenealogyZoom(event.transform));
            });
        
        svg.call(zoomBehavior);
        zoomRef.current = zoomBehavior;

        if (zoomTransform === null) { // Recenter logic
            const { width, height } = svg.node()!.getBoundingClientRect();
            const initialTranslate = layoutOrientation === 'horizontal' ? [width * 0.1, height / 2] : [width / 2, height * 0.1];
            const initialTransform = d3.zoomIdentity.translate(initialTranslate[0], initialTranslate[1]);
            svg.call(zoomBehavior.transform, initialTransform);
        } else {
            const transform = d3.zoomIdentity.translate(zoomTransform.x, zoomTransform.y).scale(zoomTransform.k);
            svg.call(zoomBehavior.transform, transform);
        }

    }, [dispatch, tree, layoutOrientation, zoomTransform]); // Rerun setup when tree or layout changes

    const handleResetZoom = useCallback(() => {
        if (svgRef.current && zoomRef.current) {
            const svg = d3.select(svgRef.current);
            const { width, height } = svg.node()!.getBoundingClientRect();
            const initialTranslate = layoutOrientation === 'horizontal' ? [width * 0.1, height / 2] : [width / 2, height * 0.1];
            const initialTransform = d3.zoomIdentity.translate(initialTranslate[0], initialTranslate[1]);
            svg.transition().duration(750).call(zoomRef.current.transform, initialTransform);
        }
    }, [layoutOrientation]);


    return (
        <div className="space-y-4">
            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400">{t('strainsView.genealogyView.title')}</h3>
                <p className="text-sm text-slate-400 mt-1">{t('strainsView.genealogyView.description')}</p>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <Select
                        className="flex-grow"
                        value={selectedStrainId || ''}
                        onChange={handleSelectChange}
                        options={[{ value: '', label: t('strainsView.genealogyView.selectStrain') }, ...sortedStrains.map(s => ({ value: s.id, label: s.name }))]}
                    />
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" onClick={handleResetZoom}><PhosphorIcons.Cube /> {t('strainsView.genealogyView.resetView')}</Button>
                        <Button variant="secondary" onClick={() => dispatch(setGenealogyLayout(layoutOrientation === 'horizontal' ? 'vertical' : 'horizontal'))}><PhosphorIcons.TreeStructure /> {t('strainsView.genealogyView.toggleLayout')}</Button>
                    </div>
                </div>
            </Card>

            {status === 'loading' && <Card><SkeletonLoader count={3} /></Card>}
            
            {status !== 'loading' && !selectedStrainId && (
                <Card className="text-center py-10 text-slate-500">
                    <PhosphorIcons.TreeStructure className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                    <p>{t('strainsView.genealogyView.noStrainSelected')}</p>
                </Card>
            )}

            {status !== 'loading' && selectedStrainId && tree && (
                 <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <div className="lg:col-span-3">
                        <Card className="!p-0 h-[60vh] overflow-hidden bg-slate-900/50">
                             <svg ref={svgRef} className="w-full h-full cursor-move">
                                <g className="genealogy-content">
                                    {links.map((link, i) => <Link key={`${link.source.data.id}-${link.target.data.id}-${i}`} link={link} orientation={layoutOrientation} />)}
                                    {nodes.map((node) => (
                                         <foreignObject
                                            key={node.data.id}
                                            x={layoutOrientation === 'horizontal' ? node.y - (nodeSize.width / 2) : node.x - (nodeSize.width / 2)}
                                            y={layoutOrientation === 'horizontal' ? node.x - (nodeSize.height / 2) : node.y - (nodeSize.height / 2)}
                                            width={nodeSize.width}
                                            height={nodeSize.height}
                                        >
                                             <StrainTreeNode node={node} onNodeClick={handleNodeClick} onToggle={handleToggle} />
                                        </foreignObject>
                                    ))}
                                </g>
                            </svg>
                        </Card>
                    </div>
                    <div className="lg:col-span-1 space-y-4">
                        <AnalysisPanel tree={tree} />
                    </div>
                </div>
            )}
        </div>
    );
};