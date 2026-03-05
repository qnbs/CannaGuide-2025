import React, { memo, useMemo, useState } from 'react'
import { CalculatorSection, Input } from './common'
import { chemotypeService } from '@/services/chemotypeService'

export const ChemotypeCalculator: React.FC = memo(() => {
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
            title="Terpen-/Cannabinoid-Profil Rechner"
            description="Profilanalyse fur THC/CBD/CBG und dominante Terpene inklusive Vorsichtshinweisen."
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
                <p>Total cannabinoids: {result.totalCannabinoids.toFixed(2)}%</p>
                <p>Total terpenes: {result.totalTerpenes.toFixed(2)}%</p>
                <p>Dominant cannabinoid: {result.dominantCannabinoid}</p>
                <p>Dominant terpene: {result.dominantTerpene}</p>
                <p className="font-semibold text-primary-300 mt-1">Profile: {result.profileLabel}</p>
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
