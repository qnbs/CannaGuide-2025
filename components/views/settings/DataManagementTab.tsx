import React, { memo, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '@/stores/store';
import { exportAllData, resetAllData } from '@/stores/slices/settingsSlice';
import { clearArchives } from '@/stores/slices/archivesSlice';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/ui/ThemePrimitives';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { Modal } from '@/components/common/Modal';
import { indexedDBStorage } from '@/stores/indexedDBStorage';
import { REDUX_STATE_KEY } from '@/constants';
import { addNotification } from '@/stores/slices/uiSlice';

const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const StorageInfo: React.FC = memo(() => {
    const { t } = useTranslation();
    const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (navigator.storage && navigator.storage.estimate) {
            navigator.storage.estimate().then(estimate => {
                setStorage({
                    usage: estimate.usage || 0,
                    quota: estimate.quota || 0,
                });
                setIsLoading(false);
            }).catch(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, []);

    if (isLoading) {
        return <p className="text-sm text-center text-slate-400">Speicher wird berechnet...</p>;
    }

    if (!storage || !storage.quota) {
        return <p className="text-sm text-center text-slate-400">Speicherinformationen nicht verfügbar.</p>;
    }

    const usagePercent = ((storage.usage / storage.quota) * 100).toFixed(1);

    return (
        <div className="space-y-2">
            <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
                <div className="bg-primary-500 h-4 rounded-full" style={{ width: `${usagePercent}%` }}></div>
            </div>
            <div className="text-center text-sm text-slate-300 font-mono">
                {formatBytes(storage.usage)} / {formatBytes(storage.quota)} ({usagePercent}%)
            </div>
        </div>
    );
});

const DataManagementTab: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
    const [fileToImport, setFileToImport] = useState<string | null>(null);
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [resetConfirmText, setResetConfirmText] = useState('');
    const resetPhrase = String(t('settingsView.data.resetAllConfirmPhrase'));
    const isResetDisabled = resetConfirmText.toLowerCase() !== resetPhrase;

    const handleImportClick = () => {
        document.getElementById('import-file-input')?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result;
                if (typeof content === 'string') {
                    try {
                        const parsed = JSON.parse(content);
                        if (parsed && typeof parsed.version === 'number') {
                            setFileToImport(content);
                            setIsImportConfirmOpen(true);
                        } else {
                            throw new Error('Invalid file structure');
                        }
                    } catch (err) {
                        dispatch(addNotification({ type: 'error', message: String(t('settingsView.data.importError')) }));
                    }
                }
            };
            reader.readAsText(file);
        }
        e.target.value = '';
    };
    
    const confirmImport = async () => {
        if (fileToImport) {
            await indexedDBStorage.setItem(REDUX_STATE_KEY, fileToImport);
            setIsImportConfirmOpen(false);
            setFileToImport(null);
            dispatch(addNotification({ type: 'success', message: String(t('settingsView.data.importSuccess')) }));
            setTimeout(() => window.location.reload(), 1000);
        }
    };
    
    const handleResetAll = () => {
        dispatch(resetAllData());
        setIsResetConfirmOpen(false);
    };

    return (
        <div className="space-y-6">
            {isImportConfirmOpen && (
                 <Modal isOpen={true} onClose={() => setIsImportConfirmOpen(false)} title={String(t('settingsView.data.importConfirmTitle'))} size="lg">
                    <p>{t('settingsView.data.importConfirmText')}</p>
                    <div className="mt-4 flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setIsImportConfirmOpen(false)}>{t('common.cancel')}</Button>
                        <Button variant="danger" onClick={confirmImport}>{t('settingsView.data.importConfirmButton')}</Button>
                    </div>
                </Modal>
            )}
            {isResetConfirmOpen && (
                 <Modal isOpen={true} onClose={() => setIsResetConfirmOpen(false)} title={String(t('settingsView.data.resetAll'))} size="lg">
                     <div className="p-4 bg-red-900/20 rounded-lg border border-red-500/30 space-y-3">
                        <h4 className="font-bold text-red-300">{t('settingsView.data.resetAll')}</h4>
                         <p className="text-sm text-slate-300">{t('settingsView.data.resetAllConfirmInput', { phrase: resetPhrase })}</p>
                         <Input
                            type="text"
                            value={resetConfirmText}
                            onChange={(e) => setResetConfirmText(e.target.value)}
                            placeholder={resetPhrase}
                            autoFocus
                        />
                        <Button variant="danger" onClick={handleResetAll} disabled={isResetDisabled} className="w-full justify-center">
                            {t('settingsView.data.resetAll')}
                        </Button>
                    </div>
                </Modal>
            )}
            <input type="file" id="import-file-input" accept=".json" className="hidden" onChange={handleFileChange} />
            
            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400 mb-3 flex items-center gap-2"><PhosphorIcons.ArchiveBox /> {t('settingsView.data.backupAndRestore')}</h3>
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-2">
                         <Button onClick={() => dispatch(exportAllData())} className="flex-1 justify-center"><PhosphorIcons.DownloadSimple className="mr-2"/>{t('settingsView.data.exportAll')}</Button>
                        <Button onClick={handleImportClick} variant="secondary" className="flex-1 justify-center"><PhosphorIcons.UploadSimple className="mr-2"/>{t('settingsView.data.importData')}</Button>
                    </div>
                    <p className="text-xs text-slate-400">{t('settingsView.data.importDataDesc')}</p>
                </div>
            </Card>

            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400 mb-3 flex items-center gap-2"><PhosphorIcons.ChartPieSlice /> {t('settingsView.data.storageInsights')}</h3>
                <StorageInfo />
            </Card>

             <Card className="border border-red-500/30 bg-red-900/10">
                <h3 className="text-xl font-bold font-display text-red-400 mb-3 flex items-center gap-2"><PhosphorIcons.WarningCircle /> {t('settingsView.data.dangerZone')}</h3>
                <div className="space-y-4">
                     <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                        <div>
                            <h4 className="font-bold text-slate-100">{t('settingsView.data.clearArchives')}</h4>
                            <p className="text-sm text-slate-400">{t('settingsView.data.clearArchivesDesc')}</p>
                        </div>
                        <Button variant="danger" size="sm" onClick={() => { if (window.confirm(String(t('settingsView.data.clearArchivesConfirm')))) { dispatch(clearArchives()) } }}>{t('common.delete')}</Button>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                         <div>
                            <h4 className="font-bold text-slate-100">{t('settingsView.data.resetAll')}</h4>
                            <p className="text-sm text-slate-400">{t('settingsView.data.resetAllConfirm')}</p>
                        </div>
                        <Button variant="danger" size="sm" onClick={() => setIsResetConfirmOpen(true)}>{t('common.delete')}</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default memo(DataManagementTab);