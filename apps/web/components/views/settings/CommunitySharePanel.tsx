import React, { memo, useState } from 'react'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { selectUserStrains } from '@/stores/selectors'
import { communityShareService } from '@/services/communityShareService'
import { addUserStrainWithValidation } from '@/stores/slices/userStrainsSlice'
import { getUISnapshot } from '@/stores/useUIStore'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { useTranslation } from 'react-i18next'

const CommunitySharePanelComponent: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const userStrains = useAppSelector(selectUserStrains)
    const [gistInput, setGistInput] = useState('')
    const [lastGistUrl, setLastGistUrl] = useState('')
    const [isBusy, setIsBusy] = useState(false)

    const handleExport = async () => {
        setIsBusy(true)
        try {
            const gist = await communityShareService.exportStrainsToAnonymousGist(userStrains)
            setLastGistUrl(gist.url)
            getUISnapshot().addNotification({ message: t('settingsView.communityShare.exportSuccess'), type: 'success' })
        } catch (error) {
            getUISnapshot().addNotification({
                    message: error instanceof Error ? error.message : t('settingsView.communityShare.exportError'),
                    type: 'error',
                })
        } finally {
            setIsBusy(false)
        }
    }

    const handleImport = async () => {
        if (!gistInput.trim()) return
        setIsBusy(true)
        try {
            const imported = await communityShareService.importStrainsFromGist(gistInput.trim())
            imported.forEach((strain) => {
                dispatch(addUserStrainWithValidation(strain))
            })
            getUISnapshot().addNotification({ message: t('settingsView.communityShare.importSuccess_other', { count: imported.length }), type: 'success' })
            setGistInput('')
        } catch (error) {
            getUISnapshot().addNotification({
                    message: error instanceof Error ? error.message : t('settingsView.communityShare.importError'),
                    type: 'error',
                })
        } finally {
            setIsBusy(false)
        }
    }

    return (
        <Card>
            <h3 className="text-xl font-bold font-display text-primary-400 mb-3 flex items-center gap-2">
                <PhosphorIcons.ShareNetwork /> {t('settingsView.communityShare.title')}
            </h3>
            <p className="text-sm text-slate-300 mb-3">
                {t('settingsView.communityShare.description')}
            </p>
            <div className="space-y-3">
                <Button onClick={handleExport} disabled={isBusy || userStrains.length === 0} className="w-full">
                    <PhosphorIcons.UploadSimple className="w-5 h-5 mr-2" />
                    {t('settingsView.communityShare.exportButton')}
                </Button>
                {lastGistUrl && (
                    <a
                        href={lastGistUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-primary-300 underline break-all"
                    >
                        {lastGistUrl}
                    </a>
                )}
                <Input
                    value={gistInput}
                    onChange={(e) => setGistInput(e.target.value)}
                    placeholder={t('settingsView.communityShare.gistPlaceholder')}
                />
                <Button onClick={handleImport} variant="secondary" disabled={isBusy || !gistInput.trim()} className="w-full">
                    <PhosphorIcons.DownloadSimple className="w-5 h-5 mr-2" />
                    {t('settingsView.communityShare.importButton')}
                </Button>
            </div>
        </Card>
    )
}

export const CommunitySharePanel = memo(CommunitySharePanelComponent)
