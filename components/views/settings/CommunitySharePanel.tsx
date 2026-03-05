import React, { memo, useState } from 'react'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { selectUserStrains } from '@/stores/selectors'
import { communityShareService } from '@/services/communityShareService'
import { addUserStrainWithValidation } from '@/stores/slices/userStrainsSlice'
import { addNotification } from '@/stores/slices/uiSlice'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'

const CommunitySharePanelComponent: React.FC = () => {
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
            dispatch(addNotification({ message: 'Anonymous Gist created.', type: 'success' }))
        } catch (error) {
            dispatch(
                addNotification({
                    message: error instanceof Error ? error.message : 'Gist export failed.',
                    type: 'error',
                }),
            )
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
            dispatch(addNotification({ message: `${imported.length} strains imported.`, type: 'success' }))
            setGistInput('')
        } catch (error) {
            dispatch(
                addNotification({
                    message: error instanceof Error ? error.message : 'Gist import failed.',
                    type: 'error',
                }),
            )
        } finally {
            setIsBusy(false)
        }
    }

    return (
        <Card>
            <h3 className="text-xl font-bold font-display text-primary-400 mb-3 flex items-center gap-2">
                <PhosphorIcons.ShareNetwork /> Community Strain Shares
            </h3>
            <p className="text-sm text-slate-300 mb-3">
                Anonymous sharing via GitHub Gist (lightweight alternative to IPFS).
            </p>
            <div className="space-y-3">
                <Button onClick={handleExport} disabled={isBusy || userStrains.length === 0} className="w-full">
                    <PhosphorIcons.UploadSimple className="w-5 h-5 mr-2" />
                    Export User Strains to Anonymous Gist
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
                    placeholder="Paste Gist URL or ID"
                />
                <Button onClick={handleImport} variant="secondary" disabled={isBusy || !gistInput.trim()} className="w-full">
                    <PhosphorIcons.DownloadSimple className="w-5 h-5 mr-2" />
                    Import Strains from Gist
                </Button>
            </div>
        </Card>
    )
}

export const CommunitySharePanel = memo(CommunitySharePanelComponent)
