import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'

interface ConfirmModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    /** Uses destructive (red) styling for the confirm button when true. Defaults to true. */
    isDestructive?: boolean
}

const ConfirmModalComponent: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel,
    cancelLabel,
    isDestructive = true,
}) => {
    const { t } = useTranslation()

    const handleConfirm = () => {
        onConfirm()
        onClose()
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="md"
            footer={
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        {cancelLabel ?? t('common.cancel')}
                    </Button>
                    <Button
                        size="sm"
                        variant={isDestructive ? 'danger' : 'primary'}
                        onClick={handleConfirm}
                    >
                        {isDestructive && <PhosphorIcons.TrashSimple className="w-4 h-4 mr-1.5" />}
                        {confirmLabel ?? t('common.delete')}
                    </Button>
                </div>
            }
        >
            <p className="text-sm text-slate-300">{message}</p>
        </Modal>
    )
}

ConfirmModalComponent.displayName = 'ConfirmModal'

export const ConfirmModal = memo(ConfirmModalComponent)
