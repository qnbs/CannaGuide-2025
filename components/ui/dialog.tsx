import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn('fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm data-[state=open]:animate-fade-in', className)}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const { t } = useTranslation()
  return (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[max(0.5rem,env(safe-area-inset-top))] bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-50 grid h-[calc(100dvh-max(1rem,env(safe-area-inset-top)+env(safe-area-inset-bottom)))] w-[calc(100%-1rem)] translate-x-[-50%] gap-4 rounded-xl border border-white/20 bg-[rgba(var(--color-bg-component),0.92)] p-4 shadow-2xl duration-200 data-[state=open]:animate-fade-in-up sm:top-[50%] sm:bottom-auto sm:h-auto sm:w-[calc(100%-2rem)] sm:max-w-lg sm:translate-y-[-50%] sm:p-6',
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 min-h-11 min-w-11 inline-flex items-center justify-center rounded-md text-slate-300 opacity-80 hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400">
        <PhosphorIcons.X className="h-5 w-5" />
        <span className="sr-only">{t('common.close')}</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
  )
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-left', className)} {...props} />
)
DialogHeader.displayName = 'DialogHeader'

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
)
DialogFooter.displayName = 'DialogFooter'

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn('text-xl font-bold font-display text-primary-300', className)} {...props} />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn('text-sm text-slate-300', className)} {...props} />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
