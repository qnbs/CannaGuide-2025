import React, { useState, useRef } from 'react';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslation } from 'react-i18next';
import { useOutsideClick } from '@/hooks/useOutsideClick';

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
    const [isFavMenuOpen, setIsFavMenuOpen] = useState(false);
    const favMenuRef = useOutsideClick<HTMLDivElement>(() => setIsFavMenuOpen(false));

    return (
        <div className="fixed bottom-[72px] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-2xl z-20 animate-slide-in-up">
            <div className="glass-pane rounded-lg p-2 flex items-center justify-between gap-2 shadow-2xl">
                <div className="flex items-center gap-3">
                    <button onClick={onClearSelection} className="p-2 rounded-full hover:bg-slate-700 transition-colors" aria-label={t('strainsView.clearSelection')}>
                        <PhosphorIcons.X className="w-5 h-5 text-slate-300" />
                    </button>
                    <span className="font-semibold text-slate-100">{t('strainsView.selectedCount', { count: selectedCount })}</span>
                </div>
                <div className="flex items-center gap-2">
                    {onAddToFavorites && onRemoveFromFavorites && (
                        <div className="relative" ref={favMenuRef}>
                            <Button size="sm" variant="secondary" onClick={() => setIsFavMenuOpen(!isFavMenuOpen)}>
                                <PhosphorIcons.Heart className="w-4 h-4 mr-1.5" />
                                <span className="hidden sm:inline">{t('common.manageFavorites')}</span>
                                <PhosphorIcons.ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isFavMenuOpen ? 'rotate-180' : ''}`} />
                            </Button>
                            {isFavMenuOpen && (
                                <div className="absolute bottom-full right-0 mb-2 w-56 bg-slate-800 border border-slate-700 rounded-md shadow-lg py-1 animate-fade-in">
                                    <button onClick={() => { onAddToFavorites(); setIsFavMenuOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-slate-700">
                                        <PhosphorIcons.Heart className="w-4 h-4 text-primary-400" /> {t('strainsView.bulkActions.addToFavorites')}
                                    </button>
                                    <button onClick={() => { onRemoveFromFavorites(); setIsFavMenuOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-slate-700">
                                         <PhosphorIcons.Heart weight="fill" className="w-4 h-4 text-red-400" /> {t('strainsView.bulkActions.removeFromFavorites')}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {onExport && (
                        <Button size="sm" variant="secondary" onClick={onExport}>
                            <PhosphorIcons.DownloadSimple className="w-4 h-4 mr-1.5" />
                            <span className="hidden sm:inline">{t('common.export')}</span>
                        </Button>
                    )}

                    {onDelete && (
                         <Button size="sm" variant="danger" onClick={onDelete}>
                            <PhosphorIcons.TrashSimple className="w-4 h-4 mr-1.5" />
                            <span className="hidden sm:inline">{t('common.delete')}</span>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};