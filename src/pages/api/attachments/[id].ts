import type { APIRoute } from 'astro';
import fs from 'fs';
import { getDb } from '../../../db/index';
import { getAttachmentFilePath } from '../../../lib/security/upload';
import { errorResponse } from '../../../lib/utils/response';

export const GET: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) {
    return errorResponse('未經授權，請先登入', 401);
  }

  const attachmentId = params.id;
  if (!attachmentId) {
    return errorResponse('未指定附件編號', 400);
  }

  const db = getDb();

  
  const attachment = db.prepare(`
    SELECT 
      la.*,
      lr.student_id,
      c.teacher_id
    FROM leave_attachments la
    JOIN leave_requests lr ON la.leave_request_id = lr.id
    JOIN courses c ON lr.course_id = c.id
    WHERE la.id = ?
  `).get(attachmentId) as any;

  if (!attachment) {
    return errorResponse('找不到此附件檔案', 404);
  }

  
  const isOwner = user.id === attachment.student_id;
  const isCourseTeacher = user.role === 'teacher' && user.id === attachment.teacher_id;
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isCourseTeacher && !isAdmin) {
    return errorResponse('無權存取此請假佐證附件 (403 Forbidden)', 403);
  }

  const filePath = getAttachmentFilePath(attachment.stored_filename);
  if (!filePath) {
    return errorResponse('實體檔案遺失或損毀', 404);
  }

  try {
    const fileBuffer = await fs.promises.readFile(filePath);
    
    
    const encodedFilename = encodeURIComponent(attachment.original_name);
    const headers = new Headers();
    headers.set('Content-Type', attachment.mime_type);
    headers.set('Content-Length', attachment.file_size.toString());
    headers.set('Content-Disposition', `inline; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`);
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate'); 

    return new Response(fileBuffer, {
      status: 200,
      headers
    });
  } catch (err) {
    console.error('[Attachment Download] 讀取失敗:', err);
    return errorResponse('伺服器讀取檔案失敗', 500);
  }
};
