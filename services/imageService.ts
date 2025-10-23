import { IMAGE_MAX_WIDTH, IMAGE_MAX_HEIGHT, IMAGE_JPEG_QUALITY } from '@/constants';

export const resizeImage = (
    base64Str: string,
    maxWidth = IMAGE_MAX_WIDTH,
    maxHeight = IMAGE_MAX_HEIGHT,
    quality = IMAGE_JPEG_QUALITY,
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }
            ctx.drawImage(img, 0, 0, width, height);

            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(dataUrl);
        };
        img.onerror = (error) => {
            reject(error);
        };
    });
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
