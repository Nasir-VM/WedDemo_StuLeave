import { getDb, executeWriteTransaction } from '../index';

export interface CourseRecord {
  id: string;
  name: string;
  department_id: string;
  department_name?: string;
  teacher_id: string;
  teacher_name?: string;
  academic_year: string;
  weekday: number;
  start_period: number;
  end_period: number;
  created_at: string;
  enrollment_count?: number;
}

export interface DepartmentRecord {
  id: string;
  name: string;
  created_at: string;
}

export function listDepartments(): DepartmentRecord[] {
  const db = getDb();
  return db.prepare(`SELECT * FROM departments ORDER BY id ASC`).all() as DepartmentRecord[];
}

export function listCourses(options: {
  departmentId?: string;
  teacherId?: string;
  academicYear?: string;
  search?: string;
  limit?: number;
  offset?: number;
} = {}): { courses: CourseRecord[]; total: number } {
  const db = getDb();
  const params: any[] = [];
  const whereClauses: string[] = [];

  if (options.departmentId) {
    whereClauses.push('c.department_id = ?');
    params.push(options.departmentId);
  }

  if (options.teacherId) {
    whereClauses.push('c.teacher_id = ?');
    params.push(options.teacherId);
  }

  if (options.academicYear) {
    whereClauses.push('c.academic_year = ?');
    params.push(options.academicYear);
  }

  if (options.search) {
    whereClauses.push('(c.id LIKE ? OR c.name LIKE ?)');
    const term = `%${options.search}%`;
    params.push(term, term);
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM courses c ${whereStr}`).get(...params) as { total: number };
  const limit = Math.min(Math.max(options.limit || 50, 1), 100);
  const offset = Math.max(options.offset || 0, 0);

  const rows = db.prepare(`
    SELECT 
      c.*,
      d.name as department_name,
      u.name as teacher_name,
      (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.course_id = c.id) as enrollment_count
    FROM courses c
    JOIN departments d ON c.department_id = d.id
    JOIN users u ON c.teacher_id = u.id
    ${whereStr}
    ORDER BY c.academic_year DESC, c.id ASC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as CourseRecord[];

  return { courses: rows, total: countRow.total };
}

export function getCourseById(id: string): CourseRecord | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT 
      c.*,
      d.name as department_name,
      u.name as teacher_name,
      (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.course_id = c.id) as enrollment_count
    FROM courses c
    JOIN departments d ON c.department_id = d.id
    JOIN users u ON c.teacher_id = u.id
    WHERE c.id = ?
  `).get(id) as CourseRecord | undefined;

  return row || null;
}

export function getCoursesForStudent(studentId: string): CourseRecord[] {
  const db = getDb();
  return db.prepare(`
    SELECT 
      c.*,
      d.name as department_name,
      u.name as teacher_name
    FROM course_enrollments ce
    JOIN courses c ON ce.course_id = c.id
    JOIN departments d ON c.department_id = d.id
    JOIN users u ON c.teacher_id = u.id
    WHERE ce.student_id = ?
    ORDER BY c.weekday ASC, c.start_period ASC
  `).all(studentId) as CourseRecord[];
}

export function getCoursesForTeacher(teacherId: string): CourseRecord[] {
  const db = getDb();
  return db.prepare(`
    SELECT 
      c.*,
      d.name as department_name,
      u.name as teacher_name,
      (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.course_id = c.id) as enrollment_count
    FROM courses c
    JOIN departments d ON c.department_id = d.id
    JOIN users u ON c.teacher_id = u.id
    WHERE c.teacher_id = ?
    ORDER BY c.academic_year DESC, c.weekday ASC, c.start_period ASC
  `).all(teacherId) as CourseRecord[];
}

export async function createCourse(data: {
  id: string;
  name: string;
  department_id: string;
  teacher_id: string;
  academic_year: string;
  weekday: number;
  start_period: number;
  end_period: number;
}): Promise<boolean> {
  return await executeWriteTransaction((db) => {
    const res = db.prepare(`
      INSERT INTO courses (
        id, name, department_id, teacher_id, academic_year, weekday, start_period, end_period
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.id.trim(),
      data.name.trim(),
      data.department_id,
      data.teacher_id,
      data.academic_year.trim(),
      data.weekday,
      data.start_period,
      data.end_period
    );
    return res.changes > 0;
  });
}

export async function enrollStudent(courseId: string, studentId: string): Promise<boolean> {
  return await executeWriteTransaction((db) => {
    const res = db.prepare(`
      INSERT OR IGNORE INTO course_enrollments (course_id, student_id)
      VALUES (?, ?)
    `).run(courseId, studentId);
    return res.changes > 0;
  });
}
