// ---------------------------------------------------------------------------
// GrowBibleExportButton -- Export "Grow Bible" as Markdown
//
// A button component that triggers the Grow Bible export using current
// plant data from Redux state. Renders in settings or plant views.
// ---------------------------------------------------------------------------

import React, { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/stores/store'
import { selectAllPlants, selectSettings } from '@/stores/selectors'
import { growBibleExporter } from '@/services/growBibleExportService'
import { cn } from '@/lib/utils'

interface GrowBibleExportButtonProps {
    /** Additional CSS classes */
    readonly className?: string
}

export const GrowBibleExportButton: React.FC<GrowBibleExportButtonProps> = memo(({ className }) => {
    const { t } = useTranslation()
    const plants = useAppSelector(selectAllPlants)
    const settings = useAppSelector(selectSettings)
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = useCallback(() => {
        if (isExporting || plants.length === 0) return

        setIsExporting(true)
        try {
            growBibleExporter.download(plants, settings, {
                includeJournal: true,
                includeEnvironment: true,
                includeAnalytics: true,
                includeKnowledge: true,
                maxJournalEntries: 50,
                language: settings.general?.language ?? 'en',
            })
        } finally {
            setIsExporting(false)
        }
    }, [isExporting, plants, settings])

    return (
        <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || plants.length === 0}
            className={cn(
                'inline-flex items-center gap-2 rounded-lg px-4 py-2',
                'bg-primary-600 text-white transition-colors',
                'hover:bg-primary-700 active:bg-primary-800',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                'text-sm font-medium',
                className,
            )}
        >
            {isExporting
                ? t('common.exporting', 'Exporting...')
                : t('common.exportGrowBible', 'Export Grow Bible')}
        </button>
    )
})

GrowBibleExportButton.displayName = 'GrowBibleExportButton'
