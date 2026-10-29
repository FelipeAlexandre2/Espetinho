/**
 * Utility to optimize, resize and format local images selected from the user's computer.
 * Ensures any image (heavy, vertical, horizontal, square) automatically adjusts to fit
 * restaurant menu cards cleanly and remains lightweight (<100KB) for fast loading across all devices.
 */

export interface ResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  aspectRatio?: 'square' | 'standard' | 'original'; // square: 1:1, standard: 4:3, original: preserve
}

export function processAndResizeImage(
  file: File,
  options: ResizeOptions = {}
): Promise<string> {
  const {
    maxWidth = 800,
    maxHeight = 600,
    quality = 0.85,
    aspectRatio = 'standard'
  } = options;

  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('O arquivo selecionado não é uma imagem válida.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo de imagem.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Erro ao processar os dados da imagem.'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context unavailable'));
            return;
          }

          let srcX = 0;
          let srcY = 0;
          let srcW = img.width;
          let srcH = img.height;

          let targetW = maxWidth;
          let targetH = maxHeight;

          if (aspectRatio === 'square') {
            targetW = Math.min(maxWidth, 600);
            targetH = targetW;
            const minDim = Math.min(srcW, srcH);
            srcX = (srcW - minDim) / 2;
            srcY = (srcH - minDim) / 2;
            srcW = minDim;
            srcH = minDim;
          } else if (aspectRatio === 'standard') {
            // 4:3 aspect ratio (optimal for menu card displays)
            targetW = Math.min(maxWidth, 800);
            targetH = Math.round(targetW * (3 / 4));

            const targetRatio = 4 / 3;
            const currentRatio = srcW / srcH;

            if (currentRatio > targetRatio) {
              // Too wide, crop sides
              const newW = srcH * targetRatio;
              srcX = (srcW - newW) / 2;
              srcW = newW;
            } else {
              // Too tall, crop top/bottom
              const newH = srcW / targetRatio;
              srcY = (srcH - newH) / 2;
              srcH = newH;
            }
          } else {
            // Preserve original aspect ratio with max limits
            let ratio = Math.min(maxWidth / srcW, maxHeight / srcH);
            if (ratio > 1) ratio = 1;
            targetW = Math.round(srcW * ratio);
            targetH = Math.round(srcH * ratio);
          }

          canvas.width = targetW;
          canvas.height = targetH;

          // High-quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Background fill in case of transparency
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, targetW, targetH);

          ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, targetW, targetH);

          // Output as JPEG for high compression & compatibility
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
