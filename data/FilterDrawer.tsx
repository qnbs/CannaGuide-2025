import React from 'react';
import { DifficultyLevel, YieldLevel, HeightLevel, AdvancedFilterState, StrainType } from '@/types';
import { Button } from '@/components/common/Button';
import { RangeSlider } from '@/components/common/RangeSlider';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { Drawer } from '@/components/common/Drawer';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { Switch } from '@/components/common/Switch';

interface FilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: () => void;
    onReset: () => void;
    tempFilterState: AdvancedFilterState;
    setTempFilterState: (filters: Partial<AdvancedFilterState>) => void;
    allAromas: string[];
    allTerpenes: string[];
    count: number;
    showFavorites: boolean;
    onToggleFavorites: () => void;
    typeFilter: StrainType[];
    onToggleTypeFilter: (type: StrainType) => void;
    letterFilter: string | null;
    onLetterFilterChange: (letter: string | null) => void;
    isAnyFilterActive: boolean;
}

const FilterSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <details open className="group border-b border-slate-700/50 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
        <summary className="text-lg font-semibold text-primary-400 cursor-pointer list-none flex items-center gap-2">
            <PhosphorIcons.ChevronDown className="w-5 h-5 transition-transform duration-200 group-open:rotate-180" />
            {title}
        </summary>
        <div className="pt-3 pl-7 space-y-4">
            {children}
        </div>
    </details>
);

export const FilterDrawer: React.FC<FilterDrawerProps> = ({ isOpen, onClose, onApply, onReset, tempFilterState, setTempFilterState, allAromas, allTerpenes, count, showFavorites, onToggleFavorites, typeFilter, onToggleTypeFilter, letterFilter, onLetterFilterChange, isAnyFilterActive }) => {
    const { t } = useTranslation();
    
    const difficultyLabels: Record<DifficultyLevel, string> = { Easy: t('strainsView.difficulty.easy'), Medium: t('strainsView.difficulty.medium'), Hard: t('strainsView.difficulty.hard') };
    const yieldLabels: Record<YieldLevel, string> = { Low: t('strainsView.addStrainModal.yields.low'), Medium: t('strainsView.addStrainModal.yields.medium'), High: t('strainsView.addStrainModal.yields.high') };
    const heightLabels: Record<HeightLevel, string> = { Short: t('strainsView.addStrainModal.heights.short'), Medium: t('strainsView.addStrainModal.heights.medium'), Tall: t('strainsView.addStrainModal.heights.tall') };
    const typeOptions = [
        { value: 'Sativa' as StrainType, label: t('strainsView.sativa') },
        { value: 'Indica' as StrainType, label: t('strainsView.indica') },
        { value: 'Hybrid' as StrainType, label: t('strainsView.hybrid') },
    ];
    
    const handleToggleArray = (key: keyof AdvancedFilterState, value: string) => {
        const currentArray = (tempFilterState as any)[key] as string[];
        const newArray = currentArray.includes(value)
            ? currentArray.filter((item: string) => item !== value)
            : [...currentArray, value];
        setTempFilterState({ [key]: newArray });
    };

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title={t('strainsView.advancedFilters')}
            size="2xl"
            footer={
                <>
                    {/* FIX: Wrap onClick handlers in arrow functions to prevent passing event objects. */}
                    <Button variant="secondary" onClick={() => onReset()}>{t('strainsView.resetFilters')}</Button>
                    <Button onClick={() => onApply()}>{t('strainsView.matchingStrains_other', { count })}</Button>
                </>
            }
        >
            <div className="space-y-6">
                <section aria-labelledby="cannabinoids-filter-title">
                    <FilterSection title={t('strainsView.addStrainModal.cannabinoids')}>
                        <h3 id="cannabinoids-filter-title" className="sr-only">{t('strainsView.addStrainModal.cannabinoids')}</h3>
                        <RangeSlider label={t('strainsView.filters.thcMax')} min={0} max={35} step={1} value={tempFilterState.thcRange} onChange={val => setTempFilterState({ thcRange: val })} unit=" %" color="primary"/>
                        <RangeSlider label={t('strainsView.filters.cbdMax')} min={0} max={20} step={1} value={tempFilterState.cbdRange} onChange={val => setTempFilterState({ cbdRange: val })} unit=" %" color="green" />
                    </FilterSection>
                </section>

                <section aria-labelledby="growdata-filter-title">
                    <FilterSection title={t('strainsView.addStrainModal.growData')}>
                        <h3 id="growdata-filter-title" className="sr-only">{t('strainsView.addStrainModal.growData')}</h3>
                        <RangeSlider label={t('strainsView.filters.floweringTime')} min={4} max={20} step={1} value={tempFilterState.floweringRange} onChange={val => setTempFilterState({ floweringRange: val })} unit={` ${t('common.units.weeks')}`} color="blue"/>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <h4 className="text-sm font-semibold text-slate-300 mb-2">{t('strainsView.filters.difficulty')}</h4>
                                <div className="flex flex-col sm:flex-row gap-1 bg-slate-800 rounded-lg p-0.5">
                                    {(['Easy', 'Medium', 'Hard'] as DifficultyLevel[]).map(d => (
                                        <button key={d} onClick={() => handleToggleArray('selectedDifficulties', d)} className={`flex-1 px-2 py-1 text-sm rounded-md transition-colors ${tempFilterState.selectedDifficulties.includes(d) ? 'bg-slate-700 text-primary-300' : 'text-slate-300 hover:bg-slate-700/50'}`}>
                                            {difficultyLabels[d]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-slate-300 mb-2">{t('strainsView.filters.yield')}</h4>
                                <div className="flex flex-col sm:flex-row gap-1 bg-slate-800 rounded-lg p-0.5">
                                    {(['Low', 'Medium', 'High'] as YieldLevel[]).map(y => (
                                        <button key={y} onClick={() => handleToggleArray('selectedYields', y)} className={`flex-1 px-2 py-1 text-sm rounded-md transition-colors ${tempFilterState.selectedYields.includes(y) ? 'bg-slate-700 text-primary-300' : 'text-slate-300 hover:bg-slate-700/50'}`}>
                                            {yieldLabels[y]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                             <div>
                                <h4 className="text-sm font-semibold text-slate-300 mb-2">{t('strainsView.filters.height')}</h4>
                                <div className="flex flex-col sm:flex-row gap-1 bg-slate-800 rounded-lg p-0.5">
                                    {(['Short', 'Medium', 'Tall'] as HeightLevel[]).map(h => (
                                        <button key={h} onClick={() => handleToggleArray('selectedHeights', h)} className={`flex-1 px-2 py-1 text-sm rounded-md transition-colors ${tempFilterState.selectedHeights.includes(h) ? 'bg-slate-700 text-primary-300' : 'text-slate-300 hover:bg-slate-700/50'}`}>
                                            {heightLabels[h]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </FilterSection>
                </section>
                 
                <section aria-labelledby="profile-filter-title">
                     <FilterSection title={t('strainsView.filters.aromas')}>
                        <h3 id="profile-filter-title" className="sr-only">{t('strainsView.addStrainModal.profile')}</h3>
                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2">
                            {allAromas.map(aroma => (
                                <button key={aroma} onClick={() => handleToggleArray('selectedAromas', aroma)} className={`px-2 py-1 text-xs rounded-full transition-colors ${tempFilterState.selectedAromas.includes(aroma) ? 'bg-primary-600 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'}`}>
                                    {t(`common.aromas.${aroma}`, aroma)}
                                </button>
                            ))}
                        </div>
                    </FilterSection>
                </section>

                 <section aria-labelledby="terpenes-filter-title">
                     <FilterSection title={t('strainsView.filters.terpenes')}>
                        <h3 id="terpenes-filter-title" className="sr-only">{t('strainsView.filters.terpenes')}</h3>
                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2">
                            {allTerpenes.map(terpene => (
                                <button key={terpene} onClick={() => handleToggleArray('selectedTerpenes', terpene)} className={`px-2 py-1 text-xs rounded-full transition-colors ${tempFilterState.selectedTerpenes.includes(terpene) ? 'bg-primary-600 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'}`}>
                                    {t(`common.terpenes.${terpene}`, terpene)}
                                </button>
                            ))}
                        </div>
                    </FilterSection>
                </section>
            </div>
        </Drawer>
    );
};
