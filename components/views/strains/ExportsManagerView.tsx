import React from 'react';
import { Strain, SavedExport, ExportFormat } from '../../../types';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { exportService } from '../../../services/exportService';
import { useNotifications } from '../../../context/NotificationContext';
import { useTranslations } from '../../../hooks/useTranslations';

interface ExportsManagerViewProps {
    savedExports: SavedExport[];
    deleteExport: (id: string) => void;
    allStrains: Strain[];
}

export const ExportsManagerView: React.FC<ExportsManagerViewProps> = ({ savedExports, deleteExport, allStrains }) => {
    const { addNotification } = useNotifications();
    const { t } = useTranslations();

    const handleRedownload = (savedExport: SavedExport) => {
        const strainsToExport = allStrains.filter(s => savedExport.strainIds.includes(s.id));
        if (strainsToExport.length === 0) {
            addNotification(t('strainsView.exportsManager.strainsNotFound'), 'error');
            return;
        }

        const fileNameWithoutExt = savedExport.name.replace(/\.(json|csv|pdf|txt)$/, '');

        switch (savedExport.format) {
            case 'json':
                exportService.exportAsJSON(strainsToExport, fileNameWithoutExt);
                break;
            case 'csv':
                exportService.exportAsCSV(strainsToExport, fileNameWithoutExt);
                break;
            case 'pdf':
                exportService.exportAsPDF(strainsToExport, fileNameWithoutExt, t);
                break;
            case 'txt':
                exportService.exportAsTXT(strainsToExport, fileNameWithoutExt);
                break;
        }
        addNotification(t('strainsView.exportsManager.downloadingExport', { name: fileNameWithoutExt, format: savedExport.format }), 'success');
    };
    
    const handleDelete = (id: string) => {
        if(window.confirm(t('strainsView.exportsManager.deleteConfirm'))) {
            deleteExport(id);
            addNotification(t('strainsView.exportsManager.exportRemoved'), 'info');
        }
    };

    const formatIcons: Record<ExportFormat, React.ReactNode> = {
        json: <PhosphorIcons.BracketsCurly />,
        csv: <PhosphorIcons.FileCsv />,
        pdf: <PhosphorIcons.FilePdf />,
        txt: <PhosphorIcons.BookOpenText />,
    };

    const sortedExports = [...savedExports].sort((a, b) => b.createdAt - a.createdAt);

    return (
        <div className="mt-4">
            {sortedExports.length === 0 ? (
                <Card className="text-center py-10 text-slate-500">
                    <PhosphorIcons.Archive className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                    <h3 className="font-semibold">{t('strainsView.exportsManager.noExports.title')}</h3>
                    <p className="text-sm">{t('strainsView.exportsManager.noExports.subtitle')}</p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {sortedExports.map(exp => (
                        <Card key={exp.id} className="flex items-center justify-between gap-4 p-3">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="text-primary-500 text-3xl flex-shrink-0">{formatIcons[exp.format]}</div>
                                <div className="min-w-0">
                                    <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{exp.name}.{exp.format}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {new Date(exp.createdAt).toLocaleString()} | {exp.count} {t('strainsView.exportsManager.strainsUnit')} | {t('strainsView.exportsManager.sourceLabel')}: {exp.source}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <Button size="sm" variant="secondary" onClick={() => handleRedownload(exp)} aria-label={t('common.downloadAgain')}>
                                    <PhosphorIcons.DownloadSimple className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="danger" onClick={() => handleDelete(exp.id)} className="px-2 py-2" aria-label={t('common.delete')}>
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