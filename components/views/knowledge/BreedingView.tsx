import React, { useMemo, useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '@/stores/store';
import { selectCollectedSeeds, selectBreedingSlots } from '@/stores/selectors';
import { Button } from '@/components/common/Button';
import { Seed, Strain } from '@/types';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { setParentA, setParentB, clearBreedingSlots } from '@/stores/slices/breedingSlice';
import { addUserStrainWithValidation } from '@/stores/slices/userStrainsSlice';
import { breedingService } from '@/services/breedingService.tsx';
import { strainService } from '@/services/strainService';
import { Input } from '@/components/ui/ThemePrimitives';
import { createStrainObject } from '@/services/strainFactory';

const SeedCard: React.FC<{ seed: Seed, onClick: () => void, isSelected?: boolean }> = ({ seed, onClick, isSelected }) => {
    return (
        <button onClick={onClick} className={`w-full text-left p-2 rounded-lg transition-all ring-1 ring-inset ring-white/20 ${isSelected ? 'bg-primary-900/50 ring-2 ring-primary-500' : 'bg-slate-800 hover:bg-slate-700/50'}`}>
            <p className="font-bold truncate">{seed.strainName}</p>
            <p className="text-xs text-slate-400">Quality: {(seed.quality * 100).toFixed(0)}%</p>
        </button>
    )
};

const ParentSlot: React.FC<{ title: string, seed: Seed | undefined, onClear: () => void, allStrains: Strain[] }> = ({ title, seed, onClear, allStrains }) => {
    const parentStrain = seed ? allStrains.find(s => s.id === seed.strainId) : null;
    return (
        <Card className="flex flex-col items-center justify-center h-48 text-center relative">
            <h4 className="absolute top-2 text-sm font-semibold text-slate-400">{title}</h4>
            {seed && parentStrain ? (
                <>
                    <PhosphorIcons.TestTube className="w-12 h-12 text-primary-400 mb-2"/>
                    <p className="font-bold text-slate-100">{seed.strainName}</p>
                    <p className="text-xs text-slate-400">THC: {parentStrain.thc.toFixed(1)}% | CBD: {parentStrain.cbd.toFixed(1)}%</p>
                    <Button size="sm" variant="danger" className="!absolute top-1 right-1 !p-1" onClick={onClear}><PhosphorIcons.X/></Button>
                </>
            ) : (
                <div className="text-slate-500">
                    <PhosphorIcons.Drop className="w-12 h-12 mb-2"/>
                    <p>Select a seed</p>
                </div>
            )}
        </Card>
    );
};

export const BreedingView: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const [allStrains, setAllStrains] = useState<Strain[]>([]);
    const collectedSeeds = useAppSelector(selectCollectedSeeds);
    const { parentA, parentB } = useAppSelector(selectBreedingSlots);
    const [newStrainName, setNewStrainName] = useState('');
    const [result, setResult] = useState<ReturnType<typeof breedingService.cross>>(null);

    useEffect(() => {
        strainService.getAllStrains().then(setAllStrains);
    }, []);

    const seedA = useMemo(() => collectedSeeds.find(s => s.id === parentA), [collectedSeeds, parentA]);
    const seedB = useMemo(() => collectedSeeds.find(s => s.id === parentB), [collectedSeeds, parentB]);

    const handleSeedClick = (seedId: string) => {
        if (!parentA) {
            dispatch(setParentA(seedId));
        } else if (!parentB && seedId !== parentA) {
            dispatch(setParentB(seedId));
        }
    };

    const handleBreed = () => {
        if (seedA && seedB) {
            const cross = breedingService.cross(seedA, seedB, allStrains);
            setResult(cross);
            setNewStrainName(cross?.name || '');
        }
    };
    
    const handleSave = () => {
        if(result && newStrainName.trim()) {
            const finalStrain = createStrainObject({ ...result, name: newStrainName.trim() });
            dispatch(addUserStrainWithValidation(finalStrain));
            setResult(null);
            setNewStrainName('');
            dispatch(clearBreedingSlots());
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-bold font-display text-primary-400 mb-2">{t('knowledgeView.breeding.title')}</h3>
                <p className="text-sm text-slate-400">{t('knowledgeView.breeding.description')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-1">
                    <h4 className="font-bold text-lg text-slate-200 mb-2">{t('knowledgeView.breeding.collectedSeeds')} ({collectedSeeds.length})</h4>
                    {collectedSeeds.length === 0 ? (
                        <p className="text-sm text-slate-500 py-4 text-center">{t('knowledgeView.breeding.noSeeds')}</p>
                    ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                            {collectedSeeds.map(seed => <SeedCard key={seed.id} seed={seed} onClick={() => handleSeedClick(seed.id)} isSelected={seed.id === parentA || seed.id === parentB} />)}
                        </div>
                    )}
                </Card>

                <div className="lg:col-span-2 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <ParentSlot title={t('knowledgeView.breeding.parentA')} seed={seedA} onClear={() => dispatch(setParentA(null))} allStrains={allStrains} />
                        <ParentSlot title={t('knowledgeView.breeding.parentB')} seed={seedB} onClear={() => dispatch(setParentB(null))} allStrains={allStrains} />
                    </div>
                     <Button onClick={handleBreed} disabled={!parentA || !parentB || !!result} className="w-full">
                        <PhosphorIcons.TestTube className="w-5 h-5 mr-2" />
                        {t('knowledgeView.breeding.breedButton')}
                    </Button>
                </div>
            </div>

            {result && (
                <Card className="animate-fade-in">
                    <h3 className="text-xl font-bold text-primary-400 mb-4">{t('knowledgeView.breeding.resultsTitle')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input type="text" value={newStrainName} onChange={e => setNewStrainName(e.target.value)} className="md:col-span-2" placeholder={t('knowledgeView.breeding.newStrainName')} />
                        <div>
                            <h4 className="font-semibold text-slate-200 mb-2">{t('knowledgeView.breeding.potentialTraits')}</h4>
                            <div className="space-y-1 text-sm text-slate-300">
                                <p><strong>{t('common.type')}:</strong> {result.type}</p>
                                <p><strong>THC:</strong> ~{result.thc.toFixed(1)}%</p>
                                <p><strong>{t('strainsView.table.flowering')}:</strong> ~{result.floweringTime.toFixed(0)} {t('common.units.weeks')}</p>
                                <p><strong>{t('strainsView.table.difficulty')}:</strong> {t(`strainsView.difficulty.${result.agronomic.difficulty.toLowerCase()}`)}</p>
                                <p><strong>{t('strainsView.addStrainModal.yield')}:</strong> {t(`strainsView.addStrainModal.yields.${result.agronomic.yield.toLowerCase()}`)}</p>
                                <p><strong>{t('strainsView.addStrainModal.height')}:</strong> {t(`strainsView.addStrainModal.heights.${result.agronomic.height.toLowerCase()}`)}</p>
                            </div>
                        </div>
                         <div>
                            <h4 className="font-semibold text-slate-200 mb-2">{t('strainsView.strainModal.aromas')}</h4>
                            <div className="flex flex-wrap gap-1">
                                {(result.aromas || []).map(a => <span key={a} className="bg-slate-700 text-xs px-2 py-0.5 rounded-full">{a}</span>)}
                            </div>
                        </div>
                    </div>
                    <div className="text-right mt-6">
                        <Button onClick={handleSave} disabled={!newStrainName.trim()}>
                            <PhosphorIcons.PlusCircle className="w-5 h-5 mr-2" />
                            {t('knowledgeView.breeding.saveStrain')}
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default BreedingView;