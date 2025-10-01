import React, { useMemo, useState } from 'react';
import { Card } from '@/components/common/Card';
// FIX: Replaced non-existent `useTranslations` with `useTranslation` from react-i18next.
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { ArchivedAdvisorResponse, ExportFormat, Plant } from '@/types';
import { selectArchivedAdvisorResponses } from '@/stores/selectors';
import { DataExportModal } from '@/components/common/DataExportModal';
import { exportService } from '@/services/exportService';
import { Button } from '@/components/common/Button';
import { useActivePlants } from '@/hooks/useSimulationBridge';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { addNotification } from '@/stores/slices/uiSlice';

export const GlobalAdvisorArchiveView: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const archive = useAppSelector(selectArchivedAdvisorResponses);
    const activePlants = useActivePlants();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState(new Set<string>());
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    const allAdvice = useMemo<(ArchivedAdvisorResponse & { plantName: string })[]>(() => {
        const plantMap = new Map<string, string>();
        // Also check archived plants from Zustand store if they exist in a more complex state
        const allKnownPlants: Plant[] = [...activePlants]; // In a real scenario, you might merge with archived plants
        
        allKnownPlants.forEach(p => plantMap.set(p.id, p.name));
        
        return Object.values(archive)
            .flat()
            .map((advice: ArchivedAdvisorResponse) => ({
                ...advice,
                plantName: plantMap.get(advice.plantId) || t('plantsView.archivedPlant')
            }))
            .sort((a, b) => b.createdAt - a.createdAt);
    }, [archive, activePlants, t]);

    const filteredAdvice = useMemo(() => {
        if (!searchTerm) return allAdvice;
        const lowerCaseSearch = searchTerm.toLowerCase();
        return allAdvice.filter(advice => 
            advice.title.toLowerCase().includes(lowerCaseSearch) ||
            advice.content.toLowerCase().includes(lowerCaseSearch) ||
            advice.plantName.toLowerCase().includes(lowerCaseSearch)
        );
    }, [allAdvice, searchTerm]);
    
    const handleToggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const handleToggleAll = () => {
        if (selectedIds.size === filteredAdvice.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredAdvice.map(advice => advice.id)));
        }
    };

    const handleExport = (source: 'selected' | 'all', format: ExportFormat) => {
        const dataToExport = source === 'selected' 
            ? allAdvice.filter(advice => selectedIds.has(advice.id))
            : filteredAdvice;
            
        if (dataToExport.length === 0) {
            dispatch(addNotification({ message: t('common.noDataToExport'), type: 'error' }));
            return;
        }
        exportService.exportAdvisorArchive(dataToExport, format, `CannaGuide_Advisor_Archive_${new Date().toISOString().slice(0, 10)}`);
    };


    return (
        <Card>
             <DataExportModal 
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onExport={handleExport}
                title={t('plantsView.aiAdvisor.archiveTitle')}
                selectionCount={selectedIds.size}
                totalCount={filteredAdvice.length}
                translationBasePath="plantsView.aiAdvisor.exportModal"
            />
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-2">
                <h3 className="text-xl font-bold font-display text-primary-400 flex items-center gap-2">
                    <PhosphorIcons.ArchiveBox className="w-6 h-6"/>
                    {t('plantsView.aiAdvisor.archiveTitle')}
                </h3>
                 <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder={t('strainsView.tips.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-700 rounded-lg bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <PhosphorIcons.MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                     <Button variant="secondary" onClick={() => setIsExportModalOpen(true)} aria-label={t('common.export')}><PhosphorIcons.DownloadSimple className="w-5 h-5"/></Button>
                </div>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {filteredAdvice.length > 0 ? (
                    <>
                         <div className="px-1 flex items-center gap-3">
                            <input type="checkbox" checked={selectedIds.size === filteredAdvice.length && filteredAdvice.length > 0} onChange={handleToggleAll} className="h-4 w-4 rounded border-slate-500 bg-transparent text-primary-500 focus:ring-primary-500" />
                            <label className="text-sm text-slate-400">{t('strainsView.selectedCount', { count: selectedIds.size })}</label>
                        </div>
                        {filteredAdvice.map((res) => {
                            const isProactive = res.query === t('ai.proactiveDiagnosis');
                            return (
                            <Card key={res.id} className="bg-slate-800/70 p-3 flex items-start gap-3">
                                 <input type="checkbox" checked={selectedIds.has(res.id)} onChange={() => handleToggleSelection(res.id)} className="mt-1.5 h-4 w-4 rounded border-slate-500 bg-transparent text-primary-500 flex-shrink-0" />
                                <div className="flex-grow">
                                    <div className="flex justify-between items-start">
                                        <h4 className={`font-bold mt-1 ${isProactive ? 'text-amber-300' : 'text-primary-300'} flex items-center gap-2`}>
                                            {isProactive && <PhosphorIcons.FirstAidKit className="w-5 h-5" />}
                                            {res.title}
                                        </h4>
                                        <div className="text-xs text-slate-400 text-right flex-shrink-0 ml-2">
                                            <p className="font-semibold">{res.plantName}</p>
                                            <p>{new Date(res.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="prose prose-sm dark:prose-invert max-w-none mt-2" dangerouslySetInnerHTML={{ __html: res.content }}></div>
                                </div>
                            </Card>
                        )})}
                    </>
                ) : (
                    <div className="text-center py-10 text-slate-500">
                        <PhosphorIcons.Archive className="w-12 h-12 mx-auto text-slate-500 mb-2"/>
                        <h3 className="font-semibold">{t('knowledgeView.archive.empty')}</h3>
                    </div>
                )}
            </div>
        </Card>
    );
};