import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { FLAVONOID_DATABASE } from '@/data/flavonoidDatabase'
import type { FlavonoidName } from '@/types'

/** Expandable flavonoid entry with scientific details */
export const FlavonoidEntry: React.FC<{
    name: string
    val: number
    barWidth: number
    ref_: (typeof FLAVONOID_DATABASE)[FlavonoidName] | undefined
    isExclusive: boolean
    t: ReturnType<typeof useTranslation>['t']
}> = React.memo(({ name, val, barWidth, ref_, isExclusive, t }) => {
    const [expanded, setExpanded] = useState(false)

    const subclassColor = ref_
        ? ({
              cannflavin: 'bg-amber-900/40 text-amber-300',
              flavone: 'bg-purple-900/40 text-purple-300',
              flavonol: 'bg-emerald-900/40 text-emerald-300',
              flavanonol: 'bg-blue-900/40 text-blue-300',
              flavanone: 'bg-orange-900/40 text-orange-300',
              catechin: 'bg-rose-900/40 text-rose-300',
          }[ref_.subclass] ?? 'bg-slate-700 text-slate-300')
        : ''

    const barColor = isExclusive ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-amber-500'

    return (
        <div
            className="group cursor-pointer rounded-lg hover:bg-slate-800/50 transition-colors p-2 -mx-2"
            onClick={() => setExpanded((prev) => !prev)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setExpanded((prev) => !prev)
            }}
        >
            {/* Header Row */}
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-200">{name}</span>
                    {isExclusive && (
                        <span className="text-xs bg-amber-900/50 text-amber-300 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <PhosphorIcons.Star className="w-3 h-3" />
                            {t('strainsView.flavonoids.exclusive')}
                        </span>
                    )}
                    {ref_ && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${subclassColor}`}>
                            {t(`strainsView.flavonoids.subclass.${ref_.subclass}`)}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-amber-300 font-mono">{val.toFixed(3)}%</span>
                    <PhosphorIcons.ChevronDown
                        className={`w-3.5 h-3.5 text-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
                    />
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div
                    className={`${barColor} rounded-full h-1.5 transition-all`}
                    style={{ width: `${barWidth}%` }}
                />
            </div>

            {/* Inline Effects Preview */}
            {ref_ && ref_.effects.length > 0 && !expanded && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                    {ref_.effects.map((effect) => (
                        <span key={effect} className="text-xs text-muted">
                            {t(`strainsView.flavonoids.effects.${effect.replace(/[\s-]/g, '')}`, {
                                defaultValue: effect,
                            })}
                        </span>
                    ))}
                </div>
            )}

            {/* Expanded Details */}
            {expanded && ref_ && (
                <div className="mt-3 space-y-3 text-xs">
                    {/* Molecular Info */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted">
                        <span>
                            {t('strainsView.flavonoids.detail.formula')}:{' '}
                            <span className="text-slate-300 font-mono">{ref_.formula}</span>
                        </span>
                        <span>
                            {t('strainsView.flavonoids.detail.molarMass')}:{' '}
                            <span className="text-slate-300">{ref_.molecularWeight} g/mol</span>
                        </span>
                        <span>
                            CAS: <span className="text-slate-300 font-mono">{ref_.cas}</span>
                        </span>
                        <span>
                            {t('strainsView.flavonoids.detail.typicalRange')}:{' '}
                            <span className="text-slate-300 font-mono">
                                {ref_.typicalRange.min.toFixed(4)}-{ref_.typicalRange.max.toFixed(3)}
                                %
                            </span>
                        </span>
                    </div>

                    {/* Effects */}
                    {ref_.effects.length > 0 && (
                        <div>
                            <div className="text-slate-400 font-semibold mb-1">
                                {t('strainsView.flavonoids.detail.effects')}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {ref_.effects.map((effect) => (
                                    <span
                                        key={effect}
                                        className="bg-amber-900/30 text-amber-200 px-2 py-0.5 rounded-full"
                                    >
                                        {t(
                                            `strainsView.flavonoids.effects.${effect.replace(/[\s-]/g, '')}`,
                                            { defaultValue: effect },
                                        )}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Mechanisms */}
                    {ref_.mechanisms.length > 0 && (
                        <div>
                            <div className="text-slate-400 font-semibold mb-1">
                                {t('strainsView.flavonoids.detail.mechanisms')}
                            </div>
                            <ul className="space-y-1 text-slate-400">
                                {ref_.mechanisms.map((m, i) => (
                                    <li key={`mech-${i}`} className="flex items-start gap-1.5">
                                        <PhosphorIcons.Flask className="w-3 h-3 text-amber-500/60 flex-shrink-0 mt-0.5" />
                                        <span>{m}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Also Found In */}
                    {ref_.alsoFoundIn.length > 0 && (
                        <div>
                            <div className="text-slate-400 font-semibold mb-1">
                                {t('strainsView.flavonoids.detail.alsoFoundIn')}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {ref_.alsoFoundIn.map((source) => (
                                    <span
                                        key={source}
                                        className="bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded-full"
                                    >
                                        {source}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
})
FlavonoidEntry.displayName = 'FlavonoidEntry'
