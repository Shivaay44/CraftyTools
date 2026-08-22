export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  dimensions?: { width: number; height: number };
}

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/bmp',
  'image/svg+xml',
];

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB limit

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function isImageFile(file: File): boolean {
  if (!file) return false;
  if (file.type && (file.type.startsWith('image/') || ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase()))) {
    return true;
  }
  const ext = file.name ? file.name.substring(file.name.lastIndexOf('.')).toLowerCase() : '';
  return ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.bmp', '.svg', '.jfif', '.pjpeg', '.pjp'].includes(ext);
}

export async function validateImageFile(file: File): Promise<ImageValidationResult> {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  if (!isImageFile(file)) {
    return {
      valid: false,
      error: 'Unsupported file format. Please select an image file (JPG, PNG, WebP, etc.).',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'This image is too large (exceeds 50MB limit). Please try a smaller image.',
    };
  }

  // Attempt to decode image to verify it's not corrupted
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const dimensions = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(url);
      resolve({ valid: true, dimensions });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        valid: false,
        error: 'Failed to decode image file. The file may be corrupted or an unsupported codec.',
      });
    };

    img.src = url;
  });
}
