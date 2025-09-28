import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useTranslations } from '@/hooks/useTranslations';
import { Strain, GrowSetup } from '@/types';
import { useAppSelector } from '@/stores/store';
import { selectSettings } from '@/stores/selectors';
import { RangeSlider } from '@/components/common/RangeSlider';

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
  const { t } = useTranslations();
  const settings = useAppSelector(selectSettings);
  const [setup, setSetup] = useState<GrowSetup>({
    ...settings.defaultGrowSetup,
    temperature: 24,
    humidity: 60,
    lightHours: 18,
  });

  const handleConfirm = () => {
    onConfirm(setup);
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
            <select
              value={setup.light.type}
              onChange={(e) => setSetup(s => ({ ...s, light: { ...s.light, type: e.target.value as 'LED' | 'HPS' | 'CFL' } }))}
              className="w-full select-input mt-1"
            >
              <option>LED</option>
              <option>HPS</option>
              <option>CFL</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold">{t('plantsView.setupModal.wattage')}</label>
            <input
              type="number"
              value={setup.light.wattage}
              onChange={(e) => setSetup(s => ({ ...s, light: { ...s.light, wattage: Number(e.target.value) } }))}
              className="w-full input-base mt-1"
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
            <select
              value={setup.medium}
              onChange={(e) => setSetup(s => ({ ...s, medium: e.target.value as 'Soil' | 'Coco' | 'Hydro' }))}
              className="w-full select-input mt-1"
            >
              <option value="Soil">{t('plantsView.mediums.Soil')}</option>
              <option value="Coco">{t('plantsView.mediums.Coco')}</option>
              <option value="Hydro">{t('plantsView.mediums.Hydro')}</option>
            </select>
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