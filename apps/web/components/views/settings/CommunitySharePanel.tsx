import React, { memo, useState } from 'react'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { selectUserStrains } from '@/stores/selectors'
import { COMMUNITY_SHARE_DISABLED } from '@/constants'
import { communityShareService } from '@/services/communityShareService'
import { addUserStrain } from '@/stores/slices/userStrainsSlice'
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
        if (COMMUNITY_SHARE_DISABLED) return
        setIsBusy(true)
        try {
            const gist = await communityShareService.exportStrainsToAnonymousGist(userStrains)
            setLastGistUrl(gist.url)
            getUISnapshot().addNotification({
                message: t('settingsView.communityShare.exportSuccess'),
                type: 'success',
            })
        } catch (error) {
            getUISnapshot().addNotification({
                message:
                    error instanceof Error
                        ? error.message
                        : t('settingsView.communityShare.exportError'),
                type: 'error',
            })
        } finally {
            setIsBusy(false)
        }
    }

    const handleImport = async () => {
        if (COMMUNITY_SHARE_DISABLED || !gistInput.trim()) return
        setIsBusy(true)
        try {
            const imported = await communityShareService.importStrainsFromGist(gistInput.trim())
            // Pre-filter duplicates so no per-strain listener toast fires;
            // dispatch raw addUserStrain to skip the validation thunk.
            const existingNames = new Set(userStrains.map((s) => s.name.toLowerCase()))
            const newStrains = imported.filter((s) => !existingNames.has(s.name.toLowerCase()))
            newStrains.forEach((strain) => dispatch(addUserStrain(strain)))
            getUISnapshot().addNotification({
                message: t('settingsView.communityShare.importSuccess_other', {
                    count: newStrains.length,
                }),
                type: 'success',
            })
            setGistInput('')
        } catch (error) {
            getUISnapshot().addNotification({
                message:
                    error instanceof Error
                        ? error.message
                        : t('settingsView.communityShare.importError'),
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
            <p
                data-testid={
                    COMMUNITY_SHARE_DISABLED ? 'community-share-unavailable-description' : undefined
                }
                className="text-sm text-slate-300 mb-3"
            >
                {COMMUNITY_SHARE_DISABLED
                    ? t('settingsView.communityShare.unavailableDescription')
                    : t('settingsView.communityShare.description')}
            </p>
            {COMMUNITY_SHARE_DISABLED && (
                <div
                    data-testid="community-share-unavailable-banner"
                    className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-900/10 p-3 text-sm text-amber-300 mb-3"
                >
                    <PhosphorIcons.Warning className="h-4 w-4 shrink-0" />
                    {t('settingsView.communityShare.temporarilyUnavailable')}
                </div>
            )}
            <div className="space-y-3">
                <Button
                    onClick={handleExport}
                    disabled={COMMUNITY_SHARE_DISABLED || isBusy || userStrains.length === 0}
                    className="w-full"
                >
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
                    disabled={COMMUNITY_SHARE_DISABLED}
                />
                <Button
                    onClick={handleImport}
                    variant="secondary"
                    disabled={COMMUNITY_SHARE_DISABLED || isBusy || !gistInput.trim()}
                    className="w-full"
                >
                    <PhosphorIcons.DownloadSimple className="w-5 h-5 mr-2" />
                    {t('settingsView.communityShare.importButton')}
                </Button>
            </div>
        </Card>
    )
}

export const CommunitySharePanel = memo(CommunitySharePanelComponent)
