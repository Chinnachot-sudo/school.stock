/**
 * Thai PromptPay EMVCo QR Code Payload Generator
 * Complies with Bank of Thailand & EMVCo QR standard.
 */

function formatField(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${tag}${len}${value}`;
}

function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xff;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function generatePromptPayPayload(target: string, amount?: number): string {
  // Sanitize target (remove hyphens, spaces)
  const cleaned = target.replace(/[^0-9]/g, '');

  let recipientSubField = '';
  if (cleaned.length === 10) {
    // Mobile number: convert '08xxxxxxxx' to '00668xxxxxxxx'
    const promptPayPhone = `0066${cleaned.slice(1)}`;
    recipientSubField = formatField('01', promptPayPhone);
  } else if (cleaned.length === 13) {
    // National ID or Tax ID
    recipientSubField = formatField('02', cleaned);
  } else {
    // Default fallback (e.g. standard school merchant or demo)
    const promptPayPhone = `0066${cleaned.padEnd(10, '0').slice(1, 10)}`;
    recipientSubField = formatField('01', promptPayPhone);
  }

  // Tag 29: Merchant Account Information - PromptPay
  const aid = formatField('00', 'A000000677010111');
  const tag29 = formatField('29', `${aid}${recipientSubField}`);

  // Base fields
  let payload = '';
  payload += formatField('00', '01'); // Format indicator
  payload += formatField('01', amount && amount > 0 ? '12' : '11'); // 12 = Dynamic (with amount), 11 = Static
  payload += tag29;
  payload += formatField('53', '764'); // Currency THB

  if (amount !== undefined && amount > 0) {
    payload += formatField('54', amount.toFixed(2));
  }

  payload += formatField('58', 'TH'); // Country code TH

  // Append checksum tag "6304" and compute CRC16
  const dataToCrc = `${payload}6304`;
  const checksum = crc16(dataToCrc);

  return `${dataToCrc}${checksum}`;
}
