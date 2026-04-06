import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { Notification } from '@/types'
import { PhosphorIcons } from '../icons/PhosphorIcons'
import { useTranslation } from 'react-i18next'
import { useUIStore } from '@/stores/useUIStore'

interface ToastProps {
    notification: Notification
    onClose: (id: number) => void
}

const toastIcons: Record<Notification['type'], React.ReactNode> = {
    success: <PhosphorIcons.CheckCircle className="w-6 h-6 text-green-500" />,
    error: <PhosphorIcons.XCircle className="w-6 h-6 text-red-500" />,
    info: <PhosphorIcons.Info className="w-6 h-6 text-blue-500" />,
}

const Toast: React.FC<ToastProps> = ({ notification, onClose }) => {
    const { t } = useTranslation()
    const [status, setStatus] = useState('toast-entering')

    useEffect(() => {
        const enterTimer = setTimeout(() => {
            setStatus('toast-entered')
        }, 10) // A small delay to ensure the entering class is applied first

        const exitTimer = setTimeout(() => {
            setStatus('toast-exiting')
        }, 3000)

        const removeTimer = setTimeout(() => {
            onClose(notification.id)
        }, 3300) // 300ms for exit animation

        return () => {
            clearTimeout(enterTimer)
            clearTimeout(exitTimer)
            clearTimeout(removeTimer)
        }
    }, [notification.id, onClose])

    // The parent ToastContainer uses key={n.id} to trigger re-mount + animation on new toasts.
    return (
        <div
            className={`toast ${status} bg-[rgb(var(--color-bg-component))] flex items-center gap-3 w-full max-w-xs p-4 rounded-lg shadow-lg border border-white/20`}
            role="alert"
        >
            <div>{toastIcons[notification.type]}</div>
            <div className="text-sm font-normal text-slate-200">{notification.message}</div>
            <button
                type="button"
                className="ml-auto -mx-1.5 -my-1.5 bg-transparent text-slate-400 hover:text-white rounded-lg focus-visible:ring-2 focus-visible:ring-slate-300 p-2.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center hover:bg-slate-700"
                onClick={() => onClose(notification.id)}
                aria-label={t('common.close')}
            >
                <span className="sr-only">{t('common.close')}</span>
                <PhosphorIcons.X className="w-5 h-5" />
            </button>
        </div>
    )
}

export const ToastContainer: React.FC = () => {
    const { t } = useTranslation()
    const notifications = useUIStore((s) => s.notifications)
    const removeNotification = useUIStore((s) => s.removeNotification)
    const container = document.getElementById('toast-container')

    const handleClose = (id: number) => {
        removeNotification(id)
    }

    if (!container) return null

    return ReactDOM.createPortal(
        <div
            role="log"
            aria-live="assertive"
            aria-label={t('common.accessibility.toastNotifications')}
        >
            {notifications.map((n) => (
                <Toast key={n.id} notification={n} onClose={handleClose} />
            ))}
        </div>,
        container,
    )
}
