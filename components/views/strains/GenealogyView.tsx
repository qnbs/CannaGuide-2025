import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { Strain, GenealogyNode } from '@/types';
import { geneticsService } from '@/services/geneticsService';
import { useTranslation } from 'react-i18next';
import * as d3 from 'd3';
import { Card } from '@/components/common/Card';
import { Select } from '@/components/ui/ThemePrimitives';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';

interface GenealogyViewProps {
    allStrains: Strain[];
    onNodeClick: (strain: Strain) => void;
}

const GenealogyViewComponent: React.FC<GenealogyViewProps> = ({ allStrains, onNodeClick }) => {
    const { t } = useTranslation();
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedStrainId, setSelectedStrainId] = useState<string | null>(null);
    const [treeData, setTreeData] = useState<GenealogyNode | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const strainOptions = useMemo(() => 
        allStrains
            .map(s => ({ value: s.id, label: s.name }))
            .sort((a, b) => a.label.localeCompare(b.label)),
    [allStrains]);

    useEffect(() => {
        if (selectedStrainId) {
            setIsLoading(true);
            // Simulate async operation for better UX
            setTimeout(() => {
                const data = geneticsService.buildGenealogyTree(selectedStrainId, allStrains);
                setTreeData(data);
                setIsLoading(false);
            }, 50);
        } else {
            setTreeData(null);
        }
    }, [selectedStrainId, allStrains]);

    useEffect(() => {
        if (treeData && svgRef.current && containerRef.current) {
            const svg = d3.select(svgRef.current);
            svg.selectAll("*").remove(); 

            const width = containerRef.current.clientWidth;
            const containerHeight = containerRef.current.clientHeight;

            svg.attr('viewBox', [-width / 4, -containerHeight / 2, width, containerHeight]);

            const root = d3.hierarchy(treeData);
            const dx = 25;
            const dy = Math.max(120, width / (root.height + 1));
            const treeLayout = d3.tree<GenealogyNode>().nodeSize([dx, dy]);
            treeLayout(root);

            const g = svg.append("g");

            g.append("g")
                .attr("fill", "none")
                .attr("stroke", "rgb(var(--color-border))")
                .attr("stroke-opacity", 0.6)
                .attr("stroke-width", 1.5)
                .selectAll("path")
                .data(root.links())
                .join("path")
                .attr("d", d3.linkHorizontal<d3.HierarchyPointLink<GenealogyNode>, d3.HierarchyPointNode<GenealogyNode>>()
                    .x(d => d.y)
                    .y(d => d.x) as any);

            const node = g.append("g")
                .selectAll("g")
                .data(root.descendants())
                .join("g")
                .attr("transform", d => `translate(${d.y},${d.x})`)
                .style("cursor", "pointer")
                .on("click", (event, d) => {
                    const strain = allStrains.find(s => s.id === d.data.id);
                    if (strain) {
                        onNodeClick(strain);
                    }
                });

            node.append("circle")
                .attr("fill", d => d.children ? "rgb(var(--color-bg-component))" : "rgb(var(--color-neutral-800))")
                .attr("stroke", "rgb(var(--color-primary-500))")
                .attr("stroke-width", 1.5)
                .attr("r", 6);

            node.append("text")
                .attr("dy", "0.31em")
                .attr("x", d => d.children ? -12 : 12)
                .attr("text-anchor", d => d.children ? "end" : "start")
                .text(d => d.data.name)
                .attr("fill", "rgb(var(--color-neutral-300))")
                .style("font-size", "11px")
                .clone(true).lower()
                .attr("stroke", "rgb(var(--color-bg-primary))")
                .attr("stroke-width", 3);

            const zoom = d3.zoom<SVGSVGElement, unknown>()
                .scaleExtent([0.2, 3])
                .on("zoom", (event) => {
                    g.attr("transform", event.transform);
                });
            
            svg.call(zoom);
            
            const initialTransform = d3.zoomIdentity.translate(50, containerHeight / 2);
            svg.call(zoom.transform as any, initialTransform);
        }
    }, [treeData, allStrains, onNodeClick]);

    return (
        <Card>
            <h3 className="text-xl font-bold font-display text-primary-400">{t('strainsView.genealogyView.title')}</h3>
            <p className="text-sm text-slate-400 mb-4">{t('strainsView.genealogyView.description')}</p>
            
            <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-300 mb-1">{t('strainsView.genealogyView.selectStrain')}</label>
                <Select
                    value={selectedStrainId || ''}
                    onChange={(e) => setSelectedStrainId(e.target.value)}
                    options={[{ value: '', label: t('strainsView.genealogyView.selectStrain') }, ...strainOptions]}
                />
            </div>
            
            <div ref={containerRef} className="w-full h-[600px] bg-slate-900/50 rounded-lg overflow-hidden border border-slate-700/50">
                {isLoading && <div className="p-8"><SkeletonLoader count={5} /></div>}
                {!isLoading && !treeData && (
                    <div className="flex items-center justify-center h-full text-slate-500">
                        {selectedStrainId ? t('strainsView.genealogyView.loadingTree') : t('strainsView.genealogyView.noStrainSelected')}
                    </div>
                )}
                <svg ref={svgRef} className="w-full h-full"></svg>
            </div>
        </Card>
    );
};

export const GenealogyView = memo(GenealogyViewComponent);