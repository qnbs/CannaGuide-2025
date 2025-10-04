import React, { memo } from 'react';
import { GenealogyNode, StrainType } from '@/types';
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import type { HierarchyNode } from 'd3';

interface StrainTreeNodeProps {
  node: HierarchyNode<GenealogyNode>;
  onNodeClick: (nodeData: GenealogyNode) => void;
  onExpand: (nodeId: string) => void;
}

const typeInfo: Record<StrainType, { icon: React.ReactNode; color: string }> = {
    [StrainType.Sativa]: { icon: <SativaIcon className="w-full h-full" />, color: 'text-amber-400' },
    [StrainType.Indica]: { icon: <IndicaIcon className="w-full h-full" />, color: 'text-indigo-400' },
    [StrainType.Hybrid]: { icon: <HybridIcon className="w-full h-full" />, color: 'text-blue-400' },
};

export const StrainTreeNode: React.FC<StrainTreeNodeProps> = memo(({ node, onNodeClick, onExpand }) => {
    const { data } = node;
    const isExpandable = !!data._children && data._children.length > 0;
    const isPlaceholder = data.isPlaceholder;
    const { icon, color } = typeInfo[data.type] || typeInfo.Hybrid;
    const thcPercentage = Math.min(100, (data.thc / 35) * 100);

    const handleNodeClick = () => {
        if (!isPlaceholder) {
            onNodeClick(data);
        }
    };

    return (
        <div
            className={`genealogy-node-container ${isPlaceholder ? 'placeholder' : ''}`}
            onClick={handleNodeClick}
        >
            <div className="flex items-center gap-2">
                <div className={`w-5 h-5 flex-shrink-0 ${color}`}>{icon}</div>
                <div className="flex flex-col min-w-0">
                    <div className="font-bold text-slate-100 truncate" title={data.name}>
                        {data.name}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                        <span>{data.type}</span>
                        {data.isLandrace && (
                            <span className="text-green-400 font-semibold" title="Landrace Strain">
                                L
                            </span>
                        )}
                    </div>
                </div>
            </div>
            {!isPlaceholder && (
                <div className="genealogy-node-thc-bar mt-1" title={`THC: ${data.thc?.toFixed(1)}%`}>
                    <div
                        className="genealogy-node-thc-fill"
                        style={{ width: `${thcPercentage}%` }}
                    ></div>
                </div>
            )}
            {isExpandable && (
                <button
                    className="genealogy-node-expand-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        onExpand(data.id);
                    }}
                    title="Expand Ancestors"
                >
                    <PhosphorIcons.Plus className="w-4 h-4" />
                </button>
            )}
        </div>
    );
});