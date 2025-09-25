import React from 'react';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslations } from '@/hooks/useTranslations';
import type { ModalType } from '@/components/views/plants/LogActionModal';

interface ActionToolbarProps {
    onAction: (type: NonNullable<ModalType>) => void;
}

export const ActionToolbar: React.FC<ActionToolbarProps> = ({ onAction }) => {
    const { t } = useTranslations();

    return (
        <div className="flex-shrink-0 flex flex-wrap gap-2">
            <Button onClick={() => onAction('watering')}>
                <PhosphorIcons.Drop className="w-4 h-4 mr-1"/> {t('plantsView.detailedView.journalFilters.watering')}
            </Button>
            <Button onClick={() => onAction('feeding')}>
                <PhosphorIcons.TestTube className="w-4 h-4 mr-1"/> {t('plantsView.detailedView.journalFilters.feeding')}
            </Button>
            <Button onClick={() => onAction('training')}>
                <PhosphorIcons.Scissors className="w-4 h-4 mr-1"/>{t('plantsView.detailedView.journalFilters.training')}
            </Button>
             <Button onClick={() => onAction('pestControl')} variant="secondary">
                <PhosphorIcons.WarningCircle className="w-4 h-4 mr-1"/>{t('plantsView.detailedView.journalFilters.pestControl')}
            </Button>
            <Button onClick={() => onAction('observation')} variant="secondary">
                <PhosphorIcons.MagnifyingGlass className="w-4 h-4 mr-1"/>{t('plantsView.detailedView.journalFilters.observation')}
            </Button>
            <Button onClick={() => onAction('photo')} variant="secondary">
                <PhosphorIcons.Camera className="w-4 h-4 mr-1"/> {t('plantsView.detailedView.journalFilters.photo')}
            </Button>
        </div>
    );
};
