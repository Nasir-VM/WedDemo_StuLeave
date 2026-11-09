import crypto from 'crypto';
import { getDb, executeWriteTransaction } from '../index';
import type { LeaveTypeCode, LeaveStatusCode } from '../../config/constants';
import { logAuditInTx } from '../../lib/utils/audit';

export interface LeaveRequestRecord {
  id: string;
  student_id: string;
  student_name?: string;
  student_email?: string;
  department_id?: string;
  department_name?: string;
  course_id: string;
  course_name?: string;
  academic_year?: string;
  teacher_id?: string;
  teacher_name?: string;
  leave_type: LeaveTypeCode;
  start_date: string;
  end_date: string;
  periods: number[];
  reason: string;
  status: LeaveStatusCode;
  review_comment: string | null;
  reviewed_by: string | null;
  reviewer_name?: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  attachment?: {
    id: string;
    original_name: string;
    stored_filename: string;
    file_size: number;
    mime_type: string;
  } | null;
}




export function checkDuplicateLeave(
  studentId: string,
  courseId: string,
  startDate: string,
  endDate: string,
  periods: number[]
): boolean {
  const db = getDb();
  
  
  const existingLeaves = db.prepare(`
    SELECT id, periods, start_date, end_date
    FROM leave_requests
    WHERE student_id = ?
      AND course_id = ?
      AND status IN ('pending', 'approved')
      AND (
        (start_date <= ? AND end_date >= ?) -- 日期區間重疊
      )
  `).all(studentId, courseId, endDate, startDate) as { id: string; periods: string }[];

  if (existingLeaves.length === 0) return false;

  const targetPeriodSet = new Set(periods);
  for (const leave of existingLeaves) {
    try {
      const parsedPeriods: number[] = JSON.parse(leave.periods);
      for (const p of parsedPeriods) {
        if (targetPeriodSet.has(p)) {
          return true; 
        }
      }
    } catch {
      continue;
    }
  }

  return false;
}





export async function createLeaveRequest(
  data: {
    studentId: string;
    courseId: string;
    leaveType: LeaveTypeCode;
    startDate: string;
    endDate: string;
    periods: number[];
    reason: string;
    attachment?: {
      originalName: string;
      storedFilename: string;
      fileSize: number;
      mimeType: string;
      hash: string;
    } | null;
  },
  meta: { ipAddress: string; userAgent: string }
): Promise<string> {
  const leaveId = crypto.randomUUID();

  await executeWriteTransaction((txDb) => {
    
    const isDup = checkDuplicateLeave(
      data.studentId,
      data.courseId,
      data.startDate,
      data.endDate,
      data.periods
    );
    if (isDup) {
      throw new Error('同一課程在該日期與節次時段已存在請假申請，不可重複送出');
    }

    
    txDb.prepare(`
      INSERT INTO leave_requests (
        id, student_id, course_id, leave_type, start_date, end_date, periods, reason, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(
      leaveId,
      data.studentId,
      data.courseId,
      data.leaveType,
      data.startDate,
      data.endDate,
      JSON.stringify(data.periods),
      data.reason.trim()
    );

    
    if (data.attachment) {
      const attachmentId = crypto.randomUUID();
      txDb.prepare(`
        INSERT INTO leave_attachments (
          id, leave_request_id, original_name, stored_filename, file_size, mime_type, hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        attachmentId,
        leaveId,
        data.attachment.originalName,
        data.attachment.storedFilename,
        data.attachment.fileSize,
        data.attachment.mimeType,
        data.attachment.hash
      );
    }

    
    logAuditInTx(txDb, {
      userId: data.studentId,
      action: 'SUBMIT_LEAVE',
      targetType: 'leave_request',
      targetId: leaveId,
      details: {
        courseId: data.courseId,
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        periods: data.periods,
        hasAttachment: !!data.attachment
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });
  });

  return leaveId;
}




export async function withdrawLeaveRequest(
  leaveId: string,
  studentId: string,
  meta: { ipAddress: string; userAgent: string }
): Promise<boolean> {
  return await executeWriteTransaction((txDb) => {
    
    const res = txDb.prepare(`
      UPDATE leave_requests
      SET status = 'withdrawn', updated_at = datetime('now', 'localtime')
      WHERE id = ? AND student_id = ? AND status = 'pending'
    `).run(leaveId, studentId);

    if (res.changes === 0) {
      throw new Error('無法撤回：請假單不存在、已非待審核狀態或無操作權限');
    }

    logAuditInTx(txDb, {
      userId: studentId,
      action: 'WITHDRAW_LEAVE',
      targetType: 'leave_request',
      targetId: leaveId,
      details: { previousStatus: 'pending', newStatus: 'withdrawn' },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return true;
  });
}





export async function reviewLeaveRequest(
  leaveId: string,
  reviewerId: string,
  reviewerRole: string,
  decision: 'approved' | 'rejected',
  comment: string | null,
  meta: { ipAddress: string; userAgent: string }
): Promise<boolean> {
  if (decision === 'rejected' && (!comment || comment.trim().length === 0)) {
    throw new Error('駁回申請時必須填寫審核意見（駁回理由）');
  }

  return await executeWriteTransaction((txDb) => {
    
    if (reviewerRole === 'teacher') {
      const courseCheck = txDb.prepare(`
        SELECT lr.id
        FROM leave_requests lr
        JOIN courses c ON lr.course_id = c.id
        WHERE lr.id = ? AND c.teacher_id = ?
      `).get(leaveId, reviewerId);

      if (!courseCheck) {
        throw new Error('無權限審核非自己授課之課程假單');
      }
    }

    
    const res = txDb.prepare(`
      UPDATE leave_requests
      SET 
        status = ?,
        review_comment = ?,
        reviewed_by = ?,
        reviewed_at = datetime('now', 'localtime'),
        updated_at = datetime('now', 'localtime')
      WHERE id = ? AND status = 'pending'
    `).run(decision, comment ? comment.trim() : null, reviewerId, leaveId);

    if (res.changes === 0) {
      throw new Error('該請假單已被審核或已撤回，請重新整理頁面');
    }

    logAuditInTx(txDb, {
      userId: reviewerId,
      action: decision === 'approved' ? 'APPROVE_LEAVE' : 'REJECT_LEAVE',
      targetType: 'leave_request',
      targetId: leaveId,
      details: { decision, comment },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return true;
  });
}




export async function batchReviewLeaveRequests(
  leaveIds: string[],
  reviewerId: string,
  reviewerRole: string,
  decision: 'approved' | 'rejected',
  comment: string | null,
  meta: { ipAddress: string; userAgent: string }
): Promise<{ successCount: number; failureCount: number }> {
  if (decision === 'rejected' && (!comment || comment.trim().length === 0)) {
    throw new Error('批次駁回時必須填寫審核意見');
  }

  return await executeWriteTransaction((txDb) => {
    let successCount = 0;
    let failureCount = 0;

    for (const leaveId of leaveIds) {
      
      if (reviewerRole === 'teacher') {
        const courseCheck = txDb.prepare(`
          SELECT lr.id
          FROM leave_requests lr
          JOIN courses c ON lr.course_id = c.id
          WHERE lr.id = ? AND c.teacher_id = ?
        `).get(leaveId, reviewerId);

        if (!courseCheck) {
          failureCount++;
          continue;
        }
      }

      const res = txDb.prepare(`
        UPDATE leave_requests
        SET 
          status = ?,
          review_comment = ?,
          reviewed_by = ?,
          reviewed_at = datetime('now', 'localtime'),
          updated_at = datetime('now', 'localtime')
        WHERE id = ? AND status = 'pending'
      `).run(decision, comment ? comment.trim() : null, reviewerId, leaveId);

      if (res.changes > 0) {
        successCount++;
        logAuditInTx(txDb, {
          userId: reviewerId,
          action: decision === 'approved' ? 'BATCH_APPROVE_LEAVE' : 'BATCH_REJECT_LEAVE',
          targetType: 'leave_request',
          targetId: leaveId,
          details: { decision, comment, batch: true },
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent
        });
      } else {
        failureCount++;
      }
    }

    return { successCount, failureCount };
  });
}




export function getLeaveById(leaveId: string): LeaveRequestRecord | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT 
      lr.*,
      u.name as student_name,
      u.email as student_email,
      u.department_id,
      d.name as department_name,
      c.name as course_name,
      c.academic_year,
      c.teacher_id,
      tu.name as teacher_name,
      ru.name as reviewer_name,
      la.id as att_id,
      la.original_name as att_original_name,
      la.stored_filename as att_stored_filename,
      la.file_size as att_file_size,
      la.mime_type as att_mime_type
    FROM leave_requests lr
    JOIN users u ON lr.student_id = u.id
    LEFT JOIN departments d ON u.department_id = d.id
    JOIN courses c ON lr.course_id = c.id
    LEFT JOIN users tu ON c.teacher_id = tu.id
    LEFT JOIN users ru ON lr.reviewed_by = ru.id
    LEFT JOIN leave_attachments la ON lr.id = la.leave_request_id
    WHERE lr.id = ?
  `).get(leaveId) as any;

  if (!row) return null;

  return {
    id: row.id,
    student_id: row.student_id,
    student_name: row.student_name,
    student_email: row.student_email,
    department_id: row.department_id,
    department_name: row.department_name,
    course_id: row.course_id,
    course_name: row.course_name,
    academic_year: row.academic_year,
    teacher_id: row.teacher_id,
    teacher_name: row.teacher_name,
    leave_type: row.leave_type,
    start_date: row.start_date,
    end_date: row.end_date,
    periods: JSON.parse(row.periods || '[]'),
    reason: row.reason,
    status: row.status,
    review_comment: row.review_comment,
    reviewed_by: row.reviewed_by,
    reviewer_name: row.reviewer_name,
    reviewed_at: row.reviewed_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    attachment: row.att_id
      ? {
          id: row.att_id,
          original_name: row.att_original_name,
          stored_filename: row.att_stored_filename,
          file_size: row.att_file_size,
          mime_type: row.att_mime_type
        }
      : null
  };
}




export function listLeavesForStudent(
  studentId: string,
  options: {
    status?: string;
    courseId?: string;
    limit?: number;
    offset?: number;
  } = {}
): { leaves: LeaveRequestRecord[]; total: number } {
  const db = getDb();
  const params: any[] = [studentId];
  const whereClauses: string[] = ['lr.student_id = ?'];

  if (options.status) {
    whereClauses.push('lr.status = ?');
    params.push(options.status);
  }

  if (options.courseId) {
    whereClauses.push('lr.course_id = ?');
    params.push(options.courseId);
  }

  const whereStr = `WHERE ${whereClauses.join(' AND ')}`;

  const countRow = db.prepare(`
    SELECT COUNT(*) as total 
    FROM leave_requests lr
    ${whereStr}
  `).get(...params) as { total: number };

  const limit = Math.min(Math.max(options.limit || 15, 1), 100);
  const offset = Math.max(options.offset || 0, 0);

  const rows = db.prepare(`
    SELECT 
      lr.*,
      c.name as course_name,
      tu.name as teacher_name,
      ru.name as reviewer_name,
      la.id as att_id,
      la.original_name as att_original_name,
      la.stored_filename as att_stored_filename,
      la.file_size as att_file_size,
      la.mime_type as att_mime_type
    FROM leave_requests lr
    JOIN courses c ON lr.course_id = c.id
    LEFT JOIN users tu ON c.teacher_id = tu.id
    LEFT JOIN users ru ON lr.reviewed_by = ru.id
    LEFT JOIN leave_attachments la ON lr.id = la.leave_request_id
    ${whereStr}
    ORDER BY lr.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as any[];

  const leaves = rows.map((r) => ({
    id: r.id,
    student_id: r.student_id,
    course_id: r.course_id,
    course_name: r.course_name,
    teacher_name: r.teacher_name,
    leave_type: r.leave_type,
    start_date: r.start_date,
    end_date: r.end_date,
    periods: JSON.parse(r.periods || '[]'),
    reason: r.reason,
    status: r.status,
    review_comment: r.review_comment,
    reviewed_by: r.reviewed_by,
    reviewer_name: r.reviewer_name,
    reviewed_at: r.reviewed_at,
    created_at: r.created_at,
    updated_at: r.updated_at,
    attachment: r.att_id
      ? {
          id: r.att_id,
          original_name: r.att_original_name,
          stored_filename: r.att_stored_filename,
          file_size: r.att_file_size,
          mime_type: r.att_mime_type
        }
      : null
  }));

  return { leaves, total: countRow.total };
}




export function listLeavesForReview(options: {
  teacherId?: string; 
  status?: string;
  courseId?: string;
  leaveType?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
} = {}): { leaves: LeaveRequestRecord[]; total: number } {
  const db = getDb();
  const params: any[] = [];
  const whereClauses: string[] = [];

  if (options.teacherId) {
    whereClauses.push('c.teacher_id = ?');
    params.push(options.teacherId);
  }

  if (options.status) {
    whereClauses.push('lr.status = ?');
    params.push(options.status);
  }

  if (options.courseId) {
    whereClauses.push('lr.course_id = ?');
    params.push(options.courseId);
  }

  if (options.leaveType) {
    whereClauses.push('lr.leave_type = ?');
    params.push(options.leaveType);
  }

  if (options.startDate) {
    whereClauses.push('lr.end_date >= ?');
    params.push(options.startDate);
  }

  if (options.endDate) {
    whereClauses.push('lr.start_date <= ?');
    params.push(options.endDate);
  }

  if (options.search) {
    whereClauses.push('(u.id LIKE ? OR u.name LIKE ? OR c.name LIKE ? OR lr.reason LIKE ?)');
    const term = `%${options.search}%`;
    params.push(term, term, term, term);
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countRow = db.prepare(`
    SELECT COUNT(*) as total 
    FROM leave_requests lr
    JOIN users u ON lr.student_id = u.id
    JOIN courses c ON lr.course_id = c.id
    ${whereStr}
  `).get(...params) as { total: number };

  const limit = Math.min(Math.max(options.limit || 15, 1), 100);
  const offset = Math.max(options.offset || 0, 0);

  const rows = db.prepare(`
    SELECT 
      lr.*,
      u.name as student_name,
      u.email as student_email,
      d.name as department_name,
      c.name as course_name,
      tu.name as teacher_name,
      ru.name as reviewer_name,
      la.id as att_id,
      la.original_name as att_original_name,
      la.stored_filename as att_stored_filename,
      la.file_size as att_file_size,
      la.mime_type as att_mime_type
    FROM leave_requests lr
    JOIN users u ON lr.student_id = u.id
    LEFT JOIN departments d ON u.department_id = d.id
    JOIN courses c ON lr.course_id = c.id
    LEFT JOIN users tu ON c.teacher_id = tu.id
    LEFT JOIN users ru ON lr.reviewed_by = ru.id
    LEFT JOIN leave_attachments la ON lr.id = la.leave_request_id
    ${whereStr}
    ORDER BY CASE WHEN lr.status = 'pending' THEN 0 ELSE 1 END, lr.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as any[];

  const leaves = rows.map((r) => ({
    id: r.id,
    student_id: r.student_id,
    student_name: r.student_name,
    student_email: r.student_email,
    department_name: r.department_name,
    course_id: r.course_id,
    course_name: r.course_name,
    teacher_name: r.teacher_name,
    leave_type: r.leave_type,
    start_date: r.start_date,
    end_date: r.end_date,
    periods: JSON.parse(r.periods || '[]'),
    reason: r.reason,
    status: r.status,
    review_comment: r.review_comment,
    reviewed_by: r.reviewed_by,
    reviewer_name: r.reviewer_name,
    reviewed_at: r.reviewed_at,
    created_at: r.created_at,
    updated_at: r.updated_at,
    attachment: r.att_id
      ? {
          id: r.att_id,
          original_name: r.att_original_name,
          stored_filename: r.att_stored_filename,
          file_size: r.att_file_size,
          mime_type: r.att_mime_type
        }
      : null
  }));

  return { leaves, total: countRow.total };
}
