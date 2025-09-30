import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useTranslation } from 'react-i18next';
import { Strain, GrowSetup } from '@/types';
import { useAppSelector } from '@/stores/store';
import { selectSettings } from '@/stores/selectors';
import { RangeSlider } from '@/components/common/RangeSlider';
import { Input, Select } from '@/components/ui/ThemePrimitives';

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
  // FIX: Removed incorrect <GrowSetup> type annotation which caused property errors. The component's internal state is more complex than the final GrowSetup type.
  const [setup, setSetup] = useState({
    ...settings.defaultGrowSetup,
    temperature: 24,
    humidity: 60,
    lightHours: 18,
  });

  const handleConfirm = () => {
    // FIX: Construct a valid GrowSetup object from the local state to match the required output type.
    const finalSetup: GrowSetup = {
        potSize: setup.potSize,
        medium: setup.medium,
        lightHours: setup.lightHours,
    };
    onConfirm(finalSetup);
  };
  
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
      <p className="text-sm text-slate-400 mb-4">{t('plantsView.setupModal.subtitle')}</p>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-800/50 rounded-lg">
            <InfoRow label={t('common.type')} value={strain.type} />
            <InfoRow label="THC" value={`${strain.thc}%`} />
            <InfoRow label={t('strainsView.table.flowering')} value={`${strain.floweringTime} ${t('common.units.weeks')}`} />
            <InfoRow label={t('strainsView.difficulty.easy')} value={t(`strainsView.difficulty.${strain.agronomic.difficulty.toLowerCase()}`)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold">{t('plantsView.setupModal.light')}</label>
             <Select
                value={setup.light.type}
                onChange={(e) => setSetup(s => ({ ...s, light: { ...s.light, type: e.target.value as 'LED' | 'HPS' | 'CFL' } }))}
                className="mt-1"
                options={[{value: 'LED', label: 'LED'}, {value: 'HPS', label: 'HPS'}, {value: 'CFL', label: 'CFL'}]}
             />
          </div>
          <div>
            <label className="text-sm font-semibold">{t('plantsView.setupModal.wattage')}</label>
            <Input
              type="number"
              value={setup.light.wattage}
              onChange={(e) => setSetup(s => ({ ...s, light: { ...s.light, wattage: Number(e.target.value) } }))}
              className="mt-1"
            />
          </div>
          <div className="col-span-2">
            <RangeSlider
              label={t('plantsView.setupModal.potSize')}
              min={3}
              max={50}
              step={1}
              value={[setup.potSize, setup.potSize]}
              onChange={(newValue) => setSetup(prev => ({ ...prev, potSize: newValue[0] }))}
              unit=" L"
            />
          </div>
          <div className="col-span-2">
            <label className="text-sm font-semibold">{t('plantsView.setupModal.medium')}</label>
            <Select
                value={setup.medium}
                onChange={(e) => setSetup(s => ({ ...s, medium: e.target.value as 'Soil' | 'Coco' | 'Hydro' }))}
                className="mt-1"
                options={[
                    { value: "Soil", label: t('plantsView.mediums.Soil') },
                    { value: "Coco", label: t('plantsView.mediums.Coco') },
                    { value: "Hydro", label: t('plantsView.mediums.Hydro') },
                ]}
             />
          </div>
          <div className="col-span-2">
            <RangeSlider
                label={t('plantsView.setupModal.lightHours')}
                min={12}
                max={24}
                step={1}
                value={[setup.lightHours, setup.lightHours]}
                onChange={(newValue) => setSetup(prev => ({ ...prev, lightHours: newValue[0] }))}
                unit={t('common.units.h_day')}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
