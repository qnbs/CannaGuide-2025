import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { VpdCalculatorPanel } from './calculatorHub/VpdCalculatorPanel'
import { NutrientRatioPanel } from './calculatorHub/NutrientRatioPanel'
import { PhQuickGuidePanel } from './calculatorHub/PhQuickGuidePanel'
import { TerpeneEntouragePanel } from './calculatorHub/TerpeneEntouragePanel'
import { TranspirationPanel } from './calculatorHub/TranspirationPanel'
import { EcTdsPanel } from './calculatorHub/EcTdsPanel'
import { LightSpectrumPanel } from './calculatorHub/LightSpectrumPanel'
import { CannabinoidRatioPanel } from './calculatorHub/CannabinoidRatioPanel'

type TabId =
    | 'vpd'
    | 'nutrient'
    | 'ph'
    | 'terpeneEntourage'
    | 'transpiration'
    | 'ecTds'
    | 'lightSpectrum'
    | 'cannabinoidRatio'

const CalculatorHubViewComponent: React.FC = () => {
    const { t } = useTranslation()
    const [activeTab, setActiveTab] = useState<TabId>('vpd')

    const tabs: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
        {
            id: 'vpd',
            label: t('knowledgeView.rechner.vpdTab'),
            icon: <PhosphorIcons.Thermometer />,
        },
        {
            id: 'nutrient',
            label: t('knowledgeView.rechner.nutrientTab'),
            icon: <PhosphorIcons.Drop />,
        },
        {
            id: 'ph',
            label: t('knowledgeView.rechner.phTab'),
            icon: <PhosphorIcons.TestTube />,
        },
        {
            id: 'terpeneEntourage',
            label: t('knowledgeView.rechner.terpeneEntourageTab'),
            icon: <PhosphorIcons.MagicWand />,
        },
        {
            id: 'transpiration',
            label: t('knowledgeView.rechner.transpirationTab'),
            icon: <PhosphorIcons.Fan />,
        },
        {
            id: 'ecTds',
            label: t('knowledgeView.rechner.ecTdsTab'),
            icon: <PhosphorIcons.Flask />,
        },
        {
            id: 'lightSpectrum',
            label: t('knowledgeView.rechner.lightSpectrumTab'),
            icon: <PhosphorIcons.Sun />,
        },
        {
            id: 'cannabinoidRatio',
            label: t('knowledgeView.rechner.cannabinoidRatioTab'),
            icon: <PhosphorIcons.ChartPieSlice />,
        },
    ]

    return (
        <div className="space-y-5">
            <div
                className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
                role="tablist"
                aria-label={t('knowledgeView.rechner.title')}
            >
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        id={`rechner-tab-${tab.id}`}
                        aria-controls={`rechner-panel-${tab.id}`}
                        aria-selected={activeTab === tab.id}
                        onClick={() => {
                            setActiveTab(tab.id)
                        }}
                        className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            activeTab === tab.id
                                ? 'bg-primary-600 text-white shadow-lg'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                    >
                        <span className="w-4 h-4">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            <div
                id={`rechner-panel-${activeTab}`}
                role="tabpanel"
                aria-labelledby={`rechner-tab-${activeTab}`}
            >
                {activeTab === 'vpd' && <VpdCalculatorPanel />}
                {activeTab === 'nutrient' && <NutrientRatioPanel />}
                {activeTab === 'ph' && <PhQuickGuidePanel />}
                {activeTab === 'terpeneEntourage' && <TerpeneEntouragePanel />}
                {activeTab === 'transpiration' && <TranspirationPanel />}
                {activeTab === 'ecTds' && <EcTdsPanel />}
                {activeTab === 'lightSpectrum' && <LightSpectrumPanel />}
                {activeTab === 'cannabinoidRatio' && <CannabinoidRatioPanel />}
            </div>

            <p className="text-xs text-slate-500 text-center">
                {t('knowledgeView.rechner.equipmentLink')}
            </p>
        </div>
    )
}

CalculatorHubViewComponent.displayName = 'CalculatorHubView'

export default CalculatorHubViewComponent
