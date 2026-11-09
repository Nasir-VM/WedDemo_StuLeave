export function applySecurityHeaders(headers: Headers): void {
  
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", 
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');

  headers.set('Content-Security-Policy', csp);

  
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  
  headers.set('X-Content-Type-Options', 'nosniff');

  
  headers.set('X-Frame-Options', 'DENY');

  
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');
}
