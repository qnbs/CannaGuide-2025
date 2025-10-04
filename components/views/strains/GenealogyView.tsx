import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { Strain, GenealogyNode, StrainType, GeneticContribution } from '@/types';
import { useTranslation } from 'react-i18next';
import * as d3 from 'd3';
import { Card } from '@/components/common/Card';
import { Select } from '@/components/ui/ThemePrimitives';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { fetchAndBuildGenealogy } from '@/stores/slices/genealogySlice';
import { geneticsService } from '@/services/geneticsService';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { StrainTreeNode } from './StrainTreeNode';

interface GenealogyViewProps {
    allStrains: Strain[];
    onNodeClick: (strain: Strain) => void;
}

const NODE_WIDTH = 140;
const NODE_HEIGHT = 50;

const GenealogyViewComponent: React.FC<GenealogyViewProps> = ({ allStrains, onNodeClick }) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const [selectedStrainId, setSelectedStrainId] = useState<string | null>(null);
    const [highlight, setHighlight] = useState<'landrace' | 'indica' | 'sativa' | null>(null);
    const [showDescendants, setShowDescendants] = useState(false);
    
    const [treeLayout, setTreeLayout] = useState<{ nodes: d3.HierarchyNode<GenealogyNode>[], links: d3.HierarchyLink<GenealogyNode>[] }>({ nodes: [], links: [] });
    const [transform, setTransform] = useState(d3.zoomIdentity);
    const [initialTransform, setInitialTransform] = useState(d3.zoomIdentity);

    const { computedTrees, status } = useAppSelector((state) => state.genealogy);
    const baseTreeData = selectedStrainId ? computedTrees[selectedStrainId] : null;
    const isLoading = status === 'loading';

    const strainOptions = useMemo(() => 
        allStrains
            .map(s => ({ value: s.id, label: s.name }))
            .sort((a, b) => a.label.localeCompare(b.label)),
    [allStrains]);

    useEffect(() => {
        if(strainOptions.length > 0 && !selectedStrainId) {
            setSelectedStrainId(strainOptions.find(o => o.label === 'Apple Fritter')?.value || strainOptions[0].value);
        }
    }, [strainOptions, selectedStrainId]);
    
    useEffect(() => {
        if (selectedStrainId) {
            setShowDescendants(false);
            dispatch(fetchAndBuildGenealogy(selectedStrainId));
        }
    }, [selectedStrainId, dispatch]);
    
    const handleNodeExpand = (nodeIdToExpand: string) => {
        if (!baseTreeData || !selectedStrainId) return;
    
        const newTreeData = JSON.parse(JSON.stringify(baseTreeData));
        let found = false;
    
        function findAndToggle(node: GenealogyNode) {
            if (found) return;
            if (node.id === nodeIdToExpand) {
                if (node._children) {
                    node.children = node._children;
                    delete node._children;
                }
                found = true;
            } else if (node.children) {
                node.children.forEach(findAndToggle);
            }
        }
    
        findAndToggle(newTreeData);
        dispatch({ type: 'genealogy/fetchAndBuild/fulfilled', payload: { strainId: selectedStrainId, tree: newTreeData } });
    };

    useEffect(() => {
        const svg = svgRef.current;
        if (baseTreeData && svg) {
            const width = svg.clientWidth;
            const height = svg.clientHeight;

            const root = d3.hierarchy(baseTreeData, d => d.children);
            const dx = 60;
            const dy = 200;
            const tree = d3.tree<GenealogyNode>().nodeSize([dx, dy]);
            tree(root);
            
            const nodes = root.descendants();
            const links = root.links();
            setTreeLayout({ nodes, links });

            const x0 = d3.min(nodes, d => d.x) || 0;
            const x1 = d3.max(nodes, d => d.x) || 0;
            const viewHeight = x1 - x0 + dx * 2;
            
            const scale = Math.max(0.1, Math.min(0.8, height / viewHeight));
            const initialT = d3.zoomIdentity.translate(dy, height / 2).scale(scale);
            setInitialTransform(initialT);
            
            const zoom = d3.zoom<SVGSVGElement, unknown>()
                .scaleExtent([0.1, 1.5])
                .on('zoom', (event) => {
                    if (event.sourceEvent) {
                        setTransform(event.transform);
                    }
                });

            d3.select(svg).call(zoom).call(zoom.transform, initialT);
        }
    }, [baseTreeData]);


    const handleZoomAction = (action: 'in' | 'out' | 'reset') => {
        const svg = svgRef.current;
        if (!svg) return;
    
        const zoom = d3.zoom<SVGSVGElement, unknown>().on('zoom', event => setTransform(event.transform));
        const selection = d3.select(svg).call(zoom);
        const transition = selection.transition().duration(500);
    
        if (action === 'reset') {
            transition.call(zoom.transform, initialTransform);
        } else {
            transition.call(zoom.scaleBy, action === 'in' ? 1.2 : 0.8);
        }
    };
    
    const handleNodeClick = (nodeData: GenealogyNode) => {
        const strain = allStrains.find(s => s.id === nodeData.id);
        if (strain && !nodeData.isPlaceholder) onNodeClick(strain);
    };
    
    const geneticContributions = useMemo(() => {
        if (!baseTreeData) return [];
        return geneticsService.calculateGeneticContribution(baseTreeData).slice(0, 5);
    }, [baseTreeData]);

    const descendants = useMemo(() => {
        if (!selectedStrainId) return null;
        return geneticsService.findDescendants(selectedStrainId, allStrains);
    }, [selectedStrainId, allStrains]);

    const { highlightedNodeIds, highlightedLinkPaths } = useMemo(() => {
        const nodeIds = new Set<string>();
        const linkIds = new Set<string>();
        if (!highlight || !baseTreeData) return { highlightedNodeIds: nodeIds, highlightedLinkPaths: linkIds };
    
        const root = d3.hierarchy(baseTreeData, d => d.children || d._children);
        const descendants = root.descendants();
    
        const matchingNodes = descendants.filter(d => 
            (highlight === 'landrace' && d.data.isLandrace) ||
            (highlight === 'sativa' && d.data.type === StrainType.Sativa) ||
            (highlight === 'indica' && d.data.type === StrainType.Indica)
        );
    
        for (const node of matchingNodes) {
            nodeIds.add(node.data.id);
            let current = node;
            while (current.parent) {
                const linkId = `${current.parent.data.id}->${current.data.id}`;
                linkIds.add(linkId);
                nodeIds.add(current.parent.data.id);
                current = current.parent;
            }
        }
        return { highlightedNodeIds: nodeIds, highlightedLinkPaths: linkIds };
    }, [highlight, baseTreeData]);


    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
                 <Card>
                    <h3 className="text-xl font-bold font-display text-primary-400 mb-2">{t('strainsView.genealogyView.title')}</h3>
                    <Select value={selectedStrainId || ''} onChange={(e) => setSelectedStrainId(e.target.value)} options={strainOptions} />
                </Card>
                <Card>
                    <h3 className="font-semibold mb-2">{t('strainsView.genealogyView.analysisTools')}</h3>
                    <div className="space-y-2">
                        <Button variant={highlight === 'landrace' ? 'primary' : 'secondary'} className="w-full" onClick={() => setHighlight(h => h === 'landrace' ? null : 'landrace')}>{t('strainsView.genealogyView.highlightLandraces')}</Button>
                        <Button variant={highlight === 'indica' ? 'primary' : 'secondary'} className="w-full" onClick={() => setHighlight(h => h === 'indica' ? null : 'indica')}>{t('strainsView.genealogyView.traceIndica')}</Button>
                        <Button variant={highlight === 'sativa' ? 'primary' : 'secondary'} className="w-full" onClick={() => setHighlight(h => h === 'sativa' ? null : 'sativa')}>{t('strainsView.genealogyView.traceSativa')}</Button>
                    </div>
                </Card>
                {geneticContributions.length > 0 && (
                    <Card>
                        <h3 className="font-semibold mb-2">{t('strainsView.genealogyView.geneticInfluence')}</h3>
                        <ul className="text-sm space-y-1">
                            {geneticContributions.map(item => (
                                <li key={item.name} className="flex justify-between">
                                    <span className="text-slate-300">{item.name}</span>
                                    <span className="font-mono text-slate-100">{item.contribution.toFixed(1)}%</span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}
                {descendants && (descendants.children.length > 0 || descendants.grandchildren.length > 0) && (
                    <Card>
                        <Button onClick={() => setShowDescendants(s => !s)} className="w-full mb-2">{t('strainsView.genealogyView.showDescendants')}</Button>
                        {showDescendants && (
                             <div className="animate-fade-in space-y-2">
                                <h4 className="font-semibold text-slate-200">{t('strainsView.genealogyView.knownDescendants', { name: allStrains.find(s => s.id === selectedStrainId)?.name })}</h4>
                                 {descendants.children.length > 0 && (<div><h5 className="text-xs uppercase text-slate-400">{t('strainsView.genealogyView.children')}</h5><ul className="list-disc list-inside text-sm">{descendants.children.map(c => <li key={c.id}>{c.name}</li>)}</ul></div>)}
                            </div>
                        )}
                    </Card>
                )}
            </div>
            <div ref={containerRef} className="md:col-span-2 genealogy-container glass-pane rounded-xl">
                {isLoading ? <div className="p-8"><SkeletonLoader count={5} /></div> :
                 !selectedStrainId || !baseTreeData ? (
                    <div className="flex items-center justify-center h-full text-slate-500 flex-col gap-4">
                        <PhosphorIcons.TreeStructure className="w-16 h-16"/>
                        <p>{t('strainsView.genealogyView.noStrainSelected')}</p>
                    </div>
                ) : (
                    <svg ref={svgRef} className="w-full h-full cursor-grab">
                        <g transform={transform.toString()}>
                            {treeLayout.links.map((link, i) => (
                                <path
                                    key={i}
                                    className={`genealogy-link fill-none stroke-slate-500 ${highlightedLinkPaths.has(`${link.source.data.id}->${link.target.data.id}`) ? 'highlight-path' : ''}`}
                                    strokeWidth={1.5}
                                    d={d3.linkHorizontal<any, any, any>()
                                        .x(d => d.y)
                                        .y(d => d.x)(link) || ''}
                                />
                            ))}
                            {treeLayout.nodes.map(node => (
                                <foreignObject
                                    key={node.data.id}
                                    x={node.y - NODE_WIDTH / 2}
                                    y={node.x - NODE_HEIGHT / 2}
                                    width={NODE_WIDTH + 20}
                                    height={NODE_HEIGHT + 20}
                                    className={`genealogy-node-wrapper ${highlightedNodeIds.has(node.data.id) ? 'highlight' : ''}`}
                                >
                                    <StrainTreeNode
                                        node={node}
                                        onNodeClick={handleNodeClick}
                                        onExpand={handleNodeExpand}
                                    />
                                </foreignObject>
                            ))}
                        </g>
                    </svg>
                )}
                <div className="genealogy-zoom-controls">
                    <Button variant="secondary" className="!p-2" onClick={() => handleZoomAction('in')}><PhosphorIcons.Plus /></Button>
                    <Button variant="secondary" className="!p-2" onClick={() => handleZoomAction('out')}><PhosphorIcons.Minus /></Button>
                    <Button variant="secondary" className="!p-2" onClick={() => handleZoomAction('reset')}><PhosphorIcons.ArrowClockwise /></Button>
                </div>
            </div>
        </div>
    );
};

export const GenealogyView = memo(GenealogyViewComponent);