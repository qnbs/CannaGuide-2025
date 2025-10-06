import React, { useRef, useEffect } from 'react'
import { Card } from '@/components/common/Card'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { Button } from '@/components/common/Button'
import { useTranslation } from 'react-i18next'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
    title?: string
    footer?: React.ReactNode
    size?: 'md' | 'lg' | 'xl' | '2xl' | '4xl'
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
    const { t } = useTranslation()
    const modalRef = useFocusTrap(isOpen)
    const scrollableContentRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isOpen && scrollableContentRef.current) {
            scrollableContentRef.current.scrollTop = 0
        }
    }, [isOpen])

    if (!isOpen) return null

    const sizeClasses = {
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '4xl': 'max-w-4xl',
    }

    return (
        <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 modal-overlay-animate"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
        >
            <Card
                ref={modalRef as React.RefObject<HTMLDivElement>}
                className={`w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col modal-content-animate ${containerClassName}`}
                onClick={(e) => e.stopPropagation()}
            >
                {title && (
                    <header className="flex justify-between items-start flex-shrink-0 mb-4 pb-4 border-b border-slate-700/50">
                        <h2
                            id="modal-title"
                            className="text-2xl font-bold font-display text-primary-400"
                        >
                            {title}
                        </h2>
                        {showCloseButton && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={onClose}
                                className="!p-1.5 !rounded-full -mt-1 -mr-1"
                            >
                                <span className="sr-only">{t('common.close')}</span>
                                <PhosphorIcons.X className="w-5 h-5" />
                            </Button>
                        )}
                    </header>
                )}

                <div ref={scrollableContentRef} className="flex-grow overflow-y-auto pr-2 -mr-4 pl-1">
                    {children}
                </div>

                {footer && (
                    <footer className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-700 flex-shrink-0">
                        {footer}
                    </footer>
                )}
            </Card>
        </div>
    )
}