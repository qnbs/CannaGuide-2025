import React from 'react'
import { View } from '@/types'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { setActiveView } from '@/stores/slices/uiSlice'
import { selectActiveView } from '@/stores/selectors'

const navIcons: Record<string, React.ReactNode> = {
    [View.Strains]: <PhosphorIcons.Leafy />,
    [View.Plants]: <PhosphorIcons.Plant />,
    [View.Equipment]: <PhosphorIcons.Wrench />,
    [View.Knowledge]: <PhosphorIcons.BookOpenText />,
}

const mainNavViews: View[] = [View.Strains, View.Plants, View.Equipment, View.Knowledge]

export const BottomNav: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const activeView = useAppSelector(selectActiveView)

    const navLabels: Record<View, string> = {
        [View.Strains]: t('nav.strains'),
        [View.Plants]: t('nav.plants'),
        [View.Equipment]: t('nav.equipment'),
        [View.Knowledge]: t('nav.knowledge'),
        [View.Settings]: t('nav.settings'),
        [View.Help]: t('nav.help'),
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 sm:relative glass-pane border-t sm:border-t-0 flex-shrink-0 z-20 pb-[env(safe-area-inset-bottom)]">
            <div className="flex justify-around max-w-5xl mx-auto">
                {mainNavViews.map((view) => (
                    <button
                        key={view}
                        onClick={() => dispatch(setActiveView(view))}
                        className={`flex-1 flex flex-col items-center justify-center py-2 px-1 text-center transition-colors duration-200 ${
                            activeView === view
                                ? 'text-primary-400'
                                : 'text-slate-400 hover:text-primary-300'
                        }`}
                        aria-current={activeView === view ? 'page' : undefined}
                    >
                        <div className="w-6 h-6 mb-1">{navIcons[view]}</div>
                        <span className="text-xs">{navLabels[view]}</span>
                    </button>
                ))}
            </div>
        </nav>
    )
}
