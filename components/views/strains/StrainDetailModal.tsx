import React, { useEffect } from 'react';
import { Strain, Plant } from '../../../types';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { useTranslations } from '../../../hooks/useTranslations';
import { SativaIcon, IndicaIcon, HybridIcon } from '../../icons/StrainTypeIcons';
import { useFocusTrap } from '../../../hooks/useFocusTrap';

interface StrainDetailModalProps {
  strain: Strain;
  isFavorite: boolean;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onStartGrowing: (strain: Strain) => void;
  plants: (Plant | null)[];
  onSelectSimilarStrain: (strain: Strain) => void;
  allStrains: Strain[];
}

const StrainDetailModal: React.FC<StrainDetailModalProps> = ({ strain, isFavorite, onClose, onToggleFavorite, onStartGrowing, plants, onSelectSimilarStrain, allStrains }) => {
    const { t } = useTranslations();
    const modalRef = useFocusTrap(true);
    const difficultyLabels: Record<Strain['agronomic']['difficulty'], string> = {
        Easy: t('strainsView.difficulty.easy'),
        Medium: t('strainsView.difficulty.medium'),
        Hard: t('strainsView.difficulty.hard'),
    };
    
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);
    
    const findSimilarStrains = (baseStrain: Strain): Strain[] => {
        if (!baseStrain) return [];
        return allStrains.filter(s =>
            s.id !== baseStrain.id &&
            s.type === baseStrain.type &&
            Math.abs(s.thc - baseStrain.thc) <= 5
        ).slice(0, 4);
    };

    const similarStrains = React.useMemo(() => findSimilarStrains(strain), [strain, allStrains]);

    const TypeDisplay: React.FC<{ type: Strain['type'], details?: string }> = ({ type, details }) => {
        const typeClasses = { Sativa: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300', Indica: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300', Hybrid: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',};
        const TypeIcon = { Sativa: SativaIcon, Indica: IndicaIcon, Hybrid: HybridIcon }[type];
        const label = details ? details : type;
        return (<span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${typeClasses[type]}`}><TypeIcon className="w-4 h-4 mr-1.5" />{label}</span>);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-40 p-4 animate-fade-in" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="strain-detail-modal-title">
            <Card ref={modalRef} className="w-full max-w-3xl h-[90vh] relative flex flex-col modal-content-animate" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full hover:bg-slate-700 z-10 transition-colors" aria-label={t('common.close')}>
                    <PhosphorIcons.X className="w-6 h-6" />
                </button>
                <div className="overflow-y-auto p-2 sm:p-4 flex-grow">
                    <div className="flex justify-between items-start mb-2">
                        <h2 id="strain-detail-modal-title" className="text-3xl font-bold font-display text-primary-400 pr-4">{strain.name}</h2>
                        <button onClick={() => onToggleFavorite(strain.id)} className={`favorite-btn-glow p-1 text-slate-400 hover:text-primary-400 ${isFavorite ? 'is-favorite' : ''}`} aria-label={t('strainsView.strainModal.toggleFavorite')}>
                            <PhosphorIcons.Heart weight={isFavorite ? 'fill' : 'regular'} className="w-7 h-7" />
                        </button>
                    </div>

                    <div className="flex items-center space-x-4 mb-4 text-slate-300 flex-wrap gap-y-2">
                      <TypeDisplay type={strain.type} details={strain.typeDetails} />
                      {strain.genetics && <span className="flex items-center text-xs"><PhosphorIcons.Sparkle className="w-4 h-4 mr-1" /> {strain.genetics}</span>}
                    </div>

                    {strain.description && (
                      <div className="prose prose-sm dark:prose-invert max-w-none mb-4 flex-shrink-0">
                        <p dangerouslySetInnerHTML={{ __html: strain.description.replace(/<br>/g, ' ') }}></p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
                        <p><strong>{t('strainsView.strainModal.thc')}:</strong> {strain.thcRange || `${strain.thc}%`}</p>
                        <p><strong>{t('strainsView.strainModal.cbd')}:</strong> {strain.cbdRange || `${strain.cbd}%`}</p>
                        <p><strong>{t('strainsView.strainModal.difficulty')}:</strong> {difficultyLabels[strain.agronomic.difficulty]}</p>
                        <p><strong>{t('strainsView.strainModal.floweringTime')}:</strong> {strain.floweringTimeRange || `${strain.floweringTime} ${t('strainsView.weeks')}`}</p>
                    </div>

                    {strain.aromas && strain.aromas.length > 0 && (
                        <div className="mb-4">
                            <h4 className="font-bold font-display text-lg text-primary-500 mb-2">{t('strainsView.strainModal.aromas')}</h4>
                            <div className="flex flex-wrap gap-2">
                                {strain.aromas.map(a => <div key={a} className="bg-slate-700 rounded-full px-3 py-1 text-sm text-slate-100">{a}</div>)}
                            </div>
                        </div>
                    )}

                    {strain.dominantTerpenes && strain.dominantTerpenes.length > 0 && (
                        <div className="mb-4">
                            <h4 className="font-bold font-display text-lg text-primary-500 mb-2">{t('strainsView.strainModal.dominantTerpenes')}</h4>
                            <div className="flex flex-wrap gap-2">
                                {strain.dominantTerpenes.map(t => <div key={t} className="bg-slate-700 rounded-full px-3 py-1 text-sm text-slate-100">{t}</div>)}
                            </div>
                        </div>
                    )}

                    {(strain.agronomic.yieldDetails || strain.agronomic.heightDetails) && (
                        <div className="mb-4">
                             <h4 className="font-bold font-display text-lg text-primary-500 mb-2">{t('strainsView.strainModal.agronomicData')}</h4>
                             <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                {strain.agronomic.yieldDetails?.indoor && <p><strong>{t('strainsView.strainModal.yieldIndoor')}:</strong> {strain.agronomic.yieldDetails.indoor}</p>}
                                {strain.agronomic.yieldDetails?.outdoor && <p><strong>{t('strainsView.strainModal.yieldOutdoor')}:</strong> {strain.agronomic.yieldDetails.outdoor}</p>}
                                {strain.agronomic.heightDetails?.indoor && <p><strong>{t('strainsView.strainModal.heightIndoor')}:</strong> {strain.agronomic.heightDetails.indoor}</p>}
                                {strain.agronomic.heightDetails?.outdoor && <p><strong>{t('strainsView.strainModal.heightOutdoor')}:</strong> {strain.agronomic.heightDetails.outdoor}</p>}
                             </div>
                        </div>
                    )}

                    {similarStrains.length > 0 && (
                        <div className="mt-6">
                            <h4 className="font-bold font-display text-lg text-primary-500 mb-2">{t('strainsView.strainModal.similarStrains')}</h4>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                {similarStrains.map(s => (
                                    <Card 
                                        key={s.id} 
                                        className="p-2 text-center cursor-pointer !shadow-none hover:bg-slate-700 transition-colors"
                                        onClick={() => onSelectSimilarStrain(s)}
                                    >
                                         <p className="font-bold text-sm truncate">{s.name}</p>
                                         <p className="text-xs text-slate-400">{s.type} - {s.thc}% THC</p>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-auto pt-4">
                      <Button onClick={() => onStartGrowing(strain)} className="w-full text-lg" disabled={plants.every(p => p !== null)}>
                        {plants.every(p => p !== null) ? t('strainsView.strainModal.allSlotsFull') : t('strainsView.strainModal.startGrowing')}
                      </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default StrainDetailModal;