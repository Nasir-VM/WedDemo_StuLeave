import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getUserById, updateUserPassword } from '../../../db/queries/users';
import { verifyPassword, hashPassword } from '../../../lib/auth/password';
import { logAudit } from '../../../lib/utils/audit';
import { errorResponse, successResponse } from '../../../lib/utils/response';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().optional().default(''),
    newPassword: z
      .string()
      .min(8, '新密碼長度不得少於 8 碼')
      .max(100)
      .regex(/[A-Z]/, '新密碼需包含至少一個大寫英文字母')
      .regex(/[a-z]/, '新密碼需包含至少一個小寫英文字母')
      .regex(/[0-9]/, '新密碼需包含至少一個數字')
      .regex(/[^A-Za-z0-9]/, '新密碼需包含至少一個特殊符號'),
    confirmPassword: z.string().min(1, '請輸入確認密碼')
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: '兩次輸入的新密碼不一致',
    path: ['confirmPassword']
  });

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) {
    return errorResponse('請先登入', 401);
  }

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
        currentPassword: formData.get('currentPassword'),
        newPassword: formData.get('newPassword'),
        confirmPassword: formData.get('confirmPassword')
      };
    }
  } catch {
    return errorResponse('無效的請求資料', 400);
  }

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return errorResponse(firstIssue ? firstIssue.message : '密碼設定不符安全規範', 400);
  }

  const { currentPassword, newPassword } = parsed.data;

  
  const dbUser = getUserById(user.id);
  if (!dbUser) {
    return errorResponse('使用者資料不存在', 404);
  }

  
  if (dbUser.must_change_password === 0 || currentPassword) {
    const isCurrentValid = await verifyPassword(dbUser.password_hash, currentPassword);
    if (!isCurrentValid) {
      return errorResponse('目前密碼不正確', 400);
    }
  }

  
  const isSameAsOld = await verifyPassword(dbUser.password_hash, newPassword);
  if (isSameAsOld) {
    return errorResponse('新密碼不得與舊密碼相同', 400);
  }

  
  const newHash = await hashPassword(newPassword);
  const updated = await updateUserPassword(user.id, newHash);

  if (!updated) {
    return errorResponse('密碼更新失敗，請稍候重試', 500);
  }

  
  user.must_change_password = 0;

  
  await logAudit({
    userId: user.id,
    action: 'CHANGE_PASSWORD',
    targetType: 'user',
    targetId: user.id,
    details: { wasFirstLogin: dbUser.must_change_password === 1 },
    ipAddress: clientIp,
    userAgent
  });

  
  let redirectUrl = '/student';
  if (user.role === 'teacher') redirectUrl = '/review';
  if (user.role === 'admin') redirectUrl = '/admin';

  return successResponse({
    message: '密碼已成功更新！',
    redirect: redirectUrl
  });
};
