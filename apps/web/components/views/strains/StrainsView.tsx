import React, { useMemo, useEffect, useRef } from 'react'
import { StrainViewTab } from '@/types'
import { setSelectedGenealogyStrain } from '@/stores/slices/genealogySlice'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { StrainSubNav } from './StrainSubNav'
import { StrainDetailView } from './StrainDetailView'
import { StrainsViewContent } from './StrainsViewContent'
import { StrainsViewModals } from './StrainsViewModals'
import { useStrainsViewController } from '@/hooks/useStrainsViewController'

export const StrainsView: React.FC = () => {
    const controller = useStrainsViewController()
    const {
        t,
        dispatch,
        strainsViewState,
        strainsViewTab,
        selectedStrainForDetail,
        viewTitles,
        savedTips,
        savedExportsCount,
        filteredStrainsLength,
        searchTermForA11y,
    } = controller

    const liveRegionRef = useRef<HTMLDivElement>(null)
    const isInitialMount = useRef(true)
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false
            return
        }
        const timer = setTimeout(() => {
            if (liveRegionRef.current) {
                liveRegionRef.current.textContent = searchTermForA11y
                    ? t('common.accessibility.searchResultsCount', {
                          count: filteredStrainsLength,
                      })
                    : t('common.accessibility.filterResultsCount', {
                          count: filteredStrainsLength,
                      })
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [filteredStrainsLength, searchTermForA11y, t])

    const viewIcons = useMemo(
        () => ({
            [StrainViewTab.All]: (
                <PhosphorIcons.Leafy className="w-16 h-16 mx-auto text-green-400" />
            ),
            [StrainViewTab.MyStrains]: (
                <PhosphorIcons.Star className="w-16 h-16 mx-auto text-amber-400" />
            ),
            [StrainViewTab.Favorites]: (
                <PhosphorIcons.Heart weight="fill" className="w-16 h-16 mx-auto text-red-400" />
            ),
            [StrainViewTab.DailyStrains]: (
                <PhosphorIcons.BellSimple className="w-16 h-16 mx-auto text-cyan-400" />
            ),
            [StrainViewTab.Comparison]: (
                <PhosphorIcons.Columns className="w-16 h-16 mx-auto text-teal-400" />
            ),
            [StrainViewTab.Genealogy]: (
                <PhosphorIcons.TreeStructure className="w-16 h-16 mx-auto text-purple-400" />
            ),
            [StrainViewTab.BreedingLab]: (
                <PhosphorIcons.Flask className="w-16 h-16 mx-auto text-teal-400" />
            ),
            [StrainViewTab.Exports]: (
                <PhosphorIcons.FileText className="w-16 h-16 mx-auto text-blue-400" />
            ),
            [StrainViewTab.Tips]: (
                <PhosphorIcons.LightbulbFilament className="w-16 h-16 mx-auto text-yellow-400" />
            ),
            [StrainViewTab.Trends]: (
                <PhosphorIcons.Sparkle className="w-16 h-16 mx-auto text-pink-400" />
            ),
            [StrainViewTab.SeedVault]: (
                <PhosphorIcons.ArchiveBox className="w-16 h-16 mx-auto text-amber-500" />
            ),
        }),
        [],
    )

    if (selectedStrainForDetail) {
        return (
            <div className="animate-fade-in">
                <StrainDetailView
                    strain={selectedStrainForDetail}
                    onBack={() => strainsViewState.setSelectedStrainId(null)}
                    onNavigateToGenealogy={(strainId) => {
                        strainsViewState.setSelectedStrainId(null)
                        dispatch(setSelectedGenealogyStrain(strainId))
                        queueMicrotask(() => {
                            strainsViewState.setStrainsViewTab(StrainViewTab.Genealogy)
                        })
                    }}
                />
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div
                ref={liveRegionRef}
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
            />
            <div className="text-center mb-6">
                {viewIcons[strainsViewTab]}
                <h2 className="text-3xl font-bold font-display text-slate-100 mt-2">
                    {viewTitles[strainsViewTab]}
                </h2>
            </div>

            <StrainSubNav
                activeTab={strainsViewTab}
                onTabChange={(id) => strainsViewState.setStrainsViewTab(id)}
                counts={{ tips: savedTips.length, exports: savedExportsCount }}
            />

            <StrainsViewModals {...controller} />
            <StrainsViewContent {...controller} />
        </div>
    )
}
