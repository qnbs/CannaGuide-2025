import React, { useMemo, useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '@/stores/store';
import { selectCollectedSeeds, selectBreedingSlots } from '@/stores/selectors';
import { Button } from '@/components/common/Button';
import { Seed, Strain, StrainType, GeneticModifiers, BreedingState } from '@/types';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons';
import { setParentA, setParentB, clearBreedingSlots } from '@/stores/slices/breedingSlice';
import { addUserStrainWithValidation } from '@/stores/slices/userStrainsSlice';
import { strainService } from '@/services/strainService';
import { Input } from '@/components/ui/ThemePrimitives';
import { createStrainObject } from '@/services/strainFactory';
import { AiLoadingIndicator } from '@/components/common/AiLoadingIndicator';

// --- SELF-CONTAINED BREEDING LOGIC ---
// Moved this pure function outside the component to prevent re-creation on every render.
const cross = (parentA: Strain, parentB: Strain): Omit<Strain, 'id'> => {
    const newName = `${parentA.name.split(' ')[0]} ${parentB.name.split(' ').pop()}`;
    const randomFactor = (magnitude = 0.2) => 1 + (Math.random() - 0.5) * magnitude;

    const newStrainData: Partial<Strain> = {
        name: newName,
        type: parentA.type === parentB.type ? parentA.type : StrainType.Hybrid,
        genetics: `${parentA.name} x ${parentB.name}`,
        floweringType: 'Photoperiod',
        thc: ((parentA.thc + parentB.thc) / 2) * randomFactor(),
        cbd: (parentA.cbd + parentB.cbd) / 2,
        floweringTime: ((parentA.floweringTime + parentB.floweringTime) / 2) * randomFactor(0.1),
        agronomic: {
            difficulty: Math.random() > 0.5 ? parentA.agronomic.difficulty : parentB.agronomic.difficulty,
            yield: Math.random() > 0.5 ? parentA.agronomic.yield : parentB.agronomic.yield,
            height: Math.random() > 0.5 ? parentA.agronomic.height : parentB.agronomic.height,
        },
        aromas: [...new Set([...(parentA.aromas || []), ...(parentB.aromas || [])])].sort(() => 0.5 - Math.random()).slice(0, 4),
        dominantTerpenes: [...new Set([...(parentA.dominantTerpenes || []), ...(parentB.dominantTerpenes || [])])].sort(() => 0.5 - Math.random()).slice(0, 3),
    };
    
    return createStrainObject(newStrainData);
};


const typeInfo: Record<StrainType, { icon: React.ReactNode; color: string }> = {
    [StrainType.Sativa]: { icon: <SativaIcon />, color: 'text-amber-400' },
    [StrainType.Indica]: { icon: <IndicaIcon />, color: 'text-indigo-400' },
    [StrainType.Hybrid]: { icon: <HybridIcon />, color: 'text-blue-400' },
};

const SeedCard: React.FC<{ seed: Seed, onClick: () => void, isSelected?: boolean, strain?: Strain | null }> = ({ seed, onClick, isSelected, strain }) => {
    const TypeInfo = strain ? typeInfo[strain.type] : null;
    return (
        <button onClick={onClick} className={`w-full text-left p-2 rounded-lg transition-all ring-1 ring-inset ring-white/20 flex items-center gap-3 ${isSelected ? 'bg-primary-900/50 ring-2 ring-primary-500' : 'bg-slate-800 hover:bg-slate-700/50'}`}>
            {TypeInfo && <div className={`w-6 h-6 flex-shrink-0 ${TypeInfo.color}`}>{TypeInfo.icon}</div>}
            <div className="flex-grow min-w-0">
                <p className="font-bold truncate">{seed.strainName}</p>
                <p className="text-xs text-slate-400">Quality: {(seed.quality * 100).toFixed(0)}%</p>
            </div>
        </button>
    )
};

const ParentSlot: React.FC<{ title: string, seed: Seed | undefined, onClear: () => void, allStrains: Strain[] }> = ({ title, seed, onClear, allStrains }) => {
    const parentStrain = seed ? allStrains.find(s => s.id === seed.strainId) : null;
    const TypeInfo = parentStrain ? typeInfo[parentStrain.type] : null;

    return (
        <Card className="flex flex-col items-center justify-center h-48 text-center relative bg-slate-800/30">
            <h4 className="absolute top-2 text-sm font-semibold text-slate-400">{title}</h4>
            {seed && parentStrain && TypeInfo ? (
                <>
                    <div className={`w-12 h-12 mb-2 ${TypeInfo.color}`}>{TypeInfo.icon}</div>
                    <p className="font-bold text-slate-100">{seed.strainName}</p>
                    <div className="text-xs text-slate-400 mt-1">
                        <p>THC: {parentStrain.thc.toFixed(1)}% | CBD: {parentStrain.cbd.toFixed(1)}%</p>
                        <p>Quality: {(seed.quality * 100).toFixed(0)}%</p>
                    </div>
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

const TraitComparison: React.FC<{ label: string, valA: string, valB: string, valChild: string, icon?: React.ReactNode }> = ({ label, valA, valB, valChild, icon }) => (
    <div className="grid grid-cols-3 items-center text-center text-sm py-1 border-b border-slate-700/50 last:border-0">
        <span className="text-slate-300 font-mono">{valA}</span>
        <span className="font-bold text-slate-100 flex items-center justify-center gap-1.5">{icon}{label}</span>
        <span className="text-slate-300 font-mono">{valB}</span>
        {/* FIX: Replaced invalid `colSpan` prop on a div with a valid `className="col-span-3"` for grid layout. */}
        <div className="col-span-3 text-2xl font-bold text-primary-300 mt-1">{valChild}</div>
    </div>
);

const BreedingView: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const [allStrains, setAllStrains] = useState<Strain[]>([]);
    const [isBreeding, setIsBreeding] = useState(false);
    // FIX: Explicitly type the result of useAppSelector to avoid `unknown` type errors.
    const collectedSeeds = useAppSelector(selectCollectedSeeds) as Seed[];
    const { parentA: parentA_id, parentB: parentB_id } = useAppSelector(selectBreedingSlots) as BreedingState['breedingSlots'];
    const [newStrainName, setNewStrainName] = useState('');
    const [result, setResult] = useState<Omit<Strain, 'id'> | null>(null);

    useEffect(() => {
        strainService.getAllStrains().then(setAllStrains);
    }, []);

    const seedA = useMemo(() => collectedSeeds.find(s => s.id === parentA_id), [collectedSeeds, parentA_id]);
    const seedB = useMemo(() => collectedSeeds.find(s => s.id === parentB_id), [collectedSeeds, parentB_id]);
    const parentA = useMemo(() => seedA ? allStrains.find(s => s.id === seedA.strainId) : null, [allStrains, seedA]);
    const parentB = useMemo(() => seedB ? allStrains.find(s => s.id === seedB.strainId) : null, [allStrains, seedB]);

    const handleSeedClick = (seedId: string) => {
        if (!parentA_id) {
            dispatch(setParentA(seedId));
        } else if (!parentB_id && seedId !== parentA_id) {
            dispatch(setParentB(seedId));
        }
    };

    const handleBreed = () => {
        if (parentA && parentB) {
            setIsBreeding(true);
            setTimeout(() => {
                const crossResult = cross(parentA, parentB);
                setResult(crossResult);
                setNewStrainName(crossResult?.name || '');
                setIsBreeding(false);
            }, 1500); // Simulate processing time for animation
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
    
    const handleReset = () => {
        setResult(null);
        setNewStrainName('');
        dispatch(clearBreedingSlots());
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-bold font-display text-primary-400 mb-2">{t('knowledgeView.breeding.title')}</h3>
                <p className="text-sm text-slate-400">{t('knowledgeView.breeding.description')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <h4 className="font-bold text-lg text-slate-200 mb-2">{t('knowledgeView.breeding.collectedSeeds')} ({collectedSeeds.length})</h4>
                    {collectedSeeds.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <PhosphorIcons.TestTube className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                            <p className="text-sm font-semibold text-slate-300">{t('knowledgeView.breeding.noSeeds')}</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                            {collectedSeeds.map(seed => <SeedCard key={seed.id} seed={seed} onClick={() => handleSeedClick(seed.id)} isSelected={seed.id === parentA_id || seed.id === parentB_id} strain={allStrains.find(s => s.id === seed.strainId)} />)}
                        </div>
                    )}
                </Card>

                <div className="lg:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-4">
                        <ParentSlot title={t('knowledgeView.breeding.parentA')} seed={seedA} onClear={() => dispatch(setParentA(null))} allStrains={allStrains} />
                        <PhosphorIcons.Plus className="w-8 h-8 text-slate-500 mx-auto" />
                        <ParentSlot title={t('knowledgeView.breeding.parentB')} seed={seedB} onClear={() => dispatch(setParentB(null))} allStrains={allStrains} />
                    </div>
                     <Button onClick={handleBreed} disabled={!parentA_id || !parentB_id || !!result || isBreeding} className="w-full">
                        <PhosphorIcons.TestTube className="w-5 h-5 mr-2" />
                        {isBreeding ? t('ai.generating') : t('knowledgeView.breeding.breedButton')}
                    </Button>
                </div>
            </div>

            {isBreeding && <AiLoadingIndicator loadingMessage="Splicing genes..." />}

            {result && parentA && parentB && (
                <Card className="animate-fade-in bg-slate-800/50">
                    <div className="flex justify-between items-center">
                         <h3 className="text-xl font-bold text-primary-400">{t('knowledgeView.breeding.resultsTitle')}</h3>
                         <Button variant="secondary" size="sm" onClick={handleReset}><PhosphorIcons.ArrowClockwise className="w-4 h-4 mr-1.5" /> Start Over</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <div className="space-y-4">
                            <Input type="text" value={newStrainName} onChange={e => setNewStrainName(e.target.value)} placeholder={t('knowledgeView.breeding.newStrainName')} />
                            <TraitComparison label="THC" valA={`${parentA.thc.toFixed(1)}%`} valB={`${parentB.thc.toFixed(1)}%`} valChild={`~${result.thc.toFixed(1)}%`} icon={<PhosphorIcons.Lightning weight="fill" />} />
                            <TraitComparison label="Flowering" valA={`${parentA.floweringTime} w`} valB={`${parentB.floweringTime} w`} valChild={`~${result.floweringTime.toFixed(0)} w`} icon={<PhosphorIcons.ArrowClockwise />} />
                        </div>
                        <div className="space-y-4">
                             <div>
                                <h4 className="font-semibold text-slate-200 mb-2">{t('strainsView.addStrainModal.aromas')}</h4>
                                <div className="flex flex-wrap gap-1">
                                    {(result.aromas || []).map(a => <span key={a} className="bg-slate-700 text-xs px-2 py-0.5 rounded-full">{a}</span>)}
                                </div>
                            </div>
                             <div>
                                <h4 className="font-semibold text-slate-200 mb-2">{t('strainsView.addStrainModal.dominantTerpenes')}</h4>
                                <div className="flex flex-wrap gap-1">
                                    {(result.dominantTerpenes || []).map(a => <span key={a} className="bg-slate-700 text-xs px-2 py-0.5 rounded-full">{a}</span>)}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="text-right mt-6">
                        <Button onClick={handleSave} disabled={!newStrainName.trim()} glow>
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