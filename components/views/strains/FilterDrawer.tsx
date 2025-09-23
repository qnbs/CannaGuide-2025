import React, { useEffect } from 'react';
import { StrainType, DifficultyLevel, YieldLevel, HeightLevel } from '@/types';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { RangeSlider } from '@/components/common/RangeSlider';
import { useTranslations } from '@/hooks/useTranslations';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { AdvancedFilterState } from '@/hooks/useStrainFilters';

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
    const modalRef = useFocusTrap(isOpen);
    
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);
    
    if (!isOpen) return null;

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
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-end justify-center modal-overlay-animate" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="filter-drawer-title">
            <Card ref={modalRef} className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-t-2xl glass-pane !border-b-0 animate-slide-in-up" onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0 p-4 border-b border-slate-700">
                     <div className="w-12 h-1.5 bg-slate-600 rounded-full mx-auto mb-2"></div>
                    <div className="flex justify-between items-center">
                        <h2 id="filter-drawer-title" className="text-xl font-bold font-display text-primary-400">{t('strainsView.advancedFilters')}</h2>
                        <Button variant="secondary" size="sm" onClick={onClose} className="!p-1.5 !rounded-full"><span className="sr-only">{t('common.close')}</span><PhosphorIcons.X className="w-5 h-5"/></Button>
                    </div>
                </div>

                <div className="overflow-y-auto flex-grow p-4">
                    <div className="space-y-6">
                        <FilterSection title={t('strainsView.addStrainModal.cannabinoids')}>
                            <RangeSlider label={t('strainsView.thcMax')} min={0} max={35} step={1} value={tempFilterState.thcRange} onChange={val => setTempFilterState(prev => ({...prev, thcRange: val}))} unit=" %" color="primary"/>
                            <RangeSlider label={t('strainsView.cbdMax')} min={0} max={20} step={1} value={tempFilterState.cbdRange} onChange={val => setTempFilterState(prev => ({...prev, cbdRange: val}))} unit=" %" color="green" />
                        </FilterSection>

                         <FilterSection title={t('strainsView.addStrainModal.growData')}>
                             <RangeSlider label={t('strainsView.floweringTime')} min={6} max={16} step={1} value={tempFilterState.floweringRange} onChange={val => setTempFilterState(prev => ({...prev, floweringRange: val}))} unit={` ${t('strainsView.weeks')}`} color="blue"/>
                             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-300 mb-2">{t('strainsView.level')}</h4>
                                    <div className="flex flex-col sm:flex-row gap-1 bg-slate-800 rounded-lg p-0.5">
                                        {(['Easy', 'Medium', 'Hard'] as DifficultyLevel[]).map(d => (<button key={d} onClick={() => handleToggleSet('selectedDifficulties', d)} className={`flex-1 px-2 py-1 text-sm rounded-md transition-colors ${tempFilterState.selectedDifficulties.has(d) ? 'bg-slate-700 text-primary-300' : 'text-slate-300 hover:bg-slate-600'}`}>{difficultyLabels[d]}</button>))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-300 mb-2">{t('strainsView.yield')}</h4>
                                    <div className="flex flex-col sm:flex-row gap-1 bg-slate-800 rounded-lg p-0.5">
                                        {(['Low', 'Medium', 'High'] as YieldLevel[]).map(y => (<button key={y} onClick={() => handleToggleSet('selectedYields', y)} className={`flex-1 px-2 py-1 text-sm rounded-md transition-colors ${tempFilterState.selectedYields.has(y) ? 'bg-slate-700 text-primary-300' : 'text-slate-300 hover:bg-slate-600'}`}>{yieldLabels[y]}</button>))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-300 mb-2">{t('strainsView.height')}</h4>
                                    <div className="flex flex-col sm:flex-row gap-1 bg-slate-800 rounded-lg p-0.5">
                                        {(['Short', 'Medium', 'Tall'] as HeightLevel[]).map(h => (<button key={h} onClick={() => handleToggleSet('selectedHeights', h)} className={`flex-1 px-2 py-1 text-sm rounded-md transition-colors ${tempFilterState.selectedHeights.has(h) ? 'bg-slate-700 text-primary-300' : 'text-slate-300 hover:bg-slate-600'}`}>{heightLabels[h]}</button>))}
                                    </div>
                                </div>
                            </div>
                         </FilterSection>

                         <FilterSection title={t('strainsView.addStrainModal.profile')}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-300 mb-2">{t('strainsView.terpenes')}</h4>
                                    <div className="max-h-32 overflow-y-auto space-y-1 pr-2 flex flex-wrap gap-2">{allTerpenes.map(terpene => (<button key={terpene} onClick={() => handleToggleSet('selectedTerpenes', terpene)} className={`px-3 py-1 text-xs rounded-full transition-colors ${tempFilterState.selectedTerpenes.has(terpene) ? 'bg-primary-600 text-white font-semibold' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}>{terpene}</button>))}</div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-300 mb-2">{t('strainsView.aromas')}</h4>
                                    <div className="max-h-32 overflow-y-auto space-y-1 pr-2 flex flex-wrap gap-2">{allAromas.map(aroma => (<button key={aroma} onClick={() => handleToggleSet('selectedAromas', aroma)} className={`px-3 py-1 text-xs rounded-full transition-colors ${tempFilterState.selectedAromas.has(aroma) ? 'bg-primary-600 text-white font-semibold' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}>{aroma}</button>))}</div>
                                </div>
                            </div>
                         </FilterSection>
                    </div>
                </div>

                <div className="flex justify-between items-center p-4 border-t border-slate-700 flex-shrink-0">
                    <Button variant="secondary" onClick={onReset}>{t('strainsView.resetFilters')}</Button>
                    <Button onClick={onApply}>{t('strainsView.matchingStrains', { count })}</Button>
                </div>
            </Card>
        </div>
    );
};