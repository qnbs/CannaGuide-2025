import React, { useState, useEffect, useMemo, memo, useRef } from 'react';
import { Strain, GenealogyNode, StrainType } from '@/types';
import { strainService } from '@/services/strainService';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/ui/ThemePrimitives';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { Button } from '@/components/common/Button';
import { useTranslation } from 'react-i18next';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { StrainCompactItem } from './StrainCompactItem';
import * as d3 from 'd3';
import { StrainDetailModal } from './StrainDetailModal';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { fetchAndBuildGenealogy } from '@/stores/slices/genealogySlice';

const typeColors: Record<StrainType, string> = {
    [StrainType.Sativa]: 'rgb(var(--color-accent-400))',
    [StrainType.Indica]: 'rgb(var(--color-primary-400))',
    [StrainType.Hybrid]: '#9ca3af', // slate-400
};

interface TreeViewProps {
    treeData: GenealogyNode;
    onNodeClick: (strainId: string) => void;
}

const TreeView: React.FC<TreeViewProps> = memo(({ treeData, onNodeClick }) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current) return;
        const svg = d3.select(svgRef.current);
        const g = svg.select<SVGGElement>('g.tree-container');

        const width = 800;
        let x0 = Infinity;
        let x1 = -x0;

        const root = d3.hierarchy(treeData, d => d.children);
        root.each(d => {
            if (d.x > x1) x1 = d.x;
            if (d.x < x0) x0 = d.x;
        });
        
        const dx = 25;
        const dy = width / (root.height + 1);
        
        const treeLayout = d3.tree<GenealogyNode>().nodeSize([dx, dy]);
        treeLayout(root);
        
        g.selectAll('.link')
            .data(root.links())
            .join('path')
            .attr('class', 'link')
            .attr('d', d3.linkHorizontal<d3.HierarchyLink<GenealogyNode>, d3.HierarchyPointNode<GenealogyNode>>()
                .x(d => d.y)
                .y(d => d.x) as any)
            .attr('fill', 'none')
            .attr('stroke', 'rgb(var(--color-border))')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', 1.5);
            
        const node = g.selectAll('.node')
            .data(root.descendants())
            .join('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.y},${d.x})`)
            .attr('cursor', 'pointer')
            .on('click', (event, d) => onNodeClick(d.data.id));

        node.append('circle')
            .attr('r', 5)
            .attr('fill', d => d.data.type ? typeColors[d.data.type] : '#718096')
            .attr('class', 'group-hover:stroke-primary-400')
            .attr('stroke-width', 2);

        node.append('text')
            .attr('dy', '0.31em')
            .attr('x', d => d.children ? -8 : 8)
            .attr('text-anchor', d => d.children ? "end" : "start")
            .attr('class', 'fill-current text-slate-300 group-hover:text-primary-300 text-xs font-mono')
            .text(d => d.data.name);

        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.5, 3])
            .on('zoom', (event) => {
                g.attr('transform', event.transform.toString());
            });

        svg.call(zoom);
        
        const bounds = g.node()?.getBBox();
        if (bounds) {
            const { x, y, width, height } = bounds;
            const svgWidth = 960;
            const svgHeight = 600;
            const scale = Math.min(1, 0.9 / Math.max(width / svgWidth, height / svgHeight));
            const translate: [number, number] = [
                svgWidth / 2 - scale * (x + width / 2),
                svgHeight / 2 - scale * (y + height / 2)
            ];

            svg.transition().duration(750).call(
                zoom.transform,
                d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
            );
        }
    }, [treeData, onNodeClick]);

    return (
        <div className="w-full h-[70vh] bg-slate-900/50 rounded-lg overflow-hidden border border-slate-700">
             <svg ref={svgRef} className="w-full h-full" viewBox={`0 0 960 600`}>
                <g className="tree-container" />
            </svg>
        </div>
    );
});

export const GenealogyView: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const [selectedStrain, setSelectedStrain] = useState<Strain | null>(null);
    const [modalStrain, setModalStrain] = useState<Strain | null>(null);
    const [allStrains, setAllStrains] = useState<Strain[]>([]);
    const [isListLoading, setIsListLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const { computedTrees, isLoading: isTreeLoading, error: treeError } = useAppSelector(state => state.genealogy);
    
    const treeData = useMemo(() => {
        if (selectedStrain && computedTrees[selectedStrain.id]) {
            return computedTrees[selectedStrain.id];
        }
        return null;
    }, [selectedStrain, computedTrees]);

    useEffect(() => {
        setIsListLoading(true);
        strainService.getAllStrains().then(strains => {
            setAllStrains(strains);
            setIsListLoading(false);
        });
    }, []);

    useEffect(() => {
        if (selectedStrain) {
            dispatch(fetchAndBuildGenealogy(selectedStrain.id));
        }
    }, [selectedStrain, dispatch]);
    
    const handleNodeClick = (strainId: string) => {
        const strainToShow = allStrains.find(s => s.id === strainId);
        if (strainToShow) {
            setModalStrain(strainToShow);
        }
    };

    const filteredStrains = useMemo(() => {
        if (!searchTerm) return allStrains;
        const lowerCaseSearch = searchTerm.toLowerCase();
        return allStrains.filter(s => s.name.toLowerCase().includes(lowerCaseSearch));
    }, [searchTerm, allStrains]);

    if (!selectedStrain) {
        return (
            <Card className="animate-fade-in">
                {modalStrain && <StrainDetailModal strain={modalStrain} onClose={() => setModalStrain(null)} />}
                <h3 className="text-xl font-bold font-display text-primary-400 mb-4">{t('strainsView.tabs.genealogy')}</h3>
                <p className="text-sm text-slate-400 mb-4">{t('strainsView.genealogy.selectStrain')}</p>
                <div className="relative mb-4">
                    <Input
                        type="text"
                        placeholder={t('strainsView.genealogy.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                    <PhosphorIcons.MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
                {isListLoading ? <SkeletonLoader count={5} /> : (
                    <ul className="max-h-[60vh] overflow-y-auto space-y-1 pr-2 -mr-2">
                        {filteredStrains.map(s => (
                            <li key={s.id}>
                                <StrainCompactItem strain={s} onClick={() => setSelectedStrain(s)} />
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        );
    }

    return (
        <Card className="animate-fade-in">
            {modalStrain && <StrainDetailModal strain={modalStrain} onClose={() => setModalStrain(null)} />}
            <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xl font-bold font-display text-primary-400">
                    {t('strainsView.tabs.genealogy')}: {selectedStrain.name}
                </h3>
                <Button variant="secondary" size="sm" onClick={() => setSelectedStrain(null)}>
                    <PhosphorIcons.ArrowLeft className="w-4 h-4 mr-1" />
                    {t('strainsView.genealogy.selectAnother')}
                </Button>
            </div>
            {isTreeLoading && <p>{t('strainsView.genealogy.buildingTree')}</p>}
            {treeError && <p className="text-red-400">{treeError}</p>}
            {treeData && !isTreeLoading && (
                <TreeView treeData={treeData} onNodeClick={handleNodeClick} />
            )}
        </Card>
    );
};