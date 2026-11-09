import { env } from '../../config/env';





export function sanitizeCsvField(value: any): string {
  if (value === null || value === undefined) return '""';

  let str = String(value);

  
  const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];
  if (dangerousPrefixes.some((p) => str.startsWith(p))) {
    str = `'${str}`;
  }

  
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}




export function generateSafeCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const headerRow = headers.map(sanitizeCsvField).join(',');
  const dataRows = rows.map((row) => row.map(sanitizeCsvField).join(',')).join('\r\n');
  
  
  const BOM = '\uFEFF';
  return BOM + headerRow + '\r\n' + dataRows;
}




export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}





export function getClientIp(request: Request): string {
  if (env.TRUST_PROXY) {
    const cfIp = request.headers.get('cf-connecting-ip');
    if (cfIp) return cfIp.trim();

    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      const firstIp = forwarded.split(',')[0].trim();
      if (firstIp) return firstIp;
    }
  }

  return '127.0.0.1';
}
