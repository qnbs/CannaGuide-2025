import React, { useState, useMemo, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'

/** Screenshot metadata */
interface ScreenshotEntry {
    id: string
    category: string
    name: string
    viewport: 'desktop' | 'mobile'
    path: string
}

const CATEGORIES = [
    { id: 'plants', icon: 'Plant' },
    { id: 'strains', icon: 'Leafy' },
    { id: 'equipment', icon: 'Wrench' },
    { id: 'knowledge', icon: 'BookBookmark' },
    { id: 'settings', icon: 'Gear' },
    { id: 'help', icon: 'Question' },
] as const

type CategoryId = (typeof CATEGORIES)[number]['id']

const SCREENSHOTS: ScreenshotEntry[] = [
    // Plants
    {
        id: 'plants-overview',
        category: 'plants',
        name: 'overview',
        viewport: 'desktop',
        path: 'screenshots/desktop--plants--overview.png',
    },
    {
        id: 'plants-overview-m',
        category: 'plants',
        name: 'overview',
        viewport: 'mobile',
        path: 'screenshots/mobile--plants--overview.png',
    },
    // Strains
    ...[
        'all',
        'my-strains',
        'favorites',
        'daily-strains',
        'genealogy',
        'breeding-lab',
        'exports',
        'tips',
        'trends',
    ].flatMap((name) => [
        {
            id: `strains-${name}`,
            category: 'strains',
            name,
            viewport: 'desktop' as const,
            path: `screenshots/desktop--strains--${name}.png`,
        },
        {
            id: `strains-${name}-m`,
            category: 'strains',
            name,
            viewport: 'mobile' as const,
            path: `screenshots/mobile--strains--${name}.png`,
        },
    ]),
    // Equipment
    ...[
        'configurator',
        'setups',
        'calculators',
        'grow-shops',
        'seedbanks',
        'grow-tech',
        'iot-dashboard',
    ].flatMap((name) => [
        {
            id: `equipment-${name}`,
            category: 'equipment',
            name,
            viewport: 'desktop' as const,
            path: `screenshots/desktop--equipment--${name}.png`,
        },
        {
            id: `equipment-${name}-m`,
            category: 'equipment',
            name,
            viewport: 'mobile' as const,
            path: `screenshots/mobile--equipment--${name}.png`,
        },
    ]),
    // Knowledge
    ...['mentor', 'guide', 'archive', 'sandbox'].flatMap((name) => [
        {
            id: `knowledge-${name}`,
            category: 'knowledge',
            name,
            viewport: 'desktop' as const,
            path: `screenshots/desktop--knowledge--${name}.png`,
        },
        {
            id: `knowledge-${name}-m`,
            category: 'knowledge',
            name,
            viewport: 'mobile' as const,
            path: `screenshots/mobile--knowledge--${name}.png`,
        },
    ]),
    // Settings
    ...['general', 'ai', 'tts', 'privacy', 'about'].flatMap((name) => [
        {
            id: `settings-${name}`,
            category: 'settings',
            name,
            viewport: 'desktop' as const,
            path: `screenshots/desktop--settings--${name}.png`,
        },
        {
            id: `settings-${name}-m`,
            category: 'settings',
            name,
            viewport: 'mobile' as const,
            path: `screenshots/mobile--settings--${name}.png`,
        },
    ]),
    // Help
    ...['manual', 'lexicon', 'guides', 'faq'].flatMap((name) => [
        {
            id: `help-${name}`,
            category: 'help',
            name,
            viewport: 'desktop' as const,
            path: `screenshots/desktop--help--${name}.png`,
        },
        {
            id: `help-${name}-m`,
            category: 'help',
            name,
            viewport: 'mobile' as const,
            path: `screenshots/mobile--help--${name}.png`,
        },
    ]),
]

const CATEGORY_COLORS: Record<string, string> = {
    plants: 'ring-emerald-500/30',
    strains: 'ring-lime-500/30',
    equipment: 'ring-amber-500/30',
    knowledge: 'ring-violet-500/30',
    settings: 'ring-sky-500/30',
    help: 'ring-yellow-500/30',
}

const getCategoryIcon = (catId: string): React.ReactNode => {
    const iconMap: Record<string, React.FC<{ className?: string }>> = {
        plants: PhosphorIcons.Plant,
        strains: PhosphorIcons.Leafy,
        equipment: PhosphorIcons.Wrench,
        knowledge: PhosphorIcons.BookBookmark,
        settings: PhosphorIcons.Gear,
        help: PhosphorIcons.Question,
    }
    const Icon = iconMap[catId]
    return Icon ? <Icon className="w-5 h-5" /> : null
}

export const ScreenshotGallery: React.FC = memo(() => {
    const { t } = useTranslation()
    const [activeCategory, setActiveCategory] = useState<CategoryId | 'all'>('all')
    const [viewportFilter, setViewportFilter] = useState<'all' | 'desktop' | 'mobile'>('all')
    const [lightboxImg, setLightboxImg] = useState<string | null>(null)

    const filtered = useMemo(() => {
        let items = SCREENSHOTS
        if (activeCategory !== 'all') {
            items = items.filter((s) => s.category === activeCategory)
        }
        if (viewportFilter !== 'all') {
            items = items.filter((s) => s.viewport === viewportFilter)
        }
        return items
    }, [activeCategory, viewportFilter])

    const grouped = useMemo(() => {
        const groups: Record<string, ScreenshotEntry[]> = {}
        for (const item of filtered) {
            if (!groups[item.category]) groups[item.category] = []
            groups[item.category].push(item)
        }
        return groups
    }, [filtered])

    const formatScreenName = (name: string): string => {
        return name
            .split('-')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')
    }

    return (
        <Card>
            <h3 className="text-xl font-bold font-display text-primary-400 mb-2">
                {t('helpView.screenshots.title')}
            </h3>
            <p className="text-sm text-slate-400 mb-4">{t('helpView.screenshots.subtitle')}</p>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
                <button
                    type="button"
                    onClick={() => setActiveCategory('all')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all duration-200 ${
                        activeCategory === 'all'
                            ? 'bg-primary-600 text-white ring-1 ring-primary-400'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 ring-1 ring-inset ring-slate-700/50'
                    }`}
                >
                    <PhosphorIcons.GridFour className="w-3.5 h-3.5" />
                    {t('helpView.screenshots.allCategories')}
                </button>
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveCategory(cat.id)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all duration-200 ${
                            activeCategory === cat.id
                                ? 'bg-primary-600 text-white ring-1 ring-primary-400'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 ring-1 ring-inset ring-slate-700/50'
                        }`}
                    >
                        {getCategoryIcon(cat.id)}
                        {t(`helpView.screenshots.categories.${cat.id}`)}
                    </button>
                ))}
            </div>

            {/* Viewport toggle */}
            <div className="flex gap-2 mb-6">
                {(['all', 'desktop', 'mobile'] as const).map((vp) => (
                    <button
                        key={vp}
                        type="button"
                        onClick={() => setViewportFilter(vp)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                            viewportFilter === vp
                                ? 'bg-primary-600/80 text-white'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                    >
                        {vp === 'desktop' && <PhosphorIcons.Globe className="w-3.5 h-3.5" />}
                        {vp === 'mobile' && <PhosphorIcons.Lightning className="w-3.5 h-3.5" />}
                        {vp === 'all' && <PhosphorIcons.GridFour className="w-3.5 h-3.5" />}
                        {t(`helpView.screenshots.viewport.${vp}`)}
                    </button>
                ))}
            </div>

            {/* Count */}
            <p className="text-xs text-slate-500 mb-4">
                {t('helpView.screenshots.resultCount', {
                    count: filtered.length,
                    total: SCREENSHOTS.length,
                })}
            </p>

            {/* Gallery */}
            {Object.entries(grouped).map(([catId, items]) => (
                <section key={catId} className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-primary-400">{getCategoryIcon(catId)}</span>
                        <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                            {t(`helpView.screenshots.categories.${catId}`)}
                        </h4>
                        <span className="text-xs tabular-nums text-slate-500 bg-slate-800 rounded-full px-2 py-0.5">
                            {items.length}
                        </span>
                        <div className="h-px flex-1 bg-slate-700/60" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setLightboxImg(item.path)}
                                className={`group relative bg-slate-900 rounded-xl overflow-hidden ring-1 ring-inset ${CATEGORY_COLORS[item.category] ?? 'ring-slate-700/50'} hover:ring-primary-500/50 transition-all duration-200 text-left`}
                            >
                                <div className="aspect-video bg-slate-800 overflow-hidden">
                                    <img
                                        src={`${import.meta.env.BASE_URL}${item.path}`}
                                        alt={`${formatScreenName(item.name)} (${item.viewport})`}
                                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                                        loading="lazy"
                                    />
                                </div>
                                <div className="p-3 flex items-center justify-between">
                                    <span className="text-sm font-medium text-slate-200">
                                        {formatScreenName(item.name)}
                                    </span>
                                    <span
                                        className={`text-xs px-2 py-0.5 rounded-full ${
                                            item.viewport === 'desktop'
                                                ? 'bg-sky-500/10 text-sky-400'
                                                : 'bg-purple-500/10 text-purple-400'
                                        }`}
                                    >
                                        {item.viewport === 'desktop' ? 'Desktop' : 'Mobile'}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>
            ))}

            {filtered.length === 0 && (
                <div className="text-center py-10 text-slate-500 space-y-2">
                    <PhosphorIcons.Camera className="w-10 h-10 mx-auto text-slate-600" />
                    <p>{t('helpView.screenshots.noResults')}</p>
                </div>
            )}

            {/* Lightbox */}
            {lightboxImg && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setLightboxImg(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-label={t('helpView.screenshots.lightboxLabel')}
                >
                    <button
                        type="button"
                        onClick={() => setLightboxImg(null)}
                        className="absolute top-4 right-4 text-white/70 hover:text-white z-10"
                        aria-label={t('common.close')}
                    >
                        <PhosphorIcons.X className="w-8 h-8" />
                    </button>
                    <img
                        src={`${import.meta.env.BASE_URL}${lightboxImg}`}
                        alt="Screenshot"
                        className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </Card>
    )
})
ScreenshotGallery.displayName = 'ScreenshotGallery'
