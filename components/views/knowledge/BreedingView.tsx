import React, { useState } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useTranslations } from '@/hooks/useTranslations';
import { useAppStore } from '@/stores/useAppStore';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { Seed } from '@/types';

const SeedCard: React.FC<{ seed: Seed, isSelected: boolean, onSelect: () => void }> = ({ seed, isSelected, onSelect }) => {
    const { t } = useTranslations();
    return (
        <button
            onClick={onSelect}
            className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 ${isSelected ? 'bg-primary-900/50 border-primary-500 scale-105' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}
        >
            <p className="font-bold text-slate-100">{seed.name}</p>
            <p className="text-xs text-slate-400 truncate">{seed.genetics}</p>
            <p className="text-sm font-semibold text-primary-300 mt-1">{t('knowledgeView.breeding.quality')}: {seed.quality.toFixed(1)}%</p>
        </button>
    );
};


export const BreedingView: React.FC = () => {
    const { t } = useTranslations();
    const { collectedSeeds, breedStrains } = useAppStore(state => ({
        collectedSeeds: state.collectedSeeds,
        breedStrains: state.breedStrains,
    }));

    const [parentA, setParentA] = useState<string | null>(null);
    const [parentB, setParentB] = useState<string | null>(null);
    const [newName, setNewName] = useState('');

    const handleSelect = (seedId: string) => {
        if (parentA === seedId) {
            setParentA(null);
        } else if (parentB === seedId) {
            setParentB(null);
        } else if (!parentA) {
            setParentA(seedId);
        } else if (!parentB) {
            setParentB(seedId);
        }
    };

    const handleBreed = () => {
        if (parentA && parentB && newName.trim()) {
            breedStrains(parentA, parentB, newName.trim());
            setParentA(null);
            setParentB(null);
            setNewName('');
        }
    };
    
    const sortedSeeds = [...collectedSeeds].sort((a, b) => b.quality - a.quality);

    const getSeedById = (id: string | null) => id ? collectedSeeds.find(s => s.id === id) : null;

    return (
        <Card>
            <h3 className="text-xl font-bold font-display text-primary-400 flex items-center gap-2">
                <PhosphorIcons.TestTube className="w-6 h-6"/> {t('knowledgeView.breeding.title')}
            </h3>
            <p className="text-sm text-slate-400 mt-2 mb-4">{t('knowledgeView.breeding.description')}</p>
            
            {collectedSeeds.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                    <PhosphorIcons.Flask className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                    <h3 className="font-semibold">{t('knowledgeView.breeding.noSeeds')}</h3>
                    <p className="text-sm">{t('knowledgeView.breeding.noSeedsDesc')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-semibold mb-2">{t('knowledgeView.breeding.selectParentA')}</h4>
                        <div className="p-2 rounded-lg bg-slate-800/50 min-h-[4rem] flex items-center justify-center">
                            {parentA ? <p className="font-bold text-primary-300">{t('knowledgeView.breeding.parentSelected', { name: getSeedById(parentA)?.name })}</p> : <p className="text-sm text-slate-500">Select a seed...</p>}
                        </div>
                    </div>
                     <div>
                        <h4 className="font-semibold mb-2">{t('knowledgeView.breeding.selectParentB')}</h4>
                         <div className="p-2 rounded-lg bg-slate-800/50 min-h-[4rem] flex items-center justify-center">
                            {parentB ? <p className="font-bold text-primary-300">{t('knowledgeView.breeding.parentSelected', { name: getSeedById(parentB)?.name })}</p> : <p className="text-sm text-slate-500">Select a seed...</p>}
                        </div>
                    </div>

                    <div className="md:col-span-2">
                         <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                            {sortedSeeds.map(seed => (
                                <SeedCard 
                                    key={seed.id}
                                    seed={seed}
                                    isSelected={parentA === seed.id || parentB === seed.id}
                                    onSelect={() => handleSelect(seed.id)}
                                />
                            ))}
                        </div>
                    </div>
                   
                    <div className="md:col-span-2 space-y-4">
                         <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder={t('knowledgeView.breeding.newStrainPlaceholder')}
                            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                         <Button onClick={handleBreed} disabled={!parentA || !parentB || !newName.trim()} className="w-full">
                           {t('knowledgeView.breeding.breedButton')}
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    );
};
