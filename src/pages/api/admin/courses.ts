import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createCourse, enrollStudent, getCourseById } from '../../../db/queries/courses';
import { getUserById } from '../../../db/queries/users';
import { errorResponse, successResponse } from '../../../lib/utils/response';
import { logAudit } from '../../../lib/utils/audit';

const createCourseSchema = z.object({
  action: z.literal('createCourse'),
  id: z.string().min(1, '請輸入課程代碼').max(20),
  name: z.string().min(1, '請輸入課程名稱').max(100),
  departmentId: z.string().min(1, '請選擇開課系所'),
  teacherId: z.string().min(1, '請指定授課教師代號'),
  academicYear: z.string().min(1, '請輸入學年期 (如 113-1)'),
  weekday: z.number().int().min(1).max(7),
  startPeriod: z.number().int().min(1).max(14),
  endPeriod: z.number().int().min(1).max(14)
}).refine((data) => data.endPeriod >= data.startPeriod, {
  message: '結束節次不得小於開始節次',
  path: ['endPeriod']
});

const enrollSchema = z.object({
  action: z.literal('enroll'),
  courseId: z.string().min(1),
  studentId: z.string().min(1)
});

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user || user.role !== 'admin') {
    return errorResponse('權限不足，僅有管理員可管理課程', 403);
  }

  const clientIp = locals.clientIp || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || 'Unknown';

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse('無效的 JSON 請求格式', 400);
  }

  if (body.action === 'createCourse') {
    const parsed = createCourseSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message || '輸入資料有誤', 400);
    }
    const data = parsed.data;

    
    const teacher = getUserById(data.teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return errorResponse('指定的教師代碼不存在或非教師角色', 400);
    }

    const existingCourse = getCourseById(data.id);
    if (existingCourse) {
      return errorResponse('此課程代碼已存在', 409);
    }

    await createCourse({
      id: data.id,
      name: data.name,
      department_id: data.departmentId,
      teacher_id: data.teacherId,
      academic_year: data.academicYear,
      weekday: data.weekday,
      start_period: data.startPeriod,
      end_period: data.endPeriod
    });

    await logAudit({
      userId: user.id,
      action: 'ADMIN_CREATE_COURSE',
      targetType: 'course',
      targetId: data.id,
      details: { name: data.name, teacherId: data.teacherId },
      ipAddress: clientIp,
      userAgent
    });

    return successResponse({ message: '課程已成功建立！' });
  }

  if (body.action === 'enroll') {
    const parsed = enrollSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message || '參數有誤', 400);
    }
    const { courseId, studentId } = parsed.data;

    const student = getUserById(studentId);
    if (!student || student.role !== 'student') {
      return errorResponse('指定學生不存在或非學生角色', 400);
    }

    const course = getCourseById(courseId);
    if (!course) {
      return errorResponse('指定課程不存在', 400);
    }

    await enrollStudent(courseId, studentId);

    await logAudit({
      userId: user.id,
      action: 'ADMIN_ENROLL_STUDENT',
      targetType: 'course_enrollment',
      targetId: `${courseId}:${studentId}`,
      details: { courseId, studentId },
      ipAddress: clientIp,
      userAgent
    });

    return successResponse({ message: '學生選課註冊成功！' });
  }

  return errorResponse('不支援的操作類型', 400);
};
