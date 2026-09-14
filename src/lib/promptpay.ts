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

/**
 * Official Bangkok Bank PromptPay Bill Payment QR Code Generator
 * for Roong Aroon International School.
 * Decoded directly from physical payment stand:
 * - Biller: ROONG AROON INTERNATIONAL
 * - Tax ID / Biller ID: 010753600037403
 * - Ref 1 (Mid): 002203089172
 * - Ref 2 (Tid): 43008918
 */
export function generateSchoolPromptPayPayload(amount?: number): string {
  let payload = '';
  payload += formatField('00', '01'); // Format indicator
  payload += formatField('01', amount && amount > 0 ? '12' : '11'); // 12 = Dynamic, 11 = Static
  payload += formatField('15', '2676076426760764000002203089172');
  payload += formatField('30', '0016A0000006770101120115010753600037403021500000220308917203194300891811109150202');
  payload += formatField('52', '0000'); // Merchant Category Code
  payload += formatField('53', '764'); // Currency THB
  if (amount !== undefined && amount > 0) {
    payload += formatField('54', amount.toFixed(2)); // Auto-filled amount
  }
  payload += formatField('58', 'TH'); // Country code
  payload += formatField('59', 'ROONG AROON INTERNATIONAL'); // Merchant Name
  payload += formatField('60', 'BANGKOK'); // Merchant City
  payload += formatField('61', '10150'); // Postal Code
  payload += formatField('62', '070843008918'); // Additional Data (TID)
  const dataToCrc = `${payload}6304`;
  return `${dataToCrc}${crc16(dataToCrc)}`;
}
