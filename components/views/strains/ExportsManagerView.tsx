import React from 'react';
import { Strain, SavedExport, ExportFormat } from '../../../types';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { exportService } from '../../../services/exportService';
import { useNotifications } from '../../../context/NotificationContext';

interface ExportsManagerViewProps {
    savedExports: SavedExport[];
    deleteExport: (id: string) => void;
    allStrains: Strain[];
}

export const ExportsManagerView: React.FC<ExportsManagerViewProps> = ({ savedExports, deleteExport, allStrains }) => {
    const { addNotification } = useNotifications();

    const handleRedownload = (savedExport: SavedExport) => {
        const strainsToExport = allStrains.filter(s => savedExport.strainIds.includes(s.id));
        if (strainsToExport.length === 0) {
            addNotification("Die für diesen Export benötigten Sorten konnten nicht gefunden werden.", 'error');
            return;
        }

        const fileNameWithoutExt = savedExport.name.replace(/\.(json|csv|pdf)$/, '');

        switch (savedExport.format) {
            case 'json':
                exportService.exportAsJSON(strainsToExport, fileNameWithoutExt);
                break;
            case 'csv':
                exportService.exportAsCSV(strainsToExport, fileNameWithoutExt);
                break;
            case 'pdf':
                exportService.exportAsPDF(strainsToExport, fileNameWithoutExt);
                break;
        }
        addNotification(`Export "${savedExport.name}.${savedExport.format}" wird heruntergeladen.`, 'success');
    };
    
    const handleDelete = (id: string) => {
        if(window.confirm('Möchtest du diesen Export wirklich aus der Liste entfernen?')) {
            deleteExport(id);
            addNotification('Export aus der Liste entfernt.', 'info');
        }
    };

    const formatIcons: Record<ExportFormat, React.ReactNode> = {
        json: <PhosphorIcons.BracketsCurly />,
        csv: <PhosphorIcons.FileCsv />,
        pdf: <PhosphorIcons.FilePdf />,
    };

    const sortedExports = [...savedExports].sort((a, b) => b.createdAt - a.createdAt);

    return (
        <div className="mt-4">
            {sortedExports.length === 0 ? (
                <Card className="text-center py-10 text-slate-500">
                    <PhosphorIcons.Archive className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                    <h3 className="font-semibold">Keine gespeicherten Exporte</h3>
                    <p className="text-sm">Wenn du eine Sortenliste exportierst, erscheint sie hier zur späteren Verwendung.</p>
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
                                        {new Date(exp.createdAt).toLocaleString()} | {exp.count} Sorten | Quelle: {exp.source}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <Button size="sm" variant="secondary" onClick={() => handleRedownload(exp)} aria-label="Erneut herunterladen">
                                    <PhosphorIcons.DownloadSimple className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="danger" onClick={() => handleDelete(exp.id)} className="px-2 py-2" aria-label="Löschen">
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
