import React, { useState, memo } from 'react';
import { SavedSetup } from '@/types';
import { useTranslation } from 'react-i18next';
import { SetupCard } from './SetupCard';
import { EditSetupModal } from './EditSetupModal';
import { Card } from '@/components/common/Card';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { Button } from '@/components/common/Button';
import { DataExportModal, SimpleExportFormat } from '@/components/common/DataExportModal';
import { useAppDispatch } from '@/stores/store';
import { exportSetups } from '@/stores/slices/savedItemsSlice';

interface SavedSetupsViewProps {
    savedSetups: SavedSetup[];
    updateSetup: (setup: SavedSetup) => void;
    deleteSetup: (id: string) => void;
}

const SavedSetupsViewComponent: React.FC<SavedSetupsViewProps> = ({ savedSetups, updateSetup, deleteSetup }) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const [editingSetup, setEditingSetup] = useState<SavedSetup | null>(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    const handleSave = (updatedSetup: SavedSetup) => {
        updateSetup(updatedSetup);
        setEditingSetup(null);
    };
    
    const onExport = (format: SimpleExportFormat) => {
        const fileName = `CannaGuide_Setups_${new Date().toISOString().slice(0, 10)}`;
        dispatch(exportSetups({ setups: savedSetups, format, fileName }));
        setIsExportModalOpen(false);
    };
    
    const sortedSetups = [...savedSetups].sort((a, b) => b.createdAt - a.createdAt);

    if (sortedSetups.length === 0) {
        return (
            <Card className="text-center py-10 text-slate-500">
                <PhosphorIcons.Archive className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                <h3 className="font-semibold text-slate-300">{t('equipmentView.savedSetups.noSetups.title')}</h3>
                <p className="text-sm">{t('equipmentView.savedSetups.noSetups.subtitle')}</p>
            </Card>
        );
    }
    
    return (
        <div className="space-y-4">
            {editingSetup && (
                <EditSetupModal 
                    setup={editingSetup} 
                    onClose={() => setEditingSetup(null)}
                    onSave={handleSave}
                />
            )}
            <DataExportModal 
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onExport={onExport}
                title={t('equipmentView.savedSetups.exportTitle')}
                selectionCount={0} // Simple export, no selection needed for now
                totalCount={savedSetups.length}
                translationBasePath="equipmentView.exportModal"
            />
            <div className="flex justify-end">
                <Button onClick={() => setIsExportModalOpen(true)} disabled={savedSetups.length === 0}>
                    <PhosphorIcons.DownloadSimple className="w-5 h-5 mr-2" />
                    {t('common.export')}
                </Button>
            </div>
            {sortedSetups.map(setup => (
                <SetupCard 
                    key={setup.id} 
                    setup={setup} 
                    onEdit={() => setEditingSetup(setup)} 
                    onDelete={deleteSetup}
                />
            ))}
        </div>
    );
};

export const SavedSetupsView = memo(SavedSetupsViewComponent);
export default SavedSetupsView;