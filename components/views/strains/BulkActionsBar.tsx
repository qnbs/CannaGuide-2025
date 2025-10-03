import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';

interface BulkActionsBarProps {
    selectedCount: number;
    onClearSelection: () => void;
    onExport?: () => void;
    onAddToFavorites?: () => void;
    onRemoveFromFavorites?: () => void;
    onDelete?: () => void;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
    selectedCount,
    onClearSelection,
    onExport,
    onAddToFavorites,
    onRemoveFromFavorites,
    onDelete,
}) => {
    const { t } = useTranslation();

    return (
        <div className="sticky bottom-20 sm:bottom-4 z-10 animate-fade-in-up">
            <div className="glass-pane max-w-fit mx-auto p-2 rounded-lg flex items-center gap-2">
                <span className="text-sm font-semibold px-2">{t('strainsView.selectedCount', { count: selectedCount })}</span>
                
                {onAddToFavorites && (
                    <Button size="sm" variant="secondary" onClick={onAddToFavorites} title={t('strainsView.bulkActions.addToFavorites')}>
                        <PhosphorIcons.Heart weight="fill" className="w-4 h-4" />
                    </Button>
                )}
                {onRemoveFromFavorites && (
                    <Button size="sm" variant="secondary" onClick={onRemoveFromFavorites} title={t('strainsView.bulkActions.removeFromFavorites')}>
                        <PhosphorIcons.Heart className="w-4 h-4" />
                    </Button>
                )}
                 {onExport && (
                    <Button size="sm" variant="secondary" onClick={onExport} title={t('common.export')}>
                        <PhosphorIcons.DownloadSimple className="w-4 h-4" />
                    </Button>
                )}
                {onDelete && (
                     <Button size="sm" variant="danger" onClick={onDelete} title={t('common.delete')}>
                        <PhosphorIcons.TrashSimple className="w-4 h-4" />
                    </Button>
                )}
                
                <div className="w-px h-6 bg-slate-600 mx-1"></div>
                
                <Button size="sm" variant="secondary" onClick={onClearSelection} title={t('strainsView.clearSelection')}>
                    <PhosphorIcons.X className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
};
