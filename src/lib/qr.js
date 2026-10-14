import 'server-only';
import QRCode from 'qrcode';

export function qrDataUrl(text, size = 260) {
  return QRCode.toDataURL(text, { width: size, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0B1B3F', light: '#FFFFFF' } });
}
