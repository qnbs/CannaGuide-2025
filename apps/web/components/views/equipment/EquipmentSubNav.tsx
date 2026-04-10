import React from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { EquipmentViewTab } from '@/types'

interface EquipmentSubNavProps {
    activeTab: EquipmentViewTab
    onTabChange: (tab: EquipmentViewTab) => void
}

export const EquipmentSubNav: React.FC<EquipmentSubNavProps> = ({ activeTab, onTabChange }) => {
    const { t } = useTranslation()

    const navItems: Array<{
        id: EquipmentViewTab | 'placeholder'
        label: string
        icon: React.ReactNode
    }> = [
        {
            id: EquipmentViewTab.Configurator,
            label: t('equipmentView.tabs.configurator'),
            icon: <PhosphorIcons.MagicWand />,
        },
        {
            id: EquipmentViewTab.PresetSetups,
            label: t('equipmentView.tabs.presetSetups'),
            icon: <PhosphorIcons.Cube />,
        },
        {
            id: EquipmentViewTab.Setups,
            label: t('equipmentView.tabs.setups'),
            icon: <PhosphorIcons.ArchiveBox />,
        },
        {
            id: EquipmentViewTab.Calculators,
            label: t('equipmentView.tabs.calculators'),
            icon: <PhosphorIcons.Calculator />,
        },
        {
            id: EquipmentViewTab.GrowShops,
            label: t('equipmentView.tabs.growShops'),
            icon: <PhosphorIcons.Storefront />,
        },
        {
            id: EquipmentViewTab.Seedbanks,
            label: t('equipmentView.tabs.seedbanks'),
            icon: <PhosphorIcons.Cannabis />,
        },
        {
            id: EquipmentViewTab.GrowTech,
            label: t('equipmentView.tabs.growTech'),
            icon: <PhosphorIcons.Lightning />,
        },
        {
            id: EquipmentViewTab.HydroMonitoring,
            label: t('equipmentView.tabs.hydroMonitoring'),
            icon: <PhosphorIcons.Drop />,
        },
    ]

    return (
        <nav className="grid grid-cols-3 gap-2 sm:gap-4">
            {navItems.map((item) => {
                const id = item.id
                if (id === 'placeholder') {
                    return <div key={id} className="hidden sm:block"></div>
                }
                return (
                    <button
                        type="button"
                        key={id}
                        onClick={() => onTabChange(id)}
                        className={`flex flex-col items-center justify-center gap-0.5 sm:gap-1 p-2 sm:p-3 rounded-lg transition-all duration-200 min-h-[56px] sm:min-h-[64px] overflow-hidden
                            ${
                                activeTab === id
                                    ? 'bg-primary-600 text-white scale-105 shadow-lg ring-1 ring-primary-400'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                            }`}
                        aria-label={item.label}
                        aria-current={activeTab === id ? 'page' : undefined}
                    >
                        <div className="w-5 h-5 sm:w-6 sm:h-6 shrink-0">{item.icon}</div>
                        <span className="text-[10px] sm:text-xs font-semibold text-center leading-tight line-clamp-2 w-full break-words">
                            {item.label}
                        </span>
                    </button>
                )
            })}
        </nav>
    )
}

EquipmentSubNav.displayName = 'EquipmentSubNav'
