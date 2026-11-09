import type { APIRoute } from 'astro';
import { z } from 'zod';
import { withdrawLeaveRequest } from '../../../db/queries/leaves';
import { errorResponse, successResponse } from '../../../lib/utils/response';

const withdrawSchema = z.object({
  leaveId: z.string().min(1, '請指定請假單編號')
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
      body = { leaveId: formData.get('leaveId') };
    }
  } catch {
    return errorResponse('無效的請求資料', 400);
  }

  const parsed = withdrawSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message || '參數錯誤', 400);
  }

  try {
    await withdrawLeaveRequest(parsed.data.leaveId, user.id, {
      ipAddress: clientIp,
      userAgent
    });

    return successResponse({ message: '請假單已成功撤回' });
  } catch (err: any) {
    return errorResponse(err.message || '撤回失敗', 400);
  }
};
