import { defineMiddleware } from 'astro:middleware';
import { validateSession, SESSION_COOKIE_NAME } from '../lib/auth/session';
import { generateCsrfToken, verifyCsrfToken, verifyOriginAndReferer, CSRF_HEADER_NAME, CSRF_FIELD_NAME, CSRF_COOKIE_NAME } from '../lib/security/csrf';
import { applySecurityHeaders } from '../lib/security/headers';
import { rateLimiter } from '../lib/security/rate-limit';
import { getClientIp } from '../lib/security/sanitize';
import { errorResponse } from '../lib/utils/response';


const PUBLIC_PATHS = [
  '/login',
  '/offline',
  '/healthz',
  '/manifest.webmanifest',
  '/sw.js',
  '/favicon.svg',
  '/api/auth/login'
];

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, url, cookies } = context;
  const pathname = url.pathname;

  
  const clientIp = getClientIp(request);
  context.locals.clientIp = clientIp;

  
  if (
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/styles/') ||
    pathname.startsWith('/_astro/') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.js')
  ) {
    const res = await next();
    applySecurityHeaders(res.headers);
    return res;
  }

  
  if (pathname.startsWith('/api/') && pathname !== '/healthz' && pathname !== '/api/auth/login') {
    const limitResult = rateLimiter.checkApiLimit(clientIp);
    if (!limitResult.allowed) {
      return errorResponse('請求過於頻繁，請稍候片刻再試 (429 Too Many Requests)', 429);
    }
  }

  
  const sessionCookie = cookies.get(SESSION_COOKIE_NAME)?.value;
  const sessionData = sessionCookie ? validateSession(sessionCookie) : null;

  context.locals.session = sessionData;
  context.locals.user = sessionData ? sessionData.user : null;

  
  const effectiveSessionId = sessionData ? sessionData.sessionId : (cookies.get(CSRF_COOKIE_NAME)?.value || 'anon');
  let csrfToken = generateCsrfToken(effectiveSessionId);
  context.locals.csrfToken = csrfToken;

  
  if (!sessionData && !cookies.get(CSRF_COOKIE_NAME)?.value) {
    cookies.set(CSRF_COOKIE_NAME, effectiveSessionId, {
      path: '/',
      httpOnly: true,
      secure: url.protocol === 'https:',
      sameSite: 'lax',
      maxAge: 3600
    });
  }

  
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (!sessionData) {
    if (!isPublic) {
      if (pathname.startsWith('/api/')) {
        return errorResponse('未經授權，請先登入 (401 Unauthorized)', 401);
      }
      return context.redirect('/login');
    }
  } else {
    
    if (pathname === '/login') {
      if (sessionData.user.must_change_password) {
        return context.redirect('/change-password');
      }
      if (sessionData.user.role === 'student') return context.redirect('/student');
      if (sessionData.user.role === 'teacher') return context.redirect('/review');
      if (sessionData.user.role === 'admin') return context.redirect('/admin');
    }

    
    if (sessionData.user.must_change_password === 1) {
      const allowedPasswordPaths = [
        '/change-password',
        '/api/auth/change-password',
        '/api/auth/logout'
      ];
      if (!allowedPasswordPaths.includes(pathname)) {
        if (pathname.startsWith('/api/')) {
          return errorResponse('首次登入請先修改預設密碼方可使用系統', 403);
        }
        return context.redirect('/change-password');
      }
    }

    
    const role = sessionData.user.role;

    if (pathname.startsWith('/student') && role !== 'student' && role !== 'admin') {
      return context.redirect('/review');
    }

    if (pathname.startsWith('/review') && role !== 'teacher' && role !== 'admin') {
      return context.redirect('/student');
    }

    if (pathname.startsWith('/admin') && role !== 'admin') {
      return errorResponse('權限不足，需要管理員權限 (403 Forbidden)', 403);
    }

    if (pathname.startsWith('/stats') && role !== 'teacher' && role !== 'admin') {
      return context.redirect('/student');
    }
  }

  
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    
    if (!verifyOriginAndReferer(request)) {
      return errorResponse('來源請求無效或跨域限制 (Cross-Origin Request Blocked)', 403);
    }

    
    if (pathname !== '/api/auth/login') {
      const headerToken = request.headers.get(CSRF_HEADER_NAME);
      let formToken: string | null = null;

      
      const contentType = request.headers.get('content-type') || '';
      if (!headerToken && (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data'))) {
        try {
          const cloneReq = request.clone();
          const formData = await cloneReq.formData();
          formToken = formData.get(CSRF_FIELD_NAME) as string | null;
        } catch {
          
        }
      }

      const receivedToken = headerToken || formToken;
      const isValidCsrf = verifyCsrfToken(receivedToken, effectiveSessionId);

      if (!isValidCsrf) {
        return errorResponse('CSRF Token 驗證失敗或過期，請重新整理頁面 (403 CSRF Failure)', 403);
      }
    }
  }

  
  const response = await next();

  
  applySecurityHeaders(response.headers);

  return response;
});
