import QRCode from 'qrcode';

/**
 * Generates a Data URL (base64 image/png) for a given text using qrcode.
 */
export async function generateQrCodeDataUrl(
  text: string, 
  options: { width?: number; margin?: number; darkColor?: string; lightColor?: string } = {}
): Promise<string> {
  const { width = 280, margin = 2, darkColor = '#0f172a', lightColor = '#ffffff' } = options;
  try {
    return await QRCode.toDataURL(text, {
      width,
      margin,
      color: {
        dark: darkColor,
        light: lightColor,
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Failed to generate QR code data URL:', err);
    return '';
  }
}

/**
 * Generates an SVG string for a given text using qrcode.
 */
export async function generateQrCodeSvg(
  text: string,
  options: { margin?: number; darkColor?: string; lightColor?: string } = {}
): Promise<string> {
  const { margin = 2, darkColor = '#0f172a', lightColor = '#ffffff' } = options;
  try {
    return await QRCode.toString(text, {
      type: 'svg',
      margin,
      color: {
        dark: darkColor,
        light: lightColor,
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Failed to generate QR code SVG:', err);
    return '';
  }
}
