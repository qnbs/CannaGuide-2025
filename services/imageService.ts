import { IMAGE_MAX_WIDTH, IMAGE_MAX_HEIGHT, IMAGE_JPEG_QUALITY } from '@/constants';
import imageCompression from 'browser-image-compression';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
const MAX_RAW_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB pre-compression limit

export type ImageValidationError = 'tooLarge' | 'invalidFormat';

/** Validates a File before upload. Returns null on success, or an error key on failure. */
export const validateImageFile = (file: File): ImageValidationError | null => {
    if (file.size > MAX_RAW_SIZE_BYTES) {
        return 'tooLarge';
    }
    // Accept also empty/unset MIME types (HEIC may report as '') and check by extension fallback
    const mime = file.type.toLowerCase();
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const extOk = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'].includes(ext);
    if (mime && !ALLOWED_MIME_TYPES.has(mime) && !extOk) {
        return 'invalidFormat';
    }
    return null;
};

const dataUrlToFile = (dataUrl: string, fileName = `image-${Date.now()}.jpg`): File => {
    const [meta, base64Data] = dataUrl.split(',');
    const mimeMatch = meta.match(/data:(.*?);base64/);
    const mimeType = mimeMatch?.[1] ?? 'image/jpeg';
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i += 1) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    return new File([bytes], fileName, { type: mimeType });
};

const fileToDataUrl = (file: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });

export const resizeImage = (
    base64Str: string,
    maxWidth = IMAGE_MAX_WIDTH,
    maxHeight = IMAGE_MAX_HEIGHT,
    quality = IMAGE_JPEG_QUALITY,
): Promise<string> => {
    const sourceFile = dataUrlToFile(base64Str);
    const maxDimension = Math.max(maxWidth, maxHeight);

    return imageCompression(sourceFile, {
        maxSizeMB: 0.7,
        maxWidthOrHeight: maxDimension,
        useWebWorker: true,
        initialQuality: quality,
        fileType: 'image/jpeg',
    }).then((compressedBlob) => fileToDataUrl(compressedBlob));
};

export const base64ToMimeType = (base64: string): string => {
    const signatures: Record<string, string> = {
      'R0lGODdh': 'image/gif',
      'iVBORw0KGgo': 'image/png',
      '/9j/': 'image/jpeg'
    };
    for (const s in signatures) {
      if (base64.startsWith(s)) {
        return signatures[s];
      }
    }
    // Since we resize to jpeg, this is a safe fallback.
    return 'image/jpeg';
};
