import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Notification, NotificationType } from '../../types';
import { PhosphorIcons } from '../icons/PhosphorIcons';

interface ToastProps {
  notification: Notification;
  onClose: (id: number) => void;
}

const toastIcons: Record<NotificationType, React.ReactNode> = {
    success: <PhosphorIcons.CheckCircle className="w-6 h-6 text-green-500" />,
    error: <PhosphorIcons.XCircle className="w-6 h-6 text-red-500" />,
    info: <PhosphorIcons.Info className="w-6 h-6 text-blue-500" />,
};

const Toast: React.FC<ToastProps> = ({ notification, onClose }) => {
    const [status, setStatus] = useState('toast-entering');

    useEffect(() => {
        const timer = setTimeout(() => {
            setStatus('toast-exiting');
        }, 3000);

        const exitTimer = setTimeout(() => {
            onClose(notification.id);
        }, 3300); // 300ms for exit animation

        return () => {
            clearTimeout(timer);
            clearTimeout(exitTimer);
        };
    }, [notification.id, onClose]);

    return (
        <div className={`toast ${status} flex items-center gap-3 w-full max-w-xs p-4 rounded-lg shadow-lg border`} role="alert">
            <div>
                {toastIcons[notification.type]}
            </div>
            <div className="text-sm font-normal text-slate-800 dark:text-slate-200">{notification.message}</div>
            <button
                type="button"
                className="ml-auto -mx-1.5 -my-1.5 bg-transparent text-slate-400 hover:text-slate-900 rounded-lg focus:ring-2 focus:ring-slate-300 p-1.5 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-white dark:hover:bg-slate-700"
                onClick={() => onClose(notification.id)}
                aria-label="Close"
            >
                <span className="sr-only">Close</span>
                <PhosphorIcons.X className="w-5 h-5" />
            </button>
        </div>
    );
};

export const ToastContainer: React.FC<{ notifications: Notification[], onClose: (id: number) => void }> = ({ notifications, onClose }) => {
    const container = document.getElementById('toast-container');
    if (!container) return null;

    return ReactDOM.createPortal(
        <>
            {notifications.map(n => (
                <Toast key={n.id} notification={n} onClose={onClose} />
            ))}
        </>,
        container
    );
};