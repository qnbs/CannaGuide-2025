import React, { useState, useEffect } from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { ExportFormat, ExportSource } from '../../../types';
import { useTranslations } from '../../../hooks/useTranslations';
import { useSettings } from '../../../hooks/useSettings';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (source: ExportSource, format: ExportFormat) => void;
    selectionCount: number;
    favoritesCount: number;
    filteredCount: number;
    totalCount: number;
}

const RadioGroup: React.FC<{
    label: string,
    options: { value: string, label: string, disabled?: boolean, count?: number }[],
    selectedValue: string,
    onChange: (value: string) => void
}> = ({ label, options, selectedValue, onChange }) => (
    <div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">{label}</h3>
        <div className="space-y-2">
            {options.map(opt => (
                <label key={opt.value} className={`flex items-center p-3 rounded-lg border-2 transition-colors ${selectedValue === opt.value ? 'border-primary-500 bg-primary-500/10' : 'border-slate-300 dark:border-slate-600'} ${opt.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                    <input
                        type="radio"
                        name={label}
                        value={opt.value}
                        checked={selectedValue === opt.value}
                        onChange={() => !opt.disabled && onChange(opt.value)}
                        disabled={opt.disabled}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 dark:border-slate-600"
                    />
                    <span className="ml-3 text-sm font-medium text-slate-800 dark:text-slate-200">{opt.label}</span>
                    {opt.count !== undefined && <span className="ml-auto text-xs font-mono bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded">{opt.count}</span>}
                </label>
            ))}
        </div>
    </div>
);

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport, selectionCount, favoritesCount, filteredCount, totalCount }) => {
    const { t } = useTranslations();
    const { settings } = useSettings();
    const [source, setSource] = useState<ExportSource>(settings.defaultExportSettings.source);
    const [format, setFormat] = useState<ExportFormat>(settings.defaultExportSettings.format);

    useEffect(() => {
        if(isOpen) {
             const defaultSource = selectionCount > 0 ? 'selected' : settings.defaultExportSettings.source;
             setSource(defaultSource);
             setFormat(settings.defaultExportSettings.format);
        }
    }, [isOpen, selectionCount, settings.defaultExportSettings]);


    if (!isOpen) return null;

    const handleConfirm = () => {
        onExport(source, format);
        onClose();
    };
    
    const sourceOptions = [
        { value: 'selected', label: t('strainsView.exportModal.sources.selected'), disabled: selectionCount === 0, count: selectionCount },
        { value: 'favorites', label: t('strainsView.exportModal.sources.favorites'), disabled: favoritesCount === 0, count: favoritesCount },
        { value: 'filtered', label: t('strainsView.exportModal.sources.filtered'), count: filteredCount },
        { value: 'all', label: t('strainsView.exportModal.sources.all'), count: totalCount },
    ];

    const formatOptions = [
        { value: 'pdf', label: t('strainsView.exportModal.formats.pdf') },
        { value: 'txt', label: 'TXT' },
        { value: 'csv', label: t('strainsView.exportModal.formats.csv') },
        { value: 'json', label: t('strainsView.exportModal.formats.json') },
    ];

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <Card className="w-full max-w-lg modal-content-animate" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-primary-500 dark:text-primary-400 mb-6">{t('strainsView.exportModal.title')}</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <RadioGroup label={t('strainsView.exportModal.source')} options={sourceOptions} selectedValue={source} onChange={v => setSource(v as ExportSource)} />
                    <RadioGroup label={t('strainsView.exportModal.format')} options={formatOptions} selectedValue={format} onChange={v => setFormat(v as ExportFormat)} />
                </div>

                <div className="flex justify-end gap-4 mt-8">
                    <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
                    <Button onClick={handleConfirm}>{t('common.export')}</Button>
                </div>
            </Card>
        </div>
    );
};