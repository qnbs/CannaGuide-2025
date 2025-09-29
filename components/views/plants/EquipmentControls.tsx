import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/Card';
import { Plant } from '@/types';
import { Switch } from '@/components/common/Switch';
import { useAppDispatch } from '@/stores/store';
import { toggleLight, toggleFan, setFanSpeed } from '@/stores/slices/simulationSlice';

interface EquipmentControlsProps {
    plant: Plant;
}

export const EquipmentControls: React.FC<EquipmentControlsProps> = memo(({ plant }) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();

    const light = plant.equipment.light;
    const fan = plant.equipment.fan;

    return (
        <Card className="h-full">
            <h3 className="text-xl font-bold font-display text-primary-400 mb-3">{t('plantsView.detailedView.controls.title')}</h3>
            <div className="space-y-4">
                <Switch 
                    label={`${t('plantsView.detailedView.controls.light')} (${light.wattage}W)`} 
                    checked={light.isOn} 
                    onChange={() => dispatch(toggleLight({ plantId: plant.id }))} 
                />
                <Switch 
                    label={t('plantsView.detailedView.controls.fan')} 
                    checked={fan.isOn} 
                    onChange={() => dispatch(toggleFan({ plantId: plant.id }))} 
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
                        onChange={(e) => dispatch(setFanSpeed({ plantId: plant.id, speed: Number(e.target.value) }))}
                        disabled={!fan.isOn}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                    />
                </div>
            </div>
        </Card>
    );
});