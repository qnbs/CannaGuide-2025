import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PlantStage } from '@/types'
import { EcPhMonitorTab } from './EcPhMonitorTab'

vi.mock('@/stores/store', () => ({
    useAppSelector: (selector: { name?: string }) =>
        selector.name === 'selectActivePlants' ? [] : { general: { language: 'en' } },
    useAppDispatch: () => vi.fn(),
}))

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}))

vi.mock('dompurify', () => ({
    default: { sanitize: (value: string) => value },
}))

describe('EcPhMonitorTab', () => {
    it('shows the shared disclaimer with an AI recommendation', () => {
        render(
            <EcPhMonitorTab
                medium="Soil"
                currentStage={PlantStage.Vegetative}
                optimalRange={{ ecMin: 0.8, ecMax: 1.4, phMin: 6, phMax: 6.8 }}
                plantOptions={[]}
                selectedPlantId={null}
                onSelectedPlantIdChange={() => undefined}
                readingType="input"
                onReadingTypeChange={() => undefined}
                inputEc={1}
                onInputEcChange={() => undefined}
                inputPh={6.2}
                onInputPhChange={() => undefined}
                inputWaterTemp={20}
                onInputWaterTempChange={() => undefined}
                recentReadings={[]}
                autoAdjust={false}
                autoAdjustRecommendation={null}
                aiLoading={false}
                aiRecommendation="<p>Raise EC slightly.</p>"
            />,
        )
        expect(screen.getByTestId('ai-disclaimer')).toBeInTheDocument()
        expect(screen.getByText('Raise EC slightly.')).toBeInTheDocument()
    })
})
