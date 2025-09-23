import React, { useMemo, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Card } from '@/components/common/Card';
import { useTranslations } from '@/hooks/useTranslations';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { ArchivedAdvisorResponse } from '@/types';
import { selectActivePlants, selectArchivedAdvisorResponses } from '@/stores/selectors';

export const GlobalAdvisorArchiveView: React.FC = () => {
    const { t } = useTranslations();
    const archive = useAppStore(selectArchivedAdvisorResponses);
    const activePlants = useAppStore(selectActivePlants);
    const [searchTerm, setSearchTerm] = useState('');

    const allAdvice = useMemo<(ArchivedAdvisorResponse & { plantName: string })[]>(() => {
        const plantMap = new Map(activePlants.map(p => [p.id, p.name]));
        
        return Object.values(archive)
            .flat()
            .map((advice: ArchivedAdvisorResponse) => ({
                ...advice,
                plantName: plantMap.get(advice.plantId) || t('plantsView.archivedPlant')
            }))
            .sort((a, b) => b.createdAt - a.createdAt);
    }, [archive, activePlants, t]);

    const filteredAdvice = useMemo(() => {
        if (!searchTerm) return allAdvice;
        const lowerCaseSearch = searchTerm.toLowerCase();
        return allAdvice.filter(advice => 
            advice.title.toLowerCase().includes(lowerCaseSearch) ||
            advice.content.toLowerCase().includes(lowerCaseSearch) ||
            advice.plantName.toLowerCase().includes(lowerCaseSearch)
        );
    }, [allAdvice, searchTerm]);

    return (
        <Card>
            <h3 className="text-xl font-bold font-display text-primary-400 mb-4 flex items-center gap-2">
                <PhosphorIcons.ArchiveBox className="w-6 h-6"/>
                {t('plantsView.aiAdvisor.archiveTitle')}
            </h3>
            
            <div className="relative mb-4">
                <input
                    type="text"
                    placeholder={t('strainsView.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-700 rounded-lg bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <PhosphorIcons.MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {filteredAdvice.length > 0 ? (
                    filteredAdvice.map((res) => (
                        <Card key={res.id} className="bg-slate-800">
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-primary-300 mt-1">{res.title}</h4>
                                <div className="text-xs text-slate-400 text-right">
                                    <p>{res.plantName}</p>
                                    <p>{new Date(res.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="prose prose-sm dark:prose-invert max-w-none mt-2" dangerouslySetInnerHTML={{ __html: res.content }}></div>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-10 text-slate-500">
                        <h3 className="font-semibold">{t('knowledgeView.archive.empty')}</h3>
                    </div>
                )}
            </div>
        </Card>
    );
};