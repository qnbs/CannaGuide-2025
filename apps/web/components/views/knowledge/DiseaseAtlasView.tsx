import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { DiseaseCategory, DiseaseEntry, PlantStage } from '@/types'
import { diseaseAtlas } from '@/data/diseases'

type CategoryFilter = 'all' | DiseaseCategory
type UrgencyFilter = 'all' | DiseaseEntry['urgency']

const CATEGORY_ICON: Record<DiseaseCategory, React.ReactNode> = {
    deficiency: <PhosphorIcons.Drop />,
    toxicity: <PhosphorIcons.Warning />,
    environmental: <PhosphorIcons.Thermometer />,
    pest: <PhosphorIcons.Leafy />,
    disease: <PhosphorIcons.FirstAidKit />,
}

const SEVERITY_BADGE: Record<DiseaseEntry['severity'], string> = {
    low: 'bg-blue-800 text-blue-200',
    medium: 'bg-yellow-800 text-yellow-200',
    high: 'bg-orange-800 text-orange-200',
    critical: 'bg-red-800 text-red-200',
}

const URGENCY_BORDER: Record<DiseaseEntry['urgency'], string> = {
    monitor: 'border-l-slate-500',
    act_soon: 'border-l-amber-500',
    act_immediately: 'border-l-red-500',
}

interface DiseaseDetailPanelProps {
    entry: DiseaseEntry
    onClose: () => void
}

const DiseaseDetailPanel: React.FC<DiseaseDetailPanelProps> = ({ entry, onClose }) => {
    const { t } = useTranslation()
    const base = `knowledgeView.atlas.diseases.${entry.id}`

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div
                className="w-full max-w-lg rounded-2xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden"
                role="dialog"
                aria-modal="true"
                aria-labelledby="disease-detail-title"
            >
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 id="disease-detail-title" className="font-bold text-slate-100 text-base">
                        {t(`${base}.name`)}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded text-slate-400 hover:text-white"
                        aria-label={t('knowledgeView.atlas.close')}
                    >
                        <PhosphorIcons.X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span
                            className={`px-2 py-0.5 rounded-full font-semibold ${SEVERITY_BADGE[entry.severity]}`}
                        >
                            {t(`knowledgeView.atlas.severity.${entry.severity}`)}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-200 font-semibold capitalize">
                            {t(`knowledgeView.atlas.category.${entry.category}`)}
                        </span>
                    </div>

                    <section>
                        <h3 className="text-sm font-semibold text-amber-400 mb-1">
                            {t('knowledgeView.atlas.detail.symptoms')}
                        </h3>
                        <p className="text-slate-300 text-sm leading-relaxed">
                            {t(`${base}.symptoms`)}
                        </p>
                    </section>

                    <section>
                        <h3 className="text-sm font-semibold text-blue-400 mb-1">
                            {t('knowledgeView.atlas.detail.causes')}
                        </h3>
                        <p className="text-slate-300 text-sm leading-relaxed">
                            {t(`${base}.causes`)}
                        </p>
                    </section>

                    <section>
                        <h3 className="text-sm font-semibold text-green-400 mb-1">
                            {t('knowledgeView.atlas.detail.treatment')}
                        </h3>
                        <p className="text-slate-300 text-sm leading-relaxed">
                            {t(`${base}.treatment`)}
                        </p>
                    </section>

                    <section>
                        <h3 className="text-sm font-semibold text-primary-400 mb-1">
                            {t('knowledgeView.atlas.detail.prevention')}
                        </h3>
                        <p className="text-slate-300 text-sm leading-relaxed">
                            {t(`${base}.prevention`)}
                        </p>
                    </section>

                    {entry.relatedLexiconKeys.length > 0 && (
                        <section>
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                                {t('knowledgeView.atlas.detail.relatedTerms')}
                            </h3>
                            <div className="flex flex-wrap gap-1">
                                {entry.relatedLexiconKeys.map((k) => (
                                    <span
                                        key={k}
                                        className="px-2 py-0.5 text-xs rounded bg-slate-700 text-slate-300"
                                    >
                                        {t(`helpView.lexicon.generals.${k}.term`, {
                                            defaultValue: k,
                                        })}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    )
}

const STAGE_LABEL: Partial<Record<PlantStage, string>> = {
    [PlantStage.Seedling]: 'Seedling',
    [PlantStage.Vegetative]: 'Veg',
    [PlantStage.Flowering]: 'Flower',
    [PlantStage.Harvest]: 'Harvest',
}

const DiseaseAtlasViewComponent: React.FC = () => {
    const { t } = useTranslation()
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
    const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>('all')
    const [query, setQuery] = useState('')
    const [selected, setSelected] = useState<DiseaseEntry | null>(null)

    const categories: CategoryFilter[] = [
        'all',
        'deficiency',
        'toxicity',
        'environmental',
        'pest',
        'disease',
    ]

    const filtered = useMemo(() => {
        const q = query.toLowerCase().trim()
        return diseaseAtlas.filter((entry) => {
            const name = t(`knowledgeView.atlas.diseases.${entry.id}.name`, {
                defaultValue: entry.id,
            }).toLowerCase()
            const matchesQuery = !q || name.includes(q)
            const matchesCategory = categoryFilter === 'all' || entry.category === categoryFilter
            const matchesUrgency = urgencyFilter === 'all' || entry.urgency === urgencyFilter
            return matchesQuery && matchesCategory && matchesUrgency
        })
    }, [query, categoryFilter, urgencyFilter, t])

    return (
        <div className="space-y-5">
            {selected && (
                <DiseaseDetailPanel
                    entry={selected}
                    onClose={() => {
                        setSelected(null)
                    }}
                />
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <PhosphorIcons.MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value)
                        }}
                        placeholder={t('knowledgeView.atlas.searchPlaceholder')}
                        className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        aria-label={t('knowledgeView.atlas.searchPlaceholder')}
                    />
                </div>
            </div>

            <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label={t('knowledgeView.atlas.filterByCategory')}
            >
                {categories.map((cat) => (
                    <button
                        key={cat}
                        type="button"
                        onClick={() => {
                            setCategoryFilter(cat)
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                            categoryFilter === cat
                                ? 'bg-primary-600 text-white border-primary-400 scale-105'
                                : 'bg-slate-800 text-slate-300 border-slate-600 hover:border-slate-400'
                        }`}
                        aria-pressed={categoryFilter === cat}
                    >
                        {cat !== 'all' && (
                            <span className="w-3 h-3">{CATEGORY_ICON[cat as DiseaseCategory]}</span>
                        )}
                        {cat === 'all'
                            ? t('knowledgeView.atlas.allCategories')
                            : t(`knowledgeView.atlas.category.${cat}`)}
                    </button>
                ))}
            </div>

            <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label={t('knowledgeView.atlas.filterByUrgency')}
            >
                {(['all', 'monitor', 'act_soon', 'act_immediately'] as UrgencyFilter[]).map((u) => (
                    <button
                        key={u}
                        type="button"
                        onClick={() => {
                            setUrgencyFilter(u)
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                            urgencyFilter === u
                                ? 'bg-slate-600 text-white border-slate-400'
                                : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-500'
                        }`}
                        aria-pressed={urgencyFilter === u}
                    >
                        {u === 'all'
                            ? t('knowledgeView.atlas.allUrgencies')
                            : t(`knowledgeView.atlas.urgency.${u}`)}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">
                    {t('knowledgeView.atlas.noResults')}
                </p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filtered.map((entry) => (
                        <button
                            key={entry.id}
                            type="button"
                            onClick={() => {
                                setSelected(entry)
                            }}
                            className={`text-left p-4 rounded-lg bg-slate-800/60 border border-white/10 border-l-4 ${URGENCY_BORDER[entry.urgency]} hover:border-primary-500/50 hover:bg-slate-800 transition-all group`}
                            aria-label={t(`knowledgeView.atlas.diseases.${entry.id}.name`, {
                                defaultValue: entry.id,
                            })}
                        >
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-4 h-4 text-slate-400 group-hover:text-primary-400 transition-colors">
                                        {CATEGORY_ICON[entry.category]}
                                    </span>
                                    <h3 className="font-semibold text-slate-100 text-sm">
                                        {t(`knowledgeView.atlas.diseases.${entry.id}.name`, {
                                            defaultValue: entry.id,
                                        })}
                                    </h3>
                                </div>
                                <span
                                    className={`shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full ${SEVERITY_BADGE[entry.severity]}`}
                                >
                                    {t(`knowledgeView.atlas.severity.${entry.severity}`)}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                                {entry.affectedStages.map((stage) => (
                                    <span
                                        key={stage}
                                        className="px-1.5 py-0.5 text-[10px] rounded bg-slate-700 text-slate-300"
                                    >
                                        {STAGE_LABEL[stage] ?? stage}
                                    </span>
                                ))}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            <p className="text-xs text-slate-500 text-center">
                {t('knowledgeView.atlas.entryCount', { count: diseaseAtlas.length })}
            </p>
        </div>
    )
}

DiseaseAtlasViewComponent.displayName = 'DiseaseAtlasView'

export default DiseaseAtlasViewComponent
