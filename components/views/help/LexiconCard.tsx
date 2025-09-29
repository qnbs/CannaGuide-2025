import React from 'react';
import { Card } from '@/components/common/Card';
import { lexiconData } from '@/data/lexicon';

export const LexiconCard: React.FC<{ entry: (typeof lexiconData)[0] }> = ({ entry }) => {
    return (
        <Card className="bg-slate-800/50">
            <h3 className="text-lg font-bold text-primary-300">{entry.term}</h3>
            <p className="text-xs uppercase text-slate-400 mb-2">{entry.category}</p>
            <p className="text-sm text-slate-300">{entry.definition}</p>
            {entry.details && (
                <div className="mt-3 pt-3 border-t border-slate-700/50 text-xs text-slate-400 space-y-1">
                    {Object.entries(entry.details).map(([key, value]) => (
                        <p key={key}>
                            <strong className="text-slate-300">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> {Array.isArray(value) ? value.join(', ') : value}
                        </p>
                    ))}
                </div>
            )}
        </Card>
    );
};
