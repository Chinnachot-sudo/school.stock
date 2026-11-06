/** Extract an inventory code from plain barcode text or a QR URL. */
export function extractScannedCode(raw: string): string {
  let value = raw.trim();

  // Some scanner/browser combinations return a URL-encoded URL.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const decoded = decodeURIComponent(value.replace(/\+/g, '%20'));
      if (decoded === value) break;
      value = decoded.trim();
    } catch {
      break;
    }
  }

  try {
    const url = new URL(value);
    const code = [...url.searchParams.entries()].find(([key]) => key.toLowerCase() === 'code')?.[1];
    if (code) return code.trim();
  } catch {
    // A plain barcode or a non-URL scanner payload is valid input too.
  }

  const match = value.match(/[?&]code=([^&#]+)/i);
  if (match) {
    try {
      return decodeURIComponent(match[1].replace(/\+/g, '%20')).trim();
    } catch {
      return match[1].trim();
    }
  }

  return value;
}
