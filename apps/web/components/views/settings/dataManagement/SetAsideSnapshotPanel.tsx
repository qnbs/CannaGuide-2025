import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { FormSection } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { readQuarantinedSnapshot } from '@/services/snapshotQuarantine'
import { redactSnapshotTextForDownload } from '@/services/persistedSnapshotFormat'

type SetAsideSnapshotPanelProps = {
    /** Opens the import confirmation for the copy; nothing is replaced before it. */
    onRestore: (snapshot: string) => void
}

// The file leaves the device: no app PIN and no sync key in it (#872 review). Restore
// uses the copy as kept, so a restored device keeps its PIN lock.
const downloadCopy = (snapshot: string): void => {
    const url = URL.createObjectURL(
        new Blob([redactSnapshotTextForDownload(snapshot)], { type: 'application/json' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `cannaguide-set-aside-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
}

/**
 * Saved data that CannaGuide could not load is kept under the quarantine key instead
 * of being deleted (#666). Until now nothing showed it, so the user saw an empty app
 * and could not get the data back. Shown only while such a copy exists.
 */
export const SetAsideSnapshotPanel: React.FC<SetAsideSnapshotPanelProps> = ({ onRestore }) => {
    const { t } = useTranslation()
    const [snapshot, setSnapshot] = useState<string | null>(null)

    useEffect(() => {
        let active = true
        void readQuarantinedSnapshot().then((stored) => {
            if (active) setSnapshot(stored)
        })
        return () => {
            active = false
        }
    }, [])

    if (!snapshot) return null

    return (
        <Card>
            <FormSection
                title={t('settingsView.data.setAside.title')}
                icon={<PhosphorIcons.Warning />}
                defaultOpen
            >
                <div className="sm:col-span-2 space-y-4">
                    <p className="text-sm text-slate-300">
                        {t('settingsView.data.setAside.description')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                            onClick={() => downloadCopy(snapshot)}
                            className="flex-1 justify-center"
                        >
                            <PhosphorIcons.DownloadSimple className="mr-2" />
                            {t('settingsView.data.setAside.download')}
                        </Button>
                        <Button
                            onClick={() => onRestore(snapshot)}
                            variant="secondary"
                            className="flex-1 justify-center"
                        >
                            <PhosphorIcons.UploadSimple className="mr-2" />
                            {t('settingsView.data.setAside.restore')}
                        </Button>
                    </div>
                </div>
            </FormSection>
        </Card>
    )
}
