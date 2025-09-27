import React, { useState, useEffect } from 'react';
import { ExportFormat } from '@/types';
import { Button } from '@/components/common/Button';
import { useTranslations } from '@/hooks/useTranslations';
import { Modal } from '@/components/common/Modal';

type ExportSource = 'selected' | 'all';

interface DataExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (source: ExportSource, format: ExportFormat) => void;
  title: string;
  selectionCount: number;
  totalCount: number;
  translationBasePath?: string;
}

export const DataExportModal: React.FC<DataExportModalProps> = ({ isOpen, onClose, onExport, title, selectionCount, totalCount, translationBasePath = 'strainsView.exportModal' }) => {
  const { t } = useTranslations();
  const [source, setSource] = useState<ExportSource>(selectionCount > 0 ? 'selected' : 'all');
  const [format, setFormat] = useState<ExportFormat>('pdf');
  
  useEffect(() => {
    if (isOpen) {
      // Intelligently set the default source based on whether items are selected
      setSource(selectionCount > 0 ? 'selected' : 'all');
    }
  }, [isOpen, selectionCount]);

  const sources: { id: ExportSource; count: number; disabled: boolean }[] = [
    { id: 'selected', count: selectionCount, disabled: selectionCount === 0 },
    { id: 'all', count: totalCount, disabled: totalCount === 0 },
  ];

  const formats: { id: ExportFormat; label: string }[] = [
    { id: 'pdf', label: t('strainsView.exportModal.formats.pdf') },
    { id: 'txt', label: t('strainsView.exportModal.formats.txt') },
    { id: 'csv', label: t('strainsView.exportModal.formats.csv') },
    { id: 'json', label: t('strainsView.exportModal.formats.json') },
    { id: 'xml', label: t('strainsView.exportModal.formats.xml') },
  ];
  
  const handleExportClick = () => {
    onExport(source, format);
    onClose();
  };
  
  const footer = (
    <>
        <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={handleExportClick} disabled={(source === 'selected' && selectionCount === 0) || (source === 'all' && totalCount === 0)}>{t('common.export')}</Button>
    </>
  );

  return (
    <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        size="lg"
        footer={footer}
    >
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
                  <span className="block">{t(`${translationBasePath}.sources.${s.id}`, { count: s.count })}</span>
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
    </Modal>
  );
};
