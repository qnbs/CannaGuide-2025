import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useTranslation } from 'react-i18next';
import { Strain, GrowSetup, LightType, VentilationPower, PotType } from '@/types';
import { useAppSelector } from '@/stores/store';
import { selectSettings } from '@/stores/selectors';
import { Card } from '@/components/common/Card';
import { FormSection } from '@/components/ui/ThemePrimitives';
import { RangeSlider } from '@/components/common/RangeSlider';
import { Switch } from '@/components/common/Switch';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { SegmentedControl } from '@/components/common/SegmentedControl';

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

export const GrowSetupModal: React.FC<GrowSetupModalProps> = ({ strain, onClose, onConfirm }) => {
  const { t } = useTranslation();
  const settings = useAppSelector(selectSettings);
  
  const [setup, setSetup] = useState<GrowSetup>({
    ...settings.defaultGrowSetup,
    lightHours: strain.floweringType === 'Autoflower' ? 18 : 18,
  });
  
  const isPhotoperiod = strain.floweringType === 'Photoperiod';

  const lightCycleOptions = [
      { value: '18', label: t('plantsView.setupModal.cycles.veg') },
      { value: '12', label: t('plantsView.setupModal.cycles.flower') },
      { value: '24', label: t('plantsView.setupModal.cycles.auto') },
  ].filter(opt => {
      if (isPhotoperiod) return opt.value !== '24';
      return true;
  });

  const handleConfirm = () => {
    onConfirm(setup);
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
      <Button onClick={handleConfirm} glow>{t('plantsView.setupModal.confirm')}</Button>
    </>
  );
  
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('plantsView.setupModal.title', { strainName: strain.name })}
      footer={footer}
      size="2xl"
    >
      <div className="space-y-4">
        <Card className="!p-3 bg-slate-800/50">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <InfoRow label={t('common.type')} value={strain.type} />
                <InfoRow label={t('strainsView.table.thc')} value={`${strain.thc}%`} />
                <InfoRow label={t('strainsView.table.flowering')} value={`${strain.floweringTime} ${t('common.units.weeks')}`} />
                <InfoRow label={t('strainsView.table.difficulty')} value={t(`strainsView.difficulty.${strain.agronomic.difficulty.toLowerCase()}`)} />
            </div>
        </Card>

        <FormSection title={t('plantsView.setupModal.lightingTitle')} icon={<PhosphorIcons.LightbulbFilament />} defaultOpen>
            <div className="sm:col-span-2">
                <SegmentedControl
                    value={[setup.lightType || 'LED']}
                    onToggle={(val) => setSetup(s => ({ ...s, lightType: val as LightType }))}
                    options={[
                        { value: 'LED', label: t('plantsView.setupModal.lightTypes.led') },
                        { value: 'HPS', label: t('plantsView.setupModal.lightTypes.hps') },
                    ]}
                />
            </div>
             <div className="sm:col-span-2">
                <RangeSlider 
                    label={t('plantsView.setupModal.wattage')}
                    min={50} max={1000} step={10}
                    singleValue={true}
                    value={setup.lightWattage || 150}
                    onChange={val => setSetup(s => ({ ...s, lightWattage: val }))}
                    unit="W"
                />
            </div>
            <div className="sm:col-span-2">
                 <label className="block text-sm font-semibold text-slate-300 mb-1">{t('plantsView.setupModal.lightCycle')}</label>
                 <SegmentedControl
                    value={[`${setup.lightHours}`]}
                    onToggle={(val) => setSetup(s => ({ ...s, lightHours: Number(val) }))}
                    options={lightCycleOptions}
                />
                 <p className="text-xs text-slate-400 mt-1">
                    {isPhotoperiod ? t('plantsView.setupModal.photoperiodInfo') : t('plantsView.setupModal.autoflowerInfo')}
                </p>
            </div>
        </FormSection>

        <FormSection title={t('plantsView.setupModal.environmentTitle')} icon={<PhosphorIcons.Fan />}>
             <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-300 mb-1">{t('plantsView.setupModal.exhaustFanPower')}</label>
                <SegmentedControl
                    value={[setup.ventilation || 'medium']}
                    onToggle={(val) => setSetup(s => ({ ...s, ventilation: val as VentilationPower }))}
                    options={[
                        { value: 'low', label: t('plantsView.setupModal.ventilationLevels.low') },
                        { value: 'medium', label: t('plantsView.setupModal.ventilationLevels.medium') },
                        { value: 'high', label: t('plantsView.setupModal.ventilationLevels.high') },
                    ]}
                />
            </div>
            <Switch label={t('plantsView.setupModal.circulationFan')} checked={!!setup.hasCirculationFan} onChange={val => setSetup(s => ({...s, hasCirculationFan: val}))} />
        </FormSection>
        
        <FormSection title={t('plantsView.setupModal.containerTitle')} icon={<PhosphorIcons.Cube />}>
             <div className="sm:col-span-2">
                <RangeSlider 
                    label={t('plantsView.setupModal.potSize')}
                    min={3} max={50} step={1}
                    singleValue={true}
                    value={setup.potSize}
                    onChange={val => setSetup(s => ({ ...s, potSize: val }))}
                    unit="L"
                />
            </div>
             <div className="sm:col-span-2">
                 <label className="block text-sm font-semibold text-slate-300 mb-1">{t('plantsView.setupModal.potType')}</label>
                <SegmentedControl
                    value={[setup.potType || 'Fabric']}
                    onToggle={(val) => setSetup(s => ({ ...s, potType: val as PotType }))}
                    options={[
                        { value: 'Plastic', label: t('plantsView.setupModal.potTypes.plastic') },
                        { value: 'Fabric', label: t('plantsView.setupModal.potTypes.fabric') },
                    ]}
                />
            </div>
            <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-300 mb-1">{t('plantsView.setupModal.medium')}</label>
                <SegmentedControl
                    value={[setup.medium]}
                    onToggle={(val) => setSetup(s => ({ ...s, medium: val as GrowSetup['medium'] }))}
                    options={[
                        { value: 'Soil', label: t('plantsView.mediums.Soil') },
                        { value: 'Coco', label: t('plantsView.mediums.Coco') },
                        { value: 'Hydro', label: t('plantsView.mediums.Hydro') },
                    ]}
                />
            </div>
        </FormSection>
      </div>
    </Modal>
  );
};