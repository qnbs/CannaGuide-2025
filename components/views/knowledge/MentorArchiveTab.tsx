import React, { useState, useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslations } from '@/hooks/useTranslations';
import { useAppStore } from '@/stores/useAppStore';
import { ArchivedMentorResponse, ExportFormat } from '@/types';
import { EditResponseModal } from '@/components/common/EditResponseModal';
import { selectArchivedMentorResponses } from '@/stores/selectors';
import { DataExportModal } from '@/components/common/DataExportModal';
import { exportService } from '@/services/exportService';

export const MentorArchiveTab: React.FC = () => {
    const { t } = useTranslations();
    const archivedResponses = useAppStore(selectArchivedMentorResponses);
    const { updateResponse, deleteResponse, addNotification } = useAppStore(state => ({
        updateResponse: state.updateArchivedMentorResponse,
        deleteResponse: state.deleteArchivedMentorResponse,
        addNotification: state.addNotification,
    }));

    const [editingResponse, setEditingResponse] = useState<ArchivedMentorResponse | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState(new Set<string>());
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    const sortedArchive = useMemo(() => 
        [...archivedResponses].sort((a,b) => b.createdAt - a.createdAt),
    [archivedResponses]);

    const filteredArchive = useMemo(() => {
        if (!searchTerm) return sortedArchive;
        const lowerCaseSearch = searchTerm.toLowerCase();
        return sortedArchive.filter(res => 
            res.title.toLowerCase().includes(lowerCaseSearch) ||
            res.query.toLowerCase().includes(lowerCaseSearch) ||
            res.content.toLowerCase().includes(lowerCaseSearch)
        );
    }, [sortedArchive, searchTerm]);

    const handleToggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const handleToggleAll = () => {
        if (selectedIds.size === filteredArchive.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredArchive.map(res => res.id)));
        }
    };

    const handleExport = (source: 'selected' | 'all', format: ExportFormat) => {
        const dataToExport = source === 'selected' 
            ? archivedResponses.filter(res => selectedIds.has(res.id))
            : filteredArchive;
        if (dataToExport.length === 0) {
            addNotification(t('common.noDataToExport'), 'error');
            return;
        }
        exportService.exportMentorArchive(dataToExport, format, `CannaGuide_Mentor_Archive_${new Date().toISOString().slice(0, 10)}`, t);
    };

    return (
        <Card>
            {editingResponse && (
                <EditResponseModal 
                    response={editingResponse} 
                    onClose={() => setEditingResponse(null)} 
                    onSave={(updated) => {
                        updateResponse(updated);
                        setEditingResponse(null);
                    }}
                />
            )}
             <DataExportModal 
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onExport={handleExport}
                title={t('knowledgeView.archive.title')}
                selectionCount={selectedIds.size}
                totalCount={filteredArchive.length}
            />

            <div className="flex justify-between items-center mb-4">
                <div className="relative flex-grow">
                     <input
                        type="text"
                        placeholder={t('strainsView.tips.searchPlaceholder')}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-700 rounded-lg bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <PhosphorIcons.MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
                <Button variant="secondary" onClick={() => setIsExportModalOpen(true)} className="ml-2">
                    <PhosphorIcons.DownloadSimple className="w-5 h-5"/>
                </Button>
            </div>

            <div className="space-y-4 max-h-[calc(100vh-350px)] overflow-y-auto pr-2">
                {filteredArchive.length > 0 ? (
                    <>
                        <div className="px-1 flex items-center gap-3">
                            <input type="checkbox" checked={selectedIds.size === filteredArchive.length && filteredArchive.length > 0} onChange={handleToggleAll} className="h-4 w-4 rounded border-slate-500 bg-transparent text-primary-500 focus:ring-primary-500" />
                            <label className="text-sm text-slate-400">{t('strainsView.selectedCount', { count: selectedIds.size })}</label>
                        </div>
                         {filteredArchive.map(res => (
                            <Card key={res.id} className="bg-slate-800/70 p-3 flex items-start gap-3">
                                 <input type="checkbox" checked={selectedIds.has(res.id)} onChange={() => handleToggleSelection(res.id)} className="mt-1.5 h-4 w-4 rounded border-slate-500 bg-transparent text-primary-500 focus:ring-primary-500 flex-shrink-0" />
                                <div className="flex-grow">
                                    <p className="text-xs text-slate-400 italic">{t('knowledgeView.archive.queryLabel')}: "{res.query}"</p>
                                    <h4 className="font-bold text-primary-300 mt-1">{res.title}</h4>
                                    <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: res.content }}></div>
                                    <div className="flex justify-end items-center gap-2 mt-2">
                                        <Button size="sm" variant="secondary" onClick={() => setEditingResponse(res)} aria-label={t('common.edit')}><PhosphorIcons.PencilSimple className="w-4 h-4"/></Button>
                                        <Button size="sm" variant="danger" onClick={() => deleteResponse(res.id)} aria-label={t('common.deleteResponse')}><PhosphorIcons.TrashSimple className="w-4 h-4"/></Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </>
                ) : (
                    <div className="text-center py-10 text-slate-500">
                        <PhosphorIcons.Archive className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                        <h3 className="font-semibold">{t('knowledgeView.archive.empty')}</h3>
                    </div>
                )}
            </div>
        </Card>
    );
};