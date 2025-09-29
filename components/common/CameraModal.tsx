import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { Modal } from './Modal';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const cleanupStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (isOpen) {
      const startCamera = async () => {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        } catch (err) {
          console.error("Camera access error:", err);
          setError(t('plantsView.aiDiagnostics.cameraError'));
        }
      };
      startCamera();
    } else {
      cleanupStream();
      setCapturedImage(null);
    }
    
    return () => {
      cleanupStream();
    };
  }, [isOpen, cleanupStream, t]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        cleanupStream();
      }
    }
  };

  const handleConfirmCapture = () => {
    if(capturedImage) {
        onCapture(capturedImage);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setError(null);
    // Restart camera
    const startCamera = async () => {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        } catch (err) {
          setError(t('plantsView.aiDiagnostics.cameraError'));
        }
      };
      startCamera();
  }

  const footerContent = (
    <div className="w-full flex justify-center gap-4">
        {capturedImage ? (
            <>
                <Button onClick={handleRetake} variant="secondary"><PhosphorIcons.ArrowClockwise className="w-5 h-5 mr-2" />{t('plantsView.aiDiagnostics.retake')}</Button>
                <Button onClick={handleConfirmCapture}><PhosphorIcons.CheckCircle className="w-5 h-5 mr-2" />{t('common.confirm')}</Button>
            </>
        ) : (
            <Button onClick={handleCapture} disabled={!stream}><PhosphorIcons.Camera className="w-5 h-5 mr-2" />{t('plantsView.aiDiagnostics.capture')}</Button>
        )}
    </div>
  );

  return (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        size="lg" 
        footer={footerContent}
        containerClassName="!bg-slate-900"
    >
        {error ? (
          <div className="text-center text-red-400 p-8">{error}</div>
        ) : (
          <div className="relative">
            <video ref={videoRef} autoPlay playsInline className={`w-full h-auto rounded-md ${capturedImage ? 'hidden' : 'block'}`}></video>
            <canvas ref={canvasRef} className="hidden"></canvas>
            {capturedImage && (
                <img src={capturedImage} alt="Captured" className="w-full h-auto rounded-md" />
            )}
          </div>
        )}
    </Modal>
  );
};