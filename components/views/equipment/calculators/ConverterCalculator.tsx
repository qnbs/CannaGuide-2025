import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalculatorSection, Input } from './common';

export const ConverterCalculator: React.FC = () => {
    const { t } = useTranslation();
    const [values, setValues] = useState({ ec: 1.2, ppm500: 600, ppm700: 840 });

    const handleECChange = (ec: number) => {
        setValues({ ec, ppm500: ec * 500, ppm700: ec * 700 });
    };
    const handlePPM500Change = (ppm: number) => {
        const ec = ppm / 500;
        setValues({ ec, ppm500: ppm, ppm700: ec * 700 });
    };
    const handlePPM700Change = (ppm: number) => {
        const ec = ppm / 700;
        setValues({ ec, ppm500: ec * 500, ppm700: ppm });
    };

    return (
        <CalculatorSection title={t('equipmentView.calculators.converter.title')} description={t('equipmentView.calculators.converter.description')}>
            <Input label="EC (mS/cm)" type="number" step="0.1" value={values.ec.toFixed(2)} onChange={e => handleECChange(Number(e.target.value))} />
            <Input label="PPM (500 Scale)" type="number" value={Math.round(values.ppm500)} onChange={e => handlePPM500Change(Number(e.target.value))} />
            <Input label="PPM (700 Scale)" type="number" value={Math.round(values.ppm700)} onChange={e => handlePPM700Change(Number(e.target.value))} />
            <p className="text-xs text-slate-400 text-center">{t('equipmentView.calculators.converter.resultInfo')}</p>
        </CalculatorSection>
    );
};