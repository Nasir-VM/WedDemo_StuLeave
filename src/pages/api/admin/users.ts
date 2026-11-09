import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createUser, toggleUserActive, getUserById } from '../../../db/queries/users';
import { hashPassword } from '../../../lib/auth/password';
import { errorResponse, successResponse } from '../../../lib/utils/response';
import { logAudit } from '../../../lib/utils/audit';
import type { UserRole } from '../../../config/constants';

const createUserSchema = z.object({
  action: z.literal('create'),
  id: z.string().min(1, '請輸入學號/教職員號').max(50),
  name: z.string().min(1, '請輸入姓名').max(50),
  email: z.string().email('請輸入合法的電子信箱'),
  role: z.enum(['student', 'teacher', 'admin']),
  departmentId: z.string().optional().nullable(),
  initialPassword: z.string().min(8, '初始密碼長度至少需 8 碼')
});

const toggleUserSchema = z.object({
  action: z.literal('toggleActive'),
  userId: z.string().min(1),
  isActive: z.boolean()
});

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user || user.role !== 'admin') {
    return errorResponse('權限不足，僅有管理員可操作使用者管理', 403);
  }

  const clientIp = locals.clientIp || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || 'Unknown';

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse('無效的 JSON 請求格式', 400);
  }

  if (body.action === 'create') {
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message || '輸入資料有誤', 400);
    }
    const data = parsed.data;

    
    const existing = getUserById(data.id);
    if (existing) {
      return errorResponse('該學號/教職員號已被註冊使用', 409);
    }

    const hash = await hashPassword(data.initialPassword);
    await createUser({
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role as UserRole,
      department_id: data.departmentId || null,
      password_hash: hash,
      must_change_password: 1
    });

    await logAudit({
      userId: user.id,
      action: 'ADMIN_CREATE_USER',
      targetType: 'user',
      targetId: data.id,
      details: { role: data.role, email: data.email },
      ipAddress: clientIp,
      userAgent
    });

    return successResponse({ message: '使用者已成功建立！' });
  }

  if (body.action === 'toggleActive') {
    const parsed = toggleUserSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message || '參數有誤', 400);
    }

    const { userId, isActive } = parsed.data;
    if (userId === user.id) {
      return errorResponse('不可停用自己的管理員帳號', 400);
    }

    await toggleUserActive(userId, isActive ? 1 : 0);

    await logAudit({
      userId: user.id,
      action: isActive ? 'ENABLE_USER' : 'DISABLE_USER',
      targetType: 'user',
      targetId: userId,
      details: { isActive },
      ipAddress: clientIp,
      userAgent
    });

    return successResponse({ message: `帳號已${isActive ? '啟用' : '停用'}` });
  }

  return errorResponse('不支援的操作類型', 400);
};
