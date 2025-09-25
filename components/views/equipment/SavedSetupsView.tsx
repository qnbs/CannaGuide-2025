import React, { useState, useId } from 'react';
import { SavedSetup, RecommendationCategory, RecommendationItem, ExportFormat } from '@/types';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslations } from '@/hooks/useTranslations';
import { useAppStore } from '@/stores/useAppStore';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { exportService } from '@/services/exportService';
import { DataExportModal } from '@/components/common/DataExportModal';

interface SavedSetupsViewProps {
    savedSetups: SavedSetup[];
    updateSetup: (setup: SavedSetup) => void;
    deleteSetup: (id: string) => void;
}

const SetupDetailModal: React.FC<{
    setup: SavedSetup;
    onClose: () => void;
    onUpdate: (updatedSetup: SavedSetup) => void;
}> = ({ setup, onClose, onUpdate }) => {
    const { t } = useTranslations();
    const [isEditing, setIsEditing] = useState(false);
    const [editedSetup, setEditedSetup] = useState<SavedSetup>(JSON.parse(JSON.stringify(setup)));
    const baseId = useId();
    const modalRef = useFocusTrap(true);

    const categoryLabels: Record<RecommendationCategory, string> = {
        tent: t('equipmentView.configurator.categories.tent'),
        light: t('equipmentView.configurator.categories.light'),
        ventilation: t('equipmentView.configurator.categories.ventilation'),
        pots: t('equipmentView.configurator.categories.pots'),
        soil: t('equipmentView.configurator.categories.soil'),
        nutrients: t('equipmentView.configurator.categories.nutrients'),
        extra: t('equipmentView.configurator.categories.extra')
    };
    
    const handleItemChange = (category: RecommendationCategory, field: keyof RecommendationItem | 'name' | 'price', value: string | number) => {
        setEditedSetup(prev => {
            const newRec = { ...prev.recommendation };
            (newRec[category] as any)[field] = value;

            if (field === 'price') {
                 const newTotal = Object.values(newRec).reduce((sum: number, item: RecommendationItem) => sum + (Number(item.price) || 0), 0);
                 return { ...prev, recommendation: newRec, totalCost: newTotal };
            }
            
            return { ...prev, recommendation: newRec };
        });
    };

    const handleSave = () => {
        onUpdate(editedSetup);
        setIsEditing(false);
    };

    const inputClasses = (editing: boolean) => 
      `w-full bg-transparent text-slate-200 ${editing ? 'bg-slate-800 p-1 rounded border border-slate-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition' : 'pointer-events-none'}`;
    
    const priceInputClasses = (editing: boolean) => 
      `w-20 bg-transparent text-right text-slate-200 ${editing ? 'bg-slate-800 p-1 rounded border border-slate-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition' : 'pointer-events-none'}`;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-overlay-animate" onClick={onClose}>
            <Card ref={modalRef} className="w-full max-w-2xl modal-content-animate" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-primary-400">{isEditing ? t('equipmentView.savedSetups.modal.editMode') : t('equipmentView.savedSetups.modal.title')}</h2>
                        <input type="text" value={editedSetup.name} id={`${baseId}-name`} name="setup-name" onChange={e => setEditedSetup(p => ({...p, name: e.target.value}))} disabled={!isEditing} className={`text-slate-100 text-lg font-semibold w-full ${isEditing ? 'bg-slate-800 border-b border-slate-500 rounded-t p-1 -m-1' : 'bg-transparent'}`} />
                    </div>
                    <Button size="sm" onClick={() => setIsEditing(!isEditing)}>{isEditing ? t('common.cancel') : t('common.edit')}</Button>
                </div>

                <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-700">
                                <th className="text-left py-2 font-semibold">{t('equipmentView.savedSetups.modal.item')}</th>
                                <th className="text-left py-2 font-semibold">{t('common.details')}</th>
                                <th className="text-right py-2 font-semibold">{`${t('equipmentView.savedSetups.modal.price')} (${t('common.units.currency_eur')})`}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(Object.keys(editedSetup.recommendation) as RecommendationCategory[]).map(key => {
                                const item = editedSetup.recommendation[key];
                                return (
                                    <tr key={key} className="border-b border-slate-800">
                                        <td className="py-2 font-bold text-slate-200">{categoryLabels[key]}</td>
                                        <td className="py-2">
                                            <input type="text" value={item.name} id={`${baseId}-${key}-name`} name={`${key}-name`} onChange={e => handleItemChange(key, 'name', e.target.value)} disabled={!isEditing} className={inputClasses(isEditing)} />
                                            {item.watts && <span className="text-xs text-slate-400">({item.watts}W)</span>}
                                        </td>
                                        <td className="py-2 text-right">
                                             <input type="number" value={item.price} id={`${baseId}-${key}-price`} name={`${key}-price`} onChange={e => handleItemChange(key, 'price', Number(e.target.value))} disabled={!isEditing} className={priceInputClasses(isEditing)} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700">
                    <span className="font-bold">{t('equipmentView.configurator.total')}: {editedSetup.totalCost.toFixed(2)} {t('common.units.currency_eur')}</span>
                    <div>
                        {isEditing && <Button onClick={handleSave} className="mr-2">{t('equipmentView.savedSetups.modal.saveChanges')}</Button>}
                        <Button variant="secondary" onClick={onClose}>{t('common.close')}</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};


export const SavedSetupsView: React.FC<SavedSetupsViewProps> = ({ savedSetups, updateSetup, deleteSetup }) => {
    const { t } = useTranslations();
    const addNotification = useAppStore(state => state.addNotification);
    const [selectedSetup, setSelectedSetup] = useState<SavedSetup | null>(null);
    const [selectedIds, setSelectedIds] = useState(new Set<string>());
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    
    const handleActionClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    };

    const handleDelete = (setup: SavedSetup) => {
        if (window.confirm(t('equipmentView.savedSetups.deleteConfirm', { name: setup.name }))) {
            deleteSetup(setup.id);
            addNotification(t('equipmentView.savedSetups.deleteSuccess', { name: setup.name }), 'success');
        }
    };

    const handleUpdate = (updatedSetup: SavedSetup) => {
        try {
            updateSetup(updatedSetup);
            addNotification(t('equipmentView.savedSetups.updateSuccess', { name: updatedSetup.name }), 'success');
            setSelectedSetup(null); // Close modal
        } catch (e) {
            addNotification(t('equipmentView.savedSetups.updateError'), 'error');
            console.error(e);
        }
    };

    const handleBulkExport = (source: 'selected' | 'all', format: ExportFormat) => {
        const setupsToExport = source === 'selected' 
            ? savedSetups.filter(s => selectedIds.has(s.id))
            : sortedSetups;
        
        if (setupsToExport.length === 0) {
            addNotification(t('common.noDataToExport'), 'error');
            return;
        }

        // FIX: Correctly call the export service with a generated filename. The 'exportSetups' function was missing.
        const filename = `CannaGuide_Setups_${new Date().toISOString().slice(0, 10)}`;
        exportService.exportSetups(setupsToExport, format, filename, t);
        addNotification(t('equipmentView.savedSetups.exportSuccess', { name: `${setupsToExport.length} setups` }), 'success');
    };
    
    const sortedSetups = [...savedSetups].sort((a, b) => b.createdAt - a.createdAt);

    return (
        <div className="mt-6">
             {selectedSetup && <SetupDetailModal setup={selectedSetup} onClose={() => setSelectedSetup(null)} onUpdate={handleUpdate} />}
             <DataExportModal 
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onExport={handleBulkExport}
                title={t('equipmentView.savedSetups.exportTitle')}
                selectionCount={selectedIds.size}
                totalCount={sortedSetups.length}
            />

            <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xl font-bold font-display text-primary-400">{t('equipmentView.tabs.setups')}</h3>
                 <Button onClick={() => setIsExportModalOpen(true)} disabled={savedSetups.length === 0}>
                     <PhosphorIcons.DownloadSimple className="w-5 h-5 mr-1.5" />
                     {t('common.export')}
                 </Button>
            </div>
            
            {sortedSetups.length === 0 ? (
                <Card className="text-center py-10 text-slate-500">
                    <PhosphorIcons.Archive className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                    <h3 className="font-semibold">{t('equipmentView.savedSetups.noSetups.title')}</h3>
                    <p className="text-sm">{t('equipmentView.savedSetups.noSetups.subtitle')}</p>
                </Card>
            ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedSetups.map(setup => (
                        <Card key={setup.id} className="flex flex-col cursor-pointer p-0 overflow-hidden" onClick={() => setSelectedSetup(setup)}>
                             <div className="p-3 flex-grow">
                                <div className="flex items-start justify-between">
                                    <h3 className="font-bold text-lg text-primary-400 truncate pr-2">{setup.name}</h3>
                                     <input 
                                        type="checkbox" 
                                        checked={selectedIds.has(setup.id)}
                                        onChange={() => setSelectedIds(prev => {
                                            const newSet = new Set(prev);
                                            if (newSet.has(setup.id)) newSet.delete(setup.id);
                                            else newSet.add(setup.id);
                                            return newSet;
                                        })}
                                        onClick={e => e.stopPropagation()}
                                        className="h-5 w-5 rounded border-slate-500 bg-slate-700 text-primary-500 focus:ring-primary-500 flex-shrink-0"
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mb-2">{new Date(setup.createdAt).toLocaleString()}</p>
                                <div className="text-sm text-slate-300 flex items-center gap-3 my-2">
                                <span className="flex items-center gap-1" title="Area"><PhosphorIcons.Cube/> {setup.sourceDetails.area}cm</span>
                                <span className="flex items-center gap-1" title="Style"><PhosphorIcons.Leafy/> {setup.sourceDetails.growStyle}</span>
                                <span className="flex items-center gap-1" title="Budget"><PhosphorIcons.Drop/> {setup.sourceDetails.budget}</span>
                                </div>
                                <p className="text-2xl font-bold text-right my-3">{setup.totalCost.toFixed(2)} {t('common.units.currency_eur')}</p>
                            </div>
                            <div className="flex gap-2 mt-auto p-3 bg-slate-900/50 border-t border-slate-700">
                                <Button size="sm" variant="secondary" className="flex-1" onClick={(e) => handleActionClick(e, () => setSelectedSetup(setup))}>
                                     {t('common.details')}
                                </Button>
                                <Button size="sm" variant="danger" onClick={(e) => handleActionClick(e, () => handleDelete(setup))} aria-label={t('common.deleteSetup')}>
                                     <PhosphorIcons.TrashSimple className="w-4 h-4" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};