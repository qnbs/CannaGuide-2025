import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { Notification } from '@/types'
import { PhosphorIcons } from '../icons/PhosphorIcons'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { removeNotification } from '@/stores/slices/uiSlice'
import { selectNotifications } from '@/stores/selectors'

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
        const timer = setTimeout(() => {
            setStatus('toast-exiting')
        }, 3000)

        const exitTimer = setTimeout(() => {
            onClose(notification.id)
        }, 3300) // 300ms for exit animation

        return () => {
            clearTimeout(timer)
            clearTimeout(exitTimer)
        }
    }, [notification.id, onClose])

    // Use a key on the message div to force re-render and re-trigger animation on new toasts.
    return (
        <div
            key={notification.id}
            className={`toast ${status} flex items-center gap-3 w-full max-w-xs p-4 rounded-lg shadow-lg border`}
            role="alert"
        >
            <div>{toastIcons[notification.type]}</div>
            <div className="text-sm font-normal text-slate-800 dark:text-slate-200">
                {notification.message}
            </div>
            <button
                type="button"
                className="ml-auto -mx-1.5 -my-1.5 bg-transparent text-slate-400 hover:text-slate-900 rounded-lg focus:ring-2 focus:ring-slate-300 p-1.5 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-white dark:hover:bg-slate-700"
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
    const dispatch = useAppDispatch()
    // FIX: Cast the result of `useAppSelector` to the correct type to avoid 'unknown' type errors.
    const notifications = useAppSelector(selectNotifications) as Notification[];
    const container = document.getElementById('toast-container')

    const handleClose = (id: number) => {
        dispatch(removeNotification(id))
    }

    if (!container) return null

    return ReactDOM.createPortal(
        <>
            {notifications.map((n) => (
                <Toast key={n.id} notification={n} onClose={handleClose} />
            ))}
        </>,
        container
    )
}