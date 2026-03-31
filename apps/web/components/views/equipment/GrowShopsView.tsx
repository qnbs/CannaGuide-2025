import React, { useState, useMemo, memo, useCallback } from 'react'
import { Card } from '@/components/common/Card'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { Button } from '@/components/common/Button'
import { PaymentIcons } from '@/components/icons/PaymentIcons'
import { Modal } from '@/components/common/Modal'

type ShopRegion = 'europe' | 'us'
type SortMode = 'rating' | 'name'
type TranslateFn = ReturnType<typeof useTranslation>['t']

interface Shop {
    name: string
    location: string
    rating: number
    description: string
    strengths: string[]
    shipping: string
    paymentMethods: string[]
    url: string
    key?: string
}

const getRatingTier = (rating: number): { label: string; color: string } => {
    if (rating >= 4.7)
        return { label: 'Top Pick', color: 'text-amber-300 bg-amber-500/15 ring-amber-400/30' }
    if (rating >= 4.4)
        return {
            label: 'Recommended',
            color: 'text-emerald-300 bg-emerald-500/15 ring-emerald-400/30',
        }
    return { label: 'Good', color: 'text-slate-300 bg-slate-500/15 ring-slate-400/30' }
}

const ShopDetailModalComponent: React.FC<{ shop: Shop; t: TranslateFn; onClose: () => void }> = ({
    shop,
    t,
    onClose,
}) => {
    const tier = getRatingTier(shop.rating)

    return (
        <Modal isOpen={true} onClose={onClose} title={shop.name} size="lg">
            <div className="flex flex-col h-full">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="flex items-center gap-1.5 text-sm text-slate-400">
                        <PhosphorIcons.Globe className="w-4 h-4" />
                        {shop.location}
                    </div>
                    <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ring-1 ring-inset ${tier.color}`}
                    >
                        {tier.label}
                    </span>
                </div>

                {/* Rating bar */}
                <div className="flex items-center gap-3 mb-5 p-3 rounded-lg bg-slate-800/50">
                    <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((starNumber) => (
                            <PhosphorIcons.Star
                                key={`rating-star-${starNumber}`}
                                weight={starNumber <= Math.round(shop.rating) ? 'fill' : 'regular'}
                                className={`w-5 h-5 ${starNumber <= Math.round(shop.rating) ? 'text-amber-400' : 'text-slate-600'}`}
                            />
                        ))}
                    </div>
                    <span className="text-lg font-bold text-amber-300">
                        {shop.rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-500">/5.0</span>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 space-y-5">
                    <p className="text-slate-300 text-sm leading-relaxed">{shop.description}</p>

                    <div className="p-3 rounded-lg bg-slate-800/30 ring-1 ring-inset ring-white/5">
                        <h4 className="font-semibold text-primary-400 mb-2 flex items-center gap-2">
                            <PhosphorIcons.Lightning className="w-4 h-4" />
                            {t('equipmentView.growShops.strengths')}
                        </h4>
                        <ul className="space-y-1.5 text-sm text-slate-300">
                            {shop.strengths.map((s: string) => (
                                <li key={s} className="flex items-start gap-2">
                                    <PhosphorIcons.CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-slate-800/30 ring-1 ring-inset ring-white/5">
                            <h4 className="font-semibold text-primary-400 mb-2 flex items-center gap-2">
                                <PhosphorIcons.ArrowSquareOut className="w-4 h-4" />
                                {t('equipmentView.growShops.shipping')}
                            </h4>
                            <p className="text-sm text-slate-300">{shop.shipping}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-800/30 ring-1 ring-inset ring-white/5">
                            <h4 className="font-semibold text-primary-400 mb-2 flex items-center gap-2">
                                <PhosphorIcons.ShieldCheck className="w-4 h-4" />
                                {t('equipmentView.growShops.paymentMethods')}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2">
                                {shop.paymentMethods.map((pm: string) => {
                                    const Icon = PaymentIcons[pm as keyof typeof PaymentIcons]
                                    return Icon ? (
                                        <div
                                            key={pm}
                                            className="flex items-center gap-1.5 rounded-md bg-slate-700/50 px-2 py-1"
                                        >
                                            <Icon className="w-5 h-5 text-slate-300" />
                                            <span className="text-[10px] text-slate-400 capitalize">
                                                {pm.replaceAll('_', ' ')}
                                            </span>
                                        </div>
                                    ) : null
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex-shrink-0">
                    <Button
                        as="a"
                        href={shop.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full text-center"
                    >
                        {t('equipmentView.growShops.visitShop', { shopName: shop.name })}{' '}
                        <PhosphorIcons.ArrowSquareOut className="inline w-4 h-4 ml-1.5" />
                    </Button>
                </div>
            </div>
        </Modal>
    )
}

const ShopDetailModal = memo(ShopDetailModalComponent)
ShopDetailModal.displayName = 'ShopDetailModal'

const ShopCard: React.FC<{ shop: Shop; onSelect: () => void }> = memo(({ shop, onSelect }) => {
    const tier = getRatingTier(shop.rating)

    return (
        <Card
            onClick={onSelect}
            className="p-3 cursor-pointer group hover:ring-1 hover:ring-primary-400/30 transition-all duration-200"
        >
            <div className="flex justify-between items-start gap-3">
                <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-slate-100 truncate">{shop.name}</h4>
                        <span
                            className={`inline-flex items-center flex-shrink-0 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full ring-1 ring-inset ${tier.color}`}
                        >
                            {tier.label}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                        <PhosphorIcons.Globe className="w-3.5 h-3.5" />
                        {shop.location}
                    </div>
                    {/* Strength preview — first 2 items */}
                    <div className="flex flex-wrap gap-1.5">
                        {shop.strengths.slice(0, 2).map((s: string) => (
                            <span
                                key={`preview-${s}`}
                                className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-full"
                            >
                                <PhosphorIcons.CheckCircle className="w-3 h-3 text-emerald-500/60" />
                                <span className="truncate max-w-[120px]">{s}</span>
                            </span>
                        ))}
                        {shop.strengths.length > 2 && (
                            <span className="text-[10px] text-slate-500 px-1.5 py-0.5">
                                +{shop.strengths.length - 2}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="flex items-center gap-0.5">
                        <PhosphorIcons.Star weight="fill" className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-bold text-amber-300">
                            {shop.rating.toFixed(1)}
                        </span>
                    </div>
                    {/* Payment icons preview */}
                    <div className="flex items-center gap-0.5">
                        {shop.paymentMethods.slice(0, 3).map((pm: string) => {
                            const Icon = PaymentIcons[pm as keyof typeof PaymentIcons]
                            return Icon ? (
                                <Icon key={pm} className="w-4 h-4 text-slate-500" />
                            ) : null
                        })}
                    </div>
                </div>
            </div>
        </Card>
    )
})
ShopCard.displayName = 'ShopCard'

export const GrowShopsView: React.FC = () => {
    const { t } = useTranslation()
    const [region, setRegion] = useState<ShopRegion>('europe')
    const [selectedShopKey, setSelectedShopKey] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [sortMode, setSortMode] = useState<SortMode>('rating')

    const allShops = useMemo(
        () => t('equipmentView.growShops.shops', { returnObjects: true }) as Record<string, Shop>,
        [t],
    )

    const filteredAndSortedShops = useMemo(() => {
        const regionKey = region === 'europe' ? 'european' : 'us'
        const shopKeys = t(`equipmentView.growShops.${regionKey}.shopKeys`, {
            returnObjects: true,
        }) as string[]

        if (!Array.isArray(shopKeys)) return []

        let shops = shopKeys
            .map((key) => ({ ...allShops[key], key }))
            .filter((shop): shop is Shop & { key: string } => !!shop.name)

        // Search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            shops = shops.filter(
                (shop) =>
                    (shop.name ?? '').toLowerCase().includes(q) ||
                    (shop.location ?? '').toLowerCase().includes(q) ||
                    (shop.strengths ?? []).some((s: string) => s.toLowerCase().includes(q)),
            )
        }

        // Sort
        if (sortMode === 'rating') {
            shops = shops.toSorted((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        } else {
            shops = shops.toSorted((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
        }

        return shops
    }, [allShops, region, t, searchQuery, sortMode])

    const selectedShop = selectedShopKey ? allShops[selectedShopKey] : null

    const handleSelectShop = useCallback((key: string | undefined) => {
        if (key) setSelectedShopKey(key)
    }, [])

    const handleCloseModal = useCallback(() => setSelectedShopKey(null), [])
    const toggleSort = useCallback(
        () => setSortMode((prev) => (prev === 'rating' ? 'name' : 'rating')),
        [],
    )
    const getRegionTabClassName = (isActive: boolean): string =>
        `flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-sm font-semibold rounded-md transition-colors ${isActive ? 'bg-slate-700 text-primary-300 shadow-sm' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'}`

    return (
        <div className="pb-[calc(7rem+env(safe-area-inset-bottom))] scroll-pb-[calc(7rem+env(safe-area-inset-bottom))] sm:pb-0 sm:scroll-pb-0">
            {selectedShop && (
                <ShopDetailModal shop={selectedShop} t={t} onClose={handleCloseModal} />
            )}

            {/* Region toggle */}
            <div
                className="flex gap-1 bg-slate-800/50 rounded-lg p-1 mb-3"
                role="tablist"
                aria-label={t('equipmentView.growShops.region.europe')}
            >
                <button
                    type="button"
                    role="tab"
                    aria-selected={region === 'europe'}
                    onClick={() => setRegion('europe')}
                    className={getRegionTabClassName(region === 'europe')}
                >
                    <PhosphorIcons.Globe className="w-4 h-4" />
                    {t('equipmentView.growShops.region.europe')}
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={region === 'us'}
                    onClick={() => setRegion('us')}
                    className={getRegionTabClassName(region === 'us')}
                >
                    <PhosphorIcons.Globe className="w-4 h-4" />
                    {t('equipmentView.growShops.region.usa')}
                </button>
            </div>

            {/* Search & sort controls */}
            <div className="flex gap-2 mb-3">
                <div className="flex-grow relative">
                    <PhosphorIcons.MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder={t('equipmentView.growShops.searchPlaceholder', {
                            defaultValue: 'Search shops...',
                        })}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-400/50"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                            aria-label={t('common.clearSearch')}
                        >
                            <PhosphorIcons.X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <button
                    type="button"
                    onClick={toggleSort}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-700/50 transition-colors"
                    aria-label={t('equipmentView.growShops.sortBy', { defaultValue: 'Sort' })}
                >
                    <PhosphorIcons.FunnelSimple className="w-4 h-4" />
                    {sortMode === 'rating'
                        ? t('equipmentView.growShops.sortRating', { defaultValue: 'Rating' })
                        : t('equipmentView.growShops.sortName', { defaultValue: 'A–Z' })}
                </button>
            </div>

            {/* Results count */}
            <p className="text-xs text-slate-500 mb-2">
                {filteredAndSortedShops.length}{' '}
                {t('equipmentView.growShops.shopsFound', { defaultValue: 'shops' })}
            </p>

            {/* Shop cards */}
            <div className="space-y-3">
                {filteredAndSortedShops.length > 0 ? (
                    filteredAndSortedShops.map((shop) => (
                        <ShopCard
                            key={shop.key}
                            shop={shop}
                            onSelect={() => handleSelectShop(shop.key)}
                        />
                    ))
                ) : (
                    <div className="text-center py-8">
                        <PhosphorIcons.Storefront className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">
                            {t('equipmentView.growShops.noResults', {
                                defaultValue: 'No shops match your search.',
                            })}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

GrowShopsView.displayName = 'GrowShopsView'
