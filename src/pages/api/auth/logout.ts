import type { APIRoute } from 'astro';
import { invalidateSession, SESSION_COOKIE_NAME } from '../../../lib/auth/session';
import { logAudit } from '../../../lib/utils/audit';
import { successResponse } from '../../../lib/utils/response';

export const POST: APIRoute = async ({ cookies, locals, request }) => {
  const sessionToken = cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = locals.user;
  const clientIp = locals.clientIp || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || 'Unknown';

  if (sessionToken) {
    invalidateSession(sessionToken);
  }

  cookies.delete(SESSION_COOKIE_NAME, { path: '/' });

  if (user) {
    await logAudit({
      userId: user.id,
      action: 'LOGOUT',
      targetType: 'session',
      targetId: user.id,
      details: { role: user.role },
      ipAddress: clientIp,
      userAgent
    });
  }

  return successResponse({ message: '已安全登出', redirect: '/login' });
};
