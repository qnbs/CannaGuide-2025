import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Strain, GenealogyNode, GeneticContribution } from '@/types';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/ui/ThemePrimitives';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { 
    fetchAndBuildGenealogy,
    setSelectedGenealogyStrain,
    toggleGenealogyNode,
    setGenealogyZoom,
    setGenealogyLayout
} from '@/stores/slices/genealogySlice';
import { hierarchy, tree } from 'd3-hierarchy';
import { StrainTreeNode } from './StrainTreeNode';
import { geneticsService } from '@/services/geneticsService';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { zoom, zoomIdentity, ZoomBehavior, D3ZoomEvent, select } from 'd3';

interface GenealogyViewProps {
    allStrains: Strain[];
    onNodeClick: (strain: Strain) => void;
}

const Link: React.FC<{ linkData: any; className?: string; orientation: 'vertical' | 'horizontal' }> = ({ linkData, className, orientation }) => {
  const { source, target } = linkData;
  
  let path: string;
  if (orientation === 'vertical') {
    // Path for a vertical tree layout
    path = `M${source.x},${source.y} C${source.x},${source.y + 50} ${target.x},${target.y - 50} ${target.x},${target.y}`;
  } else {
    // Path for a horizontal tree layout (left-to-right)
    // Here, d3's x is our vertical position, and y is our horizontal position
    path = `M${source.y},${source.x} C${source.y + 75},${source.x} ${target.y - 75},${target.x} ${target.y},${target.x}`;
  }

  return <path className={`genealogy-link ${className || ''}`} d={path} />;
};


export const GenealogyView: React.FC<GenealogyViewProps> = ({ allStrains, onNodeClick }) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { 
        computedTrees, 
        status, 
        selectedStrainId, 
        collapsedNodeIds, 
        zoomTransform, 
        layoutOrientation 
    } = useAppSelector(state => state.genealogy);
    
    const [treeLayout, setTreeLayout] = useState<any>(null);
    const [contributions, setContributions] = useState<GeneticContribution[]>([]);
    const [descendants, setDescendants] = useState<{ children: Strain[], grandchildren: Strain[] } | null>(null);

    const svgRef = useRef<SVGSVGElement>(null);
    const gRef = useRef<SVGGElement>(null);
    const zoomBehaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown>>();

    const strainOptions = useMemo(() => allStrains.map(s => ({ value: s.id, label: s.name })), [allStrains]);

    useEffect(() => {
        if (selectedStrainId && !computedTrees[selectedStrainId]) {
            dispatch(fetchAndBuildGenealogy(selectedStrainId));
        }
    }, [selectedStrainId, computedTrees, dispatch]);

    const handleNodeClick = (nodeData: GenealogyNode) => {
        const strain = allStrains.find(s => s.id === nodeData.id);
        if (strain) {
            onNodeClick(strain);
        }
    };

    const handleToggle = useCallback((nodeId: string) => {
        dispatch(toggleGenealogyNode(nodeId));
    }, [dispatch]);
    
    const collapsedNodesSet = useMemo(() => new Set(collapsedNodeIds), [collapsedNodeIds]);

    useEffect(() => {
        if (selectedStrainId && computedTrees[selectedStrainId]) {
            const rootNode = computedTrees[selectedStrainId];
            if (rootNode) {
                const clonedRootNode = JSON.parse(JSON.stringify(rootNode));
                const hierarchyData = hierarchy(clonedRootNode);

                hierarchyData.each(d => {
                    if (collapsedNodesSet.has(d.data.id) && d.children) {
                        d.data._children = d.children;
                        (d as any).children = null;
                    }
                });

                const treeGenerator = tree().nodeSize(layoutOrientation === 'vertical' ? [160, 150] : [150, 250]);
                const layout = treeGenerator(hierarchyData);
                setTreeLayout(layout);

                setContributions(geneticsService.calculateGeneticContribution(rootNode).slice(0, 5));
                setDescendants(geneticsService.findDescendants(selectedStrainId, allStrains));
            }
        } else {
            setTreeLayout(null);
        }
    }, [selectedStrainId, computedTrees, collapsedNodesSet, allStrains, layoutOrientation]);
    
    const handleZoomCallback = useCallback((event: D3ZoomEvent<SVGSVGElement, unknown>) => {
        const { k, x, y } = event.transform;
        if (gRef.current) {
            select(gRef.current).attr('transform', event.transform.toString());
        }
        // Only dispatch if the transform differs from the one in the store to prevent loops.
        if (k !== zoomTransform?.k || x !== zoomTransform?.x || y !== zoomTransform?.y) {
            dispatch(setGenealogyZoom({ k, x, y }));
        }
    }, [dispatch, zoomTransform]);

    useEffect(() => {
        if (!svgRef.current || !gRef.current || !treeLayout) return;

        const svg = select(svgRef.current);

        const zoomBehavior = zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 2])
            .on('zoom', handleZoomCallback);
        
        zoomBehaviorRef.current = zoomBehavior;
        svg.call(zoomBehavior);

        const { width, height } = svgRef.current.getBoundingClientRect();
        let initialTransform;

        if (zoomTransform) {
            initialTransform = zoomIdentity.translate(zoomTransform.x, zoomTransform.y).scale(zoomTransform.k);
        } else {
             initialTransform = layoutOrientation === 'vertical'
                ? zoomIdentity.translate(width / 2, 100)
                : zoomIdentity.translate(150, height / 2);
        }
        
        // Use a transition for a smooth initial positioning or restoration.
        svg.transition().duration(500).call(zoomBehavior.transform, initialTransform);

    }, [treeLayout, layoutOrientation, handleZoomCallback]);

    const handleZoomAction = (direction: 'in' | 'out' | 'reset') => {
        if (!svgRef.current || !zoomBehaviorRef.current) return;
        const svg = select(svgRef.current);
        const zoomBehavior = zoomBehaviorRef.current;
        const duration = 250;
    
        switch (direction) {
            case 'in':
                svg.transition().duration(duration).call(zoomBehavior.scaleBy, 1.2);
                break;
            case 'out':
                svg.transition().duration(duration).call(zoomBehavior.scaleBy, 0.8);
                break;
            case 'reset':
                 const { width, height } = svgRef.current.getBoundingClientRect();
                const initialTransform = layoutOrientation === 'vertical'
                    ? zoomIdentity.translate(width / 2, 100)
                    : zoomIdentity.translate(150, height / 2);
                svg.transition().duration(duration).call(zoomBehavior.transform, initialTransform);
                break;
        }
    };

    return (
        <div className="space-y-4">
            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400">{t('strainsView.genealogyView.title')}</h3>
                <p className="text-sm text-slate-400">{t('strainsView.genealogyView.description')}</p>
                <div className="mt-4 flex items-center gap-2">
                    <div className="flex-grow">
                         <Select options={strainOptions} value={selectedStrainId || ''} onChange={(e) => dispatch(setSelectedGenealogyStrain(e.target.value))} />
                    </div>
                    <Button
                        variant="secondary"
                        onClick={() => dispatch(setGenealogyLayout(layoutOrientation === 'vertical' ? 'horizontal' : 'vertical'))}
                        title={t('strainsView.genealogyView.toggleLayout')}
                        className="!p-2.5"
                    >
                        <PhosphorIcons.TreeStructure className={`w-5 h-5 transition-transform duration-300 ${layoutOrientation === 'horizontal' ? 'transform -rotate-90' : ''}`} />
                    </Button>
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
                    <Card className="lg:col-span-2 genealogy-container">
                        <svg ref={svgRef} width="100%" height="100%">
                            <g ref={gRef}>
                                {treeLayout.links().map((link: any, i: number) => <Link key={i} linkData={link} orientation={layoutOrientation}/>)}
                                {treeLayout.descendants().map((node: any, i: number) => (
                                    <foreignObject 
                                        key={i} 
                                        x={layoutOrientation === 'vertical' ? node.x - 70 : node.y} 
                                        y={layoutOrientation === 'vertical' ? node.y : node.x - 35} 
                                        width="140" 
                                        height="70"
                                    >
                                        <StrainTreeNode node={node} onNodeClick={handleNodeClick} onToggle={handleToggle} />
                                    </foreignObject>
                                ))}
                            </g>
                        </svg>
                         <div className="genealogy-zoom-controls">
                            <Button size="sm" variant="secondary" onClick={() => handleZoomAction('in')} className="!p-2"><PhosphorIcons.Plus /></Button>
                            <Button size="sm" variant="secondary" onClick={() => handleZoomAction('out')} className="!p-2"><PhosphorIcons.Minus /></Button>
                            <Button size="sm" variant="secondary" onClick={() => handleZoomAction('reset')} className="!p-2"><PhosphorIcons.ArrowClockwise /></Button>
                        </div>
                    </Card>

                    <div className="space-y-4">
                        <Card>
                            <h4 className="font-bold text-lg text-primary-300 mb-2">{t('strainsView.genealogyView.geneticInfluence')}</h4>
                            <ul className="space-y-1 text-sm">
                                {contributions.map(c => (
                                    <li key={c.name} className="flex justify-between items-center">
                                        <span className="text-slate-300">{c.name}</span>
                                        <span className="font-mono text-slate-100">{c.contribution.toFixed(1)}%</span>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                        {descendants && (descendants.children.length > 0 || descendants.grandchildren.length > 0) && (
                             <Card>
                                <h4 className="font-bold text-lg text-primary-300 mb-2">{t('strainsView.genealogyView.knownDescendants', { name: treeLayout.data.name })}</h4>
                                {descendants.children.length > 0 && <div className="mb-2">
                                    <h5 className="font-semibold text-slate-300 text-sm">{t('strainsView.genealogyView.children')}</h5>
                                    <div className="flex flex-wrap gap-1 mt-1">{descendants.children.map(d => <Button size="sm" variant="secondary" key={d.id} onClick={() => dispatch(setSelectedGenealogyStrain(d.id))}>{d.name}</Button>)}</div>
                                </div>}
                                {descendants.grandchildren.length > 0 && <div>
                                    <h5 className="font-semibold text-slate-300 text-sm">{t('strainsView.genealogyView.grandchildren')}</h5>
                                     <div className="flex flex-wrap gap-1 mt-1">{descendants.grandchildren.map(d => <Button size="sm" variant="secondary" key={d.id} onClick={() => dispatch(setSelectedGenealogyStrain(d.id))}>{d.name}</Button>)}</div>
                                </div>}
                            </Card>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
