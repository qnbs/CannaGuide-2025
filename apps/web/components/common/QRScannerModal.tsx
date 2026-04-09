import React, { useEffect, useRef, useState, useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'

interface QRScannerModalProps {
    isOpen: boolean
    onClose: () => void
    onScan: (plantId: string) => void
}

export const QRScannerModal: React.FC<QRScannerModalProps> = memo(({ isOpen, onClose, onScan }) => {
    const { t } = useTranslation()
    const scannerRef = useRef<HTMLDivElement>(null)
    const html5QrCodeRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [manualId, setManualId] = useState('')

    const stopScanner = useCallback(async () => {
        try {
            const scanner = html5QrCodeRef.current
            if (scanner) {
                await scanner.stop()
                scanner.clear()
                html5QrCodeRef.current = null
            }
        } catch {
            // Scanner may already be stopped
        }
    }, [])

    useEffect(() => {
        if (!isOpen) return

        let mounted = true

        const startScanner = async (): Promise<void> => {
            try {
                const { Html5Qrcode } = await import('html5-qrcode')
                if (!mounted || !scannerRef.current) return

                const scanner = new Html5Qrcode('qr-scanner-reader')
                html5QrCodeRef.current = scanner

                await scanner.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    (decodedText: string) => {
                        // Extract plant ID from QR data
                        // Expected format: "cannaguide://plant/{plantId}" or just the ID
                        const match = decodedText.match(/cannaguide:\/\/plant\/([a-zA-Z0-9_-]+)/)
                        const plantId = match ? match[1] : decodedText.trim()
                        if (plantId && plantId.length > 0 && plantId.length < 100) {
                            void stopScanner()
                            onScan(plantId)
                        }
                    },
                    () => {
                        // QR code not found in frame -- expected, no-op
                    },
                )
            } catch (err) {
                if (mounted) {
                    setError(
                        t('plantsView.qrScanner.cameraError', {
                            defaultValue:
                                'Could not access camera. Please allow camera permissions.',
                        }),
                    )
                    console.debug('[QRScanner] Camera init error:', err)
                }
            }
        }

        void startScanner()

        return () => {
            mounted = false
            void stopScanner()
        }
    }, [isOpen, onScan, stopScanner, t])

    const handleManualSubmit = useCallback(() => {
        const trimmed = manualId.trim()
        if (trimmed.length > 0 && trimmed.length < 100) {
            onScan(trimmed)
        }
    }, [manualId, onScan])

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={t('plantsView.qrScanner.title', { defaultValue: 'Scan Plant QR Code' })}
        >
            <div className="w-full max-w-md mx-4 rounded-2xl bg-slate-900 ring-1 ring-slate-700 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h2 className="text-lg font-semibold text-white">
                        {t('plantsView.qrScanner.title', { defaultValue: 'Scan Plant QR Code' })}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        aria-label={t('common.close', { defaultValue: 'Close' })}
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Camera scanner area */}
                    <div
                        id="qr-scanner-reader"
                        ref={scannerRef}
                        className="w-full rounded-xl overflow-hidden bg-slate-800"
                    />

                    {error != null && (
                        <div className="rounded-lg bg-red-500/15 p-3 ring-1 ring-inset ring-red-400/30">
                            <p className="text-sm text-red-300">{error}</p>
                        </div>
                    )}

                    {/* Manual ID entry fallback */}
                    <div className="border-t border-slate-700 pt-4">
                        <p className="text-xs text-slate-400 mb-2">
                            {t('plantsView.qrScanner.manualEntry', {
                                defaultValue: 'Or enter Plant ID manually:',
                            })}
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={manualId}
                                onChange={(e) => setManualId(e.target.value)}
                                placeholder="Plant ID"
                                className="flex-1 rounded-lg bg-slate-700/60 border-0 px-3 py-2 text-sm text-white placeholder-slate-500 ring-1 ring-inset ring-slate-600 focus:ring-2 focus:ring-primary-500"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleManualSubmit()
                                }}
                            />
                            <button
                                type="button"
                                onClick={handleManualSubmit}
                                disabled={manualId.trim().length === 0}
                                className="rounded-lg bg-primary-600 hover:bg-primary-500 disabled:opacity-40 px-4 py-2 text-sm font-medium text-white transition-colors"
                            >
                                {t('common.confirm', { defaultValue: 'Go' })}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
})
QRScannerModal.displayName = 'QRScannerModal'
