import React from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import type { VersionedSliceName } from '@/constants'

type DataManagementDialogsProps = {
    isClearArchivesConfirmOpen: boolean
    setIsClearArchivesConfirmOpen: (open: boolean) => void
    isExportConfirmOpen: boolean
    setIsExportConfirmOpen: (open: boolean) => void
    isImportConfirmOpen: boolean
    setIsImportConfirmOpen: (open: boolean) => void
    isResetConfirmOpen: boolean
    setIsResetConfirmOpen: (open: boolean) => void
    resetConfirmText: string
    setResetConfirmText: (text: string) => void
    resetPhrase: string
    isResetDisabled: boolean
    sliceToReset: VersionedSliceName | null
    setSliceToReset: (slice: VersionedSliceName | null) => void
    isEraseConfirmOpen: boolean
    setIsEraseConfirmOpen: (open: boolean) => void
    eraseConfirmText: string
    setEraseConfirmText: (text: string) => void
    erasePhrase: string
    isEraseDisabled: boolean
    isErasing: boolean
    onClearArchives: () => void
    onConfirmExportAll: () => void
    onConfirmImport: () => void
    onResetAll: () => void
    onConfirmSliceReset: () => void
    onEraseAll: () => void
}

export const DataManagementDialogs: React.FC<DataManagementDialogsProps> = ({
    isClearArchivesConfirmOpen,
    setIsClearArchivesConfirmOpen,
    isExportConfirmOpen,
    setIsExportConfirmOpen,
    isImportConfirmOpen,
    setIsImportConfirmOpen,
    isResetConfirmOpen,
    setIsResetConfirmOpen,
    resetConfirmText,
    setResetConfirmText,
    resetPhrase,
    isResetDisabled,
    sliceToReset,
    setSliceToReset,
    isEraseConfirmOpen,
    setIsEraseConfirmOpen,
    eraseConfirmText,
    setEraseConfirmText,
    erasePhrase,
    isEraseDisabled,
    isErasing,
    onClearArchives,
    onConfirmExportAll,
    onConfirmImport,
    onResetAll,
    onConfirmSliceReset,
    onEraseAll,
}) => {
    const { t } = useTranslation()

    return (
        <>
            <ConfirmDialog
                open={isClearArchivesConfirmOpen}
                onOpenChange={setIsClearArchivesConfirmOpen}
                title={t('settingsView.data.clearArchives')}
                description={t('settingsView.data.clearArchivesConfirm')}
                confirmLabel={t('common.delete')}
                cancelLabel={t('common.cancel')}
                onConfirm={onClearArchives}
            />
            <ConfirmDialog
                open={isExportConfirmOpen}
                onOpenChange={setIsExportConfirmOpen}
                title={t('common.confirm')}
                description={t('common.exportConfirm')}
                confirmLabel={t('settingsView.data.exportAll')}
                cancelLabel={t('common.cancel')}
                confirmVariant="secondary"
                onConfirm={onConfirmExportAll}
            />

            <Dialog open={isImportConfirmOpen} onOpenChange={setIsImportConfirmOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {String(t('settingsView.data.importConfirmTitle'))}
                        </DialogTitle>
                        <DialogDescription>
                            {t('settingsView.data.importConfirmText')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-2">
                        <Button variant="secondary" onClick={() => setIsImportConfirmOpen(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button variant="destructive" onClick={onConfirmImport}>
                            {t('settingsView.data.importConfirmButton')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{String(t('settingsView.data.resetAll'))}</DialogTitle>
                        <DialogDescription>
                            {t('settingsView.data.resetAllConfirm')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-4 bg-red-900/20 rounded-lg border border-red-500/30 space-y-3">
                        <h4 className="font-bold text-red-300">
                            {t('settingsView.data.resetAll')}
                        </h4>
                        <p className="text-sm text-slate-300">
                            {t('settingsView.data.resetAllConfirmInput', { phrase: resetPhrase })}
                        </p>
                        <Input
                            type="text"
                            value={resetConfirmText}
                            onChange={(e) => setResetConfirmText(e.target.value)}
                            placeholder={resetPhrase}
                            autoFocus
                        />
                        <Button
                            variant="destructive"
                            onClick={onResetAll}
                            disabled={isResetDisabled}
                            className="w-full justify-center"
                        >
                            {t('settingsView.data.resetAll')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!sliceToReset}
                onOpenChange={(open) => {
                    if (!open) setSliceToReset(null)
                }}
            >
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {t('settingsView.data.sliceReset.confirmTitle', {
                                slice: sliceToReset
                                    ? t(`settingsView.data.sliceReset.slices.${sliceToReset}`)
                                    : '',
                            })}
                        </DialogTitle>
                        <DialogDescription>
                            {t('settingsView.data.sliceReset.confirmText', {
                                slice: sliceToReset
                                    ? t(`settingsView.data.sliceReset.slices.${sliceToReset}`)
                                    : '',
                            })}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-2">
                        <Button variant="secondary" onClick={() => setSliceToReset(null)}>
                            {t('common.cancel')}
                        </Button>
                        <Button variant="destructive" onClick={onConfirmSliceReset}>
                            {t('settingsView.data.sliceReset.confirmButton')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isEraseConfirmOpen} onOpenChange={setIsEraseConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {t('settingsView.data.gdprErase', 'Erase All Data')}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'settingsView.data.gdprEraseWarning',
                                'This will permanently delete ALL databases, local storage, caches, and service workers. Type DELETE ALL to confirm.',
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        value={eraseConfirmText}
                        onChange={(e) => setEraseConfirmText(e.target.value)}
                        placeholder={erasePhrase}
                        className="font-mono"
                    />
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsEraseConfirmOpen(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={isEraseDisabled || isErasing}
                            onClick={onEraseAll}
                        >
                            {isErasing
                                ? t('common.loading')
                                : t('settingsView.data.gdprErase', 'Erase All Data')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
