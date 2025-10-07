import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/Card';
import { Plant, VentilationPower } from '@/types';
import { Switch } from '@/components/common/Switch';
import { useAppDispatch } from '@/stores/store';
import {
    toggleLight,
    toggleFan,
    setLightHours,
    setLightWattage,
    toggleCirculationFan,
    setVentilationPower
} from '@/stores/slices/simulationSlice';
import { Select } from '@/components/ui/ThemePrimitives';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { RangeSlider } from '@/components/common/RangeSlider';

interface EquipmentControlsProps {
    plant: Plant;
}

const InfoDisplay: React.FC<{ label: string; value: string; tooltip: string }> = ({ label, value, tooltip }) => (
    <div className="flex justify-between items-center text-sm">
        <label className="font-semibold text-slate-300 flex items-center gap-1">
            {label}
            <span className="group relative">
                <PhosphorIcons.Question className="w-4 h-4 text-slate-400" />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-slate-200 text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">{tooltip}</span>
            </span>
        </label>
        <span className="font-mono text-slate-100">{value}</span>
    </div>
);

export const EquipmentControls: React.FC<EquipmentControlsProps> = memo(({ plant }) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { light, exhaustFan, circulationFan } = plant.equipment;
    
    const dli = useMemo(() => {
        const PAR_PER_WATT = 2.5; // µmol/s/W for LEDs (a reasonable estimate)
        const AREA_M2 = 1; // Assume 1 m^2 for DLI calculation simplicity
        const ppfd = (light.wattage * PAR_PER_WATT) / AREA_M2;
        return (ppfd * light.lightHours * 3600) / 1000000;
    }, [light.wattage, light.lightHours]);

    const fanAnimationDurations: Record<VentilationPower, string> = {
        low: '4s',
        medium: '2s',
        high: '1s',
    };

    return (
        <Card className="h-full">
            <h3 className="text-xl font-bold font-display text-primary-400 mb-4">{t('plantsView.detailedView.controls.title')}</h3>
            <div className="space-y-3">
                {/* Lighting Controls */}
                <div className="p-3 bg-slate-800/50 rounded-lg space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="font-bold text-slate-100 flex items-center gap-2">
                            {light.isOn ? (
                                <PhosphorIcons.LightbulbFilament weight="fill" className="w-5 h-5 text-yellow-300 drop-shadow-[0_0_5px_rgba(252,211,77,0.8)]" />
                            ) : (
                                <PhosphorIcons.LightbulbFilament className="w-5 h-5" />
                            )}
                            {t('plantsView.detailedView.controls.lighting')}
                        </h4>
                        <Switch
                            checked={light.isOn}
                            onChange={() => dispatch(toggleLight({ plantId: plant.id }))}
                            aria-label={t('plantsView.detailedView.controls.light')}
                        />
                    </div>

                    <div className={`space-y-4 transition-opacity duration-300 ${!light.isOn ? 'opacity-50 pointer-events-none' : ''}`}>
                        <RangeSlider
                            label={t('plantsView.setupModal.wattage')}
                            min={50}
                            max={1000}
                            step={10}
                            value={light.wattage}
                            onChange={val => dispatch(setLightWattage({ plantId: plant.id, wattage: val }))}
                            unit="W"
                            singleValue
                        />
                        <Select
                            label={t('plantsView.setupModal.lightCycle')}
                            value={light.lightHours}
                            onChange={(e) => dispatch(setLightHours({ plantId: plant.id, hours: Number(e.target.value) }))}
                            options={[
                                { value: '18', label: t('plantsView.setupModal.cycles.veg') },
                                { value: '12', label: t('plantsView.setupModal.cycles.flower') },
                                { value: '24', label: t('plantsView.setupModal.cycles.auto') },
                            ]}
                        />
                        <InfoDisplay 
                            label={t('plantsView.detailedView.controls.dailyLightIntegral')}
                            value={`${dli.toFixed(2)}`}
                            tooltip={t('plantsView.detailedView.controls.dliTooltip')}
                        />
                    </div>
                </div>

                {/* Ventilation Controls */}
                <div className="p-3 bg-slate-800/50 rounded-lg space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="font-bold text-slate-100 flex items-center gap-2">
                            <PhosphorIcons.Fan className={exhaustFan.isOn ? 'animate-spin' : ''} style={{ animationDuration: fanAnimationDurations[exhaustFan.power] }} />
                            {t('plantsView.detailedView.controls.exhaustFan')}
                        </h4>
                        <Switch
                            checked={exhaustFan.isOn}
                            onChange={() => dispatch(toggleFan({ plantId: plant.id }))}
                            aria-label={t('plantsView.detailedView.controls.exhaustFan')}
                        />
                    </div>

                    <div className={`space-y-3 transition-opacity duration-300 ${!exhaustFan.isOn ? 'opacity-50 pointer-events-none' : ''}`}>
                        <label className="block text-sm font-semibold text-slate-300">{t('plantsView.detailedView.controls.fanSpeed')}</label>
                        <SegmentedControl
                            value={[exhaustFan.power]}
                            onToggle={(val) => dispatch(setVentilationPower({ plantId: plant.id, power: val as VentilationPower }))}
                            options={[
                                { value: 'low', label: t('plantsView.setupModal.ventilationLevels.low') },
                                { value: 'medium', label: t('plantsView.setupModal.ventilationLevels.medium') },
                                { value: 'high', label: t('plantsView.setupModal.ventilationLevels.high') },
                            ]}
                        />
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-700/50 pt-4 mt-4">
                        <h4 className="font-bold text-slate-100 flex items-center gap-2">
                            <PhosphorIcons.Fan className={circulationFan.isOn ? 'animate-spin' : ''} style={{ animationDuration: '2s' }} />
                            {t('plantsView.detailedView.controls.circulationFan')}
                            <span className="group relative">
                                <PhosphorIcons.Question className="w-4 h-4 text-slate-400" />
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-slate-200 text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">{t('plantsView.detailedView.controls.circulationFanTooltip')}</span>
                            </span>
                        </h4>
                        <Switch
                            checked={circulationFan.isOn}
                            onChange={() => dispatch(toggleCirculationFan({ plantId: plant.id }))}
                            aria-label={t('plantsView.detailedView.controls.circulationFan')}
                        />
                    </div>
                </div>
            </div>
        </Card>
    );
});