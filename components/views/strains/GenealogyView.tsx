import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { Strain, GenealogyNode, StrainType } from '@/types';
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

const GenealogyViewComponent: React.FC<GenealogyViewProps> = ({ allStrains, onNodeClick }) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedStrainId, setSelectedStrainId] = useState<string | null>(null);
    const [highlight, setHighlight] = useState<'landrace' | 'indica' | 'sativa' | null>(null);
    const [descendants, setDescendants] = useState<{ children: Strain[]; grandchildren: Strain[] } | null>(null);
    
    const [treeLayout, setTreeLayout] = useState<{ nodes: d3.HierarchyNode<GenealogyNode>[], links: d3.HierarchyLink<GenealogyNode>[] }>({ nodes: [], links: [] });
    const [transform, setTransform] = useState(d3.zoomIdentity);
    const [initialTransform, setInitialTransform] = useState<string | null>(null);

    const { computedTrees, status } = useAppSelector((state) => state.genealogy);
    const baseTreeData = selectedStrainId ? computedTrees[selectedStrainId] : null;
    const isLoading = status === 'loading' && !baseTreeData;

    const strainOptions = useMemo(() => 
        allStrains
            .map(s => ({ value: s.id, label: s.name }))
            .sort((a, b) => a.label.localeCompare(b.label)),
    [allStrains]);

    useEffect(() => {
        if (selectedStrainId) {
            setDescendants(null);
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
        if (baseTreeData && containerRef.current) {
            const width = containerRef.current.clientWidth;
            const height = containerRef.current.clientHeight;

            const root = d3.hierarchy(baseTreeData, d => d.children);
            const dx = 60;
            const dy = 180;
            const treeLayout = d3.tree<GenealogyNode>().nodeSize([dx, dy]);
            treeLayout(root);

            const nodes = root.descendants();
            const links = root.links();
            setTreeLayout({ nodes, links });

            if (!initialTransform) {
                const x0 = d3.min(nodes, d => d.x) || 0;
                const x1 = d3.max(nodes, d => d.x) || 0;
                const viewHeight = x1 - x0 + dx * 2;
                const scale = Math.min(1, height / viewHeight);
                setInitialTransform(`translate(${dy}, ${height / 2}) scale(${scale})`);
            }
        }
    }, [baseTreeData, initialTransform]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const zoom = d3.zoom<HTMLDivElement, unknown>()
            .scaleExtent([0.1, 1.5])
            .on('zoom', (event) => {
                setTransform(event.transform);
            });

        d3.select(container).call(zoom);

        return () => {
            d3.select(container).on('.zoom', null);
        };
    }, []);

    const handleZoomAction = (action: 'in' | 'out' | 'reset') => {
        const container = containerRef.current;
        if (!container) return;

        const zoom = d3.zoom<HTMLDivElement, unknown>().on('zoom', (event) => setTransform(event.transform));
        const view = d3.select(container).call(zoom);

        if (action === 'reset') {
            view.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
        } else {
            view.transition().duration(500).call(zoom.scaleBy, action === 'in' ? 1.2 : 0.8);
        }
    };
    
    const handleNodeClick = (nodeData: GenealogyNode) => {
        const strain = allStrains.find(s => s.id === nodeData.id);
        if (strain && !nodeData.isPlaceholder) onNodeClick(strain);
    };

    return (
        <Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                     <div>
                        <h3 className="text-xl font-bold font-display text-primary-400">{t('strainsView.genealogyView.title')}</h3>
                        <p className="text-sm text-slate-400 mt-1">{t('strainsView.genealogyView.description')}</p>
                    </div>
                     <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-1">{t('strainsView.genealogyView.selectStrain')}</label>
                        <Select value={selectedStrainId || ''} onChange={(e) => { setSelectedStrainId(e.target.value); setInitialTransform(null); }} options={strainOptions} />
                    </div>
                    {/* Analysis tools remain the same */}
                </div>
                <div ref={containerRef} className="md:col-span-2 genealogy-container">
                    {isLoading ? <div className="p-8"><SkeletonLoader count={5} /></div> :
                     !selectedStrainId || !baseTreeData ? (
                        <div className="flex items-center justify-center h-full text-slate-500 flex-col gap-4">
                            <PhosphorIcons.TreeStructure className="w-16 h-16"/>
                            <p>{t('strainsView.genealogyView.noStrainSelected')}</p>
                        </div>
                    ) : (
                        <div className="genealogy-nodes-container" style={{ transform: initialTransform ? `${initialTransform} ${transform.toString()}` : transform.toString(), transition: 'transform 0.5s ease' }}>
                            <svg className="genealogy-svg-layer">
                                {treeLayout.links.map((link, i) => (
                                    <path
                                        key={i}
                                        className="genealogy-link"
                                        d={d3.linkHorizontal().x(d => (d as any).y).y(d => (d as any).x)(link as any) || ''}
                                    />
                                ))}
                            </svg>
                            {treeLayout.nodes.map(node => (
                                <div key={node.data.id} className="genealogy-node-wrapper" style={{ transform: `translate(${node.y}px, ${node.x}px)` }}>
                                    <StrainTreeNode node={node} onNodeClick={handleNodeClick} onExpand={handleNodeExpand} />
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="genealogy-zoom-controls">
                        <Button variant="secondary" className="!p-2" onClick={() => handleZoomAction('in')}><PhosphorIcons.Plus /></Button>
                        <Button variant="secondary" className="!p-2" onClick={() => handleZoomAction('out')}><PhosphorIcons.Minus /></Button>
                        <Button variant="secondary" className="!p-2" onClick={() => handleZoomAction('reset')}><PhosphorIcons.ArrowClockwise /></Button>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export const GenealogyView = memo(GenealogyViewComponent);