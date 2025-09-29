import React, { useState } from 'react';
import { SavedSetup, ExportFormat } from '@/types';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { exportService } from '@/services/exportService';
import { EditResponseModal } from '@/components/common/EditResponseModal';
// FIX: Import Redux hooks and actions for state management
import { useAppDispatch } from '@/stores/store';
import { addNotification } from '@/stores/slices/uiSlice';

interface SavedSetupsViewProps {
    savedSetups: SavedSetup[];
    updateSetup: (updatedSetup: SavedSetup) => void;
    deleteSetup: (setupId: string) => void;
}

export const SavedSetupsView: React.FC<SavedSetupsViewProps> = ({ savedSetups, updateSetup, deleteSetup }) => {
    const { t } = useTranslation();
    const [editingSetup, setEditingSetup] = useState<SavedSetup | null>(null);
    const dispatch = useAppDispatch();

    const handleExport = (setup: SavedSetup, format: ExportFormat) => {
        // FIX: Removed extra `t` argument from exportService call. The service handles its own translations.
        exportService.exportSetup(setup, format);
        dispatch(addNotification({ message: t('common.successfullyExported_one', { format: format.toUpperCase() }), type: 'success' }));
    };

    const handleDelete = (id: string) => {
        if (window.confirm(t('equipmentView.savedSetups.deleteConfirm'))) {
            deleteSetup(id);
        }
    };

    const handleUpdateSave = (updated: { id: string, title: string, content: string }) => {
        if (!editingSetup) return;
        const updatedSetupData: SavedSetup = { ...editingSetup, name: updated.title };
        updateSetup(updatedSetupData);
        setEditingSetup(null);
    };
    
    const sortedSetups = [...savedSetups].sort((a, b) => b.createdAt - a.createdAt);

    return (
        <Card>
            {editingSetup && (
                <EditResponseModal
                    response={{ ...editingSetup, title: editingSetup.name, content: '' }}
                    onClose={() => setEditingSetup(null)}
                    onSave={handleUpdateSave}
                    title={t('equipmentView.savedSetups.editTitle')}
                />
            )}
            <h2 className="text-2xl font-bold text-primary-400 mb-4">{t('equipmentView.tabs.setups')}</h2>
            {sortedSetups.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                    <PhosphorIcons.ArchiveBox className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                    <h3 className="font-semibold">{t('equipmentView.savedSetups.noSetups.title')}</h3>
                    <p className="text-sm">{t('equipmentView.savedSetups.noSetups.subtitle')}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {sortedSetups.map(setup => (
                        <Card key={setup.id} className="p-4 bg-slate-800/50">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-grow">
                                    <h3 className="font-bold text-lg text-slate-100">{setup.name}</h3>
                                    <p className="text-xs text-slate-400">
                                        {new Date(setup.createdAt).toLocaleString()} | {t('equipmentView.configurator.total')}: {setup.totalCost.toFixed(2)}{t('common.units.currency_eur')}
                                    </p>
                                    <p className="text-sm text-slate-300 mt-2">
                                        {t('equipmentView.configurator.resultsSubtitle', {
                                            area: setup.sourceDetails.area,
                                            budget: t(`equipmentView.configurator.budgets.${setup.sourceDetails.budget}`),
                                            style: t(`equipmentView.configurator.styles.${setup.sourceDetails.growStyle}`),
                                        })}
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                                    <Button size="sm" variant="secondary" onClick={() => handleExport(setup, 'pdf')}><PhosphorIcons.FilePdf className="w-4 h-4"/></Button>
                                    <Button size="sm" variant="secondary" onClick={() => setEditingSetup(setup)}><PhosphorIcons.PencilSimple className="w-4 h-4"/></Button>
                                    <Button size="sm" variant="danger" onClick={() => handleDelete(setup.id)}><PhosphorIcons.TrashSimple className="w-4 h-4"/></Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </Card>
    );
};