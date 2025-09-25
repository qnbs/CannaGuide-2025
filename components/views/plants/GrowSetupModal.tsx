import React, { useState } from 'react';
import { GrowSetup, Strain } from '@/types';
import { Button } from '@/components/common/Button';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslations } from '@/hooks/useTranslations';
import { Modal } from '@/components/common/Modal';

interface GrowSetupModalProps {
  strain: Strain;
  onClose: () => void;
  onConfirm: (setup: GrowSetup) => void;
}

export const GrowSetupModal: React.FC<GrowSetupModalProps> = ({ strain, onClose, onConfirm }) => {
  const { t } = useTranslations();
  const { addNotification, settings } = useAppStore(state => ({
      addNotification: state.addNotification,
      settings: state.settings,
  }));
  
  // FIX: Initialize a complete GrowSetup object, using defaults for environment values not present in defaultGrowSetup.
  const { defaultGrowSetup } = settings;
  const [setup, setSetup] = useState<GrowSetup>({
    lightType: defaultGrowSetup.light.type,
    wattage: defaultGrowSetup.light.wattage,
    potSize: defaultGrowSetup.potSize,
    medium: defaultGrowSetup.medium,
    temperature: 24,
    humidity: 60,
    lightHours: 18,
  });

  const handleConfirm = () => {
    if (setup.lightHours < 1 || setup.lightHours > 24) {
        addNotification(t('plantsView.setupModal.validation.light'), 'error');
        return;
    }
     if (setup.temperature < 10 || setup.temperature > 40) {
        addNotification(t('plantsView.setupModal.validation.temp'), 'error');
        return;
    }
     if (setup.humidity < 10 || setup.humidity > 99) {
        addNotification(t('plantsView.setupModal.validation.humidity'), 'error');
        return;
    }
    onConfirm(setup);
  };

  type SetupOption = 'lightType' | 'potSize' | 'medium';
  const options: { id: SetupOption, label: string, choices: (string|number)[], display?: (s: string|number) => string }[] = [
      { id: 'lightType', label: t('plantsView.setupModal.lightSource'), choices: ['LED', 'HPS', 'CFL'] },
      { id: 'potSize', label: t('plantsView.setupModal.potSize'), choices: [5, 10, 15, 30], display: s => `${s}L` },
      { id: 'medium', label: t('plantsView.setupModal.medium'), choices: ['Soil', 'Coco', 'Hydro'], display: s => String(t(`plantsView.setupModal.mediums.${String(s).toLowerCase()}`)) },
  ];

  const footer = (
      <>
        <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={handleConfirm}>{t('common.confirm')} & {t('common.start')}</Button>
      </>
  );

  return (
    <Modal
        isOpen={true}
        onClose={onClose}
        title={t('plantsView.setupModal.title', { name: strain.name })}
        size="md"
        footer={footer}
    >
        <p className="text-accent-200/90 mb-6">{t('plantsView.setupModal.subtitle')}</p>
        <div className="space-y-6">
            {options.map(opt => (
                <div key={opt.id}>
                    <label className="block text-lg font-semibold text-accent-100 mb-2">{opt.label}</label>
                    <div className="flex gap-2">
                    {opt.choices.map(choice => (
                        <button
                            key={choice}
                            onClick={() => setSetup(s => ({ ...s, [opt.id]: choice }))}
                            className={`flex-1 py-2 px-2 text-sm rounded-md transition-colors ${
                                setup[opt.id] === choice
                                ? 'bg-primary-600 text-on-accent font-bold shadow-lg'
                                : 'bg-accent-800 text-accent-200 hover:bg-accent-700'
                            }`}
                        >
                            {opt.display ? opt.display(choice) : String(choice)}
                        </button>
                    ))}
                    </div>
              </div>
            ))}
        </div>

        <div className="mt-6">
            <label className="block text-lg font-semibold text-accent-100 mb-2">{t('plantsView.setupModal.environment')}</label>
            <div className="grid grid-cols-3 gap-3">
                <div>
                    <label className="block text-xs font-medium text-accent-300 mb-1">{t('plantsView.setupModal.temp')}</label>
                    <input type="number" value={setup.temperature} onChange={e => setSetup(s => ({...s, temperature: parseInt(e.target.value, 10) || 24}))} className="w-full bg-accent-900/50 border border-accent-700 rounded-md px-2 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"/>
                </div>
                <div>
                    <label className="block text-xs font-medium text-accent-300 mb-1">{t('plantsView.setupModal.humidity')}</label>
                    <input type="number" value={setup.humidity} onChange={e => setSetup(s => ({...s, humidity: parseInt(e.target.value, 10) || 60}))} className="w-full bg-accent-900/50 border border-accent-700 rounded-md px-2 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"/>
                </div>
                <div>
                    <label className="block text-xs font-medium text-accent-300 mb-1">{t('plantsView.setupModal.lightHours')}</label>
                    <input type="number" value={setup.lightHours} onChange={e => setSetup(s => ({...s, lightHours: parseInt(e.target.value, 10) || 18}))} className="w-full bg-accent-900/50 border border-accent-700 rounded-md px-2 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"/>
                </div>
            </div>
        </div>
    </Modal>
  );
};