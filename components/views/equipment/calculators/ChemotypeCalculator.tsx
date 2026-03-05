import React, { memo, useMemo, useState } from 'react'
import { CalculatorSection, Input } from './common'
import { chemotypeService } from '@/services/chemotypeService'
import { useTranslation } from 'react-i18next'

export const ChemotypeCalculator: React.FC = memo(() => {
    const { t } = useTranslation()
    const [values, setValues] = useState({
        thc: 18,
        cbd: 1.2,
        cbg: 0.8,
        limonene: 0.4,
        myrcene: 0.6,
        pinene: 0.25,
        linalool: 0.15,
        caryophyllene: 0.35,
    })

    const result = useMemo(() => chemotypeService.calculate(values), [values])

    const update = (key: keyof typeof values, next: string) => {
        setValues((prev) => ({ ...prev, [key]: Number(next) }))
    }

    return (
        <CalculatorSection
            title={t('equipmentView.calculators.chemotype.title')}
            description={t('equipmentView.calculators.chemotype.description')}
        >
            <div className="grid grid-cols-2 gap-3">
                <Input label="THC" unit="%" type="number" step="0.1" value={values.thc} onChange={(e) => update('thc', e.target.value)} />
                <Input label="CBD" unit="%" type="number" step="0.1" value={values.cbd} onChange={(e) => update('cbd', e.target.value)} />
                <Input label="CBG" unit="%" type="number" step="0.1" value={values.cbg} onChange={(e) => update('cbg', e.target.value)} />
                <Input label="Limonene" unit="%" type="number" step="0.01" value={values.limonene} onChange={(e) => update('limonene', e.target.value)} />
                <Input label="Myrcene" unit="%" type="number" step="0.01" value={values.myrcene} onChange={(e) => update('myrcene', e.target.value)} />
                <Input label="Pinene" unit="%" type="number" step="0.01" value={values.pinene} onChange={(e) => update('pinene', e.target.value)} />
                <Input label="Linalool" unit="%" type="number" step="0.01" value={values.linalool} onChange={(e) => update('linalool', e.target.value)} />
                <Input label="Caryophyllene" unit="%" type="number" step="0.01" value={values.caryophyllene} onChange={(e) => update('caryophyllene', e.target.value)} />
            </div>

            <div className="bg-slate-800/60 rounded-lg p-3 ring-1 ring-inset ring-white/20 space-y-1">
                <p>{t('equipmentView.calculators.chemotype.totalCannabinoids')}: {result.totalCannabinoids.toFixed(2)}%</p>
                <p>{t('equipmentView.calculators.chemotype.totalTerpenes')}: {result.totalTerpenes.toFixed(2)}%</p>
                <p>{t('equipmentView.calculators.chemotype.dominantCannabinoid')}: {result.dominantCannabinoid}</p>
                <p>{t('equipmentView.calculators.chemotype.dominantTerpene')}: {result.dominantTerpene}</p>
                <p className="font-semibold text-primary-300 mt-1">{t('equipmentView.calculators.chemotype.profile')}: {result.profileLabel}</p>
            </div>

            <ul className="text-sm text-slate-300 space-y-1">
                {result.guidance.map((line) => (
                    <li key={line}>- {line}</li>
                ))}
            </ul>

            <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-md p-2">
                {result.disclaimer}
            </p>
        </CalculatorSection>
    )
})
