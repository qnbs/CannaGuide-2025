import React, { useEffect, useRef, useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

export type DialogWrapperSize = 'md' | 'lg' | 'xl' | '2xl' | '4xl'

interface DialogWrapperProps {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
    title?: string | undefined
    description?: string | undefined
    footer?: React.ReactNode | undefined
    size?: DialogWrapperSize | undefined
    containerClassName?: string | undefined
    bodyClassName?: string | undefined
    showCloseButton?: boolean | undefined
    variant?: 'modal' | 'drawer' | undefined
    enableSwipeToClose?: boolean | undefined
    onOpenAutoFocus?: ((event: Event) => void) | undefined
    onCloseAutoFocus?: ((event: Event) => void) | undefined
}

const sizeClasses: Record<DialogWrapperSize, string> = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
}

export const DialogWrapper: React.FC<DialogWrapperProps> = ({
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
    variant = 'modal',
    enableSwipeToClose = false,
    onOpenAutoFocus,
    onCloseAutoFocus,
}) => {
    const { t } = useTranslation()
    const hiddenTitle = title ?? 'Dialog'
    const scrollableContentRef = useRef<HTMLDivElement>(null)
    const pointerStartY = useRef<number | null>(null)
    const [dragY, setDragY] = useState(0)

    useEffect(() => {
        if (isOpen) {
            document.documentElement.classList.add('dialog-open')
            if (scrollableContentRef.current) {
                scrollableContentRef.current.scrollTop = 0
            }
        }

        return () => {
            document.documentElement.classList.remove('dialog-open')
        }
    }, [isOpen])

    const isDrawer = variant === 'drawer'

    const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (event) => {
        if (!isDrawer || !enableSwipeToClose) return
        if (scrollableContentRef.current && scrollableContentRef.current.scrollTop > 0) return
        pointerStartY.current = event.clientY
    }

    const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (event) => {
        if (!isDrawer || !enableSwipeToClose || pointerStartY.current === null) return
        const delta = Math.max(0, event.clientY - pointerStartY.current)
        setDragY(Math.min(delta, 180))
    }

    const handlePointerUp: React.PointerEventHandler<HTMLDivElement> = () => {
        if (!isDrawer || !enableSwipeToClose) return
        if (dragY > 90) {
            onClose()
        }
        pointerStartY.current = null
        setDragY(0)
    }

    return (
        <DialogPrimitive.Root
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose()
            }}
        >
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-[120] bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_34%),rgba(2,6,23,0.84)] backdrop-blur-xl data-[state=open]:animate-fade-in" />

                <div
                    className={cn(
                        'fixed inset-0 z-[121] h-[100dvh] w-full overflow-hidden p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] overscroll-contain',
                        isDrawer
                            ? 'flex items-end justify-center'
                            : 'flex items-center justify-center',
                    )}
                >
                    <DialogPrimitive.Content
                        className={cn(
                            'pointer-events-auto flex w-full flex-col gap-3 overflow-hidden border border-white/14 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(15,23,42,0.92))] shadow-[0_36px_100px_rgba(2,6,23,0.58)] backdrop-blur-2xl focus:outline-none',
                            isDrawer
                                ? `${sizeClasses[size]} max-h-[90dvh] rounded-[1.75rem] rounded-b-none`
                                : `${sizeClasses[size]} max-h-[90dvh] rounded-[1.75rem]`,
                            containerClassName,
                        )}
                        style={{
                            transform: isDrawer && dragY > 0 ? `translateY(${dragY}px)` : undefined,
                            transition: dragY > 0 ? 'none' : 'transform 160ms ease-out',
                        }}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        onOpenAutoFocus={onOpenAutoFocus}
                        onCloseAutoFocus={onCloseAutoFocus}
                    >
                        <header className="relative flex items-start justify-between gap-3 border-b border-white/10 bg-[linear-gradient(180deg,rgba(30,41,59,0.7),rgba(15,23,42,0.16))] p-5 pb-4">
                            <div
                                className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-primary-400/60 to-transparent"
                                aria-hidden="true"
                            />
                            <div className="min-w-0">
                                <VisuallyHidden>
                                    <DialogPrimitive.Title>{hiddenTitle}</DialogPrimitive.Title>
                                </VisuallyHidden>
                                {isDrawer && (
                                    <div
                                        className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-slate-500/70"
                                        aria-hidden="true"
                                    />
                                )}
                                {title && (
                                    <DialogPrimitive.Title className="text-xl font-bold font-display tracking-tight text-slate-50 sm:text-2xl">
                                        {title}
                                    </DialogPrimitive.Title>
                                )}
                                {description && (
                                    <DialogPrimitive.Description className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                                        {description}
                                    </DialogPrimitive.Description>
                                )}
                            </div>

                            {showCloseButton && (
                                <DialogPrimitive.Close
                                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/6 text-slate-200 transition-all hover:border-white/25 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                                    aria-label={t('common.close')}
                                >
                                    <PhosphorIcons.X className="h-5 w-5" />
                                </DialogPrimitive.Close>
                            )}
                        </header>

                        <div
                            ref={scrollableContentRef}
                            className={cn(
                                'min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-2',
                                bodyClassName,
                            )}
                        >
                            {children}
                        </div>

                        {footer && (
                            <footer className="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-3 border-t border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.78),rgba(15,23,42,0.96))] px-5 pt-4 pb-[max(0.9rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
                                {footer}
                            </footer>
                        )}
                    </DialogPrimitive.Content>
                </div>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    )
}
