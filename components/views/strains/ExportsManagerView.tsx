import React, { useState } from 'react';
import { Strain, SavedExport, ExportFormat } from '@/types';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { exportService } from '@/services/exportService';
import { useTranslation } from 'react-i18next';
import { EditResponseModal } from '@/components/common/EditResponseModal';
import { BulkActionsBar } from './BulkActionsBar';
import { useAppDispatch } from '@/stores/store';
import { addNotification } from '@/stores/slices/uiSlice';

interface ExportsManagerViewProps {
    savedExports: SavedExport[];
    deleteExport: (id: string) => void;
    updateExport: (updatedExport: SavedExport) => void;
    allStrains: Strain[];
    onOpenExportModal: () => void;
}

export const ExportsManagerView: React.FC<ExportsManagerViewProps> = ({ savedExports, deleteExport, updateExport, allStrains, onOpenExportModal }) => {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const [editingExport, setEditingExport] = useState<SavedExport | null>(null);
    const [selectedIds, setSelectedIds] = useState(new Set<string>());

    const handleRedownload = (savedExport: SavedExport) => {
        const strainsToExport = allStrains.filter(s => savedExport.strainIds.includes(s.id));
        if (strainsToExport.length === 0) {
            dispatch(addNotification({ message: t('strainsView.exportsManager.strainsNotFound'), type: 'error' }));
            return;
        }

        const fileNameWithoutExt = savedExport.name.replace(/\.(json|csv|pdf|txt|xml)$/, '');
        exportService.exportStrains(strainsToExport, savedExport.format, fileNameWithoutExt);
        dispatch(addNotification({ message: t('strainsView.exportsManager.downloadingExport', { name: fileNameWithoutExt, format: savedExport.format }), type: 'success' }));
    };
    
    const handleDelete = (id: string) => {
        if (window.confirm(t('strainsView.exportsManager.deleteConfirm'))) {
            deleteExport(id);
            dispatch(addNotification({ message: t('strainsView.exportsManager.exportRemoved'), type: 'info' }));
        }
    };

    const handleBulkDelete = () => {
         if (window.confirm(t('strainsView.exportsManager.deleteConfirmPlural', { count: selectedIds.size }))) {
            selectedIds.forEach(id => deleteExport(id));
            dispatch(addNotification({ message: t('strainsView.exportsManager.deleteSuccessPlural', { count: selectedIds.size }), type: 'success' }));
            setSelectedIds(new Set());
        }
    };

    const handleUpdate = (updated: SavedExport) => {
        updateExport(updated);
        dispatch(addNotification({ message: t('strainsView.exportsManager.updateExportSuccess', { name: updated.name }), type: 'success' }));
        setEditingExport(null);
    };
    
    const handleToggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            newSet.has(id) ? newSet.delete(id) : newSet.add(id);
            return newSet;
        });
    };

    const handleToggleAll = () => {
        if (selectedIds.size === sortedExports.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(sortedExports.map(e => e.id)));
        }
    };
    
    const sortedExports = [...savedExports].sort((a, b) => b.createdAt - a.createdAt);

    return (
        <div className="mt-4 animate-fade-in">
            {editingExport && <EditResponseModal
                response={{ ...editingExport, title: editingExport.name, content: editingExport.notes || '' }}
                onClose={() => setEditingExport(null)}
                onSave={(updated) => handleUpdate({ ...editingExport, name: updated.title, notes: updated.content, id: updated.id, createdAt: editingExport.createdAt, source: editingExport.source, format: editingExport.format, count: editingExport.count, strainIds: editingExport.strainIds })}
                title={t('strainsView.exportsManager.editExportTitle')}
            />}
            
            {selectedIds.size > 0 && (
                <BulkActionsBar
                    selectedCount={selectedIds.size}
                    onClearSelection={() => setSelectedIds(new Set())}
                    onDelete={handleBulkDelete}
                />
            )}
            
            <Card>
                <div className="flex justify-between items-center mb-4">
                     <h3 className="text-xl font-bold font-display text-primary-400">{t('strainsView.tabs.exports', { count: savedExports.length })}</h3>
                     <Button onClick={onOpenExportModal}><PhosphorIcons.PlusCircle className="w-5 h-5 mr-1.5" />{t('strainsView.exportsManager.createExport')}</Button>
                </div>
                 {savedExports.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                        <PhosphorIcons.ArchiveBox className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                        <h3 className="font-semibold">{t('strainsView.exportsManager.noExports.title')}</h3>
                        <p className="text-sm">{t('strainsView.exportsManager.noExports.subtitle')}</p>
                    </div>
                ) : (
                     <div className="space-y-3">
                        <div className="flex items-center gap-3 px-2 text-sm text-slate-400">
                           <input type="checkbox" checked={selectedIds.size === sortedExports.length && sortedExports.length > 0} onChange={handleToggleAll} className="h-4 w-4 rounded border-slate-500 bg-transparent text-primary-500 focus:ring-primary-500" />
                            <span>{t('strainsView.selectedCount', { count: selectedIds.size })}</span>
                        </div>
                        {sortedExports.map(item => (
                            <div key={item.id} className={`p-3 rounded-lg flex items-center gap-3 transition-colors ${selectedIds.has(item.id) ? 'bg-primary-900/40' : 'bg-slate-800'}`}>
                                 <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => handleToggleSelection(item.id)} className="h-4 w-4 rounded border-slate-500 bg-transparent text-primary-500 flex-shrink-0" />
                                <div className="flex-grow">
                                    <p className="font-bold text-slate-100">{item.name}</p>
                                    <div className="text-xs text-slate-400 flex items-center gap-3 flex-wrap">
                                        <span>{new Date(item.createdAt).toLocaleString()}</span>
                                        <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
                                        <span>{t('strainsView.exportsManager.sourceLabel')}: <span className="font-semibold text-slate-300">{item.source}</span></span>
                                        <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
                                        <span>{t('strainsView.exportsManager.strainCount', { count: item.count })}</span>
                                    </div>
                                    {item.notes && <p className="text-sm text-slate-300 italic mt-1">"{item.notes}"</p>}
                                </div>
                                <div className="flex items-center gap-2">
                                     <span className="px-2 py-0.5 text-xs font-semibold bg-slate-700 text-slate-200 rounded-full">{item.format}</span>
                                     <Button size="sm" variant="secondary" onClick={() => handleRedownload(item)}><PhosphorIcons.DownloadSimple className="w-4 h-4 mr-1"/>{t('common.downloadAgain')}</Button>
                                     <Button size="sm" variant="secondary" onClick={() => setEditingExport(item)}><PhosphorIcons.PencilSimple className="w-4 h-4"/></Button>
                                     <Button size="sm" variant="danger" onClick={() => handleDelete(item.id)}><PhosphorIcons.TrashSimple className="w-4 h-4"/></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
};