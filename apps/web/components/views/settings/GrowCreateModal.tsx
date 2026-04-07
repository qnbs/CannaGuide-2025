import React, { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { addGrow, setActiveGrowId } from '@/stores/slices/growsSlice'
import { selectGrowCount } from '@/stores/selectors'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GROW_COLORS, MAX_GROWS } from '@/constants'
import { cn } from '@/lib/utils'

interface GrowCreateModalProps {
    isOpen: boolean
    onClose: () => void
}

const GrowCreateModal: React.FC<GrowCreateModalProps> = memo(({ isOpen, onClose }) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const growCount = useAppSelector(selectGrowCount)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [color, setColor] = useState(GROW_COLORS[0] ?? '#22c55e')

    const canCreate = name.trim().length > 0 && growCount < MAX_GROWS
    const atLimit = growCount >= MAX_GROWS

    const handleCreate = useCallback(() => {
        if (!canCreate) return
        const id = `grow-${Date.now()}`
        dispatch(
            addGrow({
                id,
                name: name.trim(),
                description: description.trim() || undefined,
                color,
                isActive: true,
            }),
        )
        dispatch(setActiveGrowId(id))
        setName('')
        setDescription('')
        setColor(GROW_COLORS[0] ?? '#22c55e')
        onClose()
    }, [canCreate, name, description, color, dispatch, onClose])

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && canCreate) {
                handleCreate()
            }
        },
        [canCreate, handleCreate],
    )

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('settingsView.grows.createGrow')}
            size="md"
            footer={
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>
                        {t('common.cancel')}
                    </Button>
                    <Button onClick={handleCreate} disabled={!canCreate}>
                        {t('settingsView.grows.createGrow')}
                    </Button>
                </div>
            }
        >
            <div className="space-y-4" onKeyDown={handleKeyDown}>
                {atLimit && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
                        {t('settingsView.grows.limitReached', { max: MAX_GROWS })}
                    </div>
                )}
                <div>
                    <label
                        htmlFor="grow-name"
                        className="mb-1 block text-sm font-medium text-slate-300"
                    >
                        {t('settingsView.grows.name')}
                    </label>
                    <Input
                        id="grow-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('settingsView.grows.namePlaceholder')}
                        maxLength={40}
                        autoFocus
                    />
                </div>
                <div>
                    <label
                        htmlFor="grow-description"
                        className="mb-1 block text-sm font-medium text-slate-300"
                    >
                        {t('settingsView.grows.description')}
                    </label>
                    <Input
                        id="grow-description"
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
GrowCreateModal.displayName = 'GrowCreateModal'

export { GrowCreateModal }
