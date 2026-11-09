import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getUserByIdOrEmail } from '../../../db/queries/users';
import { verifyPassword } from '../../../lib/auth/password';
import { createSession, SESSION_COOKIE_NAME } from '../../../lib/auth/session';
import { rateLimiter } from '../../../lib/security/rate-limit';
import { logAudit } from '../../../lib/utils/audit';
import { errorResponse, successResponse } from '../../../lib/utils/response';

const loginSchema = z.object({
  username: z.string().min(1, '請輸入學號、教職員號或電子信箱').max(100),
  password: z.string().min(1, '請輸入密碼').max(100)
});

export const POST: APIRoute = async ({ request, cookies, locals, url }) => {
  const clientIp = locals.clientIp || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || 'Unknown';

  let body: any;
  try {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      const formData = await request.formData();
      body = {
        username: formData.get('username'),
        password: formData.get('password')
      };
    }
  } catch {
    return errorResponse('無效的請求格式', 400);
  }

  const parseResult = loginSchema.safeParse(body);
  if (!parseResult.success) {
    const issue = parseResult.error.issues[0];
    return errorResponse(issue ? issue.message : '輸入資料有誤', 400);
  }

  const { username, password } = parseResult.data;

  
  const rateCheck = rateLimiter.checkLoginLimit(clientIp, username);
  if (!rateCheck.allowed) {
    return errorResponse(rateCheck.reason || '嘗試登入過於頻繁，請稍後再試', 429);
  }

  
  const user = getUserByIdOrEmail(username);

  
  let isPasswordValid = false;
  if (user) {
    isPasswordValid = await verifyPassword(user.password_hash, password);
  } else {
    
    await verifyPassword('$argon2id$v=19$m=19456,t=2,p=1$dummyhashvalforsecuritytimingsafeness$abcdef', password);
  }

  if (!user || !isPasswordValid) {
    const failInfo = rateLimiter.recordLoginFailure(clientIp, username);
    
    await logAudit({
      userId: user ? user.id : null,
      action: 'LOGIN_FAILURE',
      targetType: 'session',
      targetId: username,
      details: { reason: '帳號或密碼錯誤', locked: failInfo.locked, attempts: failInfo.failedCount },
      ipAddress: clientIp,
      userAgent
    });

    if (failInfo.locked) {
      return errorResponse('連續嘗試錯誤已達上限，帳號已被鎖定 15 分鐘，請稍後再試。', 429);
    }

    return errorResponse('帳號或密碼不正確，請重新輸入', 401);
  }

  
  if (!user.is_active) {
    return errorResponse('此帳號已被停用，請聯絡系統管理員', 403);
  }

  
  rateLimiter.recordLoginSuccess(clientIp, username);

  
  const newSessionToken = await createSession(user.id, clientIp, userAgent);

  
  cookies.set(SESSION_COOKIE_NAME, newSessionToken, {
    path: '/',
    httpOnly: true,
    secure: url.protocol === 'https:',
    sameSite: 'lax',
    maxAge: 30 * 60 
  });

  
  await logAudit({
    userId: user.id,
    action: 'LOGIN_SUCCESS',
    targetType: 'session',
    targetId: user.id,
    details: { role: user.role, mustChangePassword: user.must_change_password },
    ipAddress: clientIp,
    userAgent
  });

  
  let redirectUrl = '/student';
  if (user.must_change_password === 1) {
    redirectUrl = '/change-password';
  } else if (user.role === 'teacher') {
    redirectUrl = '/review';
  } else if (user.role === 'admin') {
    redirectUrl = '/admin';
  }

  return successResponse({
    userId: user.id,
    name: user.name,
    role: user.role,
    must_change_password: user.must_change_password === 1,
    redirect: redirectUrl
  });
};
