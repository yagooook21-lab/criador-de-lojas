/**
 * PIX BR Code generator utility
 * Based on EMV QRCPS (QR Code Payment Systems)
 */

export interface PixPayloadParams {
  key: string;
  name: string;
  city: string;
  amount: number;
  txid?: string;
  description?: string;
}

/**
 * Calculates CRC16-CCITT [0xFFFF] (Polynom 0x1021)
 */
export function calculateCRC16(payload: string): string {
  let crc = 0xFFFF;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    let b = payload.charCodeAt(i);
    for (let j = 0; j < 8; j++) {
      let bit = ((b >> (7 - j) & 1) === 1);
      let c15 = ((crc >> 15 & 1) === 1);
      crc <<= 1;
      if (c15 !== bit) crc ^= polynomial;
    }
  }

  crc &= 0xFFFF;
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function formatField(id: string, value: string): string {
  const safeValue = value || '';
  const len = safeValue.length.toString().padStart(2, '0');
  return `${id}${len}${safeValue}`;
}

export function generateRandomId(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generatePixPayload({ key, name, city, amount, txid, description }: PixPayloadParams): string {
  // 1. Merchant Account Information (ID 26)
  const gui = formatField('00', 'br.gov.bcb.pix');
  const keyField = formatField('01', key);
  
  // Use random 5-char description if not provided (per user script logic)
  const descValue = description || generateRandomId(5);
  const info = formatField('26', `${gui}${keyField}${formatField('02', descValue)}`);

  // 2. Additional Data Field (ID 62)
  // Use random 5-char txid if not provided (per user script logic)
  const txidValue = txid || generateRandomId(5);
  const additionalData = formatField('62', formatField('05', txidValue));

  // 3. Base Payload Construction
  let payload = [
    formatField('00', '01'), // Payload Format Indicator
    info,
    formatField('52', '0000'), // Merchant Category Code
    formatField('53', '986'), // Transaction Currency (BRL)
    formatField('54', amount.toFixed(2)), // Transaction Amount
    formatField('58', 'BR'), // Country Code
    formatField('59', name.substring(0, 25)), // Merchant Name
    formatField('60', city.substring(0, 15)), // Merchant City
    additionalData,
  ].join('');

  // 4. CRC Placeholder
  payload += '6304';

  // 5. Final CRC Calculation
  const crc = calculateCRC16(payload);
  return `${payload}${crc}`;
}
