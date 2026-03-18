import React, { memo, useCallback } from 'react';
import { GenealogyNode, StrainType } from '@/types';
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslation } from 'react-i18next';
import type { HierarchyNode } from 'd3-hierarchy';

interface StrainTreeNodeProps {
  node: HierarchyNode<GenealogyNode>;
  onNodeClick: (nodeData: GenealogyNode) => void;  // opens strain detail modal
  onNodeFocus: (nodeData: GenealogyNode) => void;  // pans tree to centre this node
  onToggle: (nodeId: string) => void;
}

const typeInfo: Record<StrainType, { icon: React.ReactNode; color: string }> = {
    [StrainType.Sativa]: { icon: <SativaIcon className="w-full h-full" />, color: 'text-amber-400' },
    [StrainType.Indica]: { icon: <IndicaIcon className="w-full h-full" />, color: 'text-indigo-400' },
    [StrainType.Hybrid]: { icon: <HybridIcon className="w-full h-full" />, color: 'text-blue-400' },
};

export const StrainTreeNode: React.FC<StrainTreeNodeProps> = memo(({ node, onNodeClick, onNodeFocus, onToggle }) => {
    const { t } = useTranslation();
    const { data } = node;
    const isExpandable = !!data._children && data._children.length > 0;
    const isCollapsible = !!data.children && data.children.length > 0;
    const isPlaceholder = data.isPlaceholder;
    const { icon, color } = typeInfo[data.type] || typeInfo.Hybrid;
    const thcPercentage = Math.min(100, (data.thc / 35) * 100);

    const handleFocusClick = () => {
        if (!isPlaceholder) onNodeFocus(data);
    };

    const handleDetailClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isPlaceholder) onNodeClick(data);
    };

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!isPlaceholder) onNodeFocus(data);
            }
        },
        [data, isPlaceholder, onNodeFocus],
    );

    try {
    return (
        <div
            className={`genealogy-node-container ${isPlaceholder ? 'placeholder' : ''}`}
            onClick={handleFocusClick}
            onKeyDown={handleKeyDown}
            role="treeitem"
            tabIndex={0}
            aria-label={t('common.accessibility.genealogyTreeNode', {
                name: data.name,
                type: data.type,
                thc: data.thc?.toFixed(1),
            })}
            aria-expanded={isExpandable || isCollapsible ? isCollapsible : undefined}
        >
            <div className="flex items-center gap-2">
                <div className={`w-5 h-5 flex-shrink-0 ${color}`}>{icon}</div>
                <div className="flex flex-col min-w-0 flex-1">
                    <div className="font-bold text-slate-100 truncate" title={data.name}>
                        {data.name}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                        <span>{data.type}</span>
                        {data.isLandrace && (
                            <span className="text-green-400 font-semibold" title={t('strainsView.landraceStrain')}>
                                L
                            </span>
                        )}
                    </div>
                </div>
                {!isPlaceholder && (
                    <button
                        className="flex-shrink-0 p-0.5 rounded text-slate-400 hover:text-primary-300 hover:bg-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                        onClick={handleDetailClick}
                        aria-label={t('common.accessibility.openStrainDetails') + ': ' + data.name}
                        title={t('common.accessibility.openStrainDetails')}
                    >
                        <PhosphorIcons.Info className="w-4 h-4" />
                    </button>
                )}
            </div>
            {!isPlaceholder && (
                <div className="genealogy-node-thc-bar" title={`THC: ${data.thc?.toFixed(1)}%`}>
                    <div
                        className="genealogy-node-thc-fill"
                        style={{ width: `${thcPercentage}%` }}
                    ></div>
                </div>
            )}
            {(isExpandable || isCollapsible) && (
                <button
                    className="genealogy-node-expand-btn focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle(data.id);
                    }}
                    aria-label={isCollapsible
                        ? t('common.accessibility.collapseAncestors', { name: data.name })
                        : t('common.accessibility.expandAncestors', { name: data.name })
                    }
                >
                    {isCollapsible ? <PhosphorIcons.Minus className="w-4 h-4" /> : <PhosphorIcons.Plus className="w-4 h-4" />}
                </button>
            )}
        </div>
    );
    } catch {
        return <div className="text-red-400 text-xs p-1">{t('strainsView.genealogyView.nodeError')}</div>;
    }
});
StrainTreeNode.displayName = 'StrainTreeNode';
