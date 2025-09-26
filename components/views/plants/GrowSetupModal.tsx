import React, { useState } from 'react';
import { Strain, GrowSetup } from '@/types';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslations } from '@/hooks/useTranslations';
import { selectSettings } from '@/stores/selectors';

interface GrowSetupModalProps {
  strain: Strain;
  onClose: () => void;
  onConfirm: (setup: GrowSetup) => void;
}

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-semibold text-slate-300 mb-1">{label}</label>
        <input {...props} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500" />
    </div>
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }> = ({ label, children, ...props }) => (
    <div>
        <label className="block text-sm font-semibold text-slate-300 mb-1">{label}</label>
        <select {...props} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
            {children}
        </select>
    </div>
);

export const GrowSetupModal: React.FC<GrowSetupModalProps> = ({ strain, onClose, onConfirm }) => {
    const { t } = useTranslations();
    const defaultSetup = useAppStore(selectSettings).defaultGrowSetup;
    const [setup, setSetup] = useState<GrowSetup>({
        lightType: defaultSetup.light.type,
        wattage: defaultSetup.light.wattage,
        potSize: defaultSetup.potSize,
        medium: defaultSetup.medium,
        temperature: 24,
        humidity: 60,
        lightHours: 18,
    });

    const handleChange = (field: keyof GrowSetup, value: string | number) => {
        setSetup(prev => ({ ...prev, [field]: value }));
    };

    const handleConfirm = () => {
        onConfirm(setup);
    };

    const footer = (
        <>
            <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
            <Button onClick={handleConfirm}>{t('common.confirm')}</Button>
        </>
    );

    return (
        <Modal 
            isOpen={true} 
            onClose={onClose} 
            title={t('plantsView.setupModal.title', { name: strain.name })}
            footer={footer}
            size="lg"
        >
            <p className="text-slate-400 mb-6">{t('plantsView.setupModal.subtitle')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label={t('plantsView.setupModal.lightType')} value={setup.lightType} onChange={e => handleChange('lightType', e.target.value)}>
                    <option>LED</option>
                    <option>HPS</option>
                    <option>CFL</option>
                </Select>
                <Input label={t('plantsView.setupModal.wattage')} type="number" value={setup.wattage} onChange={e => handleChange('wattage', Number(e.target.value))} />
                <Input label={t('plantsView.setupModal.potSize')} type="number" value={setup.potSize} onChange={e => handleChange('potSize', Number(e.target.value))} />
                <Select label={t('plantsView.setupModal.medium')} value={setup.medium} onChange={e => handleChange('medium', e.target.value)}>
                    <option>Soil</option>
                    <option>Coco</option>
                    <option>Hydro</option>
                </Select>
                <Input label={t('plantsView.setupModal.temperature')} type="number" value={setup.temperature} onChange={e => handleChange('temperature', Number(e.target.value))} />
                <Input label={t('plantsView.setupModal.humidity')} type="number" value={setup.humidity} onChange={e => handleChange('humidity', Number(e.target.value))} />
                <Input label={t('plantsView.setupModal.lightHours')} type="number" value={setup.lightHours} onChange={e => handleChange('lightHours', Number(e.target.value))} />
            </div>
        </Modal>
    );
};
