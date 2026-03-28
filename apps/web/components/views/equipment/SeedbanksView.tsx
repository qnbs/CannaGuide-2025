import React, { useState, useMemo, memo } from 'react'
import { Card } from '@/components/common/Card'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'

interface BankSection {
    title: string
    content?: string
    strains?: string[]
    points?: string[]
    conclusion?: string
    methods?: string[]
    phone?: string
    digital?: string
    address?: string
    email?: string
    payment?: { title: string; methods?: string[] }
    shipping?: { title: string; points?: string[] }
}

interface BankData {
    title?: string
    profile?: BankSection
    availability?: BankSection
    policies?: BankSection
    service?: BankSection
    offers?: BankSection
    assessment?: BankSection
}

type ConclusionsCategory = { title: string; content: string }

const Section = memo<{ title: string; icon?: React.ReactNode; children: React.ReactNode }>(
    ({ title, icon, children }) => (
        <div className="p-3 rounded-lg bg-slate-800/30 ring-1 ring-inset ring-white/5">
            <h5 className="font-bold text-primary-300 mb-2 flex items-center gap-2">
                {icon}
                {title}
            </h5>
            <div className="text-sm text-slate-300 space-y-2">{children}</div>
        </div>
    ),
)
Section.displayName = 'Section'

const stripNumericPrefix = (value: string): string => value.replace(/^\d+\.\s*/, '')
const leadingNumberPattern = /^\d+/

const SeedbankProfileComponent: React.FC<{
    bankKey: string
    displayIndex: number
    isOpen?: boolean
}> = ({ bankKey, displayIndex, isOpen }) => {
    const { t } = useTranslation()
    const bank = t(`equipmentView.seedbanks.${bankKey}`, { returnObjects: true }) as BankData

    if (!bank?.title) return null

    const strainCount = bank.availability?.strains?.length ?? 0
    const displayTitle = stripNumericPrefix(bank.title)

    return (
        <details className="group glass-pane rounded-lg overflow-hidden" open={isOpen}>
            <summary className="list-none flex justify-between items-center p-4 cursor-pointer hover:bg-slate-800/30 transition-colors">
                <h4 className="font-semibold text-slate-100 flex items-center gap-3 min-w-0">
                    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-primary-400/30 bg-primary-500/10 px-2 text-xs font-bold text-primary-300 flex-shrink-0">
                        {displayIndex}
                    </span>
                    <span className="truncate">{displayTitle}</span>
                </h4>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {strainCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 bg-emerald-500/10 rounded-full ring-1 ring-inset ring-emerald-400/20">
                            <PhosphorIcons.Leafy className="w-3 h-3" />
                            {strainCount}
                        </span>
                    )}
                    {bank.assessment?.content && (
                        <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-semibold text-amber-300 bg-amber-500/10 rounded-full ring-1 ring-inset ring-amber-400/20">
                            <PhosphorIcons.Star weight="fill" className="w-3 h-3 mr-1" />
                            Rated
                        </span>
                    )}
                    <PhosphorIcons.ChevronDown className="w-5 h-5 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
                </div>
            </summary>
            <div className="p-4 border-t border-slate-700/50 space-y-3">
                {bank.profile && (
                    <Section
                        title={bank.profile.title}
                        icon={<PhosphorIcons.Info className="w-4 h-4" />}
                    >
                        <p className="leading-relaxed">{bank.profile.content}</p>
                    </Section>
                )}

                {bank.availability && (
                    <Section
                        title={bank.availability.title}
                        icon={<PhosphorIcons.Leafy className="w-4 h-4" />}
                    >
                        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 list-none p-0 m-0">
                            {bank.availability.strains?.map((s: string) => (
                                <li
                                    key={s}
                                    className="flex items-center gap-2 text-xs bg-slate-700/30 rounded-md px-2 py-1"
                                >
                                    <PhosphorIcons.Leafy className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
                                    <span className="truncate">{s}</span>
                                </li>
                            ))}
                        </ul>
                    </Section>
                )}

                {bank.policies && (
                    <Section
                        title={bank.policies.title}
                        icon={<PhosphorIcons.ShieldCheck className="w-4 h-4" />}
                    >
                        <div className="space-y-3">
                            {bank.policies.payment && (
                                <div>
                                    <h6 className="font-semibold text-slate-200 text-xs uppercase tracking-wide mb-1">
                                        {bank.policies.payment.title}
                                    </h6>
                                    <ul className="list-disc pl-5 space-y-0.5">
                                        {bank.policies.payment.methods?.map((m: string) => (
                                            <li key={m}>{m}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {bank.policies.shipping && (
                                <div>
                                    <h6 className="font-semibold text-slate-200 text-xs uppercase tracking-wide mb-1">
                                        {bank.policies.shipping.title}
                                    </h6>
                                    <ul className="list-disc pl-5 space-y-0.5">
                                        {bank.policies.shipping.points?.map((p: string) => (
                                            <li key={p}>{p}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </Section>
                )}

                {bank.service && (
                    <Section
                        title={bank.service.title}
                        icon={<PhosphorIcons.Question className="w-4 h-4" />}
                    >
                        <ul className="list-none p-0 m-0 space-y-1.5">
                            {bank.service.phone && (
                                <li className="flex items-center gap-2">
                                    <PhosphorIcons.Microphone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                    {bank.service.phone}
                                </li>
                            )}
                            {bank.service.digital && (
                                <li className="flex items-center gap-2">
                                    <PhosphorIcons.Globe className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                    {bank.service.digital}
                                </li>
                            )}
                            {bank.service.address && (
                                <li className="flex items-center gap-2">
                                    <PhosphorIcons.Storefront className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                    {bank.service.address}
                                </li>
                            )}
                            {bank.service.email && (
                                <li className="flex items-center gap-2">
                                    <PhosphorIcons.PaperPlaneTilt className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                    {bank.service.email}
                                </li>
                            )}
                        </ul>
                    </Section>
                )}

                {bank.offers && (
                    <Section
                        title={bank.offers.title}
                        icon={<PhosphorIcons.Sparkle className="w-4 h-4" />}
                    >
                        <ul className="list-disc pl-5 space-y-0.5">
                            {bank.offers.points?.map((p: string) => (
                                <li key={p}>{p}</li>
                            ))}
                        </ul>
                        {bank.offers.conclusion && (
                            <p className="mt-2 italic text-slate-400">{bank.offers.conclusion}</p>
                        )}
                    </Section>
                )}

                {bank.assessment && (
                    <Section
                        title={bank.assessment.title}
                        icon={<PhosphorIcons.Star className="w-4 h-4" />}
                    >
                        <p className="leading-relaxed">{bank.assessment.content}</p>
                    </Section>
                )}
            </div>
        </details>
    )
}

const SeedbankProfile = memo(SeedbankProfileComponent)
SeedbankProfile.displayName = 'SeedbankProfile'

const SeedbanksView: React.FC = () => {
    const { t } = useTranslation()
    const [searchQuery, setSearchQuery] = useState('')

    const allBanksData = useMemo(
        () =>
            t('equipmentView.seedbanks', { returnObjects: true }) as Record<
                string,
                BankData & {
                    categories?: Record<string, ConclusionsCategory>
                    content?: string
                    summary?: string
                }
            >,
        [t],
    )

    const allBankKeys = useMemo(
        () =>
            Object.entries(allBanksData)
                .filter(([key, value]) => key !== 'conclusions' && typeof value === 'object')
                .toSorted(([, leftValue], [, rightValue]) => {
                    const leftTitle = (leftValue as BankData).title ?? ''
                    const rightTitle = (rightValue as BankData).title ?? ''
                    const leftNumber = Number(
                        leadingNumberPattern.exec(leftTitle)?.[0] ?? Number.POSITIVE_INFINITY,
                    )
                    const rightNumber = Number(
                        leadingNumberPattern.exec(rightTitle)?.[0] ?? Number.POSITIVE_INFINITY,
                    )
                    if (leftNumber !== rightNumber) return leftNumber - rightNumber
                    return leftTitle.localeCompare(rightTitle)
                })
                .map(([key]) => key),
        [allBanksData],
    )

    const filteredBankKeys = useMemo(() => {
        if (!searchQuery.trim()) return allBankKeys
        const q = searchQuery.toLowerCase()
        return allBankKeys.filter((key) => {
            const bank = allBanksData[key] as BankData
            if (!bank?.title) return false
            const title = stripNumericPrefix(bank.title).toLowerCase()
            if (title.includes(q)) return true
            if (bank.profile?.content?.toLowerCase().includes(q)) return true
            if (bank.availability?.strains?.some((s: string) => s.toLowerCase().includes(q)))
                return true
            return false
        })
    }, [allBankKeys, allBanksData, searchQuery])

    const conclusions = allBanksData.conclusions

    return (
        <div className="space-y-3 pb-[calc(7rem+env(safe-area-inset-bottom))] scroll-pb-[calc(7rem+env(safe-area-inset-bottom))] sm:pb-0 sm:scroll-pb-0">
            {/* Search bar */}
            <div className="relative">
                <PhosphorIcons.MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                    type="text"
                    placeholder={t('equipmentView.seedbanks.searchPlaceholder', {
                        defaultValue: 'Search seed banks...',
                    })}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-9 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-400/50"
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

            {/* Results count */}
            <p className="text-xs text-slate-500">
                {filteredBankKeys.length} / {allBankKeys.length}{' '}
                {t('equipmentView.seedbanks.banksLabel', { defaultValue: 'seed banks' })}
            </p>

            {/* Bank profiles */}
            {filteredBankKeys.length > 0 ? (
                filteredBankKeys.map((key, index) => (
                    <SeedbankProfile
                        key={key}
                        bankKey={key}
                        displayIndex={index + 1}
                        isOpen={!searchQuery && index === 0}
                    />
                ))
            ) : (
                <div className="text-center py-8">
                    <PhosphorIcons.Leafy className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">
                        {t('equipmentView.seedbanks.noResults', {
                            defaultValue: 'No seed banks match your search.',
                        })}
                    </p>
                </div>
            )}

            {/* Conclusions */}
            {conclusions && !searchQuery && (
                <Card>
                    <h3 className="text-xl font-bold font-display text-primary-400 mb-4 flex items-center gap-2">
                        <PhosphorIcons.Book className="w-5 h-5" />
                        {conclusions.title}
                    </h3>
                    <div className="space-y-4 text-sm text-slate-300">
                        <p className="leading-relaxed">{conclusions.content}</p>
                        {conclusions.categories &&
                            Object.values(conclusions.categories).map(
                                (cat: ConclusionsCategory) => (
                                    <div
                                        key={cat.title}
                                        className="p-3 bg-slate-800/50 rounded-lg ring-1 ring-inset ring-white/5"
                                    >
                                        <h4 className="font-bold text-slate-100 flex items-center gap-2">
                                            <PhosphorIcons.ChartLineUp className="w-4 h-4 text-primary-400" />
                                            {cat.title}
                                        </h4>
                                        <p className="mt-1 leading-relaxed">{cat.content}</p>
                                    </div>
                                ),
                            )}
                        <p className="leading-relaxed">{conclusions.summary}</p>
                    </div>
                </Card>
            )}
        </div>
    )
}

SeedbanksView.displayName = 'SeedbanksView'

export default SeedbanksView
