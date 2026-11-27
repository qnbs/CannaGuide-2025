import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { Modal } from './Modal'

interface CameraModalProps {
    isOpen: boolean
    onClose: () => void
    onCapture: (dataUrl: string) => void
    triggerRef?: React.RefObject<HTMLButtonElement | null>
}

const CAMERA_FALLBACK_VTT =
    'data:text/vtt;charset=utf-8,WEBVTT\n\n00:00:00.000 --> 00:10:00.000\nCamera preview\n'

export const CameraModal: React.FC<CameraModalProps> = ({
    isOpen,
    onClose,
    onCapture,
    triggerRef,
}) => {
    const { t } = useTranslation()
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const acquisitionGenerationRef = useRef(0)

    const [stream, setStream] = useState<MediaStream | null>(null)
    const [errorKey, setErrorKey] = useState<string | null>(null)
    const [capturedImage, setCapturedImage] = useState<string | null>(null)

    const stopStream = useCallback((mediaStream: MediaStream) => {
        mediaStream.getTracks().forEach((track) => track.stop())
    }, [])

    const releaseCurrentStream = useCallback(
        (updateState = true) => {
            const activeStream = streamRef.current
            streamRef.current = null
            if (videoRef.current?.srcObject === activeStream) {
                videoRef.current.srcObject = null
            }
            if (activeStream) stopStream(activeStream)
            if (updateState) setStream(null)
        },
        [stopStream],
    )

    const cancelCamera = useCallback(
        (updateState = true) => {
            acquisitionGenerationRef.current += 1
            releaseCurrentStream(updateState)
        },
        [releaseCurrentStream],
    )

    const acquireCamera = useCallback(async () => {
        const generation = acquisitionGenerationRef.current + 1
        acquisitionGenerationRef.current = generation
        releaseCurrentStream()
        setErrorKey(null)

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
            })
            if (generation !== acquisitionGenerationRef.current) {
                stopStream(mediaStream)
                return
            }
            streamRef.current = mediaStream
            setStream(mediaStream)
            if (videoRef.current) videoRef.current.srcObject = mediaStream
        } catch (err) {
            if (generation !== acquisitionGenerationRef.current) return
            console.debug('Camera access error:', err)
            setErrorKey('plantsView.aiDiagnostics.cameraError')
        }
    }, [releaseCurrentStream, stopStream])

    const handleClose = useCallback(() => {
        cancelCamera()
        onClose()
    }, [cancelCamera, onClose])

    const showCameraError = useCallback(() => {
        cancelCamera()
        setErrorKey('plantsView.aiDiagnostics.cameraError')
    }, [cancelCamera])

    const handleRetake = useCallback(() => {
        setCapturedImage(null)
        void acquireCamera()
    }, [acquireCamera])

    const handleCapture = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return

        const video = videoRef.current
        const canvas = canvasRef.current
        if (video.videoWidth <= 0 || video.videoHeight <= 0) {
            showCameraError()
            return
        }
        try {
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            const context = canvas.getContext('2d')
            if (!context) {
                showCameraError()
                return
            }
            context.drawImage(video, 0, 0, canvas.width, canvas.height)
            setCapturedImage(canvas.toDataURL('image/jpeg'))
        } catch {
            showCameraError()
            return
        }
        cancelCamera()
    }, [cancelCamera, showCameraError])

    const handleConfirmCapture = useCallback(() => {
        if (capturedImage) onCapture(capturedImage)
    }, [capturedImage, onCapture])

    const handleOpenAutoFocus = useCallback((event: Event) => {
        event.preventDefault()
    }, [])

    const handleCloseAutoFocus = useCallback(
        (event: Event) => {
            event.preventDefault()
            requestAnimationFrame(() => triggerRef?.current?.focus())
        },
        [triggerRef],
    )

    useEffect(() => {
        if (isOpen) {
            void acquireCamera()
        } else {
            cancelCamera()
            setCapturedImage(null)
        }

        return () => {
            cancelCamera(false)
        }
    }, [acquireCamera, cancelCamera, isOpen])

    const footerContent = (
        <div className="w-full flex justify-center gap-4">
            {capturedImage ? (
                <>
                    <Button onClick={handleRetake} variant="secondary" className="min-h-11">
                        <PhosphorIcons.ArrowClockwise className="w-5 h-5 mr-2" />
                        {t('plantsView.aiDiagnostics.retake')}
                    </Button>
                    <Button onClick={handleConfirmCapture} className="min-h-11">
                        <PhosphorIcons.CheckCircle className="w-5 h-5 mr-2" />
                        {t('common.confirm')}
                    </Button>
                </>
            ) : errorKey ? (
                <Button onClick={handleRetake} variant="secondary" className="min-h-11">
                    <PhosphorIcons.ArrowClockwise className="w-5 h-5 mr-2" />
                    {t('common.errorBoundary.retry')}
                </Button>
            ) : (
                <Button onClick={handleCapture} disabled={!stream} className="min-h-11">
                    <PhosphorIcons.Camera className="w-5 h-5 mr-2" />
                    {t('plantsView.aiDiagnostics.capture')}
                </Button>
            )}
        </div>
    )
    const videoVisibilityClass = capturedImage || errorKey ? 'hidden' : 'block'

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            size="lg"
            footer={footerContent}
            containerClassName="!bg-slate-900"
            onOpenAutoFocus={handleOpenAutoFocus}
            onCloseAutoFocus={handleCloseAutoFocus}
        >
            <div className="relative">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className={`w-full h-auto max-h-[60dvh] object-contain rounded-md ${videoVisibilityClass}`}
                >
                    <track
                        kind="captions"
                        srcLang="en"
                        label="Captions"
                        src={CAMERA_FALLBACK_VTT}
                    />
                </video>
                <canvas ref={canvasRef} className="hidden"></canvas>
                {errorKey && (
                    <div role="alert" className="text-center text-red-400 p-8">
                        {t(errorKey)}
                    </div>
                )}
                {capturedImage && (
                    <img
                        src={capturedImage}
                        alt={t('common.capturedImage')}
                        className="w-full h-auto max-h-[60dvh] object-contain rounded-md"
                    />
                )}
            </div>
        </Modal>
    )
}
