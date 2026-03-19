import React from 'react';
import { useTranslation } from 'react-i18next';
import { SavedExport, Strain } from '@/types';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

interface ExportsManagerViewProps {
    savedExports: SavedExport[];
    allStrains: Strain[];
    onDelete: (id: string) => void;
    onUpdate: (updatedExport: SavedExport) => void;
}

const ExportsManagerView: React.FC<ExportsManagerViewProps> = ({ savedExports, allStrains, onDelete, onUpdate: _onUpdate }) => {
    const { t } = useTranslation();
    const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);

    const handleDownload = async (exp: SavedExport) => {
        const { exportService } = await import('@/services/exportService');
        const strainIds = Array.isArray(exp.strainIds) ? exp.strainIds : [];
        const strainsToExport = allStrains.filter(s => strainIds.includes(s.id));
        const fileName = typeof exp.name === 'string' ? exp.name : 'export';
        if (exp.format === 'pdf') {
            exportService.exportStrainsAsPdf(strainsToExport, fileName, t);
        } else if (exp.format === 'txt') {
            exportService.exportStrainsAsTxt(strainsToExport, fileName, t);
        }
    };

    if (savedExports.length === 0) {
        return (
            <Card className="text-center py-10 text-slate-500">
                <PhosphorIcons.Archive className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                <h3 className="font-semibold text-slate-300">{t('strainsView.exportsManager.noExports.title')}</h3>
                <p className="text-sm">{t('strainsView.exportsManager.noExports.subtitle')}</p>
            </Card>
        );
    }

    const sortedExports = [...savedExports].sort((a,b) => b.createdAt - a.createdAt);

    return (
        <div className="space-y-3">
            <ConfirmDialog
                open={pendingDeleteId !== null}
                onOpenChange={(open) => {
                    if (!open) setPendingDeleteId(null)
                }}
                title={t('strainsView.exportsManager.deleteConfirm')}
                description={t('strainsView.exportsManager.deleteConfirm')}
                confirmLabel={t('common.delete')}
                cancelLabel={t('common.cancel')}
                onConfirm={() => {
                    if (pendingDeleteId) {
                        onDelete(pendingDeleteId)
                    }
                    setPendingDeleteId(null)
                }}
            />

            {sortedExports.map(exp => (
                <Card key={exp.id} className="!p-3">
                    <div className="flex justify-between items-center">
                        <div className="min-w-0">
                            <h4 className="font-bold text-slate-100 truncate">{exp.name ?? 'Export'}</h4>
                            <p className="text-xs text-slate-400">{new Date(exp.createdAt).toLocaleString()} &bull; {(exp.format ?? 'txt').toUpperCase()} &bull; {t('strainsView.exportsManager.strainCount', { count: Array.isArray(exp.strainIds) ? exp.strainIds.length : 0 })}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                            <Button size="sm" variant="secondary" onClick={() => handleDownload(exp)} title={t('common.downloadAgain')}><PhosphorIcons.DownloadSimple /></Button>
                            <Button size="sm" variant="danger" onClick={() => setPendingDeleteId(exp.id)} title={t('common.delete')}><PhosphorIcons.TrashSimple /></Button>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
};

export default ExportsManagerView;
