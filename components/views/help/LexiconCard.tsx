import React from 'react';
import { Card } from '@/components/common/Card';
import { LexiconEntry } from '@/types';
import { useTranslation } from 'react-i18next';

const getCategoryKey = (category: 'Cannabinoid' | 'Terpene' | 'Flavonoid' | 'General') => {
    const lower = category.toLowerCase();
    return lower === 'general' ? 'general' : `${lower}s`;
};

export const LexiconCard: React.FC<{ entry: LexiconEntry }> = ({ entry }) => {
    const { t } = useTranslation();

    const categoryKey = getCategoryKey(entry.category);
    const term = t(`helpView.lexicon.${categoryKey}.${entry.key}.term`);
    const definition = t(`helpView.lexicon.${categoryKey}.${entry.key}.definition`);
    const details = t(`helpView.lexicon.${categoryKey}.${entry.key}.details`, { returnObjects: true });
    const detailsObject = (typeof details === 'object' && details !== null && !Array.isArray(details)) ? details : undefined;

    return (
        <Card className="bg-slate-800/50">
            <h3 className="text-lg font-bold text-primary-300">{term}</h3>
            <p className="text-xs uppercase text-slate-400 mb-2">{entry.category}</p>
            <p className="text-sm text-slate-300">{definition}</p>
            {detailsObject && (
                <div className="mt-3 pt-3 border-t border-slate-700/50 text-xs text-slate-400 space-y-1">
                    {Object.entries(detailsObject).map(([key, value]) => (
                        <p key={key}>
                            <strong className="text-slate-300">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> {Array.isArray(value) ? value.join(', ') : String(value)}
                        </p>
                    ))}
                </div>
            )}
        </Card>
    );
};