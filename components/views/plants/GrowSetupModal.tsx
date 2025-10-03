import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useTranslation } from 'react-i18next';
import { Strain, GrowSetup } from '@/types';
import { useAppSelector } from '@/stores/store';
import { selectSettings } from '@/stores/selectors';
import { Card } from '@/components/common/Card';

interface GrowSetupModalProps {
  strain: Strain;
  onClose: () => void;
  onConfirm: (setup: GrowSetup) => void;
}

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between text-sm">
    <span className="text-slate-400">{label}:</span>
    <span className="font-semibold text-slate-100">{value}</span>
  </div>
);

const OptionButton: React.FC<{ label: string, isSelected: boolean, onClick: () => void, disabled?: boolean }> = ({ label, isSelected, onClick, disabled = false }) => (
    <Button
        onClick={onClick}
        variant={isSelected ? 'primary' : 'secondary'}
        className={`w-full transition-all duration-200 ${isSelected ? 'scale-105' : 'scale-100'}`}
        disabled={disabled}
    >
        {label}
    </Button>
);

export const GrowSetupModal: React.FC<GrowSetupModalProps> = ({ strain, onClose, onConfirm }) => {
  const { t } = useTranslation();
  const settings = useAppSelector(selectSettings);
  
  const [setup, setSetup] = useState<GrowSetup>({
    lightHours: strain.floweringType === 'Autoflower' ? 18 : 18,
    potSize: settings.defaultGrowSetup.potSize,
    medium: settings.defaultGrowSetup.medium,
  });
  
  const isPhotoperiod = strain.floweringType === 'Photoperiod';

  const handleConfirm = () => {
    onConfirm(setup);
  };
  
  const potSizes = [5, 11, 15, 25, 35];
  const lightCycles = [
      { hours: 18, label: t('plantsView.setupModal.cycles.veg') },
      { hours: 12, label: t('plantsView.setupModal.cycles.flower'), disabled: !isPhotoperiod },
      { hours: 24, label: t('plantsView.setupModal.cycles.auto'), disabled: isPhotoperiod },
  ];
  const mediums: { value: GrowSetup['medium'], label: string }[] = [
      { value: 'Soil', label: t('plantsView.mediums.Soil') },
      { value: 'Coco', label: t('plantsView.mediums.Coco') },
      { value: 'Hydro', label: t('plantsView.mediums.Hydro') },
  ];


  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
      <Button onClick={handleConfirm}>{t('plantsView.setupModal.confirm')}</Button>
    </>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('plantsView.setupModal.title', { strainName: strain.name })}
      footer={footer}
      size="lg"
    >
      <p className="text-sm text-slate-400 mb-6">{t('plantsView.setupModal.subtitle')}</p>
      <div className="space-y-6">
        <Card className="!p-3 bg-slate-800/50">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <InfoRow label={t('common.type')} value={strain.type} />
                <InfoRow label="THC" value={`${strain.thc}%`} />
                <InfoRow label={t('strainsView.table.flowering')} value={`${strain.floweringTime} ${t('common.units.weeks')}`} />
                <InfoRow label={t('strainsView.difficulty.easy')} value={t(`strainsView.difficulty.${strain.agronomic.difficulty.toLowerCase()}`)} />
            </div>
        </Card>
        
        <div>
            <h3 className="font-semibold text-slate-200 mb-2">{t('plantsView.setupModal.lightCycle')}</h3>
            <div className="grid grid-cols-3 gap-2">
                {lightCycles.map(cycle => (
                    <OptionButton 
                        key={cycle.hours}
                        label={cycle.label}
                        isSelected={setup.lightHours === cycle.hours}
                        onClick={() => setSetup(s => ({ ...s, lightHours: cycle.hours }))}
                        disabled={cycle.disabled}
                    />
                ))}
            </div>
             {isPhotoperiod ? (
                <p className="text-xs text-slate-400 mt-2">
                    {t('plantsView.setupModal.photoperiodInfo')}
                </p>
            ) : (
                <p className="text-xs text-slate-400 mt-2">
                    {t('plantsView.setupModal.autoflowerInfo')}
                </p>
            )}
        </div>

        <div>
            <h3 className="font-semibold text-slate-200 mb-2">{t('plantsView.setupModal.potSize')}</h3>
            <div className="grid grid-cols-5 gap-2">
                {potSizes.map(size => (
                     <OptionButton 
                        key={size}
                        label={`${size}L`}
                        isSelected={setup.potSize === size}
                        onClick={() => setSetup(s => ({ ...s, potSize: size }))}
                    />
                ))}
            </div>
        </div>
        
        <div>
            <h3 className="font-semibold text-slate-200 mb-2">{t('plantsView.setupModal.medium')}</h3>
            <div className="grid grid-cols-3 gap-2">
                {mediums.map(med => (
                    <OptionButton 
                        key={med.value}
                        label={med.label}
                        isSelected={setup.medium === med.value}
                        onClick={() => setSetup(s => ({ ...s, medium: med.value }))}
                    />
                ))}
            </div>
        </div>
      </div>
    </Modal>
  );
};