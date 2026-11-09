import type { APIRoute } from 'astro';
import { z } from 'zod';
import { batchReviewLeaveRequests } from '../../../db/queries/leaves';
import { errorResponse, successResponse } from '../../../lib/utils/response';

const batchReviewSchema = z.object({
  leaveIds: z.array(z.string().min(1)).min(1, '請至少選取一筆請假單').max(100, '單次批次審核上限 100 筆'),
  decision: z.enum(['approved', 'rejected']),
  comment: z.string().optional().default('')
}).refine(
  (data) => {
    if (data.decision === 'rejected') {
      return data.comment && data.comment.trim().length > 0;
    }
    return true;
  },
  {
    message: '批次駁回時必須填寫審核意見',
    path: ['comment']
  }
);

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
    return errorResponse('權限不足，僅有授課教師或管理員可進行批次審核', 403);
  }

  const clientIp = locals.clientIp || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || 'Unknown';

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse('無效的 JSON 請求格式', 400);
  }

  const parsed = batchReviewSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return errorResponse(firstIssue ? firstIssue.message : '審核資料格式錯誤', 400);
  }

  const { leaveIds, decision, comment } = parsed.data;

  try {
    const result = await batchReviewLeaveRequests(
      leaveIds,
      user.id,
      user.role,
      decision,
      comment,
      { ipAddress: clientIp, userAgent }
    );

    return successResponse({
      message: `批次審核完成：成功 ${result.successCount} 筆，略過或無權限 ${result.failureCount} 筆`,
      ...result
    });
  } catch (err: any) {
    return errorResponse(err.message || '批次審核失敗', 400);
  }
};
