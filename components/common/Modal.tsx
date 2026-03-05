import React from 'react'
import { DialogWrapper, DialogWrapperSize } from '@/components/common/DialogWrapper'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
    title?: string
    footer?: React.ReactNode
    size?: DialogWrapperSize
    containerClassName?: string
    showCloseButton?: boolean
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    children,
    title,
    footer,
    size = 'md',
    containerClassName = '',
    showCloseButton = true,
}) => {
    return (
        <DialogWrapper
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footer={footer}
            size={size}
            containerClassName={containerClassName}
            showCloseButton={showCloseButton}
            variant="modal"
        >
            {children}
        </DialogWrapper>
    )
}