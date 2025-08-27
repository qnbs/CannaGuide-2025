import React, { useState } from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { PhosphorIcons } from '../../icons/PhosphorIcons';

const CalculatorCard: React.FC<{ icon: React.ReactNode, title: string, description: string, children: React.ReactNode }> = ({ icon, title, description, children }) => (
    <Card>
        <div className="flex items-start gap-4">
            <div className="text-primary-500 mt-1 w-8 h-8 flex-shrink-0">{icon}</div>
            <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-4">{description}</p>
            </div>
        </div>
        <div>{children}</div>
    </Card>
);

const InputField: React.FC<{ label: string, value: string, onChange: (val: string) => void, placeholder: string }> = ({ label, value, onChange, placeholder }) => (
     <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
    </div>
);

const ResultDisplay: React.FC<{label: string, value: string, unit: string}> = ({label, value, unit}) => (
     <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/50 rounded-lg text-center">
        <p className="text-sm text-primary-800 dark:text-primary-200">{label}</p>
        <p className="text-2xl font-bold text-primary-600 dark:text-primary-300">{value} <span className="text-base font-normal">{unit}</span></p>
    </div>
);

export const Calculators: React.FC = () => {
    // Ventilation Calculator State
    const [width, setWidth] = useState('80');
    const [depth, setDepth] = useState('80');
    const [height, setHeight] = useState('180');
    const [airflow, setAirflow] = useState<number | null>(null);

    // Light Calculator State
    const [lightWidth, setLightWidth] = useState('80');
    const [lightDepth, setLightDepth] = useState('80');
    const [wattage, setWattage] = useState<number | null>(null);
    
    // Nutrient Calculator State
    const [waterAmount, setWaterAmount] = useState('5');
    const [nutrientRatio, setNutrientRatio] = useState('2');
    const [requiredNutrients, setRequiredNutrients] = useState<number | null>(null);

    const handleVentilationCalc = () => {
        const volume = (parseFloat(width) / 100) * (parseFloat(depth) / 100) * (parseFloat(height) / 100);
        if (isNaN(volume) || volume <= 0) return;
        const recommendedAirflow = volume * 60; // 60 air exchanges per hour
        setAirflow(Math.round(recommendedAirflow));
    };
    
    const handleLightCalc = () => {
        const area = (parseFloat(lightWidth) / 100) * (parseFloat(lightDepth) / 100);
        if (isNaN(area) || area <= 0) return;
        const recommendedWattage = area * 400; // Rule of thumb: 400W/m² for good results
        setWattage(Math.round(recommendedWattage));
    }

    const handleNutrientCalc = () => {
        const nutrients = parseFloat(waterAmount) * parseFloat(nutrientRatio);
        if (isNaN(nutrients) || nutrients < 0) return;
        setRequiredNutrients(nutrients);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <CalculatorCard icon={<PhosphorIcons.Fan />} title="Lüfter-Rechner" description="Berechne die benötigte Lüfterleistung (m³/h) für deine Growbox.">
                <div className="grid grid-cols-3 gap-2">
                    <InputField label="Breite (cm)" value={width} onChange={setWidth} placeholder="cm"/>
                    <InputField label="Tiefe (cm)" value={depth} onChange={setDepth} placeholder="cm"/>
                    <InputField label="Höhe (cm)" value={height} onChange={setHeight} placeholder="cm"/>
                </div>
                <Button onClick={handleVentilationCalc} className="w-full mt-4">Berechnen</Button>
                {airflow !== null && <ResultDisplay label="Empfohlene Abluftleistung" value={airflow.toString()} unit="m³/h" />}
            </CalculatorCard>

            <CalculatorCard icon={<PhosphorIcons.Sun />} title="Licht-Rechner" description="Schätze die benötigte LED-Lichtleistung für deine Fläche.">
                <div className="grid grid-cols-2 gap-2">
                    <InputField label="Breite (cm)" value={lightWidth} onChange={setLightWidth} placeholder="cm"/>
                    <InputField label="Tiefe (cm)" value={lightDepth} onChange={setLightDepth} placeholder="cm"/>
                </div>
                <Button onClick={handleLightCalc} className="w-full mt-4">Berechnen</Button>
                 {wattage !== null && <ResultDisplay label="Empfohlene LED-Leistung" value={wattage.toString()} unit="Watt" />}
            </CalculatorCard>

            <CalculatorCard icon={<PhosphorIcons.Flask />} title="Nährstoff-Rechner" description="Berechne die richtige Düngermenge für deine Gießkanne.">
                <div className="grid grid-cols-2 gap-2">
                    <InputField label="Wassermenge (L)" value={waterAmount} onChange={setWaterAmount} placeholder="L"/>
                    <InputField label="Dosis (ml/L)" value={nutrientRatio} onChange={setNutrientRatio} placeholder="ml/L"/>
                </div>
                 <Button onClick={handleNutrientCalc} className="w-full mt-4">Berechnen</Button>
                 {requiredNutrients !== null && <ResultDisplay label="Benötigter Dünger" value={requiredNutrients.toFixed(1)} unit="ml" />}
            </CalculatorCard>
        </div>
    );
};