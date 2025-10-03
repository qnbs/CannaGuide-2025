import React, { useRef, useEffect } from 'react'
import { Card } from '@/components/common/Card'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { Button } from '@/components/common/Button'
import { useTranslation } from 'react-i18next'

interface DrawerProps {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
    title?: string
    footer?: React.ReactNode
    size?: 'md' | 'lg' | 'xl' | '2xl'
}

export const Drawer: React.FC<DrawerProps> = ({
    isOpen,
    onClose,
    children,
    title,
    footer,
    size = 'md',
}) => {
    const { t } = useTranslation()
    const drawerRef = useFocusTrap(isOpen)
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
    }

    return (
        <div
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-end justify-center modal-overlay-animate"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'drawer-title' : undefined}
        >
            <Card
                ref={drawerRef as React.RefObject<HTMLDivElement>}
                className={`w-full ${sizeClasses[size]} max-h-[85vh] flex flex-col rounded-t-2xl glass-pane !border-b-0 animate-slide-in-up`}
                onClick={(e) => e.stopPropagation()}
            >
                {title && (
                    <header className="flex-shrink-0 p-4 border-b border-slate-700">
                        <div className="w-12 h-1.5 bg-slate-600 rounded-full mx-auto mb-2"></div>
                        <div className="flex justify-between items-center">
                            <h2 id="drawer-title" className="text-xl font-bold font-display text-primary-400">
                                {title}
                            </h2>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={onClose}
                                className="!p-1.5 !rounded-full"
                            >
                                <span className="sr-only">{t('common.close')}</span>
                                <PhosphorIcons.X className="w-5 h-5" />
                            </Button>
                        </div>
                    </header>
                )}

                <div ref={scrollableContentRef} className="overflow-y-auto flex-grow p-4">
                    {children}
                </div>

                {footer && (
                    <footer className="flex justify-between items-center p-4 border-t border-slate-700 flex-shrink-0">
                        {footer}
                    </footer>
                )}
            </Card>
        </div>
    )
}
