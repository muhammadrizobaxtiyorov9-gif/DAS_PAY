import 'server-only';
import QRCode from 'qrcode';

export async function generateQrDataUrl(text: string, size = 220): Promise<string> {
  return QRCode.toDataURL(text, {
    width: size,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#0f172a', light: '#ffffff' },
  });
}
