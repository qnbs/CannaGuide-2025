import React from 'react'
import { DialogWrapper, DialogWrapperSize } from '@/components/common/DialogWrapper'

interface DrawerProps {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
    title?: string
    description?: string
    footer?: React.ReactNode
    size?: Exclude<DialogWrapperSize, '4xl'>
}

export const Drawer: React.FC<DrawerProps> = ({
    isOpen,
    onClose,
    children,
    title,
    description,
    footer,
    size = 'md',
}) => {
    return (
        <DialogWrapper
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            description={description}
            footer={footer}
            size={size}
            variant="drawer"
            enableSwipeToClose
        >
            {children}
        </DialogWrapper>
    )
}