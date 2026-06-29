import React from 'react'
import { useTranslation } from 'react-i18next'
import type { VersionedSliceName } from '@/constants'
import { Card } from '@/components/common/Card'
import { FormSection } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'

const RESETTABLE_SLICES = [
    'simulation',
    'genealogy',
    'sandbox',
    'favorites',
    'notes',
    'archives',
    'savedItems',
    'knowledge',
    'breeding',
    'userStrains',
] as const satisfies readonly VersionedSliceName[]

type SliceResetPanelProps = {
    onSelectSlice: (slice: VersionedSliceName) => void
}

export const SliceResetPanel: React.FC<SliceResetPanelProps> = ({ onSelectSlice }) => {
    const { t } = useTranslation()

    return (
        <Card>
            <FormSection
                title={t('settingsView.data.sliceReset.title')}
                icon={<PhosphorIcons.ArrowClockwise />}
            >
                <div className="sm:col-span-2">
                    <p className="text-sm text-slate-400 mb-4">
                        {t('settingsView.data.sliceReset.desc')}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {RESETTABLE_SLICES.map((slice) => (
                            <Button
                                key={slice}
                                variant="secondary"
                                size="sm"
                                className="justify-center text-xs"
                                onClick={() => onSelectSlice(slice)}
                            >
                                {t(`settingsView.data.sliceReset.slices.${slice}`)}
                            </Button>
                        ))}
                    </div>
                </div>
            </FormSection>
        </Card>
    )
}
