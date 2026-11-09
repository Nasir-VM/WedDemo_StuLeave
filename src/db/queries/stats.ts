import { getDb } from '../index';
import { LEAVE_TYPES } from '../../config/constants';

export interface StatsFilter {
  teacherId?: string;
  departmentId?: string;
  courseId?: string;
  startDate?: string;
  endDate?: string;
}

export function getOverviewStats(filter: StatsFilter = {}) {
  const db = getDb();
  const params: any[] = [];
  const whereClauses: string[] = [];

  if (filter.teacherId) {
    whereClauses.push('c.teacher_id = ?');
    params.push(filter.teacherId);
  }
  if (filter.departmentId) {
    whereClauses.push('c.department_id = ?');
    params.push(filter.departmentId);
  }
  if (filter.courseId) {
    whereClauses.push('lr.course_id = ?');
    params.push(filter.courseId);
  }
  if (filter.startDate) {
    whereClauses.push('lr.end_date >= ?');
    params.push(filter.startDate);
  }
  if (filter.endDate) {
    whereClauses.push('lr.start_date <= ?');
    params.push(filter.endDate);
  }

  const baseWhere = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  
  const weekQuery = `
    SELECT COUNT(*) as count 
    FROM leave_requests lr
    JOIN courses c ON lr.course_id = c.id
    ${baseWhere ? `${baseWhere} AND` : 'WHERE'} lr.created_at >= date('now', 'weekday 0', '-6 days')
  `;
  const weekCount = (db.prepare(weekQuery).get(...params) as any)?.count || 0;

  
  const monthQuery = `
    SELECT COUNT(*) as count 
    FROM leave_requests lr
    JOIN courses c ON lr.course_id = c.id
    ${baseWhere ? `${baseWhere} AND` : 'WHERE'} lr.created_at >= date('now', 'start of month')
  `;
  const monthCount = (db.prepare(monthQuery).get(...params) as any)?.count || 0;

  
  const pendingQuery = `
    SELECT COUNT(*) as count 
    FROM leave_requests lr
    JOIN courses c ON lr.course_id = c.id
    ${baseWhere ? `${baseWhere} AND` : 'WHERE'} lr.status = 'pending'
  `;
  const pendingCount = (db.prepare(pendingQuery).get(...params) as any)?.count || 0;

  
  const approvalQuery = `
    SELECT 
      SUM(CASE WHEN lr.status = 'approved' THEN 1 ELSE 0 END) as approved_count,
      SUM(CASE WHEN lr.status IN ('approved', 'rejected') THEN 1 ELSE 0 END) as total_reviewed
    FROM leave_requests lr
    JOIN courses c ON lr.course_id = c.id
    ${baseWhere}
  `;
  const approvalRow = (db.prepare(approvalQuery).get(...params) as any) || { approved_count: 0, total_reviewed: 0 };
  const approvalRate = approvalRow.total_reviewed > 0
    ? Math.round((approvalRow.approved_count / approvalRow.total_reviewed) * 100)
    : 100;

  return {
    weekCount,
    monthCount,
    pendingCount,
    approvalRate,
    totalReviewed: approvalRow.total_reviewed || 0
  };
}




export function getLeaveTypeDistribution(filter: StatsFilter = {}) {
  const db = getDb();
  const params: any[] = [];
  const whereClauses: string[] = [];

  if (filter.teacherId) {
    whereClauses.push('c.teacher_id = ?');
    params.push(filter.teacherId);
  }
  if (filter.departmentId) {
    whereClauses.push('c.department_id = ?');
    params.push(filter.departmentId);
  }
  if (filter.courseId) {
    whereClauses.push('lr.course_id = ?');
    params.push(filter.courseId);
  }
  if (filter.startDate) {
    whereClauses.push('lr.end_date >= ?');
    params.push(filter.startDate);
  }
  if (filter.endDate) {
    whereClauses.push('lr.start_date <= ?');
    params.push(filter.endDate);
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const rows = db.prepare(`
    SELECT lr.leave_type, COUNT(*) as count
    FROM leave_requests lr
    JOIN courses c ON lr.course_id = c.id
    ${whereStr}
    GROUP BY lr.leave_type
  `).all(...params) as { leave_type: string; count: number }[];

  const countMap = new Map(rows.map((r) => [r.leave_type, r.count]));

  return Object.entries(LEAVE_TYPES).map(([typeKey, info]) => ({
    type: typeKey,
    label: info.label,
    count: countMap.get(typeKey) || 0
  }));
}




export function getMonthlyTrends(filter: StatsFilter = {}) {
  const db = getDb();
  const params: any[] = [];
  const whereClauses: string[] = [];

  if (filter.teacherId) {
    whereClauses.push('c.teacher_id = ?');
    params.push(filter.teacherId);
  }
  if (filter.departmentId) {
    whereClauses.push('c.department_id = ?');
    params.push(filter.departmentId);
  }
  if (filter.courseId) {
    whereClauses.push('lr.course_id = ?');
    params.push(filter.courseId);
  }

  whereClauses.push(`lr.created_at >= date('now', '-5 months', 'start of month')`);
  const whereStr = `WHERE ${whereClauses.join(' AND ')}`;

  const rows = db.prepare(`
    SELECT strftime('%Y-%m', lr.created_at) as month, COUNT(*) as count
    FROM leave_requests lr
    JOIN courses c ON lr.course_id = c.id
    ${whereStr}
    GROUP BY month
    ORDER BY month ASC
  `).all(...params) as { month: string; count: number }[];

  return rows;
}




export function getCourseRankings(filter: StatsFilter = {}) {
  const db = getDb();
  const params: any[] = [];
  const whereClauses: string[] = [];

  if (filter.teacherId) {
    whereClauses.push('c.teacher_id = ?');
    params.push(filter.teacherId);
  }
  if (filter.departmentId) {
    whereClauses.push('c.department_id = ?');
    params.push(filter.departmentId);
  }
  if (filter.startDate) {
    whereClauses.push('lr.end_date >= ?');
    params.push(filter.startDate);
  }
  if (filter.endDate) {
    whereClauses.push('lr.start_date <= ?');
    params.push(filter.endDate);
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const rows = db.prepare(`
    SELECT 
      c.id as course_id,
      c.name as course_name,
      COUNT(lr.id) as count
    FROM courses c
    LEFT JOIN leave_requests lr ON c.id = lr.course_id
    ${whereStr}
    GROUP BY c.id
    ORDER BY count DESC
    LIMIT 8
  `).all(...params) as { course_id: string; course_name: string; count: number }[];

  return rows;
}




export function getDepartmentDistribution(filter: StatsFilter = {}) {
  const db = getDb();
  const params: any[] = [];
  const whereClauses: string[] = [];

  if (filter.startDate) {
    whereClauses.push('lr.end_date >= ?');
    params.push(filter.startDate);
  }
  if (filter.endDate) {
    whereClauses.push('lr.start_date <= ?');
    params.push(filter.endDate);
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const rows = db.prepare(`
    SELECT 
      d.name as department_name,
      COUNT(lr.id) as count
    FROM departments d
    LEFT JOIN users u ON u.department_id = d.id
    LEFT JOIN leave_requests lr ON lr.student_id = u.id
    ${whereStr}
    GROUP BY d.id
    ORDER BY count DESC
  `).all(...params) as { department_name: string; count: number }[];

  return rows;
}




export function getStudentCareRankings(filter: StatsFilter = {}) {
  const db = getDb();
  const params: any[] = [];
  const whereClauses: string[] = [];

  if (filter.teacherId) {
    whereClauses.push('c.teacher_id = ?');
    params.push(filter.teacherId);
  }
  if (filter.departmentId) {
    whereClauses.push('u.department_id = ?');
    params.push(filter.departmentId);
  }
  if (filter.courseId) {
    whereClauses.push('lr.course_id = ?');
    params.push(filter.courseId);
  }
  if (filter.startDate) {
    whereClauses.push('lr.end_date >= ?');
    params.push(filter.startDate);
  }
  if (filter.endDate) {
    whereClauses.push('lr.start_date <= ?');
    params.push(filter.endDate);
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const rows = db.prepare(`
    SELECT 
      u.id as student_id,
      u.name as student_name,
      d.name as department_name,
      COUNT(lr.id) as total_leaves,
      SUM(CASE WHEN lr.status = 'approved' THEN 1 ELSE 0 END) as approved_leaves,
      SUM(CASE WHEN lr.status = 'rejected' THEN 1 ELSE 0 END) as rejected_leaves,
      SUM(CASE WHEN lr.status = 'pending' THEN 1 ELSE 0 END) as pending_leaves
    FROM users u
    JOIN leave_requests lr ON u.id = lr.student_id
    JOIN courses c ON lr.course_id = c.id
    LEFT JOIN departments d ON u.department_id = d.id
    ${whereStr}
    GROUP BY u.id
    ORDER BY total_leaves DESC
    LIMIT 10
  `).all(...params) as {
    student_id: string;
    student_name: string;
    department_name: string;
    total_leaves: number;
    approved_leaves: number;
    rejected_leaves: number;
    pending_leaves: number;
  }[];

  return rows;
}




export function getExportData(filter: StatsFilter = {}) {
  const db = getDb();
  const params: any[] = [];
  const whereClauses: string[] = [];

  if (filter.teacherId) {
    whereClauses.push('c.teacher_id = ?');
    params.push(filter.teacherId);
  }
  if (filter.departmentId) {
    whereClauses.push('c.department_id = ?');
    params.push(filter.departmentId);
  }
  if (filter.courseId) {
    whereClauses.push('lr.course_id = ?');
    params.push(filter.courseId);
  }
  if (filter.startDate) {
    whereClauses.push('lr.end_date >= ?');
    params.push(filter.startDate);
  }
  if (filter.endDate) {
    whereClauses.push('lr.start_date <= ?');
    params.push(filter.endDate);
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const rows = db.prepare(`
    SELECT 
      lr.id,
      u.id as student_id,
      u.name as student_name,
      d.name as department_name,
      c.id as course_id,
      c.name as course_name,
      tu.name as teacher_name,
      lr.leave_type,
      lr.start_date,
      lr.end_date,
      lr.periods,
      lr.reason,
      lr.status,
      lr.review_comment,
      ru.name as reviewer_name,
      lr.reviewed_at,
      lr.created_at
    FROM leave_requests lr
    JOIN users u ON lr.student_id = u.id
    LEFT JOIN departments d ON u.department_id = d.id
    JOIN courses c ON lr.course_id = c.id
    LEFT JOIN users tu ON c.teacher_id = tu.id
    LEFT JOIN users ru ON lr.reviewed_by = ru.id
    ${whereStr}
    ORDER BY lr.created_at DESC
  `).all(...params) as any[];

  return rows;
}
