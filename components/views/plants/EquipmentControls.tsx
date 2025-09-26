import React from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { Card } from '@/components/common/Card';
import { Plant } from '@/types';
import { useAppStore } from '@/stores/useAppStore';
import { Switch } from '@/components/common/Switch';

interface EquipmentControlsProps {
    plant: Plant;
}

export const EquipmentControls: React.FC<EquipmentControlsProps> = ({ plant }) => {
    const { t } = useTranslations();
    const { toggleLight, toggleFan, setFanSpeed } = useAppStore(state => ({
        toggleLight: state.toggleLight,
        toggleFan: state.toggleFan,
        setFanSpeed: state.setFanSpeed,
    }));

    const light = plant.equipment.light;
    const fan = plant.equipment.fan;

    return (
        <Card className="h-full">
            <h3 className="text-xl font-bold font-display text-primary-400 mb-3">{t('plantsView.detailedView.controls.title')}</h3>
            <div className="space-y-4">
                <Switch 
                    label={`${t('plantsView.detailedView.controls.light')} (${light.wattage}W)`} 
                    checked={light.isOn} 
                    onChange={() => toggleLight(plant.id)} 
                />
                <Switch 
                    label={t('plantsView.detailedView.controls.fan')} 
                    checked={fan.isOn} 
                    onChange={() => toggleFan(plant.id)} 
                />
                <div>
                    <label htmlFor="fan-speed" className="block text-sm font-semibold text-slate-300 mb-1">
                        {t('plantsView.detailedView.controls.fanSpeed')} ({fan.speed}%)
                    </label>
                    <input
                        id="fan-speed"
                        type="range"
                        min="0"
                        max="100"
                        step="10"
                        value={fan.speed}
                        onChange={(e) => setFanSpeed(plant.id, Number(e.target.value))}
                        disabled={!fan.isOn}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                    />
                </div>
            </div>
        </Card>
    );
};
