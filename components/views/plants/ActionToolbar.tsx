import React, { memo } from 'react';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslation } from 'react-i18next';
import { ModalType } from '@/types';

interface ActionToolbarProps {
    onLogAction: (type: ModalType) => void;
}

export const ActionToolbar: React.FC<ActionToolbarProps> = memo(({ onLogAction }) => {
    const { t } = useTranslation();

    const actions: { type: ModalType; label: string; icon: React.ReactNode }[] = [
        { type: 'watering', label: t('plantsView.detailedView.journalFilters.watering'), icon: <PhosphorIcons.Drop className="text-blue-400" /> },
        { type: 'feeding', label: t('plantsView.detailedView.journalFilters.feeding'), icon: <PhosphorIcons.TestTube className="text-amber-400" /> },
        { type: 'training', label: t('plantsView.detailedView.journalFilters.training'), icon: <PhosphorIcons.Scissors className="text-purple-400" /> },
        { type: 'observation', label: t('plantsView.detailedView.journalFilters.observation'), icon: <PhosphorIcons.MagnifyingGlass className="text-slate-300" /> },
        { type: 'photo', label: t('plantsView.detailedView.journalFilters.photo'), icon: <PhosphorIcons.Camera className="text-cyan-400" /> },
        { type: 'pestControl', label: t('plantsView.detailedView.journalFilters.pestControl'), icon: <PhosphorIcons.WarningCircle className="text-red-400" /> },
    ];

    return (
        <div className="flex flex-wrap gap-3 justify-center">
            {actions.map(action => (
                <Button
                    key={action.type}
                    onClick={() => onLogAction(action.type)}
                    variant="secondary"
                    className="flex items-center"
                >
                    <div className="w-5 h-5">{action.icon}</div>
                    <span className="ml-2">{action.label}</span>
                </Button>
            ))}
        </div>
    );
});
