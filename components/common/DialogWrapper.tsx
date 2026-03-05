import React, { useEffect, useRef, useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

export type DialogWrapperSize = 'md' | 'lg' | 'xl' | '2xl' | '4xl'

interface DialogWrapperProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  footer?: React.ReactNode
  size?: DialogWrapperSize
  containerClassName?: string
  showCloseButton?: boolean
  variant?: 'modal' | 'drawer'
  enableSwipeToClose?: boolean
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
  footer,
  size = 'md',
  containerClassName = '',
  showCloseButton = true,
  variant = 'modal',
  enableSwipeToClose = false,
}) => {
  const { t } = useTranslation()
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
        <DialogPrimitive.Overlay className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md data-[state=open]:animate-fade-in" />

        <div
          className={cn(
            'fixed inset-0 z-[121] h-[100dvh] w-full overflow-hidden p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] overscroll-contain',
            isDrawer ? 'flex items-end justify-center' : 'flex items-center justify-center'
          )}
        >
          <DialogPrimitive.Content
            className={cn(
              'pointer-events-auto flex w-full flex-col gap-3 overflow-hidden border border-white/20 bg-[rgba(var(--color-bg-component),0.94)] shadow-2xl backdrop-blur-xl focus:outline-none',
              isDrawer
                ? `${sizeClasses[size]} max-h-[90dvh] rounded-2xl rounded-b-none`
                : `${sizeClasses[size]} max-h-[90dvh] rounded-2xl`,
              containerClassName
            )}
            style={{
              transform: isDrawer && dragY > 0 ? `translateY(${dragY}px)` : undefined,
              transition: dragY > 0 ? 'none' : 'transform 160ms ease-out',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <header className="flex items-start justify-between gap-3 border-b border-white/10 p-4 pb-3">
              <div className="min-w-0">
                {isDrawer && (
                  <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-slate-500/70" aria-hidden="true" />
                )}
                {title && (
                  <DialogPrimitive.Title className="text-xl font-bold font-display text-primary-300 sm:text-2xl">
                    {title}
                  </DialogPrimitive.Title>
                )}
              </div>

              {showCloseButton && (
                <DialogPrimitive.Close
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-slate-800/80 text-slate-200 transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                  aria-label={t('common.close')}
                >
                  <PhosphorIcons.X className="h-5 w-5" />
                </DialogPrimitive.Close>
              )}
            </header>

            <div ref={scrollableContentRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-1">
              {children}
            </div>

            {footer && (
              <footer className="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-3 border-t border-white/10 bg-[rgba(var(--color-bg-component),0.96)] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
                {footer}
              </footer>
            )}
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
