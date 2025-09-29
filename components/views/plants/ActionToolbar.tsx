import React, { memo } from 'react';
import { Button } from '../../common/Button';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { useTranslation } from 'react-i18next';
import { ModalType } from '@/types';

interface ActionToolbarProps {
    onLogAction: (type: ModalType) => void;
}

export const ActionToolbar: React.FC<ActionToolbarProps> = memo(({ onLogAction }) => {
    const { t } = useTranslation();

    const actions = [
        { type: 'watering', icon: <PhosphorIcons.Drop />, label: t('plantsView.detailedView.journalFilters.watering') },
        { type: 'feeding', icon: <PhosphorIcons.TestTube />, label: t('plantsView.detailedView.journalFilters.feeding') },
        { type: 'training', icon: <PhosphorIcons.Scissors />, label: t('plantsView.detailedView.journalFilters.training') },
        { type: 'observation', icon: <PhosphorIcons.MagnifyingGlass />, label: t('plantsView.detailedView.journalFilters.observation') },
        { type: 'photo', icon: <PhosphorIcons.Camera />, label: t('plantsView.detailedView.journalFilters.photo') },
        { type: 'pestControl', icon: <PhosphorIcons.WarningCircle />, label: t('plantsView.detailedView.journalFilters.pestControl') },
        { type: 'amendment', icon: <PhosphorIcons.Flask />, label: t('plantsView.detailedView.journalFilters.amendment') },
    ];

    return (
        <div className="flex flex-wrap items-center justify-center gap-2">
            {actions.map(action => (
                <Button key={action.type} variant="secondary" onClick={() => onLogAction(action.type as ModalType)} className="flex-1 min-w-[120px] hyphens-auto">
                    {action.icon}
                    <span className="ml-2">{action.label}</span>
                </Button>
            ))}
        </div>
    );
});