import React from 'react';
import { Strain } from '@/types';
import { useTranslations } from '@/hooks/useTranslations';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons';
import { InfoSection } from '@/components/common/InfoSection';
import { AttributeDisplay } from '@/components/common/AttributeDisplay';

// --- Sub-components for better structure ---

const Tag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="bg-slate-700 text-slate-200 text-xs font-medium px-2.5 py-1 rounded-full">{children}</span>
);

const DifficultyMeter: React.FC<{ difficulty: Strain['agronomic']['difficulty'] }> = ({ difficulty }) => {
    const { t } = useTranslations();
    const difficultyLabels: Record<Strain['agronomic']['difficulty'], string> = {
        Easy: t('strainsView.difficulty.easy'),
        Medium: t('strainsView.difficulty.medium'),
        Hard: t('strainsView.difficulty.hard'),
    };

    return (
        <div className="flex items-center gap-2 justify-end" title={difficultyLabels[difficulty]}>
            <span>{difficultyLabels[difficulty]}</span>
            <div className="flex">
                <PhosphorIcons.Cannabis className={`w-5 h-5 ${difficulty === 'Easy' ? 'text-green-500' : difficulty === 'Medium' ? 'text-amber-500' : 'text-red-500'}`} />
                <PhosphorIcons.Cannabis className={`w-5 h-5 ${difficulty === 'Medium' ? 'text-amber-500' : difficulty === 'Hard' ? 'text-red-500' : 'text-slate-700'}`} />
                <PhosphorIcons.Cannabis className={`w-5 h-5 ${difficulty === 'Hard' ? 'text-red-500' : 'text-slate-700'}`} />
            </div>
        </div>
    );
};


interface StrainDetailViewProps {
    strain: Strain | null;
    onBack: () => void;
}

export const StrainDetailView: React.FC<StrainDetailViewProps> = ({ strain, onBack }) => {
    const { t } = useTranslations();

    if (!strain) {
        return null;
    }

    const typeClasses = { Sativa: 'text-amber-400', Indica: 'text-indigo-400', Hybrid: 'text-blue-400' };
    const TypeIcon = { Sativa: SativaIcon, Indica: IndicaIcon, Hybrid: HybridIcon }[strain.type];
    const aromas = Array.isArray(strain.aromas) ? strain.aromas : [];

    return (
        <div className="animate-fade-in space-y-6">
            <header className="flex items-center justify-between">
                <Button variant="secondary" onClick={onBack}>
                    <PhosphorIcons.ArrowLeft className="w-5 h-5 mr-1" />
                    {t('common.back')}
                </Button>
                <div className="flex items-center gap-3 text-right">
                     <h1 className="text-2xl sm:text-3xl font-bold font-display text-primary-300">{strain.name}</h1>
                    {TypeIcon && <TypeIcon className={`w-10 h-10 flex-shrink-0 ${typeClasses[strain.type]}`} />}
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <InfoSection title={t('common.description')}>
                        <p className="text-slate-300 italic">{strain.description || 'No description available.'}</p>
                    </InfoSection>

                    {aromas.length > 0 && (
                        <InfoSection title={t('strainsView.strainModal.aromas')}>
                            <div className="flex flex-wrap gap-2">
                                {aromas.map((aroma) => (
                                    <Tag key={aroma}>{aroma}</Tag>
                                ))}
                            </div>
                        </InfoSection>
                    )}
                </div>
                <InfoSection title={t('common.details')}>
                    <div className="space-y-2">
                        <AttributeDisplay label={t('common.genetics')} value={strain.genetics} />
                        <AttributeDisplay label={t('strainsView.table.thc')} value={strain.thcRange || `${strain.thc?.toFixed(1)}%`} />
                        <AttributeDisplay label={t('strainsView.table.cbd')} value={strain.cbdRange || `${strain.cbd?.toFixed(1)}%`} />
                        <AttributeDisplay label={t('strainsView.floweringTime')} value={`${strain.floweringTimeRange || strain.floweringTime} ${t('common.units.weeks')}`} />
                        <AttributeDisplay label={t('strainsView.level')} value={<DifficultyMeter difficulty={strain.agronomic?.difficulty || 'Medium'} />} />
                        <AttributeDisplay label={t('strainsView.strainModal.yieldIndoor')} value={strain.agronomic?.yieldDetails?.indoor} />
                        <AttributeDisplay label={t('strainsView.strainModal.heightIndoor')} value={strain.agronomic?.heightDetails?.indoor} />
                    </div>
                </InfoSection>
            </div>
        </div>
    );
};
