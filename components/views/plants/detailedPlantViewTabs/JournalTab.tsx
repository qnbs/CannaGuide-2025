import React, { useState, useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { JournalEntry, JournalEntryType } from '@/types';
import { useTranslations } from '@/hooks/useTranslations';

interface JournalTabProps {
    journal: JournalEntry[];
}

export const JournalTab: React.FC<JournalTabProps> = ({ journal }) => {
    const { t } = useTranslations();
    const [journalFilter, setJournalFilter] = useState<JournalEntryType | 'ALL'>('ALL');

    const filteredJournal = useMemo(() => {
        if (journalFilter === 'ALL') return journal;
        return journal.filter(entry => entry.type === journalFilter);
    }, [journal, journalFilter]);
    
    const journalTypeIcons: Record<JournalEntryType, React.ReactNode> = {
        [JournalEntryType.Watering]: <PhosphorIcons.Drop />,
        [JournalEntryType.Feeding]: <PhosphorIcons.TestTube />,
        [JournalEntryType.Training]: <PhosphorIcons.Scissors />,
        [JournalEntryType.Observation]: <PhosphorIcons.MagnifyingGlass />,
        [JournalEntryType.System]: <PhosphorIcons.Gear />,
        [JournalEntryType.Photo]: <PhosphorIcons.Camera />,
        [JournalEntryType.PestControl]: <PhosphorIcons.WarningCircle />,
        [JournalEntryType.Environment]: <PhosphorIcons.Fan />,
        [JournalEntryType.Amendment]: <PhosphorIcons.Flask />,
    };

    const journalFilterOptions: { label: string, value: JournalEntryType | 'ALL', icon: React.ReactNode }[] = [
        { label: t('common.all'), value: 'ALL', icon: <PhosphorIcons.ListChecks /> },
        { label: t('plantsView.detailedView.journalFilters.watering'), value: JournalEntryType.Watering, icon: <PhosphorIcons.Drop /> },
        { label: t('plantsView.detailedView.journalFilters.feeding'), value: JournalEntryType.Feeding, icon: <PhosphorIcons.TestTube /> },
        { label: t('plantsView.detailedView.journalFilters.training'), value: JournalEntryType.Training, icon: <PhosphorIcons.Scissors /> },
        { label: t('plantsView.detailedView.journalFilters.observation'), value: JournalEntryType.Observation, icon: <PhosphorIcons.MagnifyingGlass /> },
        { label: t('plantsView.detailedView.journalFilters.pestControl'), value: JournalEntryType.PestControl, icon: <PhosphorIcons.WarningCircle /> },
        { label: t('plantsView.detailedView.journalFilters.amendment'), value: JournalEntryType.Amendment, icon: <PhosphorIcons.Flask /> },
        { label: t('plantsView.detailedView.journalFilters.system'), value: JournalEntryType.System, icon: <PhosphorIcons.Gear /> },
        { label: t('plantsView.detailedView.journalFilters.photo'), value: JournalEntryType.Photo, icon: <PhosphorIcons.Camera /> },
        { label: t('plantsView.detailedView.journalFilters.environment'), value: JournalEntryType.Environment, icon: <PhosphorIcons.Fan /> },
    ];

    return (
        <Card>
            <div className="flex flex-wrap gap-2 mb-4">
                {journalFilterOptions.map(opt => (
                    <button key={opt.value} onClick={() => setJournalFilter(opt.value)} className={`flex items-center gap-2 px-3 py-1 text-sm rounded-full transition-colors ${journalFilter === opt.value ? 'bg-primary-600 text-white font-semibold' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}>
                        {opt.icon} {opt.label}
                    </button>
                ))}
            </div>
            <ul className="space-y-4">
                {filteredJournal.length > 0 ? (
                    [...filteredJournal].reverse().map(entry => (
                        <li key={entry.id} className="flex items-start gap-4 p-3 bg-slate-800 rounded-lg">
                             <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-700 rounded-full text-primary-400">
                                {journalTypeIcons[entry.type]}
                            </div>
                            <div className="flex-grow">
                                <p className="font-semibold text-slate-100">{entry.notes}</p>
                                {entry.details && (
                                    <p className="text-xs text-slate-400">
                                        {Object.entries(entry.details).map(([key, value]) => value && !['imageUrl', 'imageId'].includes(key) && `${key}: ${value}`).filter(Boolean).join(' | ')}
                                    </p>
                                )}
                                 <p className="text-xs text-slate-500 mt-1">{new Date(entry.createdAt).toLocaleString()}</p>
                            </div>
                        </li>
                    ))
                ) : (
                    <p className="text-center text-slate-400 py-8">{t('plantsView.detailedView.journalNoEntries')}</p>
                )}
            </ul>
        </Card>
    );
};