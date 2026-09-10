/**
 * Converts a number to Thai Baht text (e.g. 150.00 -> หนึ่งร้อยห้าสิบบาทถ้วน)
 */
export function thaiBahtText(num: number): string {
  if (isNaN(num) || num === 0) return 'ศูนย์บาทถ้วน';

  const numbers = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const units = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

  const convertSection = (nStr: string): string => {
    let result = '';
    const len = nStr.length;
    for (let i = 0; i < len; i++) {
      const digit = parseInt(nStr.charAt(i), 10);
      const pos = len - i - 1;
      if (digit !== 0) {
        if (pos === 0 && digit === 1 && len > 1 && nStr.charAt(len - 2) !== '0') {
          result += 'เอ็ด';
        } else if (pos === 1 && digit === 1) {
          result += ''; // 'สิบ' instead of 'หนึ่งสิบ'
        } else if (pos === 1 && digit === 2) {
          result += 'ยี่';
        } else {
          result += numbers[digit];
        }
        result += units[pos];
      }
    }
    return result;
  };

  const [bahtStr, satangStr = '00'] = Math.abs(num).toFixed(2).split('.');
  let bahtText = '';

  if (parseInt(bahtStr, 10) === 0) {
    bahtText = 'ศูนย์';
  } else {
    // Handle millions
    let remaining = bahtStr;
    const parts: string[] = [];
    while (remaining.length > 0) {
      parts.unshift(remaining.slice(-6));
      remaining = remaining.slice(0, -6);
    }
    for (let i = 0; i < parts.length; i++) {
      const converted = convertSection(parts[i]);
      if (converted) {
        bahtText += converted;
        if (i < parts.length - 1) bahtText += 'ล้าน';
      }
    }
  }

  bahtText += 'บาท';

  const satang = parseInt(satangStr, 10);
  if (satang === 0) {
    bahtText += 'ถ้วน';
  } else {
    bahtText += convertSection(satangStr) + 'สตางค์';
  }

  return (num < 0 ? 'ลบ' : '') + bahtText;
}
