import React from 'react'
import { DialogWrapper, DialogWrapperSize } from '@/components/common/DialogWrapper'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
    title?: string
    description?: string
    footer?: React.ReactNode
    size?: DialogWrapperSize
    containerClassName?: string
    bodyClassName?: string
    showCloseButton?: boolean
    onOpenAutoFocus?: (event: Event) => void
    onCloseAutoFocus?: (event: Event) => void
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    children,
    title,
    description,
    footer,
    size = 'md',
    containerClassName = '',
    bodyClassName = '',
    showCloseButton = true,
    onOpenAutoFocus,
    onCloseAutoFocus,
}) => {
    return (
        <DialogWrapper
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            description={description}
            footer={footer}
            size={size}
            containerClassName={containerClassName}
            bodyClassName={bodyClassName}
            showCloseButton={showCloseButton}
            variant="modal"
            onOpenAutoFocus={onOpenAutoFocus}
            onCloseAutoFocus={onCloseAutoFocus}
        >
            {children}
        </DialogWrapper>
    )
}
