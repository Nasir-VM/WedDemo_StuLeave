import { fileURLToPath } from 'url';
import { getDb, executeWriteTransaction } from '../src/db/index';
import { hashPassword } from '../src/lib/auth/password';
import { runMigration } from './migrate';

const __filename = fileURLToPath(import.meta.url);

export async function runSeed(): Promise<void> {
  runMigration();
  const db = getDb();

  console.log('🌱 正在準備種子資料雜湊密碼 (argon2id)...');
  const adminHash = await hashPassword('12345678');
  const teacherHash = await hashPassword('TeacherPassword123!');
  const studentHash = await hashPassword('StudentPassword123!');

  console.log('🔄 正在寫入種子資料...');
  await executeWriteTransaction((txDb) => {
    
    txDb.exec(`
      DELETE FROM leave_attachments;
      DELETE FROM leave_requests;
      DELETE FROM course_enrollments;
      DELETE FROM sessions;
      DELETE FROM courses;
      DELETE FROM users;
      DELETE FROM departments;
    `);

    
    const insertDept = txDb.prepare(`
      INSERT INTO departments (id, name)
      VALUES (?, ?)
      ON CONFLICT(id) DO UPDATE SET name = excluded.name
    `);
    insertDept.run('CS', '資訊工程學系');
    insertDept.run('EE', '電機工程學系');
    insertDept.run('BA', '企業管理學系');
    insertDept.run('FL', '應用外語學系');

    
    const insertUser = txDb.prepare(`
      INSERT INTO users (
        id, email, name, role, department_id, password_hash, must_change_password, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT(id) DO UPDATE SET
        email = excluded.email,
        name = excluded.name,
        role = excluded.role,
        department_id = excluded.department_id,
        password_hash = excluded.password_hash,
        must_change_password = excluded.must_change_password,
        is_active = excluded.is_active
    `);

    
    insertUser.run('admin', 'admin@example.edu.tw', '系統管理員', 'admin', 'CS', adminHash, 0);

    
    insertUser.run('T001', 't001@example.edu.tw', '王大明 教授', 'teacher', 'CS', teacherHash, 0);
    insertUser.run('T002', 't002@example.edu.tw', '李美玲 副教授', 'teacher', 'EE', teacherHash, 0);

    
    insertUser.run('S112001', 's112001@example.edu.tw', '陳小華', 'student', 'CS', studentHash, 1);
    insertUser.run('S112002', 's112002@example.edu.tw', '林志強', 'student', 'CS', studentHash, 0);
    insertUser.run('S112003', 's112003@example.edu.tw', '張雅婷', 'student', 'EE', studentHash, 0);

    
    const insertCourse = txDb.prepare(`
      INSERT INTO courses (
        id, name, department_id, teacher_id, academic_year, weekday, start_period, end_period
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        department_id = excluded.department_id,
        teacher_id = excluded.teacher_id,
        academic_year = excluded.academic_year,
        weekday = excluded.weekday,
        start_period = excluded.start_period,
        end_period = excluded.end_period
    `);
    insertCourse.run('CS101', '軟體工程', 'CS', 'T001', '113-1', 1, 3, 4);
    insertCourse.run('CS201', '資料庫系統', 'CS', 'T001', '113-1', 3, 5, 7);
    insertCourse.run('EE101', '電路學', 'EE', 'T002', '113-1', 2, 2, 4);
    insertCourse.run('EE205', '數位邏輯', 'EE', 'T002', '113-1', 4, 3, 5);

    
    const insertEnroll = txDb.prepare(`
      INSERT OR IGNORE INTO course_enrollments (course_id, student_id)
      VALUES (?, ?)
    `);
    insertEnroll.run('CS101', 'S112001');
    insertEnroll.run('CS201', 'S112001');
    insertEnroll.run('CS101', 'S112002');
    insertEnroll.run('EE101', 'S112002');
    insertEnroll.run('EE101', 'S112003');
    insertEnroll.run('EE205', 'S112003');

    
    const insertLeave = txDb.prepare(`
      INSERT INTO leave_requests (
        id, student_id, course_id, leave_type, start_date, end_date, periods, reason, status, review_comment, reviewed_by, reviewed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        student_id = excluded.student_id,
        course_id = excluded.course_id,
        leave_type = excluded.leave_type,
        start_date = excluded.start_date,
        end_date = excluded.end_date,
        periods = excluded.periods,
        reason = excluded.reason,
        status = excluded.status,
        review_comment = excluded.review_comment,
        reviewed_by = excluded.reviewed_by,
        reviewed_at = excluded.reviewed_at
    `);

    
    insertLeave.run(
      'seed-leave-001',
      'S112001',
      'CS101',
      'sick',
      '2026-11-10',
      '2026-11-10',
      JSON.stringify([3, 4]),
      '流感高燒，診所建議居家隔離休養',
      'pending',
      null,
      null,
      null
    );

    
    insertLeave.run(
      'seed-leave-002',
      'S112001',
      'CS201',
      'official',
      '2026-11-05',
      '2026-11-05',
      JSON.stringify([5, 6, 7]),
      '代表系所參加全國開源軟體高峰研討會',
      'approved',
      '准假，請攜帶研討會證明補登作業',
      'T001',
      '2026-11-04 15:30:00'
    );

    
    insertLeave.run(
      'seed-leave-003',
      'S112002',
      'CS101',
      'personal',
      '2026-11-03',
      '2026-11-03',
      JSON.stringify([3, 4]),
      '個人私人事務無法出席',
      'rejected',
      '事假請依校規附上證明文件並提前兩天提出',
      'T001',
      '2026-11-03 10:15:00'
    );

    
    insertLeave.run(
      'seed-leave-004',
      'S112002',
      'EE101',
      'other',
      '2026-11-02',
      '2026-11-02',
      JSON.stringify([2, 3]),
      '家中有事（後續行程取消由學生自行撤回）',
      'withdrawn',
      null,
      null,
      null
    );

    
    const insertAudit = txDb.prepare(`
      INSERT INTO audit_log (user_id, action, target_type, target_id, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertAudit.run('admin', 'SYSTEM_SEED', 'system', 'all', JSON.stringify({ message: '系統初始種子資料載入完成' }), '127.0.0.1', 'Node/Seeder');
  });

  console.log('✅ 種子資料載入成功！');
  console.log('----------------------------------------------------');
  console.log('預設測試帳號：');
  console.log('管理員: admin    / 12345678');
  console.log('教  師: T001     / TeacherPassword123! (王大明 教授)');
  console.log('教  師: T002     / TeacherPassword123! (李美玲 副教授)');
  console.log('學  生: S112001  / StudentPassword123! (首次登入須修改密碼)');
  console.log('學  生: S112002  / StudentPassword123!');
  console.log('學  生: S112003  / StudentPassword123!');
  console.log('----------------------------------------------------');
}

if (process.argv[1] === __filename) {
  runSeed().catch((err) => {
    console.error('❌ 種子資料執行失敗:', err);
    process.exit(1);
  });
}
