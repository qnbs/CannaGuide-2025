import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Strain, GenealogyNode, GeneticContribution } from '@/types';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/ui/ThemePrimitives';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { fetchAndBuildGenealogy } from '@/stores/slices/genealogySlice';
import { hierarchy, tree } from 'd3-hierarchy';
import { StrainTreeNode } from './StrainTreeNode';
import { geneticsService } from '@/services/geneticsService';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';

interface GenealogyViewProps {
    allStrains: Strain[];
    onNodeClick: (strain: Strain) => void;
}

const Link: React.FC<{ linkData: any }> = ({ linkData }) => {
  const { source, target } = linkData;
  const path = `M${source.y},${source.x} C${source.y + 50},${source.x} ${target.y - 50},${target.x} ${target.y},${target.x}`;
  return <path className="genealogy-link" d={path} />;
};

export const GenealogyView: React.FC<GenealogyViewProps> = ({ allStrains, onNodeClick }) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { computedTrees, status } = useAppSelector(state => state.genealogy);
    
    const [selectedStrainId, setSelectedStrainId] = useState<string | null>(null);
    const [treeLayout, setTreeLayout] = useState<any>(null);
    const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
    const [contributions, setContributions] = useState<GeneticContribution[]>([]);
    const [descendants, setDescendants] = useState<{ children: Strain[], grandchildren: Strain[] } | null>(null);

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
        setCollapsedNodes(prev => {
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
        if (selectedStrainId && computedTrees[selectedStrainId]) {
            const rootNode = computedTrees[selectedStrainId];
            if (rootNode) {
                // Deep clone the node from Redux state before mutating it for D3.
                // Immer freezes state objects, preventing direct mutation.
                const clonedRootNode = JSON.parse(JSON.stringify(rootNode));
                const hierarchyData = hierarchy(clonedRootNode);

                hierarchyData.each(d => {
                    if (collapsedNodes.has(d.data.id) && d.children) {
                        d.data._children = d.children;
                        (d as any).children = null;
                    }
                });

                const treeGenerator = tree().nodeSize([100, 250]);
                const layout = treeGenerator(hierarchyData);
                setTreeLayout(layout);

                setContributions(geneticsService.calculateGeneticContribution(rootNode).slice(0, 5));
                setDescendants(geneticsService.findDescendants(selectedStrainId, allStrains));
            }
        }
    }, [selectedStrainId, computedTrees, collapsedNodes, allStrains]);

    return (
        <div className="space-y-4">
            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400">{t('strainsView.genealogyView.title')}</h3>
                <p className="text-sm text-slate-400">{t('strainsView.genealogyView.description')}</p>
                <div className="mt-4">
                    <Select options={strainOptions} value={selectedStrainId || ''} onChange={(e) => setSelectedStrainId(e.target.value)} />
                </div>
            </Card>

            {status === 'loading' && <Card><SkeletonLoader count={3} /></Card>}
            {status === 'failed' && <Card><p className="text-red-400">Error loading genealogy.</p></Card>}
            
            {treeLayout && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <Card className="lg:col-span-2 overflow-auto genealogy-container">
                        <svg width={treeLayout.height * 250 + 300} height={treeLayout.descendants().length * 100}>
                            <g transform="translate(150, 50)">
                                {treeLayout.links().map((link: any, i: number) => <Link key={i} linkData={link} />)}
                                {treeLayout.descendants().map((node: any, i: number) => (
                                    <foreignObject key={i} x={node.y} y={node.x - 40} width="220" height="80">
                                        <StrainTreeNode node={node} onNodeClick={handleNodeClick} onToggle={handleToggle} />
                                    </foreignObject>
                                ))}
                            </g>
                        </svg>
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
                                    <div className="flex flex-wrap gap-1 mt-1">{descendants.children.map(d => <Button size="sm" variant="secondary" key={d.id} onClick={() => setSelectedStrainId(d.id)}>{d.name}</Button>)}</div>
                                </div>}
                                {descendants.grandchildren.length > 0 && <div>
                                    <h5 className="font-semibold text-slate-300 text-sm">{t('strainsView.genealogyView.grandchildren')}</h5>
                                     <div className="flex flex-wrap gap-1 mt-1">{descendants.grandchildren.map(d => <Button size="sm" variant="secondary" key={d.id} onClick={() => setSelectedStrainId(d.id)}>{d.name}</Button>)}</div>
                                </div>}
                            </Card>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};