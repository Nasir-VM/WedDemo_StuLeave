import type { APIRoute } from 'astro';
import { getExportData } from '../../db/queries/stats';
import { generateSafeCsv } from '../../lib/security/sanitize';
import { errorResponse } from '../../lib/utils/response';
import { LEAVE_TYPES, LEAVE_STATUS } from '../../config/constants';

export const GET: APIRoute = async ({ url, locals }) => {
  const user = locals.user;
  if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
    return errorResponse('權限不足，僅有教師或管理員可匯出報表', 403);
  }

  const searchParams = url.searchParams;
  const filter = {
    teacherId: user.role === 'teacher' ? user.id : undefined,
    departmentId: searchParams.get('departmentId') || undefined,
    courseId: searchParams.get('courseId') || undefined,
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined
  };

  const rows = getExportData(filter);

  const headers = [
    '假單編號',
    '學號',
    '學生姓名',
    '所屬系所',
    '課程代碼',
    '課程名稱',
    '授課教師',
    '假別',
    '開始日期',
    '結束日期',
    '節次',
    '請假事由',
    '審核狀態',
    '審核意見',
    '審核人員',
    '審核時間',
    '申請時間'
  ];

  const dataRows = rows.map((r) => {
    let parsedPeriods = '';
    try {
      const p = JSON.parse(r.periods);
      parsedPeriods = p.join('、');
    } catch {
      parsedPeriods = r.periods;
    }

    const typeLabel = (LEAVE_TYPES as any)[r.leave_type]?.label || r.leave_type;
    const statusLabel = (LEAVE_STATUS as any)[r.status]?.label || r.status;

    return [
      r.id,
      r.student_id,
      r.student_name,
      r.department_name || '',
      r.course_id,
      r.course_name,
      r.teacher_name,
      typeLabel,
      r.start_date,
      r.end_date,
      parsedPeriods,
      r.reason,
      statusLabel,
      r.review_comment || '',
      r.reviewer_name || '',
      r.reviewed_at || '',
      r.created_at
    ];
  });

  const csvContent = generateSafeCsv(headers, dataRows);
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `leave_records_${timestamp}.csv`;

  return new Response(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Content-Type-Options': 'nosniff'
    }
  });
};
