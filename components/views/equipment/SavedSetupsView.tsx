import React, { useState, memo, useMemo } from 'react';
import { SavedSetup, ExportFormat } from '@/types';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { EditSetupModal } from './EditSetupModal';
import { SetupCard } from './SetupCard';
import { Input } from '@/components/ui/ThemePrimitives';
import { Button } from '@/components/common/Button';
import { exportService } from '@/services/exportService';
import { DataExportModal } from '@/components/common/DataExportModal';
import { useAppDispatch } from '@/stores/store';
import { addNotification } from '@/stores/slices/uiSlice';

interface SavedSetupsViewProps {
    savedSetups: SavedSetup[];
    updateSetup: (updatedSetup: SavedSetup) => void;
    deleteSetup: (setupId: string) => void;
}

const SavedSetupsViewComponent: React.FC<SavedSetupsViewProps> = ({ savedSetups, updateSetup, deleteSetup }) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const [editingSetup, setEditingSetup] = useState<SavedSetup | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    
    const handleUpdateSave = (updatedSetup: SavedSetup) => {
        updateSetup(updatedSetup);
        setEditingSetup(null);
    };

    const filteredSetups = useMemo(() => {
        const lowerCaseSearch = searchTerm.toLowerCase();
        if (!lowerCaseSearch) {
            return [...savedSetups].sort((a, b) => b.createdAt - a.createdAt);
        }
        return [...savedSetups]
            .filter(setup => setup.name.toLowerCase().includes(lowerCaseSearch))
            .sort((a, b) => b.createdAt - a.createdAt);
    }, [savedSetups, searchTerm]);
    
    const handleExport = (source: 'selected' | 'all', format: ExportFormat) => {
        if (window.confirm(t('common.exportConfirm'))) {
            // In this view, there's no selection, so we always export all filtered items.
            if (filteredSetups.length === 0) {
                 dispatch(addNotification({ message: t('common.noDataToExport'), type: 'error' }));
                 return;
            }
            exportService.exportSetups(filteredSetups, format, 'cannaguide-setups');
            dispatch(addNotification({ message: t('common.successfullyExported_other', { count: filteredSetups.length, format }), type: 'success' }));
        }
        setIsExportModalOpen(false);
    }

    return (
        <div>
            {editingSetup && (
                <EditSetupModal
                    setup={editingSetup}
                    onClose={() => setEditingSetup(null)}
                    onSave={handleUpdateSave}
                />
            )}
            <DataExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onExport={handleExport}
                title={t('equipmentView.tabs.setups')}
                selectionCount={0} // This view doesn't have multi-select
                totalCount={filteredSetups.length}
            />
             <div className="flex flex-col sm:flex-row gap-2 justify-between sm:items-center mb-4">
                <h2 className="text-2xl font-bold text-primary-400">{t('equipmentView.tabs.setups')}</h2>
                <div className="flex items-center gap-2">
                    <div className="relative flex-grow">
                        <Input type="text" placeholder={t('equipmentView.savedSetups.searchPlaceholder')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8 !py-1.5 w-full sm:w-auto" />
                        <PhosphorIcons.MagnifyingGlass className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                     <Button variant="secondary" onClick={() => setIsExportModalOpen(true)} disabled={filteredSetups.length === 0}><PhosphorIcons.DownloadSimple className="w-5 h-5"/></Button>
                </div>
            </div>
            
            {savedSetups.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                    <PhosphorIcons.ArchiveBox className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                    <h3 className="font-semibold">{t('equipmentView.savedSetups.noSetups.title')}</h3>
                    <p className="text-sm">{t('equipmentView.savedSetups.noSetups.subtitle')}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredSetups.map(setup => (
                        <SetupCard
                            key={setup.id}
                            setup={setup}
                            onEdit={() => setEditingSetup(setup)}
                            onDelete={() => {
                                if (window.confirm(t('equipmentView.savedSetups.deleteConfirm'))) {
                                    deleteSetup(setup.id);
                                }
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const SavedSetupsView = memo(SavedSetupsViewComponent);