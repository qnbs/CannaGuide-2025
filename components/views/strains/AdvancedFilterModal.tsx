import React, { useEffect } from 'react';
import { Strain } from '../../../types';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { RangeSlider } from '../../common/RangeSlider';
import { useTranslations } from '../../../hooks/useTranslations';
import { useFocusTrap } from '../../../hooks/useFocusTrap';

interface AdvancedFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: () => void;
    tempFilterState: any;
    setTempFilterState: (updater: (prev: any) => any) => void;
    allAromas: string[];
    allTerpenes: string[];
    count: number;
}

const FilterSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <details open className="group">
        <summary className="text-lg font-semibold text-primary-400 cursor-pointer list-none flex items-center gap-2">
            <svg className="w-5 h-5 transition-transform duration-200 group-open:rotate-90" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
            {title}
        </summary>
        <div className="pt-3 pl-7 space-y-4">
            {children}
        </div>
    </details>
);

const AdvancedFilterModal: React.FC<AdvancedFilterModalProps> = ({ isOpen, onClose, onApply, tempFilterState, setTempFilterState, allAromas, allTerpenes, count }) => {
    const { t } = useTranslations();
    const modalRef = useFocusTrap(isOpen);
    
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);
    
    if (!isOpen) return null;

    const difficultyLabels: Record<Strain['agronomic']['difficulty'], string> = {
        Easy: t('strainsView.difficulty.easy'),
        Medium: t('strainsView.difficulty.medium'),
        Hard: t('strainsView.difficulty.hard'),
    };
    
    const yieldLabels: Record<Strain['agronomic']['yield'], string> = {
        Low: t('strainsView.addStrainModal.yields.low'),
        Medium: t('strainsView.addStrainModal.yields.medium'),
        High: t('strainsView.addStrainModal.yields.high'),
    };

    const heightLabels: Record<Strain['agronomic']['height'], string> = {
        Short: t('strainsView.addStrainModal.heights.short'),
        Medium: t('strainsView.addStrainModal.heights.medium'),
        Tall: t('strainsView.addStrainModal.heights.tall'),
    };
    
    const typeOptions: ('All' | 'Sativa' | 'Indica' | 'Hybrid')[] = ['All', 'Sativa', 'Indica', 'Hybrid'];

    const handleToggleSet = (key: string, value: string) => {
        setTempFilterState(prev => {
            const currentSet = prev[key] as Set<string>;
            const newSet = new Set(currentSet);
            if (newSet.has(value)) {
                newSet.delete(value);
            } else {
                newSet.add(value);
            }
            return { ...prev, [key]: newSet };
        });
    };

    const resetAdvancedFilters = () => {
        setTempFilterState(prev => ({
            ...prev,
            thcRange: [0, 35],
            cbdRange: [0, 20],
            floweringRange: [6, 16],
            selectedDifficulties: new Set(),
            selectedYields: new Set(),
            selectedHeights: new Set(),
            selectedAromas: new Set(),
            selectedTerpenes: new Set(),
            typeFilter: 'All',
        }));
    };

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-50 p-4 modal-overlay-animate" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="advanced-filter-modal-title">
            <Card ref={modalRef} className="w-full max-w-2xl h-auto max-h-[90vh] flex flex-col modal-content-animate" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start flex-shrink-0">
                    <h2 id="advanced-filter-modal-title" className="text-2xl font-bold font-display text-primary-400 mb-4">{t('strainsView.advancedFilters')}</h2>
                    <span className="text-sm font-medium text-slate-200 bg-slate-700 px-2 py-1 rounded-md">{t('strainsView.matchingStrains', { count })}</span>
                </div>
                <div className="overflow-y-auto pr-2 flex-grow space-y-6">
                    <FilterSection title="Cannabinoid Profile">
                        <RangeSlider label={t('strainsView.thcMax')} min={0} max={35} step={1} value={tempFilterState.thcRange} onChange={val => setTempFilterState(prev => ({...prev, thcRange: val}))} unit=" %" color="primary"/>
                        <RangeSlider label={t('strainsView.cbdMax')} min={0} max={20} step={1} value={tempFilterState.cbdRange} onChange={val => setTempFilterState(prev => ({...prev, cbdRange: val}))} unit=" %" color="green" />
                    </FilterSection>

                    <FilterSection title="Growth Characteristics">
                        <RangeSlider label={t('strainsView.floweringTime')} min={6} max={16} step={1} value={tempFilterState.floweringRange} onChange={val => setTempFilterState(prev => ({...prev, floweringRange: val}))} unit={` ${t('strainsView.weeks')}`} color="blue"/>
                        <div>
                            <h4 className="text-sm font-semibold text-slate-300 mb-2">{t('common.type')}</h4>
                            <div className="flex gap-1 bg-slate-800 rounded-lg p-0.5">
                                {typeOptions.map(type => (
                                    <button key={type} onClick={() => setTempFilterState(prev => ({...prev, typeFilter: type}))} className={`flex-1 px-2 py-1 text-sm font-semibold rounded-md transition-colors ${tempFilterState.typeFilter === type ? 'bg-slate-700 text-primary-300 shadow-sm' : 'text-slate-300 hover:bg-slate-600'}`}>
                                        {t(`strainsView.${type.toLowerCase()}`)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <h4 className="text-sm font-semibold text-slate-300 mb-2">{t('strainsView.level')}</h4>
                                <div className="flex flex-col sm:flex-row gap-1 bg-slate-800 rounded-lg p-0.5">
                                    {(['Easy', 'Medium', 'Hard'] as Strain['agronomic']['difficulty'][]).map(d => (<button key={d} onClick={() => handleToggleSet('selectedDifficulties', d)} className={`flex-1 px-2 py-1 text-sm rounded-md transition-colors ${tempFilterState.selectedDifficulties.has(d) ? 'bg-slate-700 text-primary-300' : 'text-slate-300 hover:bg-slate-600'}`}>{difficultyLabels[d]}</button>))}
                                </div>
                            </div>
                             <div>
                                <h4 className="text-sm font-semibold text-slate-300 mb-2">{t('strainsView.yield')}</h4>
                                <div className="flex flex-col sm:flex-row gap-1 bg-slate-800 rounded-lg p-0.5">
                                    {(['Low', 'Medium', 'High'] as Strain['agronomic']['yield'][]).map(y => (<button key={y} onClick={() => handleToggleSet('selectedYields', y)} className={`flex-1 px-2 py-1 text-sm rounded-md transition-colors ${tempFilterState.selectedYields.has(y) ? 'bg-slate-700 text-primary-300' : 'text-slate-300 hover:bg-slate-600'}`}>{yieldLabels[y]}</button>))}
                                </div>
                            </div>
                             <div>
                                <h4 className="text-sm font-semibold text-slate-300 mb-2">{t('strainsView.height')}</h4>
                                <div className="flex flex-col sm:flex-row gap-1 bg-slate-800 rounded-lg p-0.5">
                                    {(['Short', 'Medium', 'Tall'] as Strain['agronomic']['height'][]).map(h => (<button key={h} onClick={() => handleToggleSet('selectedHeights', h)} className={`flex-1 px-2 py-1 text-sm rounded-md transition-colors ${tempFilterState.selectedHeights.has(h) ? 'bg-slate-700 text-primary-300' : 'text-slate-300 hover:bg-slate-600'}`}>{heightLabels[h]}</button>))}
                                </div>
                            </div>
                        </div>
                    </FilterSection>

                    <FilterSection title="Aroma &amp; Terpene Profile">
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
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-700 flex-shrink-0">
                    <Button variant="secondary" size="sm" onClick={resetAdvancedFilters}>{t('strainsView.resetFilters')}</Button>
                    <Button size="base" onClick={onApply}>{t('common.apply')}</Button>
                </div>
            </Card>
        </div>
    );
};

export default AdvancedFilterModal;