import React, { memo, useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'

interface VisualGuideCardProps {
    guideId: string
    title: string
    description: string
}

const GUIDE_META: Record<string, { icon: React.ReactNode; color: string }> = {
    topping: { icon: <PhosphorIcons.Scissors className="w-4 h-4" />, color: 'text-lime-400' },
    lst: { icon: <PhosphorIcons.ArrowDown className="w-4 h-4" />, color: 'text-orange-400' },
    defoliation: { icon: <PhosphorIcons.Leafy className="w-4 h-4" />, color: 'text-emerald-400' },
    harvesting: { icon: <PhosphorIcons.Star className="w-4 h-4" />, color: 'text-purple-400' },
}

const GuideVisuals: React.FC<{ guideId: string }> = ({ guideId }) => {
    const { t } = useTranslation()
    const titleId = useId()
    const ariaLabels: Record<string, string> = {
        topping: t('common.accessibility.toppingTechnique'),
        lst: t('common.accessibility.lowStressTraining'),
        defoliation: t('common.accessibility.defoliationTechnique'),
        harvesting: t('common.accessibility.harvestingTechnique'),
    }
    const ariaLabel = ariaLabels[guideId] ?? guideId

    switch (guideId) {
        case 'topping':
            return (
                <svg viewBox="0 0 100 100" className="w-24 h-24" aria-labelledby={titleId}>
                    <title id={titleId}>{ariaLabel}</title>
                    <style>{`
                    .plant-stem { stroke: #84cc16; stroke-width: 2; fill: none; }
                    .plant-leaf { fill: #4d7c0f; }
                    .scissors { stroke: #9ca3af; stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; animation: cut-action 3s ease-in-out infinite; }
                    @keyframes cut-action {
                      0%, 20%, 100% { transform: translate(60px, 20px) rotate(30deg); }
                      40% { transform: translate(45px, 25px) rotate(10deg); }
                      50% { transform: translate(45px, 25px) rotate(10deg) scale(0.95); }
                      60%, 80% { transform: translate(60px, 20px) rotate(30deg); }
                    }
                    .cut-line { stroke: #ef4444; stroke-width: 1.5; stroke-dasharray: 3 3; animation: appear-cut 3s ease-in-out infinite; opacity: 0; }
                    @keyframes appear-cut {
                      40% { opacity: 0; }
                      50% { opacity: 1; }
                      60% { opacity: 0; }
                    }
                    .top-part { animation: fall-off 3s ease-in-out infinite; transform-origin: 50px 30px; opacity: 1; }
                    @keyframes fall-off {
                      0%, 50% { transform: rotate(0deg) translateY(0); opacity: 1; }
                      70% { transform: rotate(45deg) translate(20px, 20px); opacity: 0; }
                      100% { transform: rotate(0deg) translateY(0); opacity: 1; }
                    }
                    .new-shoots { animation: sprout 3s ease-in-out infinite; transform-origin: 50px 30px; opacity: 0; }
                    @keyframes sprout {
                      0%, 70% { opacity: 0; transform: scaleY(0); }
                      85%, 100% { opacity: 1; transform: scaleY(1); }
                    }
                  `}</style>
                    <g>
                        <path className="plant-stem" d="M50 90 V 30" />
                        <path
                            className="plant-leaf"
                            d="M50 60 C 40 55, 30 65, 30 70 Q 40 68, 50 60 Z"
                        />
                        <path
                            className="plant-leaf"
                            d="M50 60 C 60 55, 70 65, 70 70 Q 60 68, 50 60 Z"
                        />
                        <path
                            className="plant-leaf"
                            d="M50 45 C 42 40, 35 48, 35 52 Q 43 50, 50 45 Z"
                        />
                        <path
                            className="plant-leaf"
                            d="M50 45 C 58 40, 65 48, 65 52 Q 57 50, 50 45 Z"
                        />
                    </g>
                    <g className="top-part">
                        <path
                            className="plant-leaf"
                            d="M50 30 C 45 25, 40 30, 40 33 Q 45 32, 50 30 Z"
                        />
                        <path
                            className="plant-leaf"
                            d="M50 30 C 55 25, 60 30, 60 33 Q 55 32, 50 30 Z"
                        />
                    </g>
                    <g className="new-shoots">
                        <path className="plant-stem" d="M50 30 C 45 25, 38 22, 35 18" />
                        <path className="plant-stem" d="M50 30 C 55 25, 62 22, 65 18" />
                        <circle fill="#65a30d" cx="35" cy="18" r="3" />
                        <circle fill="#65a30d" cx="65" cy="18" r="3" />
                    </g>
                    <line className="cut-line" x1="40" y1="30" x2="60" y2="30" />
                    <g className="scissors">
                        <circle cx="0" cy="10" r="5" />
                        <circle cx="0" cy="-10" r="5" />
                        <line x1="0" y1="10" x2="20" y2="0" />
                        <line x1="0" y1="-10" x2="20" y2="0" />
                        <line x1="20" y1="0" x2="35" y2="-5" />
                        <line x1="20" y1="0" x2="35" y2="5" />
                    </g>
                </svg>
            )
        case 'lst':
            return (
                <svg viewBox="0 0 100 100" className="w-24 h-24" aria-labelledby={titleId}>
                    <title id={titleId}>{ariaLabel}</title>
                    <style>{`
                    .plant-stem { stroke: #84cc16; stroke-width: 2; fill: none; }
                    .plant-leaf { fill: #4d7c0f; }
                    .lst-tie { stroke: #fb923c; stroke-width: 1.5; fill: none; stroke-linecap: round; }
                    .branch { animation: bend-branch 4s ease-in-out infinite; transform-origin: 50px 70px; }
                    @keyframes bend-branch {
                      0%, 100% { transform: rotate(0deg); }
                      50%, 70% { transform: rotate(-45deg); }
                    }
                    .light-rays { animation: light-pulse 4s ease-in-out infinite; opacity: 0; }
                    @keyframes light-pulse {
                      0%, 40% { opacity: 0; }
                      60%, 80% { opacity: 0.4; }
                      100% { opacity: 0; }
                    }
                  `}</style>
                    <g className="light-rays">
                        <line x1="20" y1="5" x2="20" y2="15" stroke="#fbbf24" strokeWidth="1" />
                        <line x1="40" y1="3" x2="40" y2="13" stroke="#fbbf24" strokeWidth="1" />
                        <line x1="60" y1="5" x2="60" y2="15" stroke="#fbbf24" strokeWidth="1" />
                        <line x1="80" y1="3" x2="80" y2="13" stroke="#fbbf24" strokeWidth="1" />
                    </g>
                    <path className="plant-stem" d="M50 90 V 70" />
                    <g className="branch">
                        <path className="plant-stem" d="M50 70 C 60 70, 70 60, 70 50" />
                        <path
                            className="plant-leaf"
                            d="M70 50 C 65 45, 75 40, 78 42 Q 72 48, 70 50 Z"
                        />
                    </g>
                    <path className="lst-tie" d="M70 50 C 75 65, 85 75, 90 70" />
                    <line className="lst-tie" x1="90" y1="70" x2="90" y2="90" />
                </svg>
            )
        case 'defoliation':
            return (
                <svg viewBox="0 0 100 100" className="w-24 h-24" aria-labelledby={titleId}>
                    <title id={titleId}>{ariaLabel}</title>
                    <style>{`
                    .plant-stem { stroke: #84cc16; stroke-width: 2; fill: none; }
                    .plant-leaf { fill: #4d7c0f; }
                    .pluck-leaf { animation: pluck-action 3s ease-in-out infinite; transform-origin: 30px 70px; opacity: 1; }
                    @keyframes pluck-action {
                      0%, 30% { transform: translateY(0); opacity: 1; }
                      50% { transform: translateY(20px) rotate(30deg); opacity: 0; }
                      100% { transform: translateY(0); opacity: 1; }
                    }
                    .airflow { animation: flow 2.5s ease-in-out infinite; opacity: 0; }
                    @keyframes flow {
                      0%, 30% { opacity: 0; transform: translateX(0); }
                      50%, 70% { opacity: 0.3; transform: translateX(5px); }
                      100% { opacity: 0; transform: translateX(10px); }
                    }
                  `}</style>
                    <g className="airflow">
                        <path
                            d="M15 50 C 20 48, 25 52, 30 50"
                            stroke="#93c5fd"
                            strokeWidth="1"
                            fill="none"
                        />
                        <path
                            d="M15 60 C 20 58, 25 62, 30 60"
                            stroke="#93c5fd"
                            strokeWidth="1"
                            fill="none"
                        />
                        <path
                            d="M15 70 C 20 68, 25 72, 30 70"
                            stroke="#93c5fd"
                            strokeWidth="1"
                            fill="none"
                        />
                    </g>
                    <path className="plant-stem" d="M50 90 V 50" />
                    <path
                        className="plant-leaf"
                        d="M50 60 C 60 55, 70 65, 70 70 Q 60 68, 50 60 Z"
                    />
                    <path
                        className="plant-leaf pluck-leaf"
                        d="M50 60 C 40 55, 30 65, 30 70 Q 40 68, 50 60 Z"
                    />
                </svg>
            )
        case 'harvesting':
            return (
                <svg viewBox="0 0 100 100" className="w-24 h-24" aria-labelledby={titleId}>
                    <title id={titleId}>{ariaLabel}</title>
                    <style>{`
                    .plant-stem { stroke: #84cc16; stroke-width: 2; fill: none; }
                    .bud { fill: #a855f7; }
                    .trichome { fill: #e9d5ff; animation: sparkle 2s ease-in-out infinite; }
                    @keyframes sparkle {
                      0%, 100% { opacity: 0.3; }
                      50% { opacity: 1; }
                    }
                    .scissors { stroke: #9ca3af; stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; animation: harvest-cut 4s ease-in-out infinite; }
                    @keyframes harvest-cut {
                      0%, 30%, 100% { transform: translate(70px, 70px) rotate(45deg); }
                      50% { transform: translate(45px, 85px) rotate(0deg); }
                      55% { transform: translate(45px, 85px) rotate(0deg) scale(0.95); }
                      70% { transform: translate(70px, 70px) rotate(45deg); }
                    }
                    .cut-line { stroke: #ef4444; stroke-width: 1.5; stroke-dasharray: 3 3; animation: appear-harvest-cut 4s ease-in-out infinite; opacity: 0; }
                     @keyframes appear-harvest-cut {
                      50% { opacity: 0; }
                      55% { opacity: 1; }
                      60% { opacity: 0; }
                    }
                  `}</style>
                    <path className="plant-stem" d="M50 90 V 30" />
                    <circle className="bud" cx="50" cy="35" r="10" />
                    <circle className="bud" cx="45" cy="50" r="8" />
                    <circle className="bud" cx="55" cy="50" r="8" />
                    <circle className="trichome" cx="44" cy="28" r="1.5" />
                    <circle className="trichome" cx="56" cy="30" r="1.2" />
                    <circle className="trichome" cx="50" cy="26" r="1" />
                    <circle className="trichome" cx="39" cy="46" r="1" />
                    <circle className="trichome" cx="60" cy="45" r="1.3" />
                    <line className="cut-line" x1="40" y1="90" x2="60" y2="90" />
                    <g className="scissors">
                        <circle cx="0" cy="10" r="5" />
                        <circle cx="0" cy="-10" r="5" />
                        <line x1="0" y1="10" x2="20" y2="0" />
                        <line x1="0" y1="-10" x2="20" y2="0" />
                        <line x1="20" y1="0" x2="35" y2="-5" />
                        <line x1="20" y1="0" x2="35" y2="5" />
                    </g>
                </svg>
            )
        default:
            return null
    }
}

export const VisualGuideCard: React.FC<VisualGuideCardProps> = memo(
    ({ guideId, title, description }) => {
        const meta = GUIDE_META[guideId]

        return (
            <Card className="flex flex-col h-full ring-1 ring-inset ring-slate-700/50 hover:ring-primary-500/30 transition-all duration-200 group/card">
                <div className="w-full h-36 bg-slate-800/50 rounded-lg mb-4 flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover/card:scale-[1.02]">
                    <GuideVisuals guideId={guideId} />
                </div>
                <div className="flex items-center gap-2 mb-1">
                    {meta && <span className={meta.color}>{meta.icon}</span>}
                    <h3 className="font-bold text-primary-300">{title}</h3>
                </div>
                <p className="text-sm text-slate-400 mt-1 flex-grow leading-relaxed">
                    {description}
                </p>
            </Card>
        )
    },
)
