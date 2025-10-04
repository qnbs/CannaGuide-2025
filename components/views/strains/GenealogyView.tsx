import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Strain, GenealogyNode, GeneticContribution, StrainType } from '@/types';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/ui/ThemePrimitives';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { hierarchy, tree, HierarchyNode } from 'd3-hierarchy';
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
    path = `M${source.x},${source.y} C${source.x},${source.y + 50} ${target.x},${target.y - 50} ${target.x},${target.y}`;
  } else {
    path = `M${source.y},${source.x} C${source.y + 75},${source.x} ${target.y - 75},${target.x} ${target.y},${target.x}`;
  }

  return <path className={`genealogy-link ${className || ''}`} d={path} />;
};


export const GenealogyView: React.FC<GenealogyViewProps> = ({ allStrains, onNodeClick }) => {
    const { t } = useTranslation();
    const [selectedStrainId, setSelectedStrainId] = useState<string | null>('gorilla-glue-4');
    const [treeData, setTreeData] = useState<GenealogyNode | null>(null);
    const [status, setStatus] = useState<'idle' | 'loading' | 'succeeded' | 'failed'>('idle');
    const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(new Set());
    const [zoomTransform, setZoomTransform] = useState<{k: number, x: number, y: number} | null>(null);
    const [layoutOrientation, setLayoutOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
    
    const [treeLayout, setTreeLayout] = useState<any>(null);
    const [contributions, setContributions] = useState<GeneticContribution[]>([]);
    const [descendants, setDescendants] = useState<{ children: Strain[], grandchildren: Strain[] } | null>(null);

    const svgRef = useRef<SVGSVGElement>(null);
    const gRef = useRef<SVGGElement>(null);
    const zoomBehaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown>>();
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    const strainOptions = useMemo(() => allStrains.map(s => ({ value: s.id, label: s.name })), [allStrains]);

    useEffect(() => {
        if (selectedStrainId) {
            setStatus('loading');
            const tree = geneticsService.buildGenealogyTree(selectedStrainId, allStrains);
            setTreeData(tree);
            setStatus('succeeded');
        }
    }, [selectedStrainId, allStrains]);
    
    const handleStrainSelect = (id: string) => {
        setSelectedStrainId(id);
        setCollapsedNodeIds(new Set());
        setZoomTransform(null); // Reset zoom on new selection
    };

    const handleNodeClick = (nodeData: GenealogyNode) => {
        const strain = allStrains.find(s => s.id === nodeData.id);
        if (strain) {
            onNodeClick(strain);
        }
    };

    const handleToggle = useCallback((nodeId: string) => {
        setCollapsedNodeIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(nodeId)) {
                newSet.delete(nodeId);
            } else {
                newSet.add(nodeId);
            }
            return newSet;
        });
    }, []);
    
    useEffect(() => {
        if (treeData) {
            const clonedRootNode = JSON.parse(JSON.stringify(treeData));
            const hierarchyData = hierarchy(clonedRootNode);

            hierarchyData.each(d => {
                if (collapsedNodeIds.has(d.data.id) && d.children) {
                    d.data._children = d.children;
                    (d as any).children = null;
                }
            });
            
            const treeGenerator = tree().nodeSize(layoutOrientation === 'vertical' ? [160, 150] : [150, 250]);
            const layout = treeGenerator(hierarchyData);
            setTreeLayout(layout);

            setContributions(geneticsService.calculateGeneticContribution(treeData).slice(0, 5));
            if(selectedStrainId) {
                setDescendants(geneticsService.findDescendants(selectedStrainId, allStrains));
            }
        } else {
            setTreeLayout(null);
        }
    }, [treeData, collapsedNodeIds, allStrains, selectedStrainId, layoutOrientation]);
    
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                setDimensions({ width, height });
            }
        });
        resizeObserver.observe(container);
        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;

        const zoomBehavior = zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 2])
            .on('zoom', (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
                if (gRef.current) {
                    select(gRef.current).attr('transform', event.transform.toString());
                }
            })
            .on('end', (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
                const { k, x, y } = event.transform;
                setZoomTransform({ k, x, y });
            });

        zoomBehaviorRef.current = zoomBehavior;
        select(svg).call(zoomBehavior);

        return () => {
            select(svg).on('.zoom', null);
        };
    }, []);

    useEffect(() => {
        const svg = svgRef.current;
        const zoomBehavior = zoomBehaviorRef.current;
        if (!svg || !zoomBehavior || !treeLayout || dimensions.width === 0) return;

        const svgSelection = select(svg);
        
        let transform: any;
        if(zoomTransform) {
            transform = zoomIdentity.translate(zoomTransform.x, zoomTransform.y).scale(zoomTransform.k);
        } else {
            transform = layoutOrientation === 'vertical'
                ? zoomIdentity.translate(dimensions.width / 2, 100)
                : zoomIdentity.translate(150, dimensions.height / 2);
        }
        svgSelection.call(zoomBehavior.transform, transform);

    }, [treeLayout, dimensions, zoomTransform, layoutOrientation]);

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
                const initialTransform = layoutOrientation === 'vertical'
                    ? zoomIdentity.translate(dimensions.width / 2, 100)
                    : zoomIdentity.translate(150, dimensions.height / 2);
                svg.transition().duration(duration).call(zoomBehavior.transform, initialTransform);
                setZoomTransform(null);
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
                         <Select options={strainOptions} value={selectedStrainId || ''} onChange={(e) => handleStrainSelect(e.target.value)} />
                    </div>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setLayoutOrientation(o => o === 'vertical' ? 'horizontal' : 'vertical');
                            setZoomTransform(null);
                        }}
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
                    <Card ref={containerRef} className="lg:col-span-2 genealogy-container">
                        <svg ref={svgRef} className="w-full h-full">
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
