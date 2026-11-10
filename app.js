(function () {
  'use strict';

  const STORAGE_KEY = 'stuleave-demo-v1';
  const SESSION_KEY = 'stuleave-demo-session';
  const SCHOOL_NAME = 'XX大學';
  const SYSTEM_NAME = '學生請假系統';
  const STUDENT_PAGE_SIZE = 10;
  const REVIEW_PAGE_SIZE = 15;
  const USER_PAGE_SIZE = 15;
  const COURSE_PAGE_SIZE = 15;
  const AUDIT_PAGE_SIZE = 20;

  const ROLE_LABELS = {
    student: '學生',
    teacher: '教師',
    admin: '管理員'
  };

  const LEAVE_TYPES = {
    sick: '病假',
    personal: '事假',
    official: '公假',
    bereavement: '喪假',
    other: '其他'
  };

  const LEAVE_STATUS = {
    pending: '待審核',
    approved: '已核准',
    rejected: '已駁回',
    withdrawn: '已撤回'
  };

  const PERIODS = [
    { period: 1, label: '第 1 節 (08:10-09:00)' },
    { period: 2, label: '第 2 節 (09:10-10:00)' },
    { period: 3, label: '第 3 節 (10:10-11:00)' },
    { period: 4, label: '第 4 節 (11:10-12:00)' },
    { period: 5, label: '第 5 節 (13:10-14:00)' },
    { period: 6, label: '第 6 節 (14:10-15:00)' },
    { period: 7, label: '第 7 節 (15:10-16:00)' },
    { period: 8, label: '第 8 節 (16:10-17:00)' },
    { period: 9, label: '第 9 節 (17:10-18:00)' },
    { period: 10, label: '第 10 節 (18:20-19:10)' },
    { period: 11, label: '第 11 節 (19:15-20:05)' },
    { period: 12, label: '第 12 節 (20:10-21:00)' },
    { period: 13, label: '第 13 節 (21:05-21:55)' },
    { period: 14, label: '第 14 節 (22:00-22:50)' }
  ];

  const WEEKDAYS = [
    { day: 1, label: '星期一' },
    { day: 2, label: '星期二' },
    { day: 3, label: '星期三' },
    { day: 4, label: '星期四' },
    { day: 5, label: '星期五' },
    { day: 6, label: '星期六' },
    { day: 7, label: '星期日' }
  ];

  const DEPARTMENTS = [
    { code: 'CS', name: '資訊工程學系' },
    { code: 'EE', name: '電機工程學系' },
    { code: 'BA', name: '企業管理學系' },
    { code: 'FL', name: '應用外語學系' }
  ];

  const USERS = [
    { id: 'admin', email: 'admin@example.edu.tw', name: '系統管理員', role: 'admin', department: 'CS', title: '教務處資訊組' },
    { id: 'T001', email: 't001@example.edu.tw', name: '王大明 教授', role: 'teacher', department: 'CS', title: '教授' },
    { id: 'T002', email: 't002@example.edu.tw', name: '李美玲 副教授', role: 'teacher', department: 'EE', title: '副教授' },
    { id: 'T003', email: 't003@example.edu.tw', name: '陳建宏 助理教授', role: 'teacher', department: 'CS', title: '助理教授' },
    { id: 'T004', email: 't004@example.edu.tw', name: '林淑芬 教授', role: 'teacher', department: 'EE', title: '教授' },
    { id: 'T005', email: 't005@example.edu.tw', name: '黃志豪 副教授', role: 'teacher', department: 'BA', title: '副教授' },
    { id: 'T006', email: 't006@example.edu.tw', name: '吳佳穎 助理教授', role: 'teacher', department: 'FL', title: '助理教授' },
    { id: 'S112001', email: 's112001@example.edu.tw', name: '陳小華', role: 'student', department: 'CS', title: '三年級' },
    { id: 'S112002', email: 's112002@example.edu.tw', name: '林志強', role: 'student', department: 'CS', title: '三年級' },
    { id: 'S112003', email: 's112003@example.edu.tw', name: '張雅婷', role: 'student', department: 'EE', title: '三年級' },
    { id: 'S112004', email: 's112004@example.edu.tw', name: '王怡君', role: 'student', department: 'CS', title: '二年級' },
    { id: 'S112005', email: 's112005@example.edu.tw', name: '李冠廷', role: 'student', department: 'CS', title: '四年級' },
    { id: 'S112006', email: 's112006@example.edu.tw', name: '吳佩珊', role: 'student', department: 'EE', title: '二年級' },
    { id: 'S112007', email: 's112007@example.edu.tw', name: '劉家豪', role: 'student', department: 'EE', title: '四年級' },
    { id: 'S112008', email: 's112008@example.edu.tw', name: '陳美琪', role: 'student', department: 'BA', title: '三年級' },
    { id: 'S112009', email: 's112009@example.edu.tw', name: '張志偉', role: 'student', department: 'BA', title: '二年級' },
    { id: 'S112010', email: 's112010@example.edu.tw', name: '林雅雯', role: 'student', department: 'BA', title: '四年級' },
    { id: 'S112011', email: 's112011@example.edu.tw', name: '黃俊傑', role: 'student', department: 'FL', title: '二年級' },
    { id: 'S112012', email: 's112012@example.edu.tw', name: '周怡婷', role: 'student', department: 'FL', title: '三年級' },
    { id: 'S112013', email: 's112013@example.edu.tw', name: '許凱文', role: 'student', department: 'CS', title: '四年級' },
    { id: 'S112014', email: 's112014@example.edu.tw', name: '鄭雅涵', role: 'student', department: 'EE', title: '二年級' },
    { id: 'S112015', email: 's112015@example.edu.tw', name: '何志明', role: 'student', department: 'BA', title: '四年級' },
    { id: 'S112016', email: 's112016@example.edu.tw', name: '楊淑芬', role: 'student', department: 'FL', title: '三年級' }
  ];

  const COURSES = [
    { id: 'CS101', name: '軟體工程', department: 'CS', teacherId: 'T001', academicYear: '113-1', weekday: 1, startPeriod: 3, endPeriod: 4 },
    { id: 'CS201', name: '資料庫系統', department: 'CS', teacherId: 'T001', academicYear: '113-1', weekday: 3, startPeriod: 5, endPeriod: 7 },
    { id: 'CS301', name: '演算法', department: 'CS', teacherId: 'T003', academicYear: '113-1', weekday: 2, startPeriod: 6, endPeriod: 8 },
    { id: 'CS401', name: '人工智慧導論', department: 'CS', teacherId: 'T003', academicYear: '113-1', weekday: 4, startPeriod: 2, endPeriod: 4 },
    { id: 'CS210', name: '網頁程式設計', department: 'CS', teacherId: 'T001', academicYear: '113-1', weekday: 5, startPeriod: 3, endPeriod: 5 },
    { id: 'CS220', name: '計算機組織', department: 'CS', teacherId: 'T003', academicYear: '113-1', weekday: 3, startPeriod: 1, endPeriod: 3 },
    { id: 'EE101', name: '電路學', department: 'EE', teacherId: 'T002', academicYear: '113-1', weekday: 2, startPeriod: 2, endPeriod: 4 },
    { id: 'EE205', name: '數位邏輯', department: 'EE', teacherId: 'T002', academicYear: '113-1', weekday: 4, startPeriod: 3, endPeriod: 5 },
    { id: 'EE301', name: '訊號與系統', department: 'EE', teacherId: 'T004', academicYear: '113-1', weekday: 1, startPeriod: 6, endPeriod: 8 },
    { id: 'EE310', name: '嵌入式系統', department: 'EE', teacherId: 'T004', academicYear: '113-1', weekday: 3, startPeriod: 2, endPeriod: 4 },
    { id: 'EE320', name: '電力系統', department: 'EE', teacherId: 'T004', academicYear: '113-1', weekday: 5, startPeriod: 6, endPeriod: 8 },
    { id: 'BA101', name: '管理學', department: 'BA', teacherId: 'T005', academicYear: '113-1', weekday: 1, startPeriod: 2, endPeriod: 4 },
    { id: 'BA201', name: '行銷管理', department: 'BA', teacherId: 'T005', academicYear: '113-1', weekday: 3, startPeriod: 3, endPeriod: 5 },
    { id: 'BA301', name: '財務管理', department: 'BA', teacherId: 'T005', academicYear: '113-1', weekday: 4, startPeriod: 2, endPeriod: 4 },
    { id: 'BA210', name: '組織行為', department: 'BA', teacherId: 'T005', academicYear: '113-1', weekday: 2, startPeriod: 6, endPeriod: 8 },
    { id: 'FL101', name: '英文閱讀', department: 'FL', teacherId: 'T006', academicYear: '113-1', weekday: 2, startPeriod: 3, endPeriod: 4 },
    { id: 'FL201', name: '英語會話', department: 'FL', teacherId: 'T006', academicYear: '113-1', weekday: 4, startPeriod: 5, endPeriod: 7 },
    { id: 'FL210', name: '商用英文', department: 'FL', teacherId: 'T006', academicYear: '113-1', weekday: 5, startPeriod: 2, endPeriod: 4 }
  ];

  const ENROLLMENTS = [
    { courseId: 'CS101', studentId: 'S112001' },
    { courseId: 'CS201', studentId: 'S112001' },
    { courseId: 'CS101', studentId: 'S112002' },
    { courseId: 'EE101', studentId: 'S112002' },
    { courseId: 'EE101', studentId: 'S112003' },
    { courseId: 'EE205', studentId: 'S112003' },
    { courseId: 'CS101', studentId: 'S112004' },
    { courseId: 'CS301', studentId: 'S112004' },
    { courseId: 'CS201', studentId: 'S112005' },
    { courseId: 'CS210', studentId: 'S112005' },
    { courseId: 'CS401', studentId: 'S112005' },
    { courseId: 'EE101', studentId: 'S112006' },
    { courseId: 'EE301', studentId: 'S112006' },
    { courseId: 'EE205', studentId: 'S112007' },
    { courseId: 'EE310', studentId: 'S112007' },
    { courseId: 'EE320', studentId: 'S112007' },
    { courseId: 'BA101', studentId: 'S112008' },
    { courseId: 'BA201', studentId: 'S112008' },
    { courseId: 'BA201', studentId: 'S112009' },
    { courseId: 'BA301', studentId: 'S112009' },
    { courseId: 'BA101', studentId: 'S112010' },
    { courseId: 'BA210', studentId: 'S112010' },
    { courseId: 'FL101', studentId: 'S112011' },
    { courseId: 'FL201', studentId: 'S112011' },
    { courseId: 'FL201', studentId: 'S112012' },
    { courseId: 'FL210', studentId: 'S112012' },
    { courseId: 'CS201', studentId: 'S112013' },
    { courseId: 'CS401', studentId: 'S112013' },
    { courseId: 'EE205', studentId: 'S112014' },
    { courseId: 'EE320', studentId: 'S112014' },
    { courseId: 'BA210', studentId: 'S112015' },
    { courseId: 'BA301', studentId: 'S112015' },
    { courseId: 'FL101', studentId: 'S112016' },
    { courseId: 'FL210', studentId: 'S112016' }
  ];

  const DEMO_ACCOUNTS = [
    { username: 'admin', password: '12345678', name: '系統管理員', role: 'admin', caption: '全校管理與審核' },
    { username: 'T001', password: 'TeacherPassword123!', name: '王大明 教授', role: 'teacher', caption: 'CS101 / CS201 授課教師' },
    { username: 'T002', password: 'TeacherPassword123!', name: '李美玲 副教授', role: 'teacher', caption: 'EE101 / EE205 授課教師' },
    { username: 'S112001', password: 'StudentPassword123!', name: '陳小華', role: 'student', caption: '資訊工程學系 · 三年級' },
    { username: 'S112002', password: 'StudentPassword123!', name: '林志強', role: 'student', caption: '資訊工程學系 · 三年級' },
    { username: 'S112003', password: 'StudentPassword123!', name: '張雅婷', role: 'student', caption: '電機工程學系 · 三年級' }
  ];

  const MAIN_LEAVES = [
    { s: 'S112001', c: 'CS101', t: 'sick', o: -3, p: [3, 4], r: '流感高燒，診所建議居家隔離休養', status: 'pending', att: ['診斷證明.pdf', 182400] },
    { s: 'S112001', c: 'CS201', t: 'official', o: -8, p: [5, 6, 7], r: '代表系所參加全國開源軟體高峰研討會', status: 'approved', cm: '准假，請攜帶研討會證明補登作業' },
    { s: 'S112001', c: 'CS101', t: 'personal', o: -14, p: [3, 4], r: '個人私人事務無法出席', status: 'rejected', cm: '事假請依校規附上證明文件並提前兩天提出' },
    { s: 'S112001', c: 'CS201', t: 'sick', o: -22, p: [5, 6], r: '急性腸胃炎，醫師建議休息一日', status: 'approved', att: ['就診收據.pdf', 74300] },
    { s: 'S112001', c: 'CS101', t: 'official', o: -31, p: [3, 4], r: '擔任系學會活動志工', status: 'approved' },
    { s: 'S112001', c: 'CS201', t: 'bereavement', o: -43, p: [5, 6, 7], r: '祖母辭世，返鄉處理後事', status: 'approved', att: ['訃聞影本.pdf', 96000] },
    { s: 'S112001', c: 'CS101', t: 'other', o: -52, p: [3, 4], r: '原訂校外參訪，行程取消', status: 'withdrawn' },
    { s: 'S112001', c: 'CS201', t: 'sick', o: -64, p: [5, 6], r: '偏頭痛復發，無法專注上課', status: 'approved' },
    { s: 'S112001', c: 'CS101', t: 'personal', o: -75, p: [3, 4], r: '臨時有事需返家', status: 'rejected', cm: '未於期限內補附證明，予以駁回' },
    { s: 'S112001', c: 'CS201', t: 'official', o: -88, p: [5, 6], r: '參與教育部資安攻防演練', status: 'approved' },
    { s: 'S112001', c: 'CS101', t: 'sick', o: -101, p: [3, 4], r: 'A 型流感確診，居家隔離五天', status: 'approved', att: ['診斷證明.pdf', 201000] },
    { s: 'S112001', c: 'CS201', t: 'personal', o: -119, p: [5, 6, 7], r: '陪同家人就醫', status: 'approved' },
    { s: 'S112001', c: 'CS101', t: 'bereavement', o: -136, p: [3, 4], r: '外祖父辭世，返鄉治喪', status: 'approved' },
    { s: 'S112001', c: 'CS201', t: 'sick', o: 1, p: [5, 6], r: '發燒不適，預計就醫後休息', status: 'pending' },
    { s: 'S112001', c: 'CS101', t: 'other', o: -5, p: [3, 4], r: '參與校外程式競賽說明會', status: 'pending' },
    { s: 'S112002', c: 'CS101', t: 'personal', o: -2, p: [3, 4], r: '家中臨時需要協助處理私務', status: 'pending' },
    { s: 'S112002', c: 'EE101', t: 'sick', o: -6, p: [2, 3], r: '感冒發燒，校醫建議返家休息', status: 'approved', att: ['診斷證明.pdf', 155000] },
    { s: 'S112002', c: 'EE101', t: 'other', o: -12, p: [2, 3, 4], r: '原訂參加社團幹部訓練，活動延期', status: 'withdrawn' },
    { s: 'S112002', c: 'CS101', t: 'official', o: -21, p: [3, 4], r: '代表系上參加程式設計競賽', status: 'approved' },
    { s: 'S112002', c: 'EE101', t: 'personal', o: -29, p: [2, 3], r: '個人行程安排', status: 'rejected', cm: '事由未具體說明，請補件後重新申請' },
    { s: 'S112002', c: 'CS101', t: 'sick', o: -38, p: [3, 4], r: '腸胃炎嘔吐，無法到課', status: 'approved', att: ['就診收據.pdf', 68200] },
    { s: 'S112002', c: 'EE101', t: 'official', o: -50, p: [2, 3, 4], r: '參加校際電子設計競賽', status: 'approved' },
    { s: 'S112002', c: 'CS101', t: 'bereavement', o: -61, p: [3, 4], r: '家中長輩辭世', status: 'approved' },
    { s: 'S112002', c: 'EE101', t: 'personal', o: -77, p: [2, 3], r: '臨時私事', status: 'rejected', cm: '未依規定提前申請' },
    { s: 'S112002', c: 'CS101', t: 'sick', o: -94, p: [3, 4], r: '急性結膜炎，醫師建議在家休息', status: 'approved' },
    { s: 'S112002', c: 'EE101', t: 'official', o: -110, p: [2, 3], r: '擔任研討會學生志工', status: 'approved' },
    { s: 'S112002', c: 'CS101', t: 'personal', o: 2, p: [3, 4], r: '需陪同家人回診', status: 'pending' },
    { s: 'S112002', c: 'EE101', t: 'sick', o: -17, p: [2, 3], r: '重感冒咳嗽，避免傳染同學', status: 'approved', att: ['診斷證明.pdf', 143000] },
    { s: 'S112003', c: 'EE101', t: 'sick', o: -1, p: [2, 3], r: '發燒與喉嚨痛，今早至診所就醫', status: 'pending' },
    { s: 'S112003', c: 'EE205', t: 'personal', o: -7, p: [3, 4, 5], r: '家庭因素需返家處理', status: 'approved' },
    { s: 'S112003', c: 'EE101', t: 'official', o: -16, p: [2, 3], r: '參與系上專題成果發表', status: 'approved' },
    { s: 'S112003', c: 'EE205', t: 'sick', o: -25, p: [3, 4], r: '急性腸胃炎，需在家休養', status: 'approved', att: ['診斷證明.pdf', 170000] },
    { s: 'S112003', c: 'EE101', t: 'other', o: -34, p: [2, 3, 4], r: '原訂校外教學，因天候取消', status: 'withdrawn' },
    { s: 'S112003', c: 'EE205', t: 'personal', o: -45, p: [3, 4], r: '陪同家人辦理重要手續', status: 'approved' },
    { s: 'S112003', c: 'EE101', t: 'official', o: -57, p: [2, 3], r: '代表學校參加智慧電網研習', status: 'approved' },
    { s: 'S112003', c: 'EE205', t: 'bereavement', o: -69, p: [3, 4, 5], r: '外祖母辭世，返鄉協助治喪', status: 'approved' },
    { s: 'S112003', c: 'EE101', t: 'sick', o: -82, p: [2, 3], r: '身體不適', status: 'rejected', cm: '未檢附就醫證明，請補件後重新申請' },
    { s: 'S112003', c: 'EE205', t: 'personal', o: -99, p: [3, 4], r: '家中搬遷需要協助', status: 'approved' },
    { s: 'S112003', c: 'EE101', t: 'official', o: -117, p: [2, 3], r: '參加全國大專電機聯合競賽', status: 'approved' },
    { s: 'S112003', c: 'EE205', t: 'sick', o: 3, p: [3, 4], r: '感冒咳嗽，預計在家休息兩日', status: 'pending' }
  ];

  const REASON_BANK = {
    sick: [
      '身體不適，已至校醫室就診，需休息一日',
      '感冒發燒，醫師建議在家休養',
      '腸胃炎就醫，需暫停到課',
      '偏頭痛復發，無法專注上課',
      '急性結膜炎，避免傳染同學'
    ],
    personal: [
      '家中臨時需要協助處理私務',
      '陪同家人至醫院回診',
      '家庭因素需返家處理',
      '辦理重要個人證件',
      '住處搬遷需要協助'
    ],
    official: [
      '代表系所參加校際競賽',
      '擔任校內研討會學生志工',
      '參與教育部專案說明會',
      '代表學校參加專題成果發表',
      '協助系上辦理招生說明活動'
    ],
    bereavement: [
      '家中長輩辭世，返鄉協助治喪',
      '親屬辭世，需請假處理後事'
    ],
    other: [
      '原訂校外活動因天候取消',
      '參與校外學習活動',
      '生涯輔導諮詢',
      '原訂行程變更，自行撤回申請'
    ]
  };

  const ATTACHMENT_NAMES = {
    sick: ['診斷證明.pdf', '就診收據.pdf', '醫師囑咐單.pdf'],
    official: ['活動邀請函.pdf', '競賽通知.png', '研習公文.pdf'],
    personal: ['家長證明.pdf', '相關文件.pdf'],
    bereavement: ['訃聞影本.pdf'],
    other: ['活動通知.png']
  };

  const DONUT_COLORS = ['#5B7C99', '#7A9E7E', '#B58D3D', '#9E5B5B', '#8C7A9E', '#A3997A', '#6B8E99'];

  const AUDIT_ACTIONS = [
    'LOGIN_SUCCESS',
    'LOGIN_FAILURE',
    'LOGOUT',
    'SUBMIT_LEAVE',
    'WITHDRAW_LEAVE',
    'APPROVE_LEAVE',
    'REJECT_LEAVE',
    'BATCH_APPROVE_LEAVE',
    'BATCH_REJECT_LEAVE',
    'CHANGE_PASSWORD',
    'TOGGLE_USER',
    'SYSTEM_SEED'
  ];

  const AUDIT_LABELS = {
    LOGIN_SUCCESS: '登入成功',
    LOGIN_FAILURE: '登入失敗',
    LOGOUT: '登出',
    SUBMIT_LEAVE: '提出請假',
    WITHDRAW_LEAVE: '撤回請假',
    APPROVE_LEAVE: '審核核准',
    REJECT_LEAVE: '審核駁回',
    BATCH_APPROVE_LEAVE: '批次核准',
    BATCH_REJECT_LEAVE: '批次駁回',
    CHANGE_PASSWORD: '變更密碼',
    TOGGLE_USER: '啟用停用使用者',
    SYSTEM_SEED: '系統種子資料'
  };

  const ICONS = {
    dashboard: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
    audit: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    reset: '<path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M6.1 9A7 7 0 0 1 19 8l1 4M4 12l1 4a7 7 0 0 0 12.9-1"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>',
    alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.6 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    user: '<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    spark: '<path d="m12 3 1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3Z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/>',
    key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.8 12.2 8.2-8.2M16 5l3 3M13 8l3 3"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'
  };

  let state = null;
  let lastHash = '';

  function icon(name, size) {
    const dimension = size || 18;
    return '<svg width="' + dimension + '" height="' + dimension + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }

  function logoMark(size) {
    const dimension = size || 36;
    return '<svg class="demo-brand-logo" width="' + dimension + '" height="' + dimension + '" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="15" fill="var(--accent)"/><path d="M18 20h28v6H18zM18 30h28v6H18zM18 40h18v6H18z" fill="#FAF8F5"/><circle cx="44" cy="43" r="5" fill="#7A9E7E"/></svg>';
  }

  function esc(value) {
    return String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function pad2(value) {
    return String(value).padStart(2, '0');
  }

  function nowLocal() {
    const date = new Date();
    return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate()) + 'T' + pad2(date.getHours()) + ':' + pad2(date.getMinutes()) + ':' + pad2(date.getSeconds());
  }

  function dateOffset(days) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + Number(days || 0));
    return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
  }

  function dateTimeOffset(days, hour, minute) {
    const date = new Date();
    date.setHours(hour || 0, minute || 0, 0, 0);
    date.setDate(date.getDate() + Number(days || 0));
    return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate()) + 'T' + pad2(date.getHours()) + ':' + pad2(date.getMinutes()) + ':' + pad2(date.getSeconds());
  }

  function todayISO() {
    return dateOffset(0);
  }

  function formatDate(value) {
    return value ? String(value).slice(0, 10) : '—';
  }

  function formatDateTime(value) {
    if (!value) return '—';
    const text = String(value);
    if (text.length >= 16) return text.slice(0, 10) + ' ' + text.slice(11, 16);
    return text;
  }

  function monthKey(value) {
    return value ? String(value).slice(0, 7) : '';
  }

  function lastMonthKeys(count) {
    const keys = [];
    const base = new Date();
    base.setDate(1);
    for (let index = count - 1; index >= 0; index -= 1) {
      const date = new Date(base.getFullYear(), base.getMonth() - index, 1);
      keys.push(date.getFullYear() + '-' + pad2(date.getMonth() + 1));
    }
    return keys;
  }

  function periodSubset(course, seed) {
    const list = [];
    for (let period = course.startPeriod; period <= course.endPeriod; period += 1) {
      if (!list.length || (period + seed) % 2 === 0) list.push(period);
    }
    return list.length ? list : [course.startPeriod];
  }

  function defaultReviewComment(status) {
    if (status === 'approved') return '准假，請留意補課與作業期限。';
    if (status === 'rejected') return '請依校規補附相關證明文件。';
    return '';
  }

  function buildSeed() {
    const users = USERS.map(function (user) {
      return Object.assign({}, user, {
        isActive: true,
        mustChangePassword: user.id === 'S112001',
        createdAt: dateTimeOffset(-240, 8, 0)
      });
    });
    const courses = COURSES.map(function (course) {
      return Object.assign({}, course);
    });
    const enrollments = ENROLLMENTS.map(function (item) {
      return Object.assign({}, item);
    });
    const leaves = [];
    const auditLogs = [];
    let leaveCounter = 0;
    let auditCounter = 0;

    function nextLeaveId() {
      leaveCounter += 1;
      return 'LV-' + new Date().getFullYear() + '-' + String(leaveCounter).padStart(4, '0');
    }

    function pushAuditAt(time, action, targetType, targetId, details, userId) {
      auditCounter += 1;
      auditLogs.push({
        id: auditCounter,
        userId: userId || null,
        action: action,
        targetType: targetType,
        targetId: targetId || null,
        details: JSON.stringify(details || {}),
        ip: '192.168.1.' + (20 + (auditCounter % 70)),
        createdAt: time
      });
    }

    function addLeave(spec) {
      const course = courses.find(function (item) {
        return item.id === spec.c;
      });
      const student = users.find(function (item) {
        return item.id === spec.s;
      });
      if (!course || !student) return;
      const reviewed = spec.status === 'approved' || spec.status === 'rejected';
      const id = nextLeaveId();
      const createdAt = spec.o > 0 ? dateTimeOffset(-1, 9, 0) : dateTimeOffset(spec.o - 2, 9 + (leaveCounter % 6), 20);
      const reviewedAt = reviewed ? dateTimeOffset(spec.o - 1, 14 + (leaveCounter % 3), 10) : null;
      const updatedAt = reviewed ? reviewedAt : spec.status === 'withdrawn' ? dateTimeOffset(spec.o - 1, 16, 0) : createdAt;
      const leave = {
        id: id,
        studentId: spec.s,
        courseId: spec.c,
        leaveType: spec.t,
        startDate: dateOffset(spec.o),
        endDate: dateOffset(spec.o + (spec.days || 0)),
        periods: spec.p.slice().sort(function (a, b) { return a - b; }),
        reason: spec.r,
        status: spec.status,
        reviewComment: reviewed ? (spec.cm || defaultReviewComment(spec.status)) : '',
        reviewedBy: reviewed ? course.teacherId : null,
        reviewedAt: reviewedAt,
        attachment: spec.att ? { name: spec.att[0], size: spec.att[1] } : null,
        createdAt: createdAt,
        updatedAt: updatedAt
      };
      leaves.push(leave);
      pushAuditAt(createdAt, 'SUBMIT_LEAVE', 'leave_request', id, {
        courseId: leave.courseId,
        leaveType: leave.leaveType,
        startDate: leave.startDate,
        endDate: leave.endDate,
        periods: leave.periods
      }, student.id);
      if (reviewed) {
        pushAuditAt(reviewedAt, leave.status === 'approved' ? 'APPROVE_LEAVE' : 'REJECT_LEAVE', 'leave_request', id, { comment: leave.reviewComment }, course.teacherId);
      }
      if (leave.status === 'withdrawn') {
        pushAuditAt(updatedAt, 'WITHDRAW_LEAVE', 'leave_request', id, { reason: '學生自行撤回' }, student.id);
      }
    }

    MAIN_LEAVES.forEach(addLeave);

    const mainIds = ['S112001', 'S112002', 'S112003'];
    const extraStudents = users.filter(function (user) {
      return user.role === 'student' && mainIds.indexOf(user.id) === -1;
    });
    const extraStatuses = ['approved', 'approved', 'rejected', 'withdrawn', 'approved', 'approved'];
    const leaveTypeKeys = Object.keys(LEAVE_TYPES);
    extraStudents.forEach(function (student, studentIndex) {
      const studentCourses = enrollments.filter(function (item) {
        return item.studentId === student.id;
      });
      if (!studentCourses.length) return;
      const count = 2 + (studentIndex % 3);
      for (let index = 0; index < count; index += 1) {
        const courseId = studentCourses[(studentIndex + index) % studentCourses.length].courseId;
        const course = courses.find(function (item) {
          return item.id === courseId;
        });
        const leaveType = leaveTypeKeys[(studentIndex + index) % leaveTypeKeys.length];
        const status = index === 0 ? 'pending' : extraStatuses[(studentIndex + index) % extraStatuses.length];
        const reasonList = REASON_BANK[leaveType];
        const reason = reasonList[(studentIndex + index) % reasonList.length];
        const offset = index === 0 ? 1 + (studentIndex % 5) : -(12 + studentIndex * 9 + index * 16);
        let attachment = null;
        if ((leaveType === 'sick' || leaveType === 'official') && (studentIndex + index) % 3 === 0) {
          const names = ATTACHMENT_NAMES[leaveType];
          attachment = [names[(studentIndex + index) % names.length], 88000 + studentIndex * 4200 + index * 3100];
        }
        const spec = {
          s: student.id,
          c: courseId,
          t: leaveType,
          o: offset,
          days: (studentIndex + index) % 5 === 0 ? 1 : 0,
          p: periodSubset(course, studentIndex + index),
          r: reason,
          status: status,
          att: attachment
        };
        if (status === 'approved') spec.cm = '准假，請留意補課與作業期限。';
        if (status === 'rejected') spec.cm = '請依校規補附相關證明文件後重新申請。';
        addLeave(spec);
      }
    });

    pushAuditAt(dateTimeOffset(-230, 8, 0), 'SYSTEM_SEED', 'system', 'all', {
      message: '系統初始種子資料載入完成',
      users: users.length,
      courses: courses.length,
      leaves: leaves.length
    }, 'admin');
    pushAuditAt(dateTimeOffset(-1, 8, 5), 'LOGIN_SUCCESS', 'session', 'admin', { role: 'admin' }, 'admin');
    pushAuditAt(dateTimeOffset(-1, 8, 12), 'LOGIN_SUCCESS', 'session', 'T001', { role: 'teacher' }, 'T001');
    pushAuditAt(dateTimeOffset(-1, 20, 10), 'LOGIN_SUCCESS', 'session', 'S112001', { role: 'student' }, 'S112001');
    pushAuditAt(dateTimeOffset(-2, 8, 20), 'LOGIN_SUCCESS', 'session', 'T002', { role: 'teacher' }, 'T002');
    pushAuditAt(dateTimeOffset(-2, 19, 35), 'LOGIN_SUCCESS', 'session', 'S112002', { role: 'student' }, 'S112002');
    pushAuditAt(dateTimeOffset(-2, 17, 40), 'LOGOUT', 'session', 'S112002', { message: '使用者主動登出' }, 'S112002');
    pushAuditAt(dateTimeOffset(-3, 21, 5), 'LOGIN_SUCCESS', 'session', 'S112003', { role: 'student' }, 'S112003');
    pushAuditAt(dateTimeOffset(-4, 22, 40), 'LOGIN_FAILURE', 'session', null, { username: 'S112099' }, null);
    pushAuditAt(dateTimeOffset(-5, 10, 5), 'CHANGE_PASSWORD', 'user', 'S112001', { message: '首次登入完成密碼變更' }, 'S112001');
    pushAuditAt(dateTimeOffset(-6, 14, 20), 'BATCH_APPROVE_LEAVE', 'leave_request', 'CS101', { count: 3, courseId: 'CS101' }, 'T001');
    pushAuditAt(dateTimeOffset(-12, 9, 15), 'TOGGLE_USER', 'user', 'S112016', { isActive: true }, 'admin');

    auditLogs.sort(function (a, b) {
      if (a.createdAt < b.createdAt) return 1;
      if (a.createdAt > b.createdAt) return -1;
      return b.id - a.id;
    });

    return {
      version: 1,
      users: users,
      courses: courses,
      enrollments: enrollments,
      leaves: leaves,
      auditLogs: auditLogs,
      counters: { leave: leaveCounter, audit: auditCounter },
      seededAt: nowLocal()
    };
  }

  function loadState() {
    let parsed = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) parsed = JSON.parse(raw);
    } catch (error) {
      parsed = null;
    }
    if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.courses) && Array.isArray(parsed.leaves) && Array.isArray(parsed.auditLogs)) {
      return parsed;
    }
    const seeded = buildSeed();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    } catch (error) {
      state = seeded;
    }
    return seeded;
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      return;
    }
  }

  function getSessionId() {
    try {
      return localStorage.getItem(SESSION_KEY);
    } catch (error) {
      return null;
    }
  }

  function setSession(id) {
    try {
      localStorage.setItem(SESSION_KEY, id);
    } catch (error) {
      return;
    }
  }

  function clearSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      return;
    }
  }

  function getUserById(id) {
    return state.users.find(function (user) {
      return user.id === id;
    }) || null;
  }

  function getCourseById(id) {
    return state.courses.find(function (course) {
      return course.id === id;
    }) || null;
  }

  function currentUser() {
    if (!state) return null;
    const id = getSessionId();
    if (!id) return null;
    const user = getUserById(id);
    if (!user || !user.isActive) {
      clearSession();
      return null;
    }
    return user;
  }

  function departmentName(code) {
    const department = DEPARTMENTS.find(function (item) {
      return item.code === code;
    });
    return department ? department.name : code || '—';
  }

  function weekdayLabel(day) {
    const weekday = WEEKDAYS.find(function (item) {
      return item.day === Number(day);
    });
    return weekday ? weekday.label : '—';
  }

  function roleLabel(role) {
    return ROLE_LABELS[role] || role || '—';
  }

  function leaveTypeLabel(type) {
    return LEAVE_TYPES[type] || type || '—';
  }

  function statusLabel(status) {
    return LEAVE_STATUS[status] || status || '—';
  }

  function roleHome(role) {
    if (role === 'admin') return '/admin';
    if (role === 'teacher') return '/review';
    return '/student';
  }

  function teacherName(course) {
    const teacher = course ? getUserById(course.teacherId) : null;
    return teacher ? teacher.name : '—';
  }

  function getLeaveById(id) {
    return state.leaves.find(function (leave) {
      return leave.id === id;
    }) || null;
  }

  function courseForLeave(leave) {
    return leave ? getCourseById(leave.courseId) : null;
  }

  function enrolledCourses(studentId) {
    return state.enrollments.filter(function (item) {
      return item.studentId === studentId;
    }).map(function (item) {
      return getCourseById(item.courseId);
    }).filter(Boolean);
  }

  function enrollmentCount(courseId) {
    return state.enrollments.filter(function (item) {
      return item.courseId === courseId;
    }).length;
  }

  function teacherCourses(teacherId) {
    return state.courses.filter(function (course) {
      return course.teacherId === teacherId;
    });
  }

  function visibleLeaves(user) {
    if (!user) return [];
    if (user.role === 'admin') return state.leaves.slice();
    if (user.role === 'teacher') {
      const courseIds = teacherCourses(user.id).map(function (course) {
        return course.id;
      });
      return state.leaves.filter(function (leave) {
        return courseIds.indexOf(leave.courseId) !== -1;
      });
    }
    return state.leaves.filter(function (leave) {
      return leave.studentId === user.id;
    });
  }

  function canReviewLeave(user, leave) {
    if (!user || !leave) return false;
    if (user.role === 'admin') return true;
    if (user.role !== 'teacher') return false;
    const course = courseForLeave(leave);
    return Boolean(course && course.teacherId === user.id);
  }

  function pendingReviewCount(user) {
    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) return 0;
    return visibleLeaves(user).filter(function (leave) {
      return leave.status === 'pending';
    }).length;
  }

  function sortLeaves(list) {
    return list.slice().sort(function (a, b) {
      const aKey = a.startDate + ' ' + a.createdAt;
      const bKey = b.startDate + ' ' + b.createdAt;
      if (aKey < bKey) return 1;
      if (aKey > bKey) return -1;
      return 0;
    });
  }

  function statusBadge(status) {
    return '<span class="badge badge-' + esc(status) + '">' + esc(statusLabel(status)) + '</span>';
  }

  function roleTag(role) {
    return '<span class="demo-role demo-role-' + esc(role) + '">' + esc(roleLabel(role)) + '</span>';
  }

  function attachmentRow(attachment) {
    if (!attachment) return '<span class="demo-muted">無檢附佐證文件</span>';
    return '<div class="demo-attachment"><div class="demo-attachment-meta">' + icon('file', 18) + '<span class="demo-attachment-name">' + esc(attachment.name) + '</span><span class="demo-muted">' + Math.max(1, Math.round(attachment.size / 1024)) + ' KB</span></div><button type="button" class="btn btn-secondary btn-sm" data-action="view-attachment" data-name="' + esc(attachment.name) + '">下載 / 預覽</button></div>';
  }

  function periodsText(periods) {
    return '第 ' + periods.join(', ') + ' 節';
  }

  function dateRangeText(leave) {
    if (leave.startDate === leave.endDate) return leave.startDate;
    return leave.startDate + ' ~ ' + leave.endDate;
  }

  function pageHeader(title, subtitle, actions, eyebrow) {
    return '<div class="demo-page-head"><div class="demo-page-heading">' + (eyebrow ? '<div class="demo-eyebrow">' + eyebrow + '</div>' : '') + '<h1 class="demo-page-title">' + esc(title) + '</h1>' + (subtitle ? '<p class="demo-page-sub">' + esc(subtitle) + '</p>' : '') + '</div>' + (actions ? '<div class="demo-page-actions">' + actions + '</div>' : '') + '</div>';
  }

  function emptyState(iconName, title, text, action) {
    return '<div class="demo-empty"><span class="demo-empty-icon">' + icon(iconName, 22) + '</span><strong class="demo-empty-title">' + esc(title) + '</strong><span class="demo-empty-text">' + esc(text) + '</span>' + (action || '') + '</div>';
  }

  function pageNumber(params, totalPages) {
    let page = parseInt(params.get('page') || '1', 10);
    if (!Number.isFinite(page) || page < 1) page = 1;
    return Math.min(page, Math.max(totalPages, 1));
  }

  function pageQuery(path, params, page) {
    const query = new URLSearchParams(params ? params.toString() : '');
    query.set('page', String(page));
    const text = query.toString();
    return path + (text ? '?' + text : '');
  }

  function renderPagination(path, params, page, totalPages) {
    if (totalPages <= 1) return '';
    const previous = page > 1 ? '<a class="demo-page-btn" href="#' + esc(pageQuery(path, params, page - 1)) + '">‹ 上一頁</a>' : '<span class="demo-page-btn disabled" aria-disabled="true">‹ 上一頁</span>';
    const next = page < totalPages ? '<a class="demo-page-btn" href="#' + esc(pageQuery(path, params, page + 1)) + '">下一頁 ›</a>' : '<span class="demo-page-btn disabled" aria-disabled="true">下一頁 ›</span>';
    return '<nav class="demo-pagination" aria-label="分頁導航">' + previous + '<span class="demo-page-info">第 <strong>' + page + '</strong> 頁 / 共 ' + totalPages + ' 頁</span>' + next + '</nav>';
  }

  function pageTitleFor(route, user) {
    if (route.path === '/student') return '我的請假紀錄';
    if (route.path === '/student/apply') return '線上請假申請';
    if (route.segments[0] === 'student' && route.segments.length === 2) return '請假單明細';
    if (route.path === '/review') return user && user.role === 'admin' ? '全校請假審核' : '課堂請假審核';
    if (route.segments[0] === 'review' && route.segments.length === 2) return '審核請假申請';
    if (route.path === '/admin') return '系統管理中心';
    if (route.path === '/admin/users') return '使用者管理';
    if (route.path === '/admin/courses') return '課程與選課管理';
    if (route.path === '/admin/audit') return '資安稽核日誌';
    if (route.path === '/stats') return user && user.role === 'admin' ? '全校請假統計' : '課程請假統計';
    return '頁面不存在';
  }

  function navItems(user) {
    if (user.role === 'student') {
      return [
        { path: '/student', label: '我的請假', icon: 'list' },
        { path: '/student/apply', label: '提出申請', icon: 'plus' }
      ];
    }
    if (user.role === 'teacher') {
      return [
        { path: '/review', label: '審核清單', icon: 'check' },
        { path: '/stats', label: '課程統計', icon: 'chart' }
      ];
    }
    return [
      { path: '/admin', label: '管理中心', icon: 'dashboard' },
      { path: '/review', label: '全校審核', icon: 'check' },
      { path: '/stats', label: '全校統計', icon: 'chart' },
      { path: '/admin/users', label: '使用者管理', icon: 'users' },
      { path: '/admin/courses', label: '課程維護', icon: 'book' },
      { path: '/admin/audit', label: '稽核日誌', icon: 'audit' }
    ];
  }

  function isNavActive(path, currentPath) {
    if (path === '/student') return currentPath === '/student' || (currentPath.indexOf('/student/') === 0 && currentPath !== '/student/apply');
    if (path === '/review') return currentPath === '/review' || currentPath.indexOf('/review/') === 0;
    if (path === '/admin') return currentPath === '/admin';
    return currentPath === path;
  }

  function getRoute() {
    let raw = location.hash ? location.hash.slice(1) : '/';
    if (!raw) raw = '/';
    const split = raw.split('?');
    let path = split[0] || '/';
    if (path.length > 1 && path.charAt(path.length - 1) === '/') path = path.slice(0, -1);
    const params = new URLSearchParams(split[1] || '');
    const segments = path.split('/').filter(Boolean);
    return { path: path, params: params, segments: segments };
  }

  function navigate(path) {
    const next = '#' + path;
    if (location.hash === next) {
      render();
      return;
    }
    location.hash = next;
  }

  function showInlineAlert(id, message, tone) {
    const element = document.getElementById(id);
    if (!element) return;
    if (!message) {
      element.hidden = true;
      element.textContent = '';
      return;
    }
    element.hidden = false;
    element.textContent = message;
    element.className = 'demo-alert demo-alert-' + (tone || 'error');
  }

  function toast(message, level) {
    const root = document.getElementById('toast-root');
    if (!root) return;
    const tone = level === 'error' ? 'error' : level === 'warning' ? 'warning' : level === 'info' ? 'info' : 'success';
    const iconName = tone === 'error' || tone === 'warning' ? 'alert' : tone === 'info' ? 'info' : 'check';
    const element = document.createElement('div');
    element.className = 'demo-toast demo-toast-' + tone;
    element.innerHTML = '<span class="demo-toast-icon">' + icon(iconName, 16) + '</span><span class="demo-toast-text">' + esc(message) + '</span><button type="button" class="demo-toast-close" data-action="dismiss-toast" aria-label="關閉通知">' + icon('close', 14) + '</button>';
    root.appendChild(element);
    window.setTimeout(function () {
      element.classList.add('demo-toast-out');
      window.setTimeout(function () {
        element.remove();
      }, 190);
    }, 3600);
  }

  function nextLeaveId() {
    state.counters.leave = (state.counters.leave || 0) + 1;
    return 'LV-' + new Date().getFullYear() + '-' + String(state.counters.leave).padStart(4, '0');
  }

  function addAudit(action, targetType, targetId, details, actorId) {
    state.counters.audit = (state.counters.audit || 0) + 1;
    state.auditLogs.unshift({
      id: state.counters.audit,
      userId: actorId || null,
      action: action,
      targetType: targetType,
      targetId: targetId || null,
      details: JSON.stringify(details || {}),
      ip: '192.168.1.' + (10 + (state.counters.audit % 80)),
      createdAt: nowLocal()
    });
  }

  const AUDIT_TARGET_LABELS = {
    leave_request: '請假單',
    session: '登入工作階段',
    user: '使用者',
    system: '系統',
    course: '課程'
  };

  function initials(name) {
    const text = String(name || '').trim();
    return text ? text.slice(0, 1).toUpperCase() : '?';
  }

  function avatar(name) {
    return '<span class="demo-avatar" aria-hidden="true">' + esc(initials(name)) + '</span>';
  }

  function statCard(iconName, label, value, hint, tone) {
    return '<div class="demo-stat-card' + (tone ? ' is-' + esc(tone) : '') + '"><div class="demo-stat-top"><span class="demo-stat-icon">' + icon(iconName, 18) + '</span></div><span class="demo-stat-label">' + esc(label) + '</span><strong class="demo-stat-value">' + esc(value) + '</strong><span class="demo-stat-hint">' + esc(hint) + '</span></div>';
  }

  function courseLabel(course) {
    return course ? course.code + ' ' + course.name : '—';
  }

  function courseScheduleText(course) {
    if (!course) return '—';
    return weekdayLabel(course.weekday) + ' 第 ' + course.startPeriod + '–' + course.endPeriod + ' 節';
  }

  function sumPeriods(list) {
    return list.reduce(function (total, leave) {
      return total + (leave.periods ? leave.periods.length : 0);
    }, 0);
  }

  function slicePage(list, params, size) {
    const pages = Math.max(1, Math.ceil(list.length / size));
    const page = pageNumber(params, pages);
    const start = (page - 1) * size;
    return {
      items: list.slice(start, start + size),
      page: page,
      pages: pages
    };
  }

  function queryLink(path, params, updates) {
    const query = new URLSearchParams(params ? params.toString() : '');
    Object.keys(updates || {}).forEach(function (key) {
      const value = updates[key];
      if (value === null || value === undefined || value === '' || value === 'all') query.delete(key);
      else query.set(key, String(value));
    });
    query.delete('page');
    const text = query.toString();
    return path + (text ? '?' + text : '');
  }

  function statusTabs(path, params, list) {
    const rawStatus = params.get('status') || 'all';
    const active = rawStatus === 'all' || LEAVE_STATUS[rawStatus] ? rawStatus : 'all';
    const definitions = [
      ['all', '全部'],
      ['pending', '待審核'],
      ['approved', '已核准'],
      ['rejected', '已駁回'],
      ['withdrawn', '已撤回']
    ];
    return '<div class="demo-tabs" role="tablist" aria-label="請假狀態篩選">' + definitions.map(function (item) {
      const count = item[0] === 'all' ? list.length : list.filter(function (leave) {
        return leave.status === item[0];
      }).length;
      const href = queryLink(path, params, { status: item[0] === 'all' ? 'all' : item[0] });
      return '<a class="demo-tab' + (active === item[0] ? ' active' : '') + '" role="tab" aria-selected="' + (active === item[0] ? 'true' : 'false') + '" href="#' + esc(href) + '">' + esc(item[1]) + '<span class="demo-tab-count">' + count + '</span></a>';
    }).join('') + '</div>';
  }

  function chartCard(title, subtitle, content) {
    return '<div class="demo-chart-card"><div class="demo-chart-head"><div class="demo-chart-title">' + esc(title) + '</div><div class="demo-chart-sub">' + esc(subtitle) + '</div></div>' + content + '</div>';
  }

  function donutChart(items) {
    const total = items.reduce(function (sum, item) {
      return sum + item.value;
    }, 0);
    if (!total) return '<div class="demo-chart-empty">目前尚無請假資料</div>';
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;
    const segments = items.map(function (item, index) {
      const ratio = item.value / total;
      const color = item.color || DONUT_COLORS[index % DONUT_COLORS.length];
      const segment = '<circle class="demo-donut-segment" cx="60" cy="60" r="' + radius + '" fill="none" stroke="' + color + '" stroke-width="17" stroke-dasharray="' + (ratio * circumference) + ' ' + circumference + '" stroke-dashoffset="' + (-offset) + '"/>';
      offset += ratio * circumference;
      return segment;
    }).join('');
    const legend = items.map(function (item, index) {
      const color = item.color || DONUT_COLORS[index % DONUT_COLORS.length];
      const percent = Math.round(item.value / total * 100);
      return '<div class="demo-legend-item"><span class="demo-legend-dot" style="background:' + color + '"></span><span class="demo-legend-label">' + esc(item.label) + '</span><span class="demo-legend-value">' + item.value + ' · ' + percent + '%</span></div>';
    }).join('');
    return '<div class="demo-donut-wrap"><svg class="demo-donut-svg" viewBox="0 0 120 120" role="img" aria-label="請假類型比例"><g transform="rotate(-90 60 60)"><circle cx="60" cy="60" r="' + radius + '" fill="none" stroke="var(--bg-subtle)" stroke-width="17"/>' + segments + '</g><text x="60" y="57" text-anchor="middle" font-size="19" font-weight="700" fill="currentColor">' + total + '</text><text x="60" y="73" text-anchor="middle" font-size="8" fill="currentColor" opacity="0.58">筆請假</text></svg><div class="demo-legend">' + legend + '</div></div>';
  }

  function lineChart(points) {
    if (!points.length) return '<div class="demo-chart-empty">目前尚無趨勢資料</div>';
    const width = 520;
    const height = 210;
    const left = 38;
    const right = 16;
    const top = 18;
    const bottom = 34;
    const innerWidth = width - left - right;
    const innerHeight = height - top - bottom;
    const maxValue = Math.max(1, Math.max.apply(null, points.map(function (point) {
      return point.value;
    })));
    const step = points.length > 1 ? innerWidth / (points.length - 1) : innerWidth;
    const coords = points.map(function (point, index) {
      return {
        x: points.length > 1 ? left + step * index : left + innerWidth / 2,
        y: top + innerHeight - (point.value / maxValue) * innerHeight,
        label: point.label,
        value: point.value
      };
    });
    const grid = [0, 0.25, 0.5, 0.75, 1].map(function (ratio) {
      const y = top + innerHeight * ratio;
      return '<line x1="' + left + '" y1="' + y + '" x2="' + (width - right) + '" y2="' + y + '" stroke="var(--border-color)" stroke-dasharray="4 5"/>';
    }).join('');
    const line = coords.map(function (point, index) {
      return (index === 0 ? 'M' : 'L') + point.x.toFixed(1) + ' ' + point.y.toFixed(1);
    }).join(' ');
    const area = line + ' L ' + coords[coords.length - 1].x.toFixed(1) + ' ' + (top + innerHeight) + ' L ' + coords[0].x.toFixed(1) + ' ' + (top + innerHeight) + ' Z';
    const dots = coords.map(function (point) {
      return '<circle class="demo-line-dot" cx="' + point.x.toFixed(1) + '" cy="' + point.y.toFixed(1) + '" r="4" fill="var(--bg-surface)" stroke="var(--accent)" stroke-width="2"><title>' + esc(point.label) + '：' + point.value + ' 筆</title></circle>';
    }).join('');
    const labels = coords.map(function (point) {
      return '<text x="' + point.x.toFixed(1) + '" y="' + (height - 10) + '" text-anchor="middle" font-size="9" fill="currentColor" opacity="0.62">' + esc(point.label) + '</text>';
    }).join('');
    return '<div class="demo-line-wrap"><svg class="demo-line-svg" viewBox="0 0 520 210" role="img" aria-label="每月請假申請趨勢">' + grid + '<path d="' + area + '" fill="var(--accent-light)" opacity="0.7"/><path class="demo-line-track" d="' + line + '" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' + dots + labels + '</svg></div>';
  }

  function barChart(items) {
    if (!items.length) return '<div class="demo-chart-empty">目前尚無統計資料</div>';
    const maxValue = Math.max(1, Math.max.apply(null, items.map(function (item) {
      return item.value;
    })));
    return '<div class="demo-bar-list">' + items.map(function (item) {
      const width = item.value > 0 ? Math.max(3, item.value / maxValue * 100) : 0;
      const color = item.color || 'var(--accent)';
      return '<div class="demo-bar-item"><div class="demo-bar-head"><span class="demo-bar-label">' + esc(item.label) + '</span><span class="demo-bar-value">' + esc(item.text || item.value) + '</span></div><div class="demo-bar-track"><div class="demo-bar-fill" style="width:' + width + '%;background:' + color + '"></div></div></div>';
    }).join('') + '</div>';
  }

  function auditTone(action) {
    if (action === 'LOGIN_FAILURE' || action === 'REJECT_LEAVE' || action === 'BATCH_REJECT_LEAVE') return 'danger';
    if (action === 'APPROVE_LEAVE' || action === 'BATCH_APPROVE_LEAVE' || action === 'LOGIN_SUCCESS') return 'success';
    if (action === 'WITHDRAW_LEAVE' || action === 'TOGGLE_USER') return 'warning';
    if (action === 'SUBMIT_LEAVE' || action === 'CHANGE_PASSWORD') return 'info';
    return 'neutral';
  }

  function auditActionLabel(action) {
    return AUDIT_LABELS[action] || action || '—';
  }

  function auditDetailsText(raw) {
    try {
      return JSON.stringify(JSON.parse(raw));
    } catch (error) {
      return raw || '{}';
    }
  }

  function loginView() {
    const accounts = DEMO_ACCOUNTS.map(function (account) {
      return '<button type="button" class="demo-account-card" data-action="fill-login" data-username="' + esc(account.username) + '" data-password="' + esc(account.password) + '"><span class="demo-account-top"><span class="demo-account-name">' + esc(account.name) + '</span><span class="demo-role demo-role-' + esc(account.role) + '">' + esc(roleLabel(account.role)) + '</span></span><span class="demo-account-id">' + esc(account.username) + '</span><span class="demo-account-pass">' + esc(account.password) + '</span></button>';
    }).join('');
    return '<div class="demo-login-page"><div class="demo-login-shell"><section class="demo-login-brand" aria-label="系統介紹"><div><div class="demo-login-mark">' + logoMark(44) + '<div class="demo-login-mark-text"><span class="demo-login-mark-title">' + esc(SCHOOL_NAME) + '</span><span class="demo-login-mark-sub">' + esc(SYSTEM_NAME) + '</span></div></div><div class="demo-login-kicker">' + icon('shield', 14) + '課堂出缺席管理</div><h1 class="demo-login-title">讓請假流程，<br><span>簡單而透明。</span></h1><p class="demo-login-desc">學生線上提出申請，教師即時掌握課堂請假狀況，管理者集中檢視全校紀錄與稽核軌跡。</p><ul class="demo-login-points"><li class="demo-login-point"><span class="demo-login-point-icon">' + icon('check', 12) + '</span>依課程與節次精準請假</li><li class="demo-login-point"><span class="demo-login-point-icon">' + icon('check', 12) + '</span>教師審核與批次處理</li><li class="demo-login-point"><span class="demo-login-point-icon">' + icon('check', 12) + '</span>統計圖表與資安稽核</li></ul></div><div class="demo-login-meta">本示範完全離線執行，資料儲存在瀏覽器 localStorage。<br>所有帳號、課程與請假紀錄皆為虛構示範資料。</div></section><section class="demo-login-card-wrap" aria-label="登入表單"><div class="card demo-login-card"><div class="demo-login-head"><h2>登入系統</h2><p>使用學號、教師代碼或管理員帳號登入。</p></div><form class="demo-login-form" data-form="login" novalidate><div id="login-error" class="demo-alert demo-alert-error" role="alert" hidden></div><div class="form-group"><label class="form-label" for="login-username">帳號<span class="required">*</span></label><input class="form-control" id="login-username" name="username" type="text" autocomplete="username" placeholder="例如：S112001" required></div><div class="form-group"><label class="form-label" for="login-password">密碼<span class="required">*</span></label><div class="demo-password-wrap"><input class="form-control" id="login-password" name="password" type="password" autocomplete="current-password" placeholder="請輸入密碼" required><button type="button" class="demo-password-toggle" data-action="toggle-password" data-target="login-password">顯示</button></div></div><button type="submit" class="btn btn-primary">' + icon('arrow', 16) + '登入系統</button></form><div class="demo-login-divider">快速填入示範帳號</div><div class="demo-account-grid">' + accounts + '</div><div class="demo-login-note">教師密碼皆為 TeacherPassword123!，學生密碼皆為 StudentPassword123!，管理員密碼為 12345678。示範版不會連線至任何伺服器。</div></div></section></div><div class="demo-login-footer"><span>' + esc(SCHOOL_NAME) + ' · ' + esc(SYSTEM_NAME) + ' · 離線示範版</span> · <button type="button" data-action="reset-demo">重設示範資料</button></div></div>';
  }

  function shellView(user, route, content) {
    const pending = pendingReviewCount(user);
    const nav = navItems(user).map(function (item) {
      const active = isNavActive(item.path, route.path);
      const badge = item.path === '/review' && pending ? '<span class="demo-nav-badge">' + pending + '</span>' : '';
      return '<a class="demo-nav-link' + (active ? ' active' : '') + '" href="#' + esc(item.path) + '"' + (active ? ' aria-current="page"' : '') + '><span class="demo-nav-icon">' + icon(item.icon, 16) + '</span><span class="demo-nav-text">' + esc(item.label) + '</span>' + badge + '</a>';
    }).join('');
    const title = pageTitleFor(route, user);
    return '<div class="demo-shell"><aside class="demo-sidebar" aria-label="主要導覽"><div class="demo-sidebar-inner"><a class="demo-sidebar-brand" href="#' + esc(roleHome(user.role)) + '">' + logoMark(38) + '<span><span class="demo-brand-title">' + esc(SCHOOL_NAME) + '</span><span class="demo-brand-sub">' + esc(SYSTEM_NAME) + '</span></span></a><div class="demo-sidebar-section"><div class="demo-sidebar-label">主選單</div><nav class="demo-nav">' + nav + '</nav></div><div class="demo-sidebar-footer"><div class="demo-sidebar-note">離線示範 · 資料僅存於此瀏覽器<br>所有操作都不會傳送至伺服器</div><button type="button" class="btn btn-secondary btn-sm demo-sidebar-reset" data-action="reset-demo">' + icon('reset', 15) + '重設示範資料</button></div></div></aside><button type="button" class="demo-backdrop" data-action="close-sidebar" aria-label="關閉導覽"></button><div class="demo-main"><header class="demo-topbar"><div class="demo-topbar-left"><button type="button" class="demo-menu-btn" data-action="open-sidebar" aria-label="開啟導覽">' + icon('menu', 20) + '</button><div class="demo-topbar-context"><span class="demo-topbar-title">' + esc(title) + '</span><span class="demo-topbar-sub">' + esc(SCHOOL_NAME) + ' · ' + esc(departmentName(user.department)) + '</span></div></div><div class="demo-topbar-right"><span class="demo-demo-chip">' + icon('shield', 12) + '離線示範</span><div class="demo-user-chip">' + avatar(user.name) + '<div class="demo-user-meta"><span class="demo-user-name">' + esc(user.name) + '</span><span class="demo-user-role">' + esc(roleLabel(user.role)) + '</span></div></div><button type="button" class="btn btn-secondary btn-sm demo-topbar-logout" data-action="logout">' + icon('logout', 15) + '<span>登出</span></button></div></header><main class="demo-content" id="main-content">' + content + '</main></div></div>';
  }

  function routeView(route, user) {
    const segments = route.segments;
    if (route.path === '/student') {
      if (user.role !== 'student') return accessDeniedView('「我的請假」僅供學生帳號使用。');
      return studentListView(user, route);
    }
    if (route.path === '/student/apply') {
      if (user.role !== 'student') return accessDeniedView('僅學生帳號可以提出請假申請。');
      return studentApplyView(user);
    }
    if (segments[0] === 'student' && segments.length === 2) {
      const leave = getLeaveById(segments[1]);
      if (!leave) return notFoundView('找不到指定的請假單。');
      if (user.role === 'student' && leave.studentId !== user.id) return accessDeniedView('你只能檢視自己的請假紀錄。');
      if (user.role === 'teacher' && !canReviewLeave(user, leave)) return accessDeniedView('這張請假單不屬於你授課的課程。');
      return studentDetailView(user, leave);
    }
    if (route.path === '/review') {
      if (user.role !== 'teacher' && user.role !== 'admin') return accessDeniedView('審核功能僅供教師與管理員使用。');
      return reviewListView(user, route);
    }
    if (segments[0] === 'review' && segments.length === 2) {
      if (user.role !== 'teacher' && user.role !== 'admin') return accessDeniedView('審核功能僅供教師與管理員使用。');
      const leave = getLeaveById(segments[1]);
      if (!leave) return notFoundView('找不到指定的請假單。');
      if (!canReviewLeave(user, leave)) return accessDeniedView('你沒有權限審核這張請假單。');
      return reviewDetailView(user, leave);
    }
    if (route.path === '/admin' || route.path === '/admin/users' || route.path === '/admin/courses' || route.path === '/admin/audit') {
      if (user.role !== 'admin') return accessDeniedView('系統管理中心僅供管理員使用。');
      if (route.path === '/admin') return adminDashboardView();
      if (route.path === '/admin/users') return usersView(user, route);
      if (route.path === '/admin/courses') return coursesView(route);
      return auditView(route);
    }
    if (route.path === '/stats') {
      if (user.role !== 'teacher' && user.role !== 'admin') return accessDeniedView('統計圖表僅供教師與管理員使用。');
      return statsView(user, route);
    }
    return notFoundView('此頁面不存在，請確認網址是否正確。');
  }

  function render() {
    const route = getRoute();
    const user = currentUser();
    const app = document.getElementById('app');
    if (!app) return;
    const previousHash = lastHash;
    lastHash = location.hash;
    if (!user) {
      if (route.path !== '/login') {
        navigate('/login');
        return;
      }
      app.innerHTML = loginView();
      document.title = '登入 · ' + SCHOOL_NAME + ' ' + SYSTEM_NAME;
      window.scrollTo(0, 0);
      return;
    }
    if (route.path === '/' || route.path === '/login') {
      navigate(roleHome(user.role));
      return;
    }
    app.innerHTML = shellView(user, route, routeView(route, user));
    document.title = pageTitleFor(route, user) + ' · ' + SCHOOL_NAME + ' ' + SYSTEM_NAME;
    document.body.classList.remove('demo-sidebar-open');
    if (previousHash && previousHash !== location.hash) window.scrollTo(0, 0);
    if (route.path === '/student/apply') window.setTimeout(syncApplyCourse, 0);
    if (route.path === '/review') window.setTimeout(updateBatchBar, 0);
  }

  function notFoundView(message) {
    const user = currentUser();
    const home = user ? roleHome(user.role) : '/login';
    return '<div class="demo-view"><div class="card demo-access-card">' + emptyState('alert', '找不到頁面', message, '<a class="btn btn-primary" href="#' + esc(home) + '">回到首頁</a>') + '</div></div>';
  }

  function accessDeniedView(message) {
    const user = currentUser();
    const home = user ? roleHome(user.role) : '/login';
    return '<div class="demo-view"><div class="card demo-access-card">' + emptyState('shield', '權限不足', message, '<a class="btn btn-primary" href="#' + esc(home) + '">回到首頁</a>') + '</div></div>';
  }

  function studentListView(user, route) {
    const params = route.params;
    const all = sortLeaves(visibleLeaves(user));
    const rawStatus = params.get('status') || 'all';
    const status = rawStatus === 'all' || LEAVE_STATUS[rawStatus] ? rawStatus : 'all';
    const filtered = status === 'all' ? all : all.filter(function (leave) {
      return leave.status === status;
    });
    const paged = slicePage(filtered, params, STUDENT_PAGE_SIZE);
    const approved = all.filter(function (leave) {
      return leave.status === 'approved';
    });
    const cards = [
      statCard('calendar', '累計申請', all.length, '包含所有歷史假單'),
      statCard('clock', '待審核', all.filter(function (leave) { return leave.status === 'pending'; }).length, '等待授課教師處理', 'warning'),
      statCard('check', '已核准', approved.length, '已完成審核', 'success'),
      statCard('chart', '核准節次', sumPeriods(approved), '依核准假單累計')
    ].join('');
    const rows = paged.items.map(function (leave) {
      const course = courseForLeave(leave);
      const action = leave.status === 'pending' ? '<button type="button" class="btn btn-danger btn-sm" data-action="withdraw-leave" data-id="' + esc(leave.id) + '">撤回</button>' : '';
      return '<tr><td><a class="demo-code" href="#/student/' + esc(leave.id) + '">' + esc(leave.id) + '</a></td><td><span class="demo-strong">' + esc(course ? course.name : '—') + '</span><span class="demo-table-sub">' + esc(course ? course.code : '') + '</span></td><td>' + esc(leaveTypeLabel(leave.leaveType)) + '</td><td>' + esc(dateRangeText(leave)) + '</td><td><span class="demo-period-tag">' + esc(periodsText(leave.periods)) + '</span></td><td>' + statusBadge(leave.status) + '</td><td><span class="demo-time">' + esc(formatDateTime(leave.createdAt)) + '</span></td><td><div class="demo-action-row"><a class="btn btn-secondary btn-sm" href="#/student/' + esc(leave.id) + '">查看</a>' + action + '</div></td></tr>';
    }).join('');
    const emptyAction = status === 'all' ? '<a class="btn btn-primary" href="#/student/apply">提出第一筆申請</a>' : '<a class="btn btn-secondary" href="#/student">查看全部紀錄</a>';
    const body = filtered.length ? '<div class="card demo-table-card"><div class="table-container"><table><thead><tr><th>假單編號</th><th>課程</th><th>假別</th><th>請假日期</th><th>節次</th><th>狀態</th><th>申請時間</th><th>操作</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' + renderPagination('/student', params, paged.page, paged.pages) : emptyState('calendar', '尚無請假紀錄', '目前沒有符合篩選條件的假單，可以立即提出新的申請。', emptyAction);
    return '<div class="demo-view">' + pageHeader('我的請假紀錄', '檢視每筆申請的審核進度、課程與節次，並可撤回尚待審核的假單。', '<a class="btn btn-primary" href="#/student/apply">' + icon('plus', 16) + '申請請假</a>', 'STUDENT') + '<div class="demo-stat-grid">' + cards + '</div>' + statusTabs('/student', params, all) + body + '</div>';
  }

  function studentApplyView(user) {
    const courses = enrolledCourses(user.id);
    if (!courses.length) {
      return '<div class="demo-view">' + pageHeader('線上請假申請', '你目前沒有可申請的課程。', '<a class="btn btn-secondary" href="#/student">返回我的請假</a>', 'STUDENT') + emptyState('book', '沒有選課資料', '請先由管理員完成選課設定，再提出請假申請。', '<a class="btn btn-secondary" href="#/student">返回</a>') + '</div>';
    }
    const first = courses[0];
    const courseOptions = courses.map(function (course) {
      return '<option value="' + esc(course.id) + '">' + esc(course.code + ' · ' + course.name) + '</option>';
    }).join('');
    const typeCards = Object.keys(LEAVE_TYPES).map(function (type, index) {
      return '<label class="demo-radio-card"><input type="radio" name="leaveType" value="' + esc(type) + '"' + (index === 0 ? ' checked' : '') + '>' + esc(LEAVE_TYPES[type]) + '</label>';
    }).join('');
    const periodChecks = PERIODS.map(function (period) {
      const checked = period.period >= first.startPeriod && period.period <= first.endPeriod ? ' checked' : '';
      return '<label class="demo-period-item"><input class="demo-period-checkbox" type="checkbox" name="periods" value="' + period.period + '"' + checked + '>' + esc(period.label) + '</label>';
    }).join('');
    return '<div class="demo-view">' + pageHeader('線上請假申請', '選擇課程、日期與節次，送出後將由該課程授課教師審核。', '<a class="btn btn-secondary" href="#/student">' + icon('list', 16) + '返回我的請假</a>', 'STUDENT') + '<div class="card demo-form-card"><div class="demo-alert demo-alert-info">' + icon('info', 16) + '<span>送出後無法自行修改內容，送出前請確認課程、日期與節次。尚待審核的假單可以撤回。</span></div><form id="apply-form" data-form="apply" novalidate><div class="demo-form-grid"><div class="form-group"><label class="form-label" for="apply-course">課程<span class="required">*</span></label><select class="form-control" id="apply-course" name="courseId" data-course-select required>' + courseOptions + '</select><div class="form-hint" id="apply-course-hint">' + esc(courseScheduleText(first) + ' · ' + teacherName(first)) + '</div></div><div class="form-group"><label class="form-label">假別<span class="required">*</span></label><div class="demo-radio-grid">' + typeCards + '</div></div><div class="form-group"><label class="form-label" for="apply-start">開始日期<span class="required">*</span></label><input class="form-control" id="apply-start" name="startDate" type="date" value="' + todayISO() + '" min="' + todayISO() + '" required></div><div class="form-group"><label class="form-label" for="apply-end">結束日期<span class="required">*</span></label><input class="form-control" id="apply-end" name="endDate" type="date" value="' + todayISO() + '" min="' + todayISO() + '" required></div><div class="form-group" style="grid-column:1 / -1"><div class="demo-periods-head"><label class="form-label">請假節次<span class="required">*</span></label><label class="demo-check"><input type="checkbox" data-period-all>全選節次</label></div><div class="demo-period-grid">' + periodChecks + '</div><div class="form-hint">系統會依所選課程帶入上課節次，仍可依實際狀況調整。</div></div><div class="form-group" style="grid-column:1 / -1"><label class="form-label" for="apply-reason">請假事由<span class="required">*</span></label><textarea class="form-control" id="apply-reason" name="reason" rows="4" maxlength="500" placeholder="請具體說明請假原因，至少 5 個字" required></textarea><div class="form-hint">病假與公假建議於正式系統檢附相關證明文件。</div></div><div class="form-group" style="grid-column:1 / -1"><label class="form-label" for="apply-file">佐證附件</label><input class="form-control demo-file-disabled" id="apply-file" type="file" disabled><div class="form-hint">離線示範不支援實體檔案上傳；正式系統可檢附診斷證明、活動公文等文件。</div></div><div id="apply-error" class="demo-alert demo-alert-error" role="alert" hidden style="grid-column:1 / -1"></div></div><div class="demo-form-actions"><a class="btn btn-secondary" href="#/student">取消</a><button type="submit" class="btn btn-primary">' + icon('check', 16) + '送出申請</button></div></form></div></div>';
  }

  function syncApplyCourse() {
    const select = document.getElementById('apply-course');
    const hint = document.getElementById('apply-course-hint');
    if (!select || !hint) return;
    const course = getCourseById(select.value);
    if (!course) {
      hint.textContent = '請選擇課程';
      return;
    }
    hint.textContent = courseScheduleText(course) + ' · ' + teacherName(course);
    const form = select.form;
    if (!form) return;
    const boxes = form.querySelectorAll('input[name="periods"]');
    Array.prototype.forEach.call(boxes, function (box) {
      const period = Number(box.value);
      box.checked = period >= course.startPeriod && period <= course.endPeriod;
    });
    updatePeriodAllState(form);
  }

  function updatePeriodAllState(form) {
    if (!form) return;
    const all = form.querySelector('[data-period-all]');
    const boxes = Array.prototype.slice.call(form.querySelectorAll('input[name="periods"]'));
    if (!all || !boxes.length) return;
    const checked = boxes.filter(function (box) {
      return box.checked;
    }).length;
    all.checked = checked === boxes.length;
    all.indeterminate = checked > 0 && checked < boxes.length;
  }

  function detailItem(label, value, full) {
    return '<div class="demo-detail-item' + (full ? ' full' : '') + '"><span class="demo-detail-label">' + esc(label) + '</span><div class="demo-detail-value">' + value + '</div></div>';
  }

  function reviewFormHtml(leave) {
    return '<div class="demo-review-section"><form data-form="review" data-id="' + esc(leave.id) + '" novalidate><div id="review-error" class="demo-alert demo-alert-error" role="alert" hidden></div><div class="demo-radio-grid" style="grid-template-columns:repeat(2,minmax(0,1fr))"><label class="demo-radio-card"><input type="radio" name="decision" value="approved" checked>核准請假</label><label class="demo-radio-card"><input type="radio" name="decision" value="rejected">駁回申請</label></div><div class="form-group" style="margin-top:1rem;margin-bottom:0"><label class="form-label" for="review-comment">審核意見</label><textarea class="form-control" id="review-comment" name="comment" rows="3" maxlength="300" placeholder="填寫給學生的說明，駁回時必填"></textarea><div class="form-hint">核准時若留空，系統會帶入預設提醒；駁回時必須填寫原因。</div></div><div class="demo-form-actions"><a class="btn btn-secondary" href="#/review">返回清單</a><button type="submit" class="btn btn-primary">' + icon('check', 16) + '送出審核</button></div></form></div>';
  }

  function reviewSectionFor(leave, reviewMode) {
    if (leave.status === 'pending') {
      if (reviewMode) return reviewFormHtml(leave);
      return '<div class="demo-review-section"><div class="demo-review-locked">' + icon('clock', 16) + ' 此申請尚待授課教師審核，送出後會顯示審核結果。</div></div>';
    }
    if (leave.status === 'withdrawn') {
      return '<div class="demo-review-section"><div class="demo-review-locked">' + icon('info', 16) + ' 學生已撤回此申請，無需進行審核。</div></div>';
    }
    const reviewer = leave.reviewedBy ? getUserById(leave.reviewedBy) : null;
    return '<div class="demo-review-section"><div class="demo-review-box"><div class="demo-review-head"><span>' + esc(statusLabel(leave.status)) + '</span><span>' + esc(reviewer ? reviewer.name : '—') + ' · ' + esc(formatDateTime(leave.reviewedAt)) + '</span></div><div class="demo-review-text">' + esc(leave.reviewComment || '—') + '</div></div></div>';
  }

  function leaveDetailView(user, leave, options) {
    const settings = options || {};
    const reviewMode = Boolean(settings.reviewMode);
    const student = getUserById(leave.studentId);
    const course = courseForLeave(leave);
    const backPath = settings.backPath || (user.role === 'student' ? '/student' : '/review');
    const canWithdraw = leave.studentId === user.id && leave.status === 'pending';
    const reviewSection = reviewSectionFor(leave, reviewMode);
    let footer = '';
    if (!reviewMode || leave.status !== 'pending') {
      footer = '<div class="demo-detail-footer"><a class="btn btn-secondary" href="#' + esc(backPath) + '">返回' + (user.role === 'student' ? '我的請假' : '審核清單') + '</a>' + (canWithdraw ? '<button type="button" class="btn btn-danger" data-action="withdraw-leave" data-id="' + esc(leave.id) + '">撤回申請</button>' : '') + '</div>';
    }
    const fields = [
      detailItem('假單編號', '<span class="demo-code">' + esc(leave.id) + '</span>'),
      detailItem('目前狀態', statusBadge(leave.status)),
      detailItem('申請學生', esc(student ? student.name : '—') + ' <span class="demo-muted">(' + esc(leave.studentId) + ')</span>'),
      detailItem('課程', '<span class="demo-strong">' + esc(course ? course.name : '—') + '</span><span class="demo-table-sub">' + esc(course ? course.code : '') + '</span>'),
      detailItem('授課教師', esc(course ? teacherName(course) : '—')),
      detailItem('假別', esc(leaveTypeLabel(leave.leaveType))),
      detailItem('請假日期', esc(dateRangeText(leave))),
      detailItem('請假節次', esc(periodsText(leave.periods))),
      detailItem('申請時間', esc(formatDateTime(leave.createdAt))),
      detailItem('最後更新', esc(formatDateTime(leave.updatedAt))),
      detailItem('請假事由', '<div class="demo-detail-box">' + esc(leave.reason) + '</div>', true),
      detailItem('佐證附件', attachmentRow(leave.attachment), true),
      detailItem('審核結果', reviewSection, true)
    ].join('');
    return '<div class="demo-view">' + pageHeader(reviewMode ? '審核請假申請' : '請假單明細', leave.id + ' · ' + (course ? course.code + ' ' + course.name : '未知課程'), statusBadge(leave.status), reviewMode ? 'REVIEW' : 'DETAIL') + '<div class="card demo-detail-card demo-detail-card-wide"><div class="demo-detail-grid">' + fields + '</div>' + footer + '</div></div>';
  }

  function studentDetailView(user, leave) {
    return leaveDetailView(user, leave, { backPath: user.role === 'student' ? '/student' : '/review' });
  }

  function reviewDetailView(user, leave) {
    return leaveDetailView(user, leave, { reviewMode: true, backPath: '/review' });
  }

  function reviewListView(user, route) {
    const params = route.params;
    const all = sortLeaves(visibleLeaves(user));
    const rawStatus = params.get('status') || 'all';
    const status = rawStatus === 'all' || LEAVE_STATUS[rawStatus] ? rawStatus : 'all';
    const courseFilter = params.get('course') || '';
    const query = (params.get('q') || '').trim();
    const courses = user.role === 'admin' ? state.courses : teacherCourses(user.id);
    const filtered = all.filter(function (leave) {
      if (status !== 'all' && leave.status !== status) return false;
      if (courseFilter && leave.courseId !== courseFilter) return false;
      if (query) {
        const student = getUserById(leave.studentId);
        const haystack = (leave.id + ' ' + leave.studentId + ' ' + (student ? student.name : '') + ' ' + (courseForLeave(leave) ? courseLabel(courseForLeave(leave)) : '')).toLowerCase();
        if (haystack.indexOf(query.toLowerCase()) === -1) return false;
      }
      return true;
    });
    const paged = slicePage(filtered, params, REVIEW_PAGE_SIZE);
    const pending = all.filter(function (leave) {
      return leave.status === 'pending';
    }).length;
    const approved = all.filter(function (leave) {
      return leave.status === 'approved';
    }).length;
    const rejected = all.filter(function (leave) {
      return leave.status === 'rejected';
    }).length;
    const withdrawn = all.filter(function (leave) {
      return leave.status === 'withdrawn';
    }).length;
    const cards = [
      statCard('clock', '待審核', pending, user.role === 'admin' ? '全校待處理假單' : '你授課課程的待處理假單', 'warning'),
      statCard('check', '已核准', approved, '目前累計核准件數', 'success'),
      statCard('alert', '已駁回', rejected, '目前累計駁回件數', 'danger'),
      statCard('info', '已撤回', withdrawn, '由學生自行撤回')
    ].join('');
    const options = courses.map(function (course) {
      return '<option value="' + esc(course.id) + '"' + (course.id === courseFilter ? ' selected' : '') + '>' + esc(course.code + ' · ' + course.name) + '</option>';
    }).join('');
    const filterForm = '<form class="card demo-filter-card" data-form="review-filter"><input type="hidden" name="status" value="' + esc(status) + '"><div class="demo-filter-grid"><div class="demo-filter-field"><label class="demo-filter-label" for="review-q">搜尋學生</label><input class="form-control" id="review-q" name="q" type="search" value="' + esc(query) + '" placeholder="姓名、學號或假單編號"></div><div class="demo-filter-field"><label class="demo-filter-label" for="review-course">課程</label><select class="form-control" id="review-course" name="course"><option value="">全部課程</option>' + options + '</select></div></div><div class="demo-filter-actions"><a class="btn btn-secondary btn-sm" href="#/review">清除篩選</a><button type="submit" class="btn btn-primary btn-sm">' + icon('search', 14) + '套用篩選</button></div></form>';
    const pageHasPending = paged.items.some(function (leave) {
      return leave.status === 'pending';
    });
    const batchBar = pageHasPending ? '<div class="demo-batch-bar" id="review-batch-bar"><div class="demo-batch-info"><label class="demo-check"><input type="checkbox" id="batch-select-all" data-batch-all>選取本頁待審核</label><span class="demo-batch-count" id="batch-count">已選 0 筆</span></div><div class="demo-batch-actions"><button type="button" class="btn btn-secondary btn-sm" data-action="batch-approve" disabled>批次核准</button><button type="button" class="btn btn-danger btn-sm" data-action="batch-reject" disabled>批次駁回</button></div></div>' : '';
    const rows = paged.items.map(function (leave) {
      const student = getUserById(leave.studentId);
      const course = courseForLeave(leave);
      const checkbox = leave.status === 'pending' ? '<input class="demo-batch-checkbox" type="checkbox" data-batch-select value="' + esc(leave.id) + '" aria-label="選取 ' + esc(leave.id) + '">' : '';
      return '<tr><td>' + checkbox + '</td><td><span class="demo-strong">' + esc(student ? student.name : '—') + '</span><span class="demo-table-sub">' + esc(leave.studentId) + '</span></td><td><span class="demo-strong">' + esc(course ? course.name : '—') + '</span><span class="demo-table-sub">' + esc(course ? course.code : '') + '</span></td><td>' + esc(leaveTypeLabel(leave.leaveType)) + '</td><td>' + esc(dateRangeText(leave)) + '</td><td><span class="demo-period-tag">' + esc(periodsText(leave.periods)) + '</span></td><td>' + statusBadge(leave.status) + '</td><td><a class="btn btn-secondary btn-sm" href="#/review/' + esc(leave.id) + '">' + (leave.status === 'pending' ? '審核' : '查看') + '</a></td></tr>';
    }).join('');
    const body = filtered.length ? batchBar + '<div class="card demo-table-card demo-table-wide"><div class="table-container"><table><thead><tr><th aria-label="選取"></th><th>學生</th><th>課程</th><th>假別</th><th>請假日期</th><th>節次</th><th>狀態</th><th>操作</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' + renderPagination('/review', params, paged.page, paged.pages) : emptyState('check', '目前沒有符合條件的假單', '調整篩選條件，或切換上方狀態頁籤查看其他紀錄。', '<a class="btn btn-secondary" href="#/review">清除篩選</a>');
    return '<div class="demo-view">' + pageHeader(user.role === 'admin' ? '全校請假審核' : '課堂請假審核', user.role === 'admin' ? '檢視全校學生的請假申請，可逐筆審核或批次處理待審核項目。' : '檢視你授課課程的請假申請，核准或駁回後學生即可看到結果。', '', 'REVIEW') + '<div class="demo-stat-grid">' + cards + '</div>' + statusTabs('/review', params, all) + filterForm + body + '</div>';
  }

  function adminDashboardView() {
    const students = state.users.filter(function (user) {
      return user.role === 'student';
    });
    const activeStudents = students.filter(function (user) {
      return user.isActive;
    });
    const pending = state.leaves.filter(function (leave) {
      return leave.status === 'pending';
    });
    const cards = [
      statCard('users', '使用者總數', state.users.length, '含管理員、教師與學生'),
      statCard('book', '課程總數', state.courses.length, '目前學期開設課程'),
      statCard('calendar', '請假單總數', state.leaves.length, '所有學生申請紀錄'),
      statCard('clock', '待審核', pending.length, '需要教師或管理員處理', 'warning')
    ].join('');
    const quick = '<div class="demo-quick-grid"><a class="demo-quick-card" href="#/review"><span class="demo-quick-icon">' + icon('check', 18) + '</span><span class="demo-quick-title">待審核假單</span><span class="demo-quick-desc">目前有 ' + pending.length + ' 筆申請等待處理，可逐筆審核或批次核准。</span><span class="demo-quick-link">前往審核 →</span></a><a class="demo-quick-card" href="#/admin/users"><span class="demo-quick-icon">' + icon('users', 18) + '</span><span class="demo-quick-title">使用者管理</span><span class="demo-quick-desc">檢視 ' + state.users.length + ' 位使用者，包含 ' + activeStudents.length + ' 位啟用中的學生。</span><span class="demo-quick-link">管理使用者 →</span></a><a class="demo-quick-card" href="#/admin/courses"><span class="demo-quick-icon">' + icon('book', 18) + '</span><span class="demo-quick-title">課程維護</span><span class="demo-quick-desc">檢視課程教師、上課時段、選課人數與相關假單。</span><span class="demo-quick-link">查看課程 →</span></a></div>';
    const recent = sortLeaves(pending).slice(0, 6);
    const recentRows = recent.map(function (leave) {
      const student = getUserById(leave.studentId);
      const course = courseForLeave(leave);
      return '<a class="demo-mini-row" href="#/review/' + esc(leave.id) + '">' + avatar(student ? student.name : '?') + '<span class="demo-mini-main"><span class="demo-mini-title">' + esc(student ? student.name : '—') + ' · ' + esc(leaveTypeLabel(leave.leaveType)) + '</span><span class="demo-mini-sub">' + esc(course ? courseLabel(course) : '—') + ' · ' + esc(dateRangeText(leave)) + '</span></span>' + statusBadge(leave.status) + '</a>';
    }).join('');
    const auditRows = state.auditLogs.slice(0, 6).map(function (log) {
      const actor = log.userId ? getUserById(log.userId) : null;
      return '<a class="demo-mini-row" href="#/admin/audit">' + '<span class="demo-nav-icon">' + icon('audit', 14) + '</span><span class="demo-mini-main"><span class="demo-mini-title">' + esc(auditActionLabel(log.action)) + '</span><span class="demo-mini-sub">' + esc(actor ? actor.name : '系統') + ' · ' + esc(formatDateTime(log.createdAt)) + '</span></span></a>';
    }).join('');
    return '<div class="demo-view">' + pageHeader('系統管理中心', '掌握使用者、課程、請假申請與資安稽核狀態。', '<a class="btn btn-secondary" href="#/admin/audit">' + icon('audit', 16) + '查看稽核日誌</a>', 'ADMIN') + '<div class="demo-stat-grid">' + cards + '</div>' + quick + '<div class="demo-split-grid"><section class="demo-section-card"><div class="demo-section-head"><h2 class="demo-section-title">最新待審核</h2><a class="demo-section-link" href="#/review">查看全部 →</a></div>' + (recentRows ? '<div class="demo-mini-list">' + recentRows + '</div>' : '<div class="demo-chart-empty">目前沒有待審核假單</div>') + '</section><section class="demo-section-card"><div class="demo-section-head"><h2 class="demo-section-title">最近稽核活動</h2><a class="demo-section-link" href="#/admin/audit">完整日誌 →</a></div>' + (auditRows ? '<div class="demo-mini-list">' + auditRows + '</div>' : '<div class="demo-chart-empty">目前沒有稽核紀錄</div>') + '</section></div></div>';
  }

  function usersView(user, route) {
    const params = route.params;
    const query = (params.get('q') || '').trim();
    const rawRole = params.get('role') || 'all';
    const roleFilter = rawRole === 'all' || ROLE_LABELS[rawRole] ? rawRole : 'all';
    const activeFilter = params.get('active') || 'all';
    const filtered = state.users.filter(function (item) {
      if (roleFilter !== 'all' && item.role !== roleFilter) return false;
      if (activeFilter === 'active' && !item.isActive) return false;
      if (activeFilter === 'inactive' && item.isActive) return false;
      if (query) {
        const haystack = (item.id + ' ' + item.name + ' ' + item.email + ' ' + departmentName(item.department)).toLowerCase();
        if (haystack.indexOf(query.toLowerCase()) === -1) return false;
      }
      return true;
    });
    const paged = slicePage(filtered, params, USER_PAGE_SIZE);
    const cards = [
      statCard('users', '使用者總數', state.users.length, '所有角色帳號'),
      statCard('user', '學生', state.users.filter(function (item) { return item.role === 'student'; }).length, '含啟用與停用帳號'),
      statCard('book', '教師', state.users.filter(function (item) { return item.role === 'teacher'; }).length, '目前授課教師'),
      statCard('shield', '啟用帳號', state.users.filter(function (item) { return item.isActive; }).length, '可正常登入系統', 'success')
    ].join('');
    const roleOptions = ['all'].concat(Object.keys(ROLE_LABELS)).map(function (role) {
      return '<option value="' + esc(role) + '"' + (role === roleFilter ? ' selected' : '') + '>' + (role === 'all' ? '全部角色' : esc(roleLabel(role))) + '</option>';
    }).join('');
    const filterForm = '<form class="card demo-filter-card" data-form="users-filter"><div class="demo-filter-grid"><div class="demo-filter-field"><label class="demo-filter-label" for="users-q">搜尋使用者</label><input class="form-control" id="users-q" name="q" type="search" value="' + esc(query) + '" placeholder="姓名、帳號或 Email"></div><div class="demo-filter-field"><label class="demo-filter-label" for="users-role">角色</label><select class="form-control" id="users-role" name="role">' + roleOptions + '</select></div><div class="demo-filter-field"><label class="demo-filter-label" for="users-active">狀態</label><select class="form-control" id="users-active" name="active"><option value="all"' + (activeFilter === 'all' ? ' selected' : '') + '>全部狀態</option><option value="active"' + (activeFilter === 'active' ? ' selected' : '') + '>啟用</option><option value="inactive"' + (activeFilter === 'inactive' ? ' selected' : '') + '>停用</option></select></div></div><div class="demo-filter-actions"><a class="btn btn-secondary btn-sm" href="#/admin/users">清除篩選</a><button type="submit" class="btn btn-primary btn-sm">' + icon('search', 14) + '套用篩選</button></div></form>';
    const rows = paged.items.map(function (item) {
      const self = item.id === user.id;
      const action = self ? '<span class="demo-muted">目前登入</span>' : '<button type="button" class="btn btn-' + (item.isActive ? 'danger' : 'secondary') + ' btn-sm" data-action="toggle-user" data-id="' + esc(item.id) + '">' + (item.isActive ? '停用' : '啟用') + '</button>';
      return '<tr><td><div class="demo-mini-row" style="border:0;padding:0;background:transparent">' + avatar(item.name) + '<span class="demo-mini-main"><span class="demo-mini-title">' + esc(item.name) + '</span><span class="demo-mini-sub">' + esc(item.email) + '</span></span></div></td><td>' + roleTag(item.role) + '</td><td><span class="demo-strong">' + esc(departmentName(item.department)) + '</span><span class="demo-table-sub">' + esc(item.title) + '</span></td><td>' + (item.isActive ? '<span class="badge badge-approved">啟用</span>' : '<span class="badge badge-withdrawn">停用</span>') + '</td><td><span class="demo-time">' + esc(formatDate(item.createdAt)) + '</span></td><td>' + action + '</td></tr>';
    }).join('');
    const body = filtered.length ? '<div class="card demo-table-card"><div class="table-container"><table><thead><tr><th>使用者</th><th>角色</th><th>單位 / 職稱</th><th>狀態</th><th>建立時間</th><th>操作</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' + renderPagination('/admin/users', params, paged.page, paged.pages) : emptyState('users', '沒有符合條件的使用者', '請調整關鍵字、角色或狀態篩選。', '<a class="btn btn-secondary" href="#/admin/users">清除篩選</a>');
    return '<div class="demo-view">' + pageHeader('使用者管理', '檢視示範系統中的帳號、角色與啟用狀態，停用後該帳號將無法登入。', '', 'ADMIN') + '<div class="demo-stat-grid">' + cards + '</div>' + filterForm + body + '</div>';
  }

  function coursesView(route) {
    const params = route.params;
    const query = (params.get('q') || '').trim();
    const deptFilter = params.get('dept') || 'all';
    const filtered = state.courses.filter(function (course) {
      if (deptFilter !== 'all' && course.department !== deptFilter) return false;
      if (query) {
        const haystack = (course.id + ' ' + course.name + ' ' + teacherName(course) + ' ' + departmentName(course.department)).toLowerCase();
        if (haystack.indexOf(query.toLowerCase()) === -1) return false;
      }
      return true;
    });
    const paged = slicePage(filtered, params, COURSE_PAGE_SIZE);
    const cards = [
      statCard('book', '課程總數', state.courses.length, '目前種子課程'),
      statCard('users', '選課人次', state.enrollments.length, '學生與課程關聯'),
      statCard('calendar', '課程假單', state.leaves.length, '所有課程累計'),
      statCard('check', '核准假單', state.leaves.filter(function (leave) { return leave.status === 'approved'; }).length, '所有課程累計', 'success')
    ].join('');
    const deptOptions = ['all'].concat(DEPARTMENTS.map(function (department) { return department.code; })).map(function (code) {
      return '<option value="' + esc(code) + '"' + (code === deptFilter ? ' selected' : '') + '>' + (code === 'all' ? '全部學系' : esc(departmentName(code))) + '</option>';
    }).join('');
    const filterForm = '<form class="card demo-filter-card" data-form="courses-filter"><div class="demo-filter-grid"><div class="demo-filter-field"><label class="demo-filter-label" for="courses-q">搜尋課程</label><input class="form-control" id="courses-q" name="q" type="search" value="' + esc(query) + '" placeholder="課程代碼、名稱或教師"></div><div class="demo-filter-field"><label class="demo-filter-label" for="courses-dept">開課學系</label><select class="form-control" id="courses-dept" name="dept">' + deptOptions + '</select></div></div><div class="demo-filter-actions"><a class="btn btn-secondary btn-sm" href="#/admin/courses">清除篩選</a><button type="submit" class="btn btn-primary btn-sm">' + icon('search', 14) + '套用篩選</button></div><div class="demo-filter-note">示範版課程資料由種子資料載入，僅供檢視與連動審核篩選。</div></form>';
    const rows = paged.items.map(function (course) {
      const leaves = state.leaves.filter(function (leave) {
        return leave.courseId === course.id;
      });
      return '<tr><td><span class="demo-code">' + esc(course.id) + '</span></td><td><span class="demo-strong">' + esc(course.name) + '</span><span class="demo-table-sub">' + esc(course.academicYear) + '</span></td><td>' + esc(departmentName(course.department)) + '</td><td>' + esc(teacherName(course)) + '</td><td><span class="demo-period-tag">' + esc(courseScheduleText(course)) + '</span></td><td>' + enrollmentCount(course.id) + ' 人</td><td>' + leaves.length + ' 筆</td><td><a class="btn btn-secondary btn-sm" href="#/review?course=' + encodeURIComponent(course.id) + '">查看假單</a></td></tr>';
    }).join('');
    const body = filtered.length ? '<div class="card demo-table-card"><div class="table-container"><table><thead><tr><th>代碼</th><th>課程</th><th>學系</th><th>授課教師</th><th>上課時段</th><th>選課</th><th>假單</th><th>操作</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' + renderPagination('/admin/courses', params, paged.page, paged.pages) : emptyState('book', '沒有符合條件的課程', '請調整關鍵字或開課學系篩選。', '<a class="btn btn-secondary" href="#/admin/courses">清除篩選</a>');
    return '<div class="demo-view">' + pageHeader('課程與選課管理', '檢視課程基本資料、授課教師、上課時段與選課人數。', '', 'ADMIN') + '<div class="demo-stat-grid">' + cards + '</div>' + filterForm + body + '</div>';
  }

  function auditView(route) {
    const params = route.params;
    const query = (params.get('q') || '').trim();
    const actionFilter = params.get('action') || 'all';
    const filtered = state.auditLogs.filter(function (log) {
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;
      if (query) {
        const actor = log.userId ? getUserById(log.userId) : null;
        const haystack = (log.action + ' ' + auditActionLabel(log.action) + ' ' + (actor ? actor.name + ' ' + actor.id : '') + ' ' + (log.targetId || '') + ' ' + log.details + ' ' + log.ip).toLowerCase();
        if (haystack.indexOf(query.toLowerCase()) === -1) return false;
      }
      return true;
    });
    const paged = slicePage(filtered, params, AUDIT_PAGE_SIZE);
    const cards = [
      statCard('audit', '日誌總數', state.auditLogs.length, '依時間新到舊排序'),
      statCard('alert', '登入失敗', state.auditLogs.filter(function (log) { return log.action === 'LOGIN_FAILURE'; }).length, '可留意異常登入', 'danger'),
      statCard('check', '審核事件', state.auditLogs.filter(function (log) { return log.action.indexOf('APPROVE') !== -1 || log.action.indexOf('REJECT') !== -1; }).length, '含批次審核', 'success'),
      statCard('info', '系統事件', state.auditLogs.filter(function (log) { return log.action === 'SYSTEM_SEED'; }).length, '種子資料初始化')
    ].join('');
    const actionOptions = ['all'].concat(AUDIT_ACTIONS).map(function (action) {
      return '<option value="' + esc(action) + '"' + (action === actionFilter ? ' selected' : '') + '>' + (action === 'all' ? '全部動作' : esc(auditActionLabel(action))) + '</option>';
    }).join('');
    const filterForm = '<form class="card demo-filter-card" data-form="audit-filter"><div class="demo-filter-grid"><div class="demo-filter-field"><label class="demo-filter-label" for="audit-q">搜尋日誌</label><input class="form-control" id="audit-q" name="q" type="search" value="' + esc(query) + '" placeholder="使用者、目標、IP 或內容"></div><div class="demo-filter-field"><label class="demo-filter-label" for="audit-action">動作類型</label><select class="form-control" id="audit-action" name="action">' + actionOptions + '</select></div></div><div class="demo-filter-actions"><a class="btn btn-secondary btn-sm" href="#/admin/audit">清除篩選</a><button type="submit" class="btn btn-primary btn-sm">' + icon('search', 14) + '套用篩選</button></div></form>';
    const rows = paged.items.map(function (log) {
      const actor = log.userId ? getUserById(log.userId) : null;
      const target = (AUDIT_TARGET_LABELS[log.targetType] || log.targetType || '—') + (log.targetId ? ' / ' + log.targetId : '');
      return '<tr><td><span class="demo-time">' + esc(formatDateTime(log.createdAt)) + '</span></td><td><span class="demo-audit-badge demo-tone-' + auditTone(log.action) + '">' + esc(log.action) + '</span><span class="demo-table-sub">' + esc(auditActionLabel(log.action)) + '</span></td><td><span class="demo-strong">' + esc(actor ? actor.name : '系統 / 匿名') + '</span><span class="demo-table-sub">' + esc(log.userId || '—') + '</span></td><td>' + esc(target) + '</td><td><code class="demo-json">' + esc(auditDetailsText(log.details)) + '</code></td><td><span class="demo-code">' + esc(log.ip) + '</span></td></tr>';
    }).join('');
    const body = filtered.length ? '<div class="card demo-table-card demo-table-wide"><div class="table-container"><table><thead><tr><th>時間</th><th>動作</th><th>操作者</th><th>目標</th><th>詳細資料</th><th>來源 IP</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' + renderPagination('/admin/audit', params, paged.page, paged.pages) : emptyState('audit', '沒有符合條件的稽核日誌', '請調整關鍵字或動作類型篩選。', '<a class="btn btn-secondary" href="#/admin/audit">清除篩選</a>');
    return '<div class="demo-view">' + pageHeader('資安稽核日誌', '記錄登入、請假送出、審核、撤回與使用者狀態變更等重要事件。', '', 'ADMIN') + '<div class="demo-stat-grid">' + cards + '</div>' + filterForm + body + '</div>';
  }

  function statsView(user) {
    const leaves = sortLeaves(visibleLeaves(user));
    const approved = leaves.filter(function (leave) {
      return leave.status === 'approved';
    });
    const pending = leaves.filter(function (leave) {
      return leave.status === 'pending';
    });
    const approvalRate = leaves.length ? Math.round(approved.length / leaves.length * 100) : 0;
    const cards = [
      statCard('calendar', '請假申請', leaves.length, user.role === 'admin' ? '全校累計' : '授課課程累計'),
      statCard('clock', '請假節次', sumPeriods(leaves), '所有申請累計節次'),
      statCard('check', '核准率', approvalRate + '%', '已核准 / 全部申請', 'success'),
      statCard('alert', '待審核', pending.length, '尚未完成審核', 'warning')
    ].join('');
    const typeItems = Object.keys(LEAVE_TYPES).map(function (type, index) {
      return {
        label: LEAVE_TYPES[type],
        value: leaves.filter(function (leave) {
          return leave.leaveType === type;
        }).length,
        color: DONUT_COLORS[index % DONUT_COLORS.length]
      };
    }).filter(function (item) {
      return item.value > 0;
    });
    const monthly = lastMonthKeys(6).map(function (key) {
      return {
        label: Number(key.slice(5)) + '月',
        value: leaves.filter(function (leave) {
          return monthKey(leave.createdAt) === key;
        }).length
      };
    });
    let barItems = [];
    let barTitle = '';
    if (user.role === 'admin') {
      barTitle = '各學系請假件數';
      barItems = DEPARTMENTS.map(function (department) {
        const deptLeaves = leaves.filter(function (leave) {
          const student = getUserById(leave.studentId);
          return student && student.department === department.code;
        });
        return {
          label: department.name,
          value: deptLeaves.length,
          text: deptLeaves.length + ' 件 / ' + sumPeriods(deptLeaves) + ' 節'
        };
      });
    } else {
      barTitle = '各課程請假件數';
      barItems = teacherCourses(user.id).map(function (course) {
        const courseLeaves = leaves.filter(function (leave) {
          return leave.courseId === course.id;
        });
        return {
          label: course.code + ' ' + course.name,
          value: courseLeaves.length,
          text: courseLeaves.length + ' 件 / ' + sumPeriods(courseLeaves) + ' 節'
        };
      });
    }
    barItems = barItems.filter(function (item) {
      return item.value > 0;
    }).sort(function (a, b) {
      return b.value - a.value;
    }).slice(0, 7);
    const statusColors = {
      pending: '#B58D3D',
      approved: '#7A9E7E',
      rejected: '#9E5B5B',
      withdrawn: '#A3997A'
    };
    const statusItems = Object.keys(LEAVE_STATUS).map(function (status) {
      const count = leaves.filter(function (leave) {
        return leave.status === status;
      }).length;
      return {
        label: LEAVE_STATUS[status],
        value: count,
        text: count + ' 件',
        color: statusColors[status]
      };
    }).filter(function (item) {
      return item.value > 0;
    });
    const careMap = {};
    leaves.forEach(function (leave) {
      if (!careMap[leave.studentId]) {
        careMap[leave.studentId] = { count: 0, periods: 0, lastDate: '' };
      }
      careMap[leave.studentId].count += 1;
      careMap[leave.studentId].periods += leave.periods ? leave.periods.length : 0;
      if (leave.startDate > careMap[leave.studentId].lastDate) careMap[leave.studentId].lastDate = leave.startDate;
    });
    const care = Object.keys(careMap).map(function (studentId) {
      const student = getUserById(studentId);
      return {
        student: student,
        count: careMap[studentId].count,
        periods: careMap[studentId].periods,
        lastDate: careMap[studentId].lastDate
      };
    }).sort(function (a, b) {
      return b.periods - a.periods || b.count - a.count;
    }).slice(0, 8);
    const careRows = care.map(function (item, index) {
      return '<tr><td><span class="demo-rank' + (index === 0 ? ' demo-rank-top' : '') + '">' + (index + 1) + '</span></td><td><span class="demo-strong">' + esc(item.student ? item.student.name : '—') + '</span><span class="demo-table-sub">' + esc(item.student ? item.student.id : '') + '</span></td><td>' + esc(item.student ? departmentName(item.student.department) : '—') + '</td><td>' + item.count + ' 筆</td><td>' + item.periods + ' 節</td><td><span class="demo-time">' + esc(formatDate(item.lastDate)) + '</span></td></tr>';
    }).join('');
    const careBody = care.length ? '<div class="card demo-table-card"><div class="table-container"><table><thead><tr><th>排名</th><th>學生</th><th>學系</th><th>請假筆數</th><th>累計節次</th><th>最近請假</th></tr></thead><tbody>' + careRows + '</tbody></table></div></div>' : emptyState('spark', '尚無關懷名單', '目前沒有足夠的請假資料可產生名單。', '');
    return '<div class="demo-view">' + pageHeader(user.role === 'admin' ? '全校請假統計' : '課程請假統計', '以視覺化圖表掌握假別比例、月度趨勢、課程分布與需要關懷的學生。', '', 'STATISTICS') + '<div class="demo-stat-grid">' + cards + '</div><div class="demo-chart-grid">' + chartCard('假別比例', '依請假類型統計申請件數', donutChart(typeItems)) + chartCard('月度趨勢', '近 6 個月每月申請件數', lineChart(monthly)) + chartCard(barTitle, user.role === 'admin' ? '依學生所屬學系統計' : '依授課課程統計', barChart(barItems)) + chartCard('狀態分布', '所有申請的審核狀態', barChart(statusItems)) + '</div><section class="demo-section-card demo-care-section"><div class="demo-care-head"><div><h2 class="demo-care-title">關懷名單</h2><p class="demo-care-sub">依累計請假節次排序，協助教師與管理者留意學生的出席狀況。</p></div></div>' + careBody + '</section></div>';
  }

  function hasLeaveOverlap(studentId, courseId, startDate, endDate, periods) {
    return state.leaves.some(function (leave) {
      if (leave.studentId !== studentId || leave.courseId !== courseId) return false;
      if (leave.status !== 'pending' && leave.status !== 'approved') return false;
      if (leave.endDate < startDate || leave.startDate > endDate) return false;
      return leave.periods.some(function (period) {
        return periods.indexOf(period) !== -1;
      });
    });
  }

  function updateBatchBar() {
    const bar = document.getElementById('review-batch-bar');
    if (!bar) return;
    const boxes = Array.prototype.slice.call(document.querySelectorAll('[data-batch-select]'));
    const checked = boxes.filter(function (box) {
      return box.checked;
    });
    const label = document.getElementById('batch-count');
    if (label) label.textContent = '已選 ' + checked.length + ' 筆';
    ['batch-approve', 'batch-reject'].forEach(function (action) {
      const button = bar.querySelector('[data-action="' + action + '"]');
      if (button) button.disabled = checked.length === 0;
    });
    const all = document.getElementById('batch-select-all');
    if (all) {
      all.checked = boxes.length > 0 && checked.length === boxes.length;
      all.indeterminate = checked.length > 0 && checked.length < boxes.length;
    }
  }

  function withdrawLeave(id) {
    const user = currentUser();
    const leave = getLeaveById(id);
    if (!user || !leave) return;
    if (leave.studentId !== user.id) {
      toast('你只能撤回自己的請假申請。', 'error');
      return;
    }
    if (leave.status !== 'pending') {
      toast('只有待審核的假單可以撤回。', 'warning');
      return;
    }
    if (!window.confirm('確定要撤回這筆請假申請嗎？撤回後仍會保留紀錄。')) return;
    leave.status = 'withdrawn';
    leave.reviewComment = '';
    leave.reviewedBy = null;
    leave.reviewedAt = null;
    leave.updatedAt = nowLocal();
    addAudit('WITHDRAW_LEAVE', 'leave_request', leave.id, { reason: '學生自行撤回' }, user.id);
    saveState();
    toast('已撤回請假申請。', 'info');
    render();
  }

  function batchReview(decision) {
    const user = currentUser();
    if (!user) return;
    const ids = Array.prototype.slice.call(document.querySelectorAll('[data-batch-select]:checked')).map(function (box) {
      return box.value;
    });
    const eligible = ids.map(function (id) {
      return getLeaveById(id);
    }).filter(function (leave) {
      return leave && leave.status === 'pending' && canReviewLeave(user, leave);
    });
    if (!eligible.length) {
      toast('請先選取至少一筆可審核的待審假單。', 'warning');
      return;
    }
    const label = decision === 'approved' ? '核准' : '駁回';
    if (!window.confirm('確定要批次' + label + ' ' + eligible.length + ' 筆請假申請嗎？')) return;
    const now = nowLocal();
    eligible.forEach(function (leave) {
      leave.status = decision;
      leave.reviewComment = defaultReviewComment(decision);
      leave.reviewedBy = user.id;
      leave.reviewedAt = now;
      leave.updatedAt = now;
    });
    const action = decision === 'approved' ? 'BATCH_APPROVE_LEAVE' : 'BATCH_REJECT_LEAVE';
    addAudit(action, 'leave_request', 'batch', {
      ids: eligible.map(function (leave) {
        return leave.id;
      }),
      count: eligible.length
    }, user.id);
    saveState();
    toast('已批次' + label + ' ' + eligible.length + ' 筆請假申請。', decision === 'approved' ? 'success' : 'info');
    render();
  }

  function toggleUser(id) {
    const user = currentUser();
    const target = getUserById(id);
    if (!user || user.role !== 'admin' || !target) return;
    if (target.id === user.id) {
      toast('不可停用目前登入的管理員帳號。', 'warning');
      return;
    }
    const nextState = !target.isActive;
    if (!window.confirm('確定要' + (nextState ? '啟用' : '停用') + '「' + target.name + '」嗎？停用後該帳號將無法登入。')) return;
    target.isActive = nextState;
    addAudit('TOGGLE_USER', 'user', target.id, { isActive: target.isActive }, user.id);
    saveState();
    toast('已' + (target.isActive ? '啟用' : '停用') + ' ' + target.name + ' 的帳號。', target.isActive ? 'success' : 'info');
    render();
  }

  function resetDemoData() {
    if (!window.confirm('確定要清除本機示範資料並重新載入初始狀態嗎？所有在此瀏覽器做的變更都會消失。')) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      state = null;
    }
    state = buildSeed();
    saveState();
    lastHash = '';
    document.body.classList.remove('demo-sidebar-open');
    toast('示範資料已重設，請重新登入。', 'success');
    navigate('/login');
  }

  function handleLogin(form) {
    const data = new FormData(form);
    const username = String(data.get('username') || '').trim();
    const password = String(data.get('password') || '');
    const account = DEMO_ACCOUNTS.find(function (item) {
      return item.username === username;
    });
    const user = account ? getUserById(account.username) : null;
    if (!account || password !== account.password || !user) {
      addAudit('LOGIN_FAILURE', 'session', username || null, { username: username, reason: 'invalid_credentials' }, null);
      saveState();
      showInlineAlert('login-error', '帳號或密碼不正確，請確認示範帳號後再試。', 'error');
      form.elements.password.value = '';
      form.elements.password.focus();
      return;
    }
    if (!user.isActive) {
      addAudit('LOGIN_FAILURE', 'session', user.id, { username: username, reason: 'inactive_account' }, null);
      saveState();
      showInlineAlert('login-error', '此帳號已被停用，請聯絡系統管理員。', 'error');
      form.elements.password.value = '';
      form.elements.password.focus();
      return;
    }
    showInlineAlert('login-error', '', 'error');
    setSession(user.id);
    addAudit('LOGIN_SUCCESS', 'session', user.id, { role: user.role }, user.id);
    saveState();
    if (user.mustChangePassword) toast('此示範帳號標記為首次登入，正式系統會要求變更密碼。', 'info');
    toast('歡迎回來，' + user.name + '。', 'success');
    navigate(roleHome(user.role));
  }

  function handleApply(form) {
    const user = currentUser();
    if (!user || user.role !== 'student') return;
    const data = new FormData(form);
    const courseId = String(data.get('courseId') || '');
    const leaveType = String(data.get('leaveType') || '');
    const startDate = String(data.get('startDate') || '');
    const endDate = String(data.get('endDate') || '');
    const reason = String(data.get('reason') || '').trim();
    const periodValues = data.getAll('periods').map(function (value) {
      return Number(value);
    }).filter(function (value) {
      return Number.isFinite(value);
    });
    const periods = Array.from(new Set(periodValues)).sort(function (a, b) {
      return a - b;
    });
    const course = getCourseById(courseId);
    const fail = function (message) {
      showInlineAlert('apply-error', message, 'error');
    };
    showInlineAlert('apply-error', '', 'error');
    if (!course) {
      fail('請選擇有效的課程。');
      return;
    }
    if (!enrolledCourses(user.id).some(function (item) {
      return item.id === courseId;
    })) {
      fail('你沒有選修這門課程，無法提出請假。');
      return;
    }
    if (!LEAVE_TYPES[leaveType]) {
      fail('請選擇有效的假別。');
      return;
    }
    if (!startDate || !endDate) {
      fail('請填寫完整的請假日期。');
      return;
    }
    if (startDate > endDate) {
      fail('結束日期不可早於開始日期。');
      return;
    }
    if (startDate < todayISO()) {
      fail('請假日期不可早於今天。');
      return;
    }
    if (!periods.length) {
      fail('請至少選擇一個請假節次。');
      return;
    }
    if (reason.length < 5) {
      fail('請假事由至少需要 5 個字，請具體說明原因。');
      return;
    }
    if (hasLeaveOverlap(user.id, courseId, startDate, endDate, periods)) {
      fail('同一課程在相同日期與節次已有待審核或已核准的假單。');
      return;
    }
    const leave = {
      id: nextLeaveId(),
      studentId: user.id,
      courseId: courseId,
      leaveType: leaveType,
      startDate: startDate,
      endDate: endDate,
      periods: periods,
      reason: reason,
      status: 'pending',
      reviewComment: '',
      reviewedBy: null,
      reviewedAt: null,
      attachment: null,
      createdAt: nowLocal(),
      updatedAt: nowLocal()
    };
    state.leaves.push(leave);
    addAudit('SUBMIT_LEAVE', 'leave_request', leave.id, {
      courseId: leave.courseId,
      leaveType: leave.leaveType,
      startDate: leave.startDate,
      endDate: leave.endDate,
      periods: leave.periods
    }, user.id);
    saveState();
    toast('請假申請已送出，等待授課教師審核。', 'success');
    navigate('/student/' + leave.id);
  }

  function handleReview(form) {
    const user = currentUser();
    const leave = getLeaveById(form.getAttribute('data-id'));
    if (!user || !leave || !canReviewLeave(user, leave)) {
      toast('你沒有權限審核這筆請假申請。', 'error');
      return;
    }
    if (leave.status !== 'pending') {
      showInlineAlert('review-error', '此申請已處理，無法再次審核。', 'warning');
      return;
    }
    const data = new FormData(form);
    const decision = String(data.get('decision') || '');
    const comment = String(data.get('comment') || '').trim();
    if (decision !== 'approved' && decision !== 'rejected') {
      showInlineAlert('review-error', '請選擇核准或駁回。', 'error');
      return;
    }
    if (decision === 'rejected' && !comment) {
      showInlineAlert('review-error', '駁回申請時必須填寫審核意見。', 'error');
      return;
    }
    showInlineAlert('review-error', '', 'error');
    const now = nowLocal();
    leave.status = decision;
    leave.reviewComment = comment || defaultReviewComment(decision);
    leave.reviewedBy = user.id;
    leave.reviewedAt = now;
    leave.updatedAt = now;
    addAudit(decision === 'approved' ? 'APPROVE_LEAVE' : 'REJECT_LEAVE', 'leave_request', leave.id, { comment: leave.reviewComment }, user.id);
    saveState();
    toast(decision === 'approved' ? '已核准 ' + leave.id + '。' : '已駁回 ' + leave.id + '。', decision === 'approved' ? 'success' : 'info');
    navigate('/review');
  }

  function submitFilters(form, path, keys) {
    const data = new FormData(form);
    const query = new URLSearchParams();
    keys.forEach(function (key) {
      const value = String(data.get(key) || '').trim();
      if (value && value !== 'all') query.set(key, value);
    });
    const text = query.toString();
    navigate(path + (text ? '?' + text : ''));
  }

  function handleSubmit(event) {
    const form = event.target.closest('form[data-form]');
    if (!form) return;
    event.preventDefault();
    const kind = form.getAttribute('data-form');
    if (kind === 'login') handleLogin(form);
    else if (kind === 'apply') handleApply(form);
    else if (kind === 'review') handleReview(form);
    else if (kind === 'review-filter') submitFilters(form, '/review', ['status', 'course', 'q']);
    else if (kind === 'users-filter') submitFilters(form, '/admin/users', ['q', 'role', 'active']);
    else if (kind === 'courses-filter') submitFilters(form, '/admin/courses', ['q', 'dept']);
    else if (kind === 'audit-filter') submitFilters(form, '/admin/audit', ['q', 'action']);
  }

  function handleChange(event) {
    const target = event.target;
    if (target.matches('[data-batch-all]')) {
      Array.prototype.forEach.call(document.querySelectorAll('[data-batch-select]'), function (box) {
        box.checked = target.checked;
      });
      updateBatchBar();
      return;
    }
    if (target.matches('[data-batch-select]')) {
      updateBatchBar();
      return;
    }
    if (target.matches('[data-period-all]')) {
      const form = target.form;
      if (form) {
        Array.prototype.forEach.call(form.querySelectorAll('input[name="periods"]'), function (box) {
          box.checked = target.checked;
        });
      }
      return;
    }
    if (target.matches('input[name="periods"]')) {
      updatePeriodAllState(target.form);
      return;
    }
    if (target.matches('[data-course-select]')) syncApplyCourse();
  }

  function handleClick(event) {
    const trigger = event.target.closest('[data-action]');
    if (trigger) {
      const action = trigger.getAttribute('data-action');
      if (action === 'fill-login') {
        event.preventDefault();
        const username = document.getElementById('login-username');
        const password = document.getElementById('login-password');
        if (username) username.value = trigger.getAttribute('data-username') || '';
        if (password) password.value = trigger.getAttribute('data-password') || '';
        showInlineAlert('login-error', '', 'error');
        if (password) password.focus();
        return;
      }
      if (action === 'toggle-password') {
        event.preventDefault();
        const input = document.getElementById(trigger.getAttribute('data-target'));
        if (!input) return;
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        trigger.textContent = show ? '隱藏' : '顯示';
        return;
      }
      if (action === 'dismiss-toast') {
        const item = trigger.closest('.demo-toast');
        if (item) item.remove();
        return;
      }
      if (action === 'open-sidebar') {
        event.preventDefault();
        document.body.classList.add('demo-sidebar-open');
        return;
      }
      if (action === 'close-sidebar') {
        event.preventDefault();
        document.body.classList.remove('demo-sidebar-open');
        return;
      }
      if (action === 'logout') {
        event.preventDefault();
        const user = currentUser();
        if (user) {
          addAudit('LOGOUT', 'session', user.id, { message: '使用者主動登出' }, user.id);
          saveState();
        }
        clearSession();
        toast('已安全登出系統。', 'info');
        navigate('/login');
        return;
      }
      if (action === 'reset-demo') {
        event.preventDefault();
        resetDemoData();
        return;
      }
      if (action === 'view-attachment') {
        event.preventDefault();
        toast('「' + (trigger.getAttribute('data-name') || '附件') + '」為示範附件，未實際上傳或下載。', 'info');
        return;
      }
      if (action === 'withdraw-leave') {
        event.preventDefault();
        withdrawLeave(trigger.getAttribute('data-id'));
        return;
      }
      if (action === 'batch-approve' || action === 'batch-reject') {
        event.preventDefault();
        batchReview(action === 'batch-approve' ? 'approved' : 'rejected');
        return;
      }
      if (action === 'toggle-user') {
        event.preventDefault();
        toggleUser(trigger.getAttribute('data-id'));
        return;
      }
    }
    if (event.target.closest('.demo-nav-link')) document.body.classList.remove('demo-sidebar-open');
  }

  function init() {
    state = loadState();
    document.addEventListener('click', handleClick);
    document.addEventListener('change', handleChange);
    document.addEventListener('submit', handleSubmit);
    window.addEventListener('hashchange', render);
    render();
  }

  init();
})();
