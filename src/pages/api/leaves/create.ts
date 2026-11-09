import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createLeaveRequest, checkDuplicateLeave } from '../../../db/queries/leaves';
import { getCoursesForStudent } from '../../../db/queries/courses';
import { validateAndSaveFile } from '../../../lib/security/upload';
import { rateLimiter } from '../../../lib/security/rate-limit';
import { errorResponse, successResponse } from '../../../lib/utils/response';
import type { LeaveTypeCode } from '../../../config/constants';

const leaveCreateSchema = z.object({
  courseId: z.string().min(1, '請選擇欲請假的課程'),
  leaveType: z.enum(['sick', 'personal', 'official', 'bereavement', 'other'], {
    errorMap: () => ({ message: '請選擇有效的假別' })
  }),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '開始日期格式需為 YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '結束日期格式需為 YYYY-MM-DD'),
  periods: z.array(z.number().int().min(1).max(14)).min(1, '請至少選擇一個請假節次'),
  reason: z.string().min(3, '請假事由不得少於 3 個字元').max(1000, '事由長度上限為 1000 字元')
}).refine((data) => data.endDate >= data.startDate, {
  message: '結束日期不得早於開始日期',
  path: ['endDate']
});

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user || (user.role !== 'student' && user.role !== 'admin')) {
    return errorResponse('權限不足，僅有學生可提出請假申請', 403);
  }

  const clientIp = locals.clientIp || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || 'Unknown';

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse('無效的表單資料', 400);
  }

  
  let periodsArr: number[] = [];
  const rawPeriods = formData.getAll('periods');
  if (rawPeriods.length > 0) {
    periodsArr = rawPeriods.map((p) => Number(p)).filter((n) => !isNaN(n));
  } else {
    const singlePeriods = formData.get('periods');
    if (singlePeriods) {
      try {
        periodsArr = JSON.parse(singlePeriods as string);
      } catch {
        periodsArr = [Number(singlePeriods)].filter((n) => !isNaN(n));
      }
    }
  }

  const payload = {
    courseId: formData.get('courseId') as string,
    leaveType: formData.get('leaveType') as any,
    startDate: formData.get('startDate') as string,
    endDate: formData.get('endDate') as string,
    periods: periodsArr,
    reason: formData.get('reason') as string
  };

  const parsed = leaveCreateSchema.safeParse(payload);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return errorResponse(firstIssue ? firstIssue.message : '請假申請資料有誤', 400);
  }

  const data = parsed.data;

  
  const enrolledCourses = getCoursesForStudent(user.id);
  const isEnrolled = enrolledCourses.some((c) => c.id === data.courseId);
  if (!isEnrolled && user.role !== 'admin') {
    return errorResponse('您並未選修此門課程，無法送出請假單', 403);
  }

  
  const isDuplicate = checkDuplicateLeave(
    user.id,
    data.courseId,
    data.startDate,
    data.endDate,
    data.periods
  );
  if (isDuplicate) {
    return errorResponse('您已在相同課堂時段送出過待審核或已核准的請假單，請勿重複申請', 409);
  }

  
  let attachmentMeta: any = null;
  const file = formData.get('attachment') as File | null;
  if (file && file.size > 0 && file.name) {
    
    const uploadCheck = rateLimiter.checkUploadLimit(clientIp);
    if (!uploadCheck.allowed) {
      return errorResponse('附件上傳次數過於頻繁（上限 10 次 / 10 分鐘），請稍後再試', 429);
    }

    try {
      attachmentMeta = await validateAndSaveFile(file);
    } catch (fileErr: any) {
      return errorResponse(fileErr.message || '檔案上傳驗證失敗', 400);
    }
  }

  
  try {
    const leaveId = await createLeaveRequest(
      {
        studentId: user.id,
        courseId: data.courseId,
        leaveType: data.leaveType as LeaveTypeCode,
        startDate: data.startDate,
        endDate: data.endDate,
        periods: data.periods,
        reason: data.reason,
        attachment: attachmentMeta
      },
      {
        ipAddress: clientIp,
        userAgent
      }
    );

    return successResponse({
      message: '請假申請已成功送出！',
      leaveId
    });
  } catch (err: any) {
    return errorResponse(err.message || '請假申請送出失敗，請重試', 500);
  }
};
