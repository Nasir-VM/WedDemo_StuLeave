export const ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin'
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const LEAVE_TYPES = {
  sick: { label: '病假', code: 'sick' },
  personal: { label: '事假', code: 'personal' },
  official: { label: '公假', code: 'official' },
  bereavement: { label: '喪假', code: 'bereavement' },
  other: { label: '其他', code: 'other' }
} as const;

export type LeaveTypeCode = keyof typeof LEAVE_TYPES;

export const LEAVE_STATUS = {
  pending: { label: '待審核', code: 'pending', color: '#B58D3D' },
  approved: { label: '已核准', code: 'approved', color: '#5B7C99' },
  rejected: { label: '已駁回', code: 'rejected', color: '#9E5B5B' },
  withdrawn: { label: '已撤回', code: 'withdrawn', color: '#888888' }
} as const;

export type LeaveStatusCode = keyof typeof LEAVE_STATUS;

export const PERIODS = [
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
] as const;

export const WEEKDAYS = [
  { day: 1, label: '星期一' },
  { day: 2, label: '星期二' },
  { day: 3, label: '星期三' },
  { day: 4, label: '星期四' },
  { day: 5, label: '星期五' },
  { day: 6, label: '星期六' },
  { day: 7, label: '星期日' }
] as const;

export const SECURITY_LIMITS = {
  MAX_UPLOAD_SIZE: 5 * 1024 * 1024, 
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'application/pdf'] as const,
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.pdf'] as const,
  SESSION_IDLE_TIMEOUT_MS: 30 * 60 * 1000, 
  SESSION_MAX_LIFETIME_MS: 24 * 60 * 60 * 1000, 
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE_SIZE: 15,
  JSON_BODY_MAX_BYTES: 100 * 1024, 
  MAX_LOGIN_ATTEMPTS_BEFORE_LOCK: 10,
  LOGIN_LOCKOUT_MS: 15 * 60 * 1000 
};
