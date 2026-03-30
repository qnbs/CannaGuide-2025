import React, { useState, useEffect } from 'react'
import type { Strain, SeedAvailability, Seedbank } from '@/types'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { getAvailabilityForStrain, getSeedbankById } from '@/services/seedbankService'

interface AvailabilityTabProps {
    strain: Strain
}

const SeedTypeBadge: React.FC<{ seedType: string }> = ({ seedType }) => {
    const { t } = useTranslation()
    const colorMap: Record<string, string> = {
        Feminized: 'bg-pink-600/30 text-pink-300 border-pink-500/40',
        Regular: 'bg-slate-600/30 text-slate-300 border-slate-500/40',
        Autoflowering: 'bg-amber-600/30 text-amber-300 border-amber-500/40',
    }
    const labelMap: Record<string, string> = {
        Feminized: t('strainsView.availability.seedType.feminized', { defaultValue: 'Feminized' }),
        Regular: t('strainsView.availability.seedType.regular', { defaultValue: 'Regular' }),
        Autoflowering: t('strainsView.availability.seedType.autoflowering', {
            defaultValue: 'Autoflowering',
        }),
    }
    const classes = colorMap[seedType] ?? colorMap['Regular']
    return (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${classes}`}>
            {labelMap[seedType] ?? seedType}
        </span>
    )
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
    const full = Math.floor(rating)
    const half = rating - full >= 0.5
    return (
        <span className="flex items-center gap-0.5 text-amber-400" title={`${rating}/5`}>
            {Array.from({ length: 5 }, (_, i) => (
                <PhosphorIcons.Star
                    key={`star-${i}`}
                    weight={i < full ? 'fill' : i === full && half ? 'fill' : 'regular'}
                    className="w-3.5 h-3.5"
                />
            ))}
            <span className="text-xs text-slate-400 ml-1">{rating.toFixed(1)}</span>
        </span>
    )
}

interface AvailabilityRowProps {
    item: SeedAvailability
    seedbank: Seedbank
}

const AvailabilityRow: React.FC<AvailabilityRowProps> = ({ item, seedbank }) => {
    const { t } = useTranslation()
    return (
        <Card className="bg-slate-800/60 border border-slate-700/50">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-100 truncate">
                            {seedbank.name}
                        </span>
                        <SeedTypeBadge seedType={item.seedType} />
                        {!item.inStock && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-red-600/20 text-red-300 border-red-500/40">
                                {t('strainsView.availability.outOfStock', {
                                    defaultValue: 'Out of stock',
                                })}
                            </span>
                        )}
                    </div>
                    <StarRating rating={seedbank.rating} />
                    <div className="text-xs text-slate-400">
                        {t('strainsView.availability.packSizes', { defaultValue: 'Packs' })}:{' '}
                        {item.packSizes.join(', ')}{' '}
                        {t('strainsView.availability.seeds', { defaultValue: 'seeds' })}
                    </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xl font-bold text-primary-300">
                        {item.pricePerSeed.toFixed(2)} {item.currency}
                    </span>
                    <a
                        href={seedbank.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        tabIndex={item.inStock ? 0 : -1}
                        aria-disabled={!item.inStock}
                    >
                        <Button size="sm" disabled={!item.inStock}>
                            <PhosphorIcons.Storefront className="w-4 h-4 mr-1" />
                            {t('strainsView.availability.visit', { defaultValue: 'Visit' })}
                        </Button>
                    </a>
                </div>
            </div>
        </Card>
    )
}

export const AvailabilityTab: React.FC<AvailabilityTabProps> = ({ strain }) => {
    const { t } = useTranslation()
    const [items, setItems] = useState<SeedAvailability[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        setIsLoading(true)
        setError(null)

        getAvailabilityForStrain(strain.id, strain.name)
            .then((data) => {
                if (!cancelled) {
                    setItems(data)
                    setIsLoading(false)
                }
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : t('common.errors.unknown', {
                                  defaultValue: 'An error occurred',
                              }),
                    )
                    setIsLoading(false)
                }
            })

        return () => {
            cancelled = true
        }
    }, [strain.id, strain.name, t])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12 text-slate-400">
                <PhosphorIcons.ArrowClockwise className="w-6 h-6 animate-spin mr-2" />
                {t('common.loading', { defaultValue: 'Loading...' })}
            </div>
        )
    }

    if (error) {
        return (
            <Card className="bg-red-900/20 border border-red-500/30">
                <p className="text-red-300 text-sm">{error}</p>
            </Card>
        )
    }

    if (items.length === 0) {
        return (
            <Card className="bg-slate-800/60">
                <p className="text-slate-400 text-sm text-center py-4">
                    {t('strainsView.availability.noResults', {
                        defaultValue: 'No availability data found for this strain.',
                    })}
                </p>
            </Card>
        )
    }

    // Sort: in-stock first, then by price
    const sorted = [...items].sort((a, b) => {
        if (a.inStock !== b.inStock) return a.inStock ? -1 : 1
        return a.pricePerSeed - b.pricePerSeed
    })

    return (
        <div className="space-y-3">
            <p className="text-xs text-slate-500">
                {t('strainsView.availability.disclaimer', {
                    defaultValue:
                        'Prices are indicative. Check the seedbank website for current pricing.',
                })}
            </p>
            {sorted.map((item) => {
                const sb = getSeedbankById(item.seedbankId)
                if (!sb) return null
                return <AvailabilityRow key={item.seedbankId} item={item} seedbank={sb} />
            })}
        </div>
    )
}

AvailabilityTab.displayName = 'AvailabilityTab'
