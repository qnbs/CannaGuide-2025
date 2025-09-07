import React from 'react';
import { JournalEntry, JournalEntryType } from '../../../types';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { useTranslations } from '../../../hooks/useTranslations';

interface ActionToolbarProps {
    onAddJournalEntry: (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => void;
}

export const ActionToolbar: React.FC<ActionToolbarProps> = ({ onAddJournalEntry }) => {
    const { t } = useTranslations();

    const actions: { type: JournalEntryType, label: string, icon: React.ReactNode }[] = [
        { type: 'WATERING', label: t('plantsView.detailedView.journalFilters.watering'), icon: <PhosphorIcons.Drop /> },
        { type: 'FEEDING', label: t('plantsView.detailedView.journalFilters.feeding'), icon: <PhosphorIcons.TestTube /> },
        { type: 'TRAINING', label: t('plantsView.detailedView.journalFilters.training'), icon: <PhosphorIcons.Scissors /> },
        { type: 'OBSERVATION', label: t('plantsView.detailedView.journalFilters.observation'), icon: <PhosphorIcons.MagnifyingGlass /> },
        { type: 'PHOTO', label: t('plantsView.detailedView.journalFilters.photo'), icon: <PhosphorIcons.Camera /> },
    ];

    return (
        <div className="flex-shrink-0 mt-4">
            <div className="glass-pane p-2">
                <div className="grid grid-cols-5 gap-1">
                    {actions.map(action => (
                        <button
                            key={action.type}
                            onClick={() => onAddJournalEntry({ type: action.type, notes: '' })}
                            className="flex flex-col items-center justify-center p-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-primary-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                            aria-label={action.label}
                        >
                            <div className="w-6 h-6">{action.icon}</div>
                            <span className="text-xs mt-1 font-semibold">{action.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
