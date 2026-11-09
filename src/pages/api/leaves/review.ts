import type { APIRoute } from 'astro';
import { z } from 'zod';
import { reviewLeaveRequest } from '../../../db/queries/leaves';
import { errorResponse, successResponse } from '../../../lib/utils/response';

const reviewSchema = z.object({
  leaveId: z.string().min(1, '請指定請假單編號'),
  decision: z.enum(['approved', 'rejected'], {
    errorMap: () => ({ message: '審核結果僅能為核准或駁回' })
  }),
  comment: z.string().optional().default('')
}).refine(
  (data) => {
    if (data.decision === 'rejected') {
      return data.comment && data.comment.trim().length > 0;
    }
    return true;
  },
  {
    message: '駁回申請時必須填寫審核意見（駁回理由）',
    path: ['comment']
  }
);

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
    return errorResponse('權限不足，僅有授課教師或管理員可進行審核', 403);
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
        leaveId: formData.get('leaveId'),
        decision: formData.get('decision'),
        comment: formData.get('comment')
      };
    }
  } catch {
    return errorResponse('無效的請求資料', 400);
  }

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return errorResponse(firstIssue ? firstIssue.message : '審核輸入有誤', 400);
  }

  const { leaveId, decision, comment } = parsed.data;

  try {
    await reviewLeaveRequest(
      leaveId,
      user.id,
      user.role,
      decision,
      comment,
      { ipAddress: clientIp, userAgent }
    );

    return successResponse({
      message: `請假單已成功${decision === 'approved' ? '核准' : '駁回'}`
    });
  } catch (err: any) {
    return errorResponse(err.message || '審核操作失敗', 400);
  }
};
