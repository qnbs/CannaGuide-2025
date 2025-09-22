import React, { useState } from 'react';
import { ExportSource, ExportFormat } from '@/types';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useTranslations } from '@/hooks/useTranslations';
import { useAppStore } from '@/stores/useAppStore';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (source: ExportSource, format: ExportFormat) => void;
  selectionCount: number;
  favoritesCount: number;
  filteredCount: number;
  totalCount: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport, selectionCount, favoritesCount, filteredCount, totalCount }) => {
  const { t } = useTranslations();
  const settings = useAppStore(state => state.settings);
  const [source, setSource] = useState<ExportSource>(settings.defaultExportSettings.source);
  const [format, setFormat] = useState<ExportFormat>(settings.defaultExportSettings.format);
  const modalRef = useFocusTrap(isOpen);

  if (!isOpen) return null;

  const sources: { id: ExportSource; label: string; count: number; disabled: boolean }[] = [
    { id: 'selected', label: t('strainsView.exportModal.sources.selected'), count: selectionCount, disabled: selectionCount === 0 },
    { id: 'favorites', label: t('strainsView.exportModal.sources.favorites'), count: favoritesCount, disabled: favoritesCount === 0 },
    { id: 'filtered', label: t('strainsView.exportModal.sources.filtered'), count: filteredCount, disabled: filteredCount === 0 },
    { id: 'all', label: t('strainsView.exportModal.sources.all'), count: totalCount, disabled: totalCount === 0 },
  ];

  const formats: { id: ExportFormat; label: string }[] = [
    { id: 'pdf', label: t('strainsView.exportModal.formats.pdf') },
    { id: 'txt', label: t('strainsView.exportModal.formats.txt') },
    { id: 'csv', label: t('strainsView.exportModal.formats.csv') },
    { id: 'json', label: t('strainsView.exportModal.formats.json') },
  ];
  
  const handleExportClick = () => {
    onExport(source, format);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-50 p-4 modal-overlay-animate" onClick={onClose}>
      <Card ref={modalRef} className="w-full max-w-lg modal-content-animate" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold font-display text-primary-400 mb-4">{t('strainsView.exportModal.title')}</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-2">{t('strainsView.exportModal.source')}</h3>
            <div className="grid grid-cols-2 gap-2">
              {sources.map(s => (
                <button
                  key={s.id}
                  onClick={() => !s.disabled && setSource(s.id)}
                  disabled={s.disabled}
                  className={`p-3 text-left rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${source === s.id ? 'bg-primary-600 text-white font-bold' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
                >
                  <span className="block">{s.label}</span>
                  <span className="text-xs">{t('strainsView.exportModal.count', { count: s.count })}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-2">{t('strainsView.exportModal.format')}</h3>
            <div className="flex gap-2">
              {formats.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={`flex-1 py-2 px-2 text-sm rounded-md transition-colors ${format === f.id ? 'bg-primary-600 text-white font-bold' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleExportClick}>{t('common.export')}</Button>
        </div>
      </Card>
    </div>
  );
};
