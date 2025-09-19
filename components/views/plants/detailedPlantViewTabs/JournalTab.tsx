import React, { useState, useMemo } from 'react';
import { Card } from '../../../common/Card';
import { PhosphorIcons } from '../../../icons/PhosphorIcons';
import { JournalEntry, JournalEntryType } from '../../../../types';
import { useTranslations } from '../../../../hooks/useTranslations';

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

    const journalFilterOptions: { label: string, value: JournalEntryType | 'ALL', icon: React.ReactNode }[] = [
        { label: t('common.all'), value: 'ALL', icon: <PhosphorIcons.ListChecks /> },
        { label: t('plantsView.detailedView.journalFilters.watering'), value: 'WATERING', icon: <PhosphorIcons.Drop /> },
        { label: t('plantsView.detailedView.journalFilters.feeding'), value: 'FEEDING', icon: <PhosphorIcons.TestTube /> },
        { label: t('plantsView.detailedView.journalFilters.training'), value: 'TRAINING', icon: <PhosphorIcons.Scissors /> },
        { label: t('plantsView.detailedView.journalFilters.observation'), value: 'OBSERVATION', icon: <PhosphorIcons.MagnifyingGlass /> },
        { label: t('plantsView.detailedView.journalFilters.system'), value: 'SYSTEM', icon: <PhosphorIcons.Gear /> },
        { label: t('plantsView.detailedView.journalFilters.photo'), value: 'PHOTO', icon: <PhosphorIcons.Camera /> },
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
                            <div className="flex-shrink-0 text-center">
                                <p className="font-bold text-primary-400">{new Date(entry.timestamp).toLocaleDateString()}</p>
                                <p className="text-xs text-slate-400">{new Date(entry.timestamp).toLocaleTimeString()}</p>
                            </div>
                            <div className="flex-grow">
                                <p className="font-semibold text-slate-100">{entry.notes}</p>
                                {entry.details && (
                                    <p className="text-xs text-slate-400">
                                        {Object.entries(entry.details).map(([key, value]) => value && !['imageUrl', 'imageId'].includes(key) && `${key}: ${value}`).filter(Boolean).join(' | ')}
                                    </p>
                                )}
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