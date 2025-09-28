import React from 'react';
import { DifficultyLevel, YieldLevel, HeightLevel } from '@/types';
import { Button } from '@/components/common/Button';
import { RangeSlider } from '@/components/common/RangeSlider';
import { useTranslations } from '@/hooks/useTranslations';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { AdvancedFilterState } from '@/hooks/useStrainFilters';
import { Drawer } from '@/components/common/Drawer';

interface FilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: () => void;
    onReset: () => void;
    tempFilterState: AdvancedFilterState;
    setTempFilterState: (updater: (prev: AdvancedFilterState) => AdvancedFilterState) => void;
    allAromas: string[];
    allTerpenes: string[];
    count: number;
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

export const FilterDrawer: React.FC<FilterDrawerProps> = ({ isOpen, onClose, onApply, onReset, tempFilterState, setTempFilterState, allAromas, allTerpenes, count }) => {
    const { t } = useTranslations();
    
    const difficultyLabels: Record<DifficultyLevel, string> = { Easy: t('strainsView.difficulty.easy'), Medium: t('strainsView.difficulty.medium'), Hard: t('strainsView.difficulty.hard') };
    const yieldLabels: Record<YieldLevel, string> = { Low: t('strainsView.addStrainModal.yields.low'), Medium: t('strainsView.addStrainModal.yields.medium'), High: t('strainsView.addStrainModal.yields.high') };
    const heightLabels: Record<HeightLevel, string> = { Short: t('strainsView.addStrainModal.heights.short'), Medium: t('strainsView.addStrainModal.heights.medium'), Tall: t('strainsView.addStrainModal.heights.tall') };
    
    const handleToggleSet = (key: keyof AdvancedFilterState, value: string) => {
        setTempFilterState(prev => {
            const currentSet = prev[key] as Set<string>;
            const newSet = new Set(currentSet);
            newSet.has(value) ? newSet.delete(value) : newSet.add(value);
            return { ...prev, [key]: newSet };
        });
    };

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title={t('strainsView.advancedFilters')}
            size="2xl"
            footer={
                <>
                    <Button variant="secondary" onClick={onReset}>{t('strainsView.resetFilters')}</Button>
                    <Button onClick={onApply}>{t('strainsView.matchingStrains', { count })}</Button>
                </>
            }
        >
            <div className="space-y-6">
                <section aria-labelledby="cannabinoids-filter-title">
                    <FilterSection title={t('strainsView.addStrainModal.cannabinoids')}>
                        <h3 id="cannabinoids-filter-title" className="sr-only">{t('strainsView.addStrainModal.cannabinoids')}</h3>
                        <RangeSlider label={t('strainsView.filters.thcMax')} min={0} max={35} step={1} value={tempFilterState.thcRange} onChange={val => setTempFilterState(prev => ({...prev, thcRange: val}))} unit=" %" color="primary"/>
                        <RangeSlider label={t('strainsView.filters.cbdMax')} min={0} max={20} step={1} value={tempFilterState.cbdRange} onChange={val => setTempFilterState(prev => ({...prev, cbdRange: val}))} unit=" %" color="green" />
                    </FilterSection>
                </section>

                <section aria-labelledby="growdata-filter-title">
                    <FilterSection title={t('strainsView.addStrainModal.growData')}>
                        <h3 id="growdata-filter-title" className="sr-only">{t('strainsView.addStrainModal.growData')}</h3>
                        <RangeSlider label={t('strainsView.filters.floweringTime')} min={4} max={20} step={1} value={tempFilterState.floweringRange} onChange={val => setTempFilterState(prev => ({...prev, floweringRange: val}))} unit={` ${t('strainsView.weeks')}`} color="blue"/>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <h4 className="text-sm font-semibold text-slate-300 mb-2">{t('strainsView.filters.difficulty')}</h4>
                                <div className="flex flex-col sm:flex-row gap-1 bg-slate-800 rounded-lg p-0.5">
                                    {(['Easy', 'Medium', 'Hard'] as DifficultyLevel[]).map(d => (<button key={d} onClick={() => handleToggleSet('selectedDifficulties', d)} className={`flex-1 px-2 py-1 text-sm rounded-md transition-colors ${tempFilterState.selectedDifficulties.has(d) ? 'bg-slate-700 text-primary-300' : 'text-slate-300 hover:bg-slate-600'}`}>{difficultyLabels[d]}</button>))}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-slate-300 mb-2">{t('strainsView.filters.yield')}</h4>
                                <div className="flex flex-col sm:flex-row gap-1 bg-slate-800 rounded-lg p-0.5">
                                    {(['Low', 'Medium', 'High'] as YieldLevel[]).map(y => (<button key={y} onClick={() => handleToggleSet('selectedYields', y)} className={`flex-1 px-2 py-1 text-sm rounded-md transition-colors ${tempFilterState.selectedYields.has(y) ? 'bg-slate-700 text-primary-300' : 'text-slate-300 hover:bg-slate-600'}`}>{yieldLabels[y]}</button>))}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-slate-300 mb-2">{t('strainsView.filters.height')}</h4>
                                <div className="flex flex-col sm:flex-row gap-1 bg-slate-800 rounded-lg p-0.5">
                                    {(['Short', 'Medium', 'Tall'] as HeightLevel[]).map(h => (<button key={h} onClick={() => handleToggleSet('selectedHeights', h)} className={`flex-1 px-2 py-1 text-sm rounded-md transition-colors ${tempFilterState.selectedHeights.has(h) ? 'bg-slate-700 text-primary-300' : 'text-slate-300 hover:bg-slate-600'}`}>{heightLabels[h]}</button>))}
                                </div>
                            </div>
                        </div>
                    </FilterSection>
                </section>

                <section aria-labelledby="profile-filter-title">
                    <FilterSection title={t('strainsView.addStrainModal.profile')}>
                        <h3 id="profile-filter-title" className="sr-only">{t('strainsView.addStrainModal.profile')}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-sm font-semibold text-slate-300 mb-2">{t('strainsView.filters.terpenes')}</h4>
                                <div className="max-h-32 overflow-y-auto space-y-1 pr-2 flex flex-wrap gap-2">{allTerpenes.map(terpene => (<button key={terpene} onClick={() => handleToggleSet('selectedTerpenes', terpene)} className={`px-3 py-1 text-xs rounded-full transition-colors ${tempFilterState.selectedTerpenes.has(terpene) ? 'bg-primary-600 text-white font-semibold' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}>{t(`common.terpenes.${terpene}`, terpene)}</button>))}</div>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-slate-300 mb-2">{t('strainsView.filters.aromas')}</h4>
                                <div className="max-h-32 overflow-y-auto space-y-1 pr-2 flex flex-wrap gap-2">{allAromas.map(aroma => (<button key={aroma} onClick={() => handleToggleSet('selectedAromas', aroma)} className={`px-3 py-1 text-xs rounded-full transition-colors ${tempFilterState.selectedAromas.has(aroma) ? 'bg-primary-600 text-white font-semibold' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}>{t(`common.aromas.${aroma}`, aroma)}</button>))}</div>
                            </div>
                        </div>
                    </FilterSection>
                </section>
            </div>
        </Drawer>
    );
};
