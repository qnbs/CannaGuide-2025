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
    
    const typeOptions: ('All' | 'Sativa' | 'Indica' | 'Hybrid')[] = ['All', 'Sativa', 'Indica', 'Hybrid'];

    const handleTempToggleDifficulty = (difficulty: Strain['agronomic']['difficulty']) => setTempFilterState(prev => ({...prev, selectedDifficulties: new Set(prev.selectedDifficulties.has(difficulty) ? [...prev.selectedDifficulties].filter(d => d !== difficulty) : [...prev.selectedDifficulties, difficulty])}));
    const handleTempToggleAroma = (aroma: string) => setTempFilterState(prev => ({...prev, selectedAromas: new Set(prev.selectedAromas.has(aroma) ? [...prev.selectedAromas].filter(a => a !== aroma) : [...prev.selectedAromas, aroma])}));
    const handleTempToggleTerpene = (terpene: string) => setTempFilterState(prev => ({...prev, selectedTerpenes: new Set(prev.selectedTerpenes.has(terpene) ? [...prev.selectedTerpenes].filter(t => t !== terpene) : [...prev.selectedTerpenes, terpene])}));

    const resetAdvancedFilters = () => {
        setTempFilterState(prev => ({
            ...prev,
            thcRange: [0, 35],
            floweringRange: [6, 16],
            selectedDifficulties: new Set(),
            selectedAromas: new Set(),
            selectedTerpenes: new Set(),
            typeFilter: 'All',
        }));
    };

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="advanced-filter-modal-title">
            <Card ref={modalRef} className="w-full max-w-xl h-auto max-h-[80vh] flex flex-col modal-content-animate" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start flex-shrink-0">
                    <h2 id="advanced-filter-modal-title" className="text-2xl font-bold font-display text-primary-400 mb-4">{t('strainsView.advancedFilters')}</h2>
                    <span className="text-sm font-medium text-slate-200 bg-slate-700 px-2 py-1 rounded-md">{t('strainsView.matchingStrains', { count })}</span>
                </div>
                <div className="overflow-y-auto pr-2 flex-grow space-y-4">
                    <RangeSlider label={t('strainsView.thcMax')} min={0} max={35} step={5} value={tempFilterState.thcRange} onChange={val => setTempFilterState(prev => ({...prev, thcRange: val}))} unit=" %" />
                    <RangeSlider label={t('strainsView.floweringTime')} min={6} max={16} step={1} value={tempFilterState.floweringRange} onChange={val => setTempFilterState(prev => ({...prev, floweringRange: val}))} unit={` ${t('strainsView.weeks')}`} />
                    <div>
                        <h4 className="text-sm font-semibold text-slate-300 mb-2">{t('common.type')}</h4>
                        <div className="flex gap-1 bg-slate-900 rounded-lg p-0.5">
                            {typeOptions.map(type => (
                                <button key={type} onClick={() => setTempFilterState(prev => ({...prev, typeFilter: type}))} className={`flex-1 px-2 py-1 text-sm font-semibold rounded-md transition-colors ${tempFilterState.typeFilter === type ? 'glass-pane text-primary-300 shadow-sm border-0' : 'text-slate-300 hover:bg-slate-700'}`}>
                                    {t(`strainsView.${type.toLowerCase()}`)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-300 mb-2">{t('strainsView.level')}</h4>
                      <div className="flex flex-wrap gap-2">
                        {(['Easy', 'Medium', 'Hard'] as Strain['agronomic']['difficulty'][]).map(difficulty => (
                            <button 
                                key={difficulty} 
                                onClick={() => handleTempToggleDifficulty(difficulty)} 
                                className={`px-3 py-1 text-sm rounded-full transition-colors ${tempFilterState.selectedDifficulties.has(difficulty) ? 'bg-primary-600 text-white font-semibold' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
                            >
                                {difficultyLabels[difficulty]}
                            </button>
                        ))}
                      </div>
                    </div>
                     <div>
                      <h4 className="text-sm font-semibold text-slate-300 mb-2">{t('strainsView.terpenes')}</h4>
                      <div className="flex flex-wrap gap-2">{allTerpenes.map(terpene => (<button key={terpene} onClick={() => handleTempToggleTerpene(terpene)} className={`px-3 py-1 text-sm rounded-full transition-colors ${tempFilterState.selectedTerpenes.has(terpene) ? 'bg-primary-600 text-white font-semibold' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}>{terpene}</button>))}</div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-300 mb-2">{t('strainsView.aromas')}</h4>
                      <div className="flex flex-wrap gap-2">{allAromas.map(aroma => (<button key={aroma} onClick={() => handleTempToggleAroma(aroma)} className={`px-3 py-1 text-sm rounded-full transition-colors ${tempFilterState.selectedAromas.has(aroma) ? 'bg-primary-600 text-white font-semibold' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}>{aroma}</button>))}</div>
                    </div>
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