import React from 'react';
import { Strain, StrainType } from '@/types';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/common/Modal';
import { AttributeDisplay } from '@/components/common/AttributeDisplay';
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons';
import { Speakable } from '@/components/common/Speakable';

interface StrainDetailModalProps {
    strain: Strain;
    onClose: () => void;
}

const Tag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="bg-slate-700 text-slate-200 text-xs font-medium px-2 py-1 rounded-full">{children}</span>
);

export const StrainDetailModal: React.FC<StrainDetailModalProps> = ({ strain, onClose }) => {
    const { t } = useTranslation();

    const typeClasses: Record<StrainType, string> = {
        [StrainType.Sativa]: 'text-amber-400',
        [StrainType.Indica]: 'text-indigo-400',
        [StrainType.Hybrid]: 'text-blue-400',
    };
    const TypeIcon = { Sativa: SativaIcon, Indica: IndicaIcon, Hybrid: HybridIcon }[strain.type];

    return (
        <Modal isOpen={true} onClose={onClose} title={strain.name} size="xl">
            <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg">
                    {TypeIcon && <TypeIcon className={`w-10 h-10 flex-shrink-0 ${typeClasses[strain.type]}`} />}
                    <div>
                        <h3 className="text-xl font-bold font-display text-primary-300">{strain.name}</h3>
                        <p className="text-slate-400 text-sm">{strain.typeDetails || strain.type}</p>
                    </div>
                </div>
                
                <Speakable elementId={`strain-modal-desc-${strain.id}`}>
                    <p className="text-slate-300 italic text-sm">{strain.description || 'No description available.'}</p>
                </Speakable>

                <div className="space-y-2 text-sm">
                    <AttributeDisplay label={t('common.genetics')} value={strain.genetics} />
                    <AttributeDisplay label={t('strainsView.table.thc')} value={strain.thcRange || `${strain.thc?.toFixed(1)}%`} />
                    <AttributeDisplay label={t('strainsView.table.cbd')} value={strain.cbdRange || `${strain.cbd?.toFixed(1)}%`} />
                    <AttributeDisplay label={t('strainsView.table.flowering')} value={`${strain.floweringTimeRange || strain.floweringTime} ${t('common.units.weeks')}`} />
                </div>
                 <div className="space-y-3 text-sm">
                    <AttributeDisplay
                        label={t('strainsView.strainModal.aromas')}
                        value={
                            <div className="flex flex-wrap gap-1 justify-start sm:justify-end">
                                {(strain.aromas || []).map(a => <Tag key={a}>{t(`common.aromas.${a}`, a)}</Tag>)}
                            </div>
                        }
                    />
                     <AttributeDisplay
                        label={t('strainsView.strainModal.dominantTerpenes')}
                        value={
                            <div className="flex flex-wrap gap-1 justify-start sm:justify-end">
                                {(strain.dominantTerpenes || []).map(terp => <Tag key={terp}>{t(`common.terpenes.${terp}`, terp)}</Tag>)}
                            </div>
                        }
                    />
                </div>
            </div>
        </Modal>
    );
};