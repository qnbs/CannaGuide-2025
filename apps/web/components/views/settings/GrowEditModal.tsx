import React, { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from '@/stores/store'
import { updateGrow, removeGrow, archiveGrow } from '@/stores/slices/growsSlice'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GROW_COLORS } from '@/constants'
import { cn } from '@/lib/utils'
import type { Grow } from '@/types'

interface GrowEditModalProps {
    isOpen: boolean
    onClose: () => void
    grow: Grow
}

const GrowEditModal: React.FC<GrowEditModalProps> = memo(({ isOpen, onClose, grow }) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const [name, setName] = useState(grow.name)
    const [description, setDescription] = useState(grow.description ?? '')
    const [color, setColor] = useState<string>(grow.color ?? GROW_COLORS[0] ?? '#22c55e')
    const [confirmDelete, setConfirmDelete] = useState(false)

    const canSave = name.trim().length > 0

    const handleSave = useCallback(() => {
        if (!canSave) return
        dispatch(
            updateGrow({
                id: grow.id,
                changes: {
                    name: name.trim(),
                    description: description.trim() || undefined,
                    color,
                },
            }),
        )
        onClose()
    }, [canSave, name, description, color, grow.id, dispatch, onClose])

    const handleArchive = useCallback(() => {
        dispatch(archiveGrow(grow.id))
        onClose()
    }, [grow.id, dispatch, onClose])

    const handleDelete = useCallback(() => {
        if (!confirmDelete) {
            setConfirmDelete(true)
            return
        }
        dispatch(removeGrow(grow.id))
        onClose()
    }, [confirmDelete, grow.id, dispatch, onClose])

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && canSave) {
                handleSave()
            }
        },
        [canSave, handleSave],
    )

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('settingsView.grows.editGrow')}
            size="md"
            footer={
                <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            onClick={handleArchive}
                            className="text-amber-400 hover:text-amber-300"
                        >
                            {t('settingsView.grows.archive')}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={handleDelete}
                            className="text-red-400 hover:text-red-300"
                        >
                            {confirmDelete
                                ? t('settingsView.grows.confirmDelete')
                                : t('settingsView.grows.delete')}
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={onClose}>
                            {t('common.cancel')}
                        </Button>
                        <Button onClick={handleSave} disabled={!canSave}>
                            {t('common.save')}
                        </Button>
                    </div>
                </div>
            }
        >
            <div className="space-y-4" onKeyDown={handleKeyDown}>
                <div>
                    <label
                        htmlFor="grow-edit-name"
                        className="mb-1 block text-sm font-medium text-slate-300"
                    >
                        {t('settingsView.grows.name')}
                    </label>
                    <Input
                        id="grow-edit-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('settingsView.grows.namePlaceholder')}
                        maxLength={40}
                        autoFocus
                    />
                </div>
                <div>
                    <label
                        htmlFor="grow-edit-description"
                        className="mb-1 block text-sm font-medium text-slate-300"
                    >
                        {t('settingsView.grows.description')}
                    </label>
                    <Input
                        id="grow-edit-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t('settingsView.grows.descriptionPlaceholder')}
                        maxLength={120}
                    />
                </div>
                <div>
                    <p className="mb-2 text-sm font-medium text-slate-300">
                        {t('settingsView.grows.color')}
                    </p>
                    <div className="flex gap-2">
                        {GROW_COLORS.map((c) => (
                            <button
                                type="button"
                                key={c}
                                onClick={() => setColor(c)}
                                className={cn(
                                    'h-8 w-8 rounded-full border-2 transition-transform',
                                    color === c
                                        ? 'scale-110 border-white'
                                        : 'border-transparent hover:scale-105',
                                )}
                                style={{ backgroundColor: c }}
                                aria-label={c}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    )
})
GrowEditModal.displayName = 'GrowEditModal'

export { GrowEditModal }
