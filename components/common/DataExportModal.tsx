import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import { Button } from './Button';
import { PhosphorIcons } from '../icons/PhosphorIcons';

export type SimpleExportFormat = 'pdf' | 'txt';

interface DataExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (format: SimpleExportFormat) => void;
    title: string;
    selectionCount: number;
    totalCount: number;
    translationBasePath: string;
}

export const DataExportModal: React.FC<DataExportModalProps> = ({ isOpen, onClose, onExport, title, selectionCount, totalCount, translationBasePath }) => {
    const { t } = useTranslation();
    
    const hasSelection = selectionCount > 0;
    const sourceText = hasSelection 
        ? t(`${translationBasePath}.sources.selected_other`, { count: selectionCount }) 
        : t(`${translationBasePath}.sources.all_other`, { count: totalCount });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
            <div className="space-y-4">
                <div>
                    <h3 className="font-semibold text-slate-300">{t(`${translationBasePath}.source`)}</h3>
                    <p className="text-sm text-slate-400">{sourceText}</p>
                </div>
                <div>
                    <h3 className="font-semibold text-slate-300">{t(`${translationBasePath}.format`)}</h3>
                    <p className="text-sm text-slate-400 mb-2">{t(`${translationBasePath}.chooseFormat`)}</p>
                    <div className="flex gap-4">
                        <Button onClick={() => onExport('pdf')} className="flex-1" variant="secondary">
                            <PhosphorIcons.FilePdf className="w-5 h-5 mr-2" />
                            {t(`${translationBasePath}.formats.pdf`)}
                        </Button>
                        <Button onClick={() => onExport('txt')} className="flex-1" variant="secondary">
                            <PhosphorIcons.FileText className="w-5 h-5 mr-2" />
                            {t(`${translationBasePath}.formats.txt`)}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
