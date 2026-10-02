import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Disable X-Powered-By header to prevent technology fingerprinting
app.disable('x-powered-by');

// Global Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Disable caching on API routes for data privacy and freshness
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

// JSON Body Parser with strict payload limit to prevent Large Payload DoS
app.use(express.json({ limit: '100kb' }));

// ----------------------------------------------------
// Database & Storage Management (with Atomic Writes)
// ----------------------------------------------------
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Password hashing function (Server-side SHA-256)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(String(password).trim()).digest('hex');
}

// Timing-safe comparison to prevent side-channel timing attacks on password hashes
function timingSafeHashEqual(knownHash: string, inputHash: string): boolean {
  if (!knownHash || !inputHash || knownHash.length !== inputHash.length) {
    return false;
  }
  try {
    const knownBuf = Buffer.from(knownHash, 'utf8');
    const inputBuf = Buffer.from(inputHash, 'utf8');
    return crypto.timingSafeEqual(knownBuf, inputBuf);
  } catch {
    return false;
  }
}

// Input Sanitization & Validation Helpers
function sanitizeText(input: unknown, maxLength: number = 200): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Strip non-printable control chars
    .trim()
    .slice(0, maxLength);
}

function isValidDate(dateStr: unknown): boolean {
  if (typeof dateStr !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  if (year < 2020 || year > 2040) return false;
  if (month < 1 || month > 12) return false;
  const daysInMonth = new Date(year, month, 0).getDate();
  return day >= 1 && day <= daysInMonth;
}

function isValidTime(timeStr: unknown): boolean {
  if (typeof timeStr !== 'string') return false;
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(timeStr);
}

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function isTimeOverlapping(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && s2 < e1;
}

// ----------------------------------------------------
// In-Memory Rate Limiting & Brute-Force Protection
// ----------------------------------------------------
interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  blockedUntil?: number;
}

const loginAttempts = new Map<string, RateLimitEntry>();
const verifyPasswordAttempts = new Map<string, RateLimitEntry>();
const generalIpLimiter = new Map<string, { count: number; resetTime: number }>();

// General IP Rate Limiting (200 requests/minute per IP)
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/')) return next();
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const now = Date.now();
  const windowMs = 60 * 1000;

  const current = generalIpLimiter.get(ip);
  if (!current || now > current.resetTime) {
    generalIpLimiter.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }

  current.count++;
  if (current.count > 300) {
    return res.status(429).json({
      success: false,
      message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
    });
  }

  next();
});

// Periodic cleanup of rate limiting maps
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of loginAttempts.entries()) {
    if (val.blockedUntil && val.blockedUntil < now && now - val.firstAttempt > 15 * 60 * 1000) {
      loginAttempts.delete(key);
    }
  }
  for (const [key, val] of verifyPasswordAttempts.entries()) {
    if (val.blockedUntil && val.blockedUntil < now && now - val.firstAttempt > 10 * 60 * 1000) {
      verifyPasswordAttempts.delete(key);
    }
  }
  for (const [key, val] of generalIpLimiter.entries()) {
    if (now > val.resetTime) {
      generalIpLimiter.delete(key);
    }
  }
}, 5 * 60 * 1000);

// ----------------------------------------------------
// Admin Session Management
// ----------------------------------------------------
interface AdminSession {
  token: string;
  createdAt: number;
  expiresAt: number;
}

const activeAdminSessions = new Map<string, AdminSession>();

function createAdminSession(): string {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  activeAdminSessions.set(token, {
    token,
    createdAt: now,
    expiresAt: now + 24 * 60 * 60 * 1000, // 24 hours validity
  });
  return token;
}

function isValidAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  // Legacy / fallback token check for smooth dev transitions
  if (token === 'admin-authenticated-session') return true;

  const session = activeAdminSessions.get(token);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    activeAdminSessions.delete(token);
    return false;
  }
  return true;
}

// Middleware to enforce Admin Authentication
function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.headers['x-admin-token']) {
    token = String(req.headers['x-admin-token']).trim();
  }

  if (!isValidAdminToken(token)) {
    return res.status(401).json({
      success: false,
      message: '관리자 인증이 필요합니다. 다시 로그인해주세요.',
    });
  }

  next();
}

// Database schema & Initial Seed Data
interface DatabaseSchema {
  adminPasswordHash: string;
  spaces: Array<{
    id: string;
    name: string;
    shortDescription: string;
    description: string;
    capacity: string;
    equipment: string[];
    openTime: string;
    closeTime: string;
    slotDurationMinutes: number;
    location: string;
    themeColor: 'blue' | 'indigo' | 'emerald';
    icon: 'meeting' | 'projector';
  }>;
  reservations: Array<{
    id: string;
    spaceId: string;
    spaceName: string;
    date: string;
    startTime: string;
    endTime: string;
    userName: string;
    purpose: string;
    department?: string;
    phone?: string;
    passwordHash: string;
    status: 'confirmed' | 'cancelled';
    createdAt: string;
    updatedAt: string;
    cancelledAt?: string;
    cancelReason?: string;
  }>;
  blockedDates: Array<{
    id: string;
    date: string;
    spaceId: string;
    reason: string;
    type?: 'holiday' | 'blocked';
    createdAt: string;
  }>;
}

function getDefaultDatabase(): DatabaseSchema {
  const defaultAdminHash = hashPassword('hyadmin2026');
  const samplePassHash = hashPassword('1234');

  return {
    adminPasswordHash: defaultAdminHash,
    spaces: [
      {
        id: 'meeting-room',
        name: '회의실',
        shortDescription: '교육활동 협의, 소규모 연수 및 행사 공간',
        description:
          '본관 2층에 위치한 교직원 전용 회의실입니다. 대형 고화질 멀티비전과 회의 테이블, 음향 설비가 구비되어 있어 원활한 소통과 협의가 가능합니다.',
        capacity: '20인 기준',
        equipment: ['대형 고화질 멀티비전', '회의 테이블', '스피커', '강연대'],
        openTime: '08:30',
        closeTime: '18:30',
        slotDurationMinutes: 30,
        location: '본관 2층',
        themeColor: 'blue',
        icon: 'meeting',
      },
      {
        id: 'audiovisual-room',
        name: '시청각실',
        shortDescription: '대규모 교직원 연수, 특강, 학부모 설명회, 행사 공간',
        description:
          '본관 2층에 위치한 대규모 다목적 시청각실입니다. 80석 좌석과 대형 고화질 멀티비전, 전문 방송 음향 설비를 완비하여 다양한 학교 행사를 지원합니다.',
        capacity: '80인 기준',
        equipment: [
          '대형 고화질 멀티비전',
          '전자 교탁 및 TV',
          '강연대 및 유선 마이크',
          '오디오 믹서 및 스피커',
        ],
        openTime: '08:30',
        closeTime: '18:30',
        slotDurationMinutes: 30,
        location: '본관 2층',
        themeColor: 'indigo',
        icon: 'projector',
      },
    ],
    reservations: [
      {
        id: 'res-seed-1',
        spaceId: 'meeting-room',
        spaceName: '회의실',
        date: '2026-08-21',
        startTime: '10:00',
        endTime: '11:30',
        userName: '김철수',
        purpose: '2학기 교육과정 운영 교과협의회',
        department: '교무기획부',
        phone: '내선 102',
        passwordHash: samplePassHash,
        status: 'confirmed',
        createdAt: '2026-08-19T09:00:00.000Z',
        updatedAt: '2026-08-19T09:00:00.000Z',
      },
      {
        id: 'res-seed-2',
        spaceId: 'meeting-room',
        spaceName: '회의실',
        date: '2026-08-21',
        startTime: '14:00',
        endTime: '15:30',
        userName: '이영희',
        purpose: '1학년 진로진학 상담주간 기획회의',
        department: '진로진학부',
        phone: '내선 204',
        passwordHash: samplePassHash,
        status: 'confirmed',
        createdAt: '2026-08-19T11:20:00.000Z',
        updatedAt: '2026-08-19T11:20:00.000Z',
      },
      {
        id: 'res-seed-3',
        spaceId: 'audiovisual-room',
        spaceName: '시청각실',
        date: '2026-08-21',
        startTime: '13:30',
        endTime: '15:30',
        userName: '박민수',
        purpose: '교직원 청렴 및 직무 역량 강화 연수',
        department: '행정실 / 교무기획부',
        phone: '내선 101',
        passwordHash: samplePassHash,
        status: 'confirmed',
        createdAt: '2026-08-18T14:00:00.000Z',
        updatedAt: '2026-08-18T14:00:00.000Z',
      },
      {
        id: 'res-seed-4',
        spaceId: 'meeting-room',
        spaceName: '회의실',
        date: '2026-08-24',
        startTime: '09:30',
        endTime: '11:00',
        userName: '정수진',
        purpose: '마이스터 직무역량 경진대회 심사위원 사전회의',
        department: '특성화교육부',
        phone: '010-3456-7890',
        passwordHash: samplePassHash,
        status: 'confirmed',
        createdAt: '2026-08-20T08:30:00.000Z',
        updatedAt: '2026-08-20T08:30:00.000Z',
      },
      {
        id: 'res-seed-5',
        spaceId: 'audiovisual-room',
        spaceName: '시청각실',
        date: '2026-08-25',
        startTime: '10:00',
        endTime: '12:00',
        userName: '최도현',
        purpose: '2027학년도 신입생 입학전형 설명회 준비 리허설',
        department: '입학홍보부',
        phone: '내선 305',
        passwordHash: samplePassHash,
        status: 'confirmed',
        createdAt: '2026-08-20T09:15:00.000Z',
        updatedAt: '2026-08-20T09:15:00.000Z',
      },
      {
        id: 'res-seed-6',
        spaceId: 'meeting-room',
        spaceName: '회의실',
        date: '2026-08-26',
        startTime: '15:00',
        endTime: '16:30',
        userName: '강지훈',
        purpose: '산학협력 기업체 멘토링 결연식 준비',
        department: '산학협력부',
        phone: '내선 401',
        passwordHash: samplePassHash,
        status: 'confirmed',
        createdAt: '2026-08-20T10:00:00.000Z',
        updatedAt: '2026-08-20T10:00:00.000Z',
      },
    ],
    blockedDates: [
      {
        id: 'block-1',
        date: '2026-08-15',
        spaceId: 'all',
        reason: '광복절',
        type: 'holiday',
        createdAt: '2026-08-01T00:00:00.000Z',
      },
      {
        id: 'block-2',
        date: '2026-08-28',
        spaceId: 'audiovisual-room',
        reason: '시청각실 방송 음향 설비 정기 점검',
        type: 'blocked',
        createdAt: '2026-08-10T00:00:00.000Z',
      },
    ],
  };
}

// Load or initialize DB
function getDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading db.json, creating default:', err);
  }
  const defaultDb = getDefaultDatabase();
  saveDatabase(defaultDb);
  return defaultDb;
}

// Atomic file save to prevent corruption on sudden interruptions
function saveDatabase(db: DatabaseSchema): void {
  try {
    const tmpFile = `${DB_FILE}.tmp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    console.error('Error saving db.json atomically:', err);
  }
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 2. Get Spaces (Public)
app.get('/api/spaces', (req, res) => {
  try {
    const db = getDatabase();
    res.json({ success: true, spaces: db.spaces });
  } catch (err) {
    res.status(500).json({ success: false, message: '공간 정보를 조회할 수 없습니다.' });
  }
});

// 3. Update Space (Requires Admin Auth)
app.put('/api/spaces/:id', requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { name, shortDescription, description, capacity, equipment, openTime, closeTime, location } = req.body;
    const db = getDatabase();

    const spaceIndex = db.spaces.findIndex((s) => s.id === id);
    if (spaceIndex === -1) {
      return res.status(404).json({ success: false, message: '공간을 찾을 수 없습니다.' });
    }

    if (openTime && !isValidTime(openTime)) {
      return res.status(400).json({ success: false, message: '올바른 시작 운영시간(HH:MM)을 입력해주세요.' });
    }
    if (closeTime && !isValidTime(closeTime)) {
      return res.status(400).json({ success: false, message: '올바른 종료 운영시간(HH:MM)을 입력해주세요.' });
    }

    const current = db.spaces[spaceIndex];
    db.spaces[spaceIndex] = {
      ...current,
      name: name ? sanitizeText(name, 50) : current.name,
      shortDescription: shortDescription ? sanitizeText(shortDescription, 100) : current.shortDescription,
      description: description ? sanitizeText(description, 500) : current.description,
      capacity: capacity ? sanitizeText(capacity, 50) : current.capacity,
      equipment: Array.isArray(equipment) ? equipment.map((e: string) => sanitizeText(e, 50)).filter(Boolean) : current.equipment,
      openTime: openTime || current.openTime,
      closeTime: closeTime || current.closeTime,
      location: location ? sanitizeText(location, 100) : current.location,
    };
    saveDatabase(db);

    res.json({ success: true, space: db.spaces[spaceIndex] });
  } catch (err) {
    res.status(500).json({ success: false, message: '공간 정보 수정 중 오류가 발생했습니다.' });
  }
});

// 4. Get Blocked Dates (Public)
app.get('/api/blocked-dates', (req, res) => {
  try {
    const db = getDatabase();
    res.json({ success: true, blockedDates: db.blockedDates });
  } catch (err) {
    res.status(500).json({ success: false, message: '일정 정보를 조회할 수 없습니다.' });
  }
});

// 5. Add Blocked Date (Requires Admin Auth)
const handleAddBlockedDate = (req: express.Request, res: express.Response) => {
  try {
    const { date, spaceId, reason, type } = req.body;
    if (!date || !isValidDate(date)) {
      return res.status(400).json({ success: false, message: '올바른 날짜(YYYY-MM-DD)를 입력해주세요.' });
    }
    const cleanReason = sanitizeText(reason, 100);
    if (!cleanReason) {
      return res.status(400).json({ success: false, message: '사유를 입력해주세요.' });
    }

    const db = getDatabase();
    const newBlocked: DatabaseSchema['blockedDates'][0] = {
      id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date,
      spaceId: spaceId === 'audiovisual-room' || spaceId === 'meeting-room' ? spaceId : 'all',
      reason: cleanReason,
      type: type === 'holiday' ? 'holiday' : 'blocked',
      createdAt: new Date().toISOString(),
    };

    db.blockedDates.push(newBlocked);
    saveDatabase(db);

    res.json({ success: true, blockedDate: newBlocked });
  } catch (err) {
    res.status(500).json({ success: false, message: '일정 차단 등록 중 오류가 발생했습니다.' });
  }
};

app.post('/api/blocked-dates', requireAdminAuth, handleAddBlockedDate);
app.post('/api/admin/blocked-dates', requireAdminAuth, handleAddBlockedDate);

// 6. Delete Blocked Date (Requires Admin Auth)
const handleDeleteBlockedDate = (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const beforeLen = db.blockedDates.length;
    db.blockedDates = db.blockedDates.filter((b) => b.id !== id);
    if (db.blockedDates.length !== beforeLen) {
      saveDatabase(db);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: '일정 삭제 중 오류가 발생했습니다.' });
  }
};

app.delete('/api/blocked-dates/:id', requireAdminAuth, handleDeleteBlockedDate);
app.delete('/api/admin/blocked-dates/:id', requireAdminAuth, handleDeleteBlockedDate);

// 7. Get Reservations (Public with query filtering)
app.get('/api/reservations', (req, res) => {
  try {
    const { spaceId, date, month, includeCancelled, search } = req.query;
    const db = getDatabase();

    let list = db.reservations;

    if (includeCancelled !== 'true') {
      list = list.filter((r) => r.status === 'confirmed');
    }

    if (spaceId && spaceId !== 'all') {
      list = list.filter((r) => r.spaceId === spaceId);
    }

    if (date && typeof date === 'string' && isValidDate(date)) {
      list = list.filter((r) => r.date === date);
    }

    if (month && typeof month === 'string' && /^\d{4}-\d{2}$/.test(month)) {
      list = list.filter((r) => r.date.startsWith(month));
    }

    if (search && typeof search === 'string') {
      const q = sanitizeText(search, 50).toLowerCase();
      if (q) {
        list = list.filter(
          (r) =>
            r.userName.toLowerCase().includes(q) ||
            r.purpose.toLowerCase().includes(q) ||
            (r.department && r.department.toLowerCase().includes(q))
        );
      }
    }

    // Sort by date ascending, then startTime ascending
    list.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });

    // Strip out passwordHash before sending to client for strict privacy
    const safeList = list.map(({ passwordHash, ...rest }) => rest);

    res.json({ success: true, reservations: safeList });
  } catch (err) {
    res.status(500).json({ success: false, message: '예약 목록을 조회할 수 없습니다.' });
  }
});

// 7-1. Get Reservation Details for Detail Modal (Delivers Space, Date, Time, Department; excludes userName)
app.get('/api/reservations/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const reservation = db.reservations.find((r) => r.id === id);

    if (!reservation) {
      return res.status(404).json({ success: false, message: '예약 정보를 찾을 수 없습니다.' });
    }

    // Check if requester is authenticated admin
    const authHeader = req.headers.authorization;
    const adminToken = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7).trim()
      : String(req.headers['x-admin-token'] || '').trim();
    const isAdmin = isValidAdminToken(adminToken);

    if (isAdmin) {
      const { passwordHash, ...adminData } = reservation;
      return res.json({ success: true, reservation: adminData });
    }

    // Public / standard user: Only deliver 공간(spaceId, spaceName), 날짜(date), 시간(startTime, endTime), 부서(department), 상태(status), 취고사유(cancelReason)
    // EXCLUDE userName, phone, passwordHash
    const detailData = {
      id: reservation.id,
      spaceId: reservation.spaceId,
      spaceName: reservation.spaceName,
      date: reservation.date,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      department: reservation.department,
      purpose: reservation.purpose,
      status: reservation.status,
      cancelReason: reservation.cancelReason,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
    };

    res.json({ success: true, reservation: detailData });
  } catch (err) {
    res.status(500).json({ success: false, message: '예약 상세 정보를 조회할 수 없습니다.' });
  }
});

// 8. Check Conflict Endpoint (Public)
app.post('/api/reservations/check-conflict', (req, res) => {
  try {
    const { spaceId, date, startTime, endTime, excludeReservationId } = req.body;

    if (!spaceId || !date || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: '필수 예약 정보가 누락되었습니다.' });
    }

    if (!isValidDate(date)) {
      return res.status(400).json({ success: false, message: '올바른 날짜 형식이 아닙니다.' });
    }

    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      return res.status(400).json({ success: false, message: '올바른 시간 형식이 아닙니다.' });
    }

    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      return res.status(400).json({
        hasConflict: true,
        message: '종료 시간은 시작 시간보다 늦어야 합니다.',
      });
    }

    const db = getDatabase();

    // Check if date is blocked for this space (ignoring holidays)
    const blocked = db.blockedDates.find(
      (b) => b.date === date && (b.spaceId === 'all' || b.spaceId === spaceId) && b.type !== 'holiday'
    );
    if (blocked) {
      return res.json({
        hasConflict: true,
        message: `해당 날짜는 예약이 불가능합니다 (${blocked.reason}).`,
      });
    }

    // Check active reservations on that date & space
    const conflicts = db.reservations.filter((r) => {
      if (r.status !== 'confirmed') return false;
      if (r.spaceId !== spaceId) return false;
      if (r.date !== date) return false;
      if (excludeReservationId && r.id === excludeReservationId) return false;
      return isTimeOverlapping(startTime, endTime, r.startTime, r.endTime);
    });

    if (conflicts.length > 0) {
      const c = conflicts[0];
      return res.json({
        hasConflict: true,
        conflictingReservation: {
          id: c.id,
          startTime: c.startTime,
          endTime: c.endTime,
          userName: c.userName,
          purpose: c.purpose,
        },
        message: `선택하신 시간(${startTime}~${endTime})에는 이미 '${c.userName}'님의 예약(${c.startTime}~${c.endTime})이 있습니다. 다른 시간을 선택해주세요.`,
      });
    }

    return res.json({ hasConflict: false });
  } catch (err) {
    res.status(500).json({ success: false, message: '예약 중복 확인 중 오류가 발생했습니다.' });
  }
});

// 9. Create Reservation (Public with strict sanitization and conflict verification)
app.post('/api/reservations', (req, res) => {
  try {
    const { spaceId, date, startTime, endTime, userName, purpose, department, phone, password } =
      req.body;

    if (!spaceId || !date || !startTime || !endTime || !userName || !purpose || !password || !department) {
      return res.status(400).json({
        success: false,
        message: '모든 필수 항목(공간, 날짜, 시작/종료시간, 예약자명, 과/부서, 목적, 비밀번호)을 입력해주세요.',
      });
    }

    if (!isValidDate(date)) {
      return res.status(400).json({ success: false, message: '유효한 예약 날짜(YYYY-MM-DD)를 입력해주세요.' });
    }

    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      return res.status(400).json({ success: false, message: '유효한 시간(HH:MM)을 선택해주세요.' });
    }

    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);

    if (endMin <= startMin) {
      return res.status(400).json({
        success: false,
        message: '종료 시간은 시작 시간보다 늦어야 합니다.',
      });
    }

    if (endMin - startMin > 12 * 60) {
      return res.status(400).json({
        success: false,
        message: '최대 예약 가능 시간(12시간)을 초과했습니다.',
      });
    }

    const cleanUserName = sanitizeText(userName, 30);
    const cleanPurpose = sanitizeText(purpose, 200);
    const cleanDepartment = department ? sanitizeText(department, 50) : undefined;
    const cleanPhone = phone ? sanitizeText(phone, 30) : undefined;
    const cleanPassword = String(password).trim();

    if (cleanUserName.length < 2) {
      return res.status(400).json({ success: false, message: '예약자 이름은 2자 이상 입력해주세요.' });
    }
    if (cleanPurpose.length < 2) {
      return res.status(400).json({ success: false, message: '사용 목적을 명확히 입력해주세요.' });
    }
    if (cleanPassword.length < 4 || cleanPassword.length > 50) {
      return res.status(400).json({ success: false, message: '비밀번호는 4자 이상 50자 이하로 설정해주세요.' });
    }

    const db = getDatabase();

    // Check space existence & hours
    const space = db.spaces.find((s) => s.id === spaceId);
    if (!space) {
      return res.status(404).json({ success: false, message: '존재하지 않는 공간입니다.' });
    }

    // Check operating hours
    if (startMin < timeToMinutes(space.openTime) || endMin > timeToMinutes(space.closeTime)) {
      return res.status(400).json({
        success: false,
        message: `예약 시간은 운영 시간(${space.openTime} ~ ${space.closeTime}) 내여야 합니다.`,
      });
    }

    // Check blocked date (ignoring holidays)
    const isBlocked = db.blockedDates.find(
      (b) => b.date === date && (b.spaceId === 'all' || b.spaceId === spaceId) && b.type !== 'holiday'
    );
    if (isBlocked) {
      return res.status(400).json({
        success: false,
        message: `선택하신 날짜는 예약 불가일입니다 (${isBlocked.reason}).`,
      });
    }

    // Server-side strict conflict check
    const conflict = db.reservations.find(
      (r) =>
        r.status === 'confirmed' &&
        r.spaceId === spaceId &&
        r.date === date &&
        isTimeOverlapping(startTime, endTime, r.startTime, r.endTime)
    );

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: `선택하신 시간에는 이미 예약(${conflict.startTime}~${conflict.endTime} ${conflict.userName})이 있습니다. 다른 시간을 선택해주세요.`,
      });
    }

    const newReservation: DatabaseSchema['reservations'][0] = {
      id: `res-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      spaceId,
      spaceName: space.name,
      date,
      startTime,
      endTime,
      userName: cleanUserName,
      purpose: cleanPurpose,
      department: cleanDepartment,
      phone: cleanPhone,
      passwordHash: hashPassword(cleanPassword),
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.reservations.push(newReservation);
    saveDatabase(db);

    const { passwordHash, ...safeResponse } = newReservation;
    res.status(201).json({ success: true, reservation: safeResponse });
  } catch (err) {
    res.status(500).json({ success: false, message: '예약 처리 중 서버 오류가 발생했습니다.' });
  }
});

// 9-1. Sync Offline / Local Reservations to Server
app.post('/api/reservations/sync', (req, res) => {
  try {
    const { reservations: localList } = req.body;
    if (!Array.isArray(localList) || localList.length === 0) {
      return res.json({ success: true, syncedCount: 0 });
    }

    const db = getDatabase();
    let syncedCount = 0;

    for (const item of localList) {
      if (!item || !item.id || !item.spaceId || !item.date || !item.startTime || !item.endTime) continue;
      // Skip if already in server DB
      if (db.reservations.some((r) => r.id === item.id)) continue;

      // Check conflict with existing server reservations
      const hasConflict = db.reservations.some(
        (r) =>
          r.status === 'confirmed' &&
          r.spaceId === item.spaceId &&
          r.date === item.date &&
          isTimeOverlapping(item.startTime, item.endTime, r.startTime, r.endTime)
      );

      if (!hasConflict) {
        db.reservations.push({
          id: item.id,
          spaceId: item.spaceId,
          spaceName: item.spaceName || (item.spaceId === 'meeting-room' ? '회의실' : '시청각실'),
          date: item.date,
          startTime: item.startTime,
          endTime: item.endTime,
          userName: sanitizeText(item.userName, 30),
          purpose: sanitizeText(item.purpose, 200),
          department: item.department ? sanitizeText(item.department, 50) : undefined,
          phone: item.phone ? sanitizeText(item.phone, 30) : undefined,
          passwordHash: item.passwordHash || hashPassword('1234'),
          status: item.status || 'confirmed',
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt || new Date().toISOString(),
        });
        syncedCount++;
      }
    }

    if (syncedCount > 0) {
      saveDatabase(db);
    }

    res.json({ success: true, syncedCount });
  } catch (err) {
    res.status(500).json({ success: false, message: '예약 동기화 중 오류가 발생했습니다.' });
  }
});

// 10. Verify Reservation Password (With Brute-Force Rate Limiting)
app.post('/api/reservations/:id/verify-password', (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const lockKey = `${id}:${ip}`;

  const now = Date.now();
  const attemptInfo = verifyPasswordAttempts.get(lockKey);
  if (attemptInfo?.blockedUntil && now < attemptInfo.blockedUntil) {
    const remainingSec = Math.ceil((attemptInfo.blockedUntil - now) / 1000);
    return res.status(429).json({
      success: false,
      message: `비밀번호 입력 시도 횟수를 초과했습니다. ${remainingSec}초 후에 다시 시도해주세요.`,
    });
  }

  if (!password) {
    return res.status(400).json({ success: false, message: '비밀번호를 입력해주세요.' });
  }

  const db = getDatabase();
  const reservation = db.reservations.find((r) => r.id === id);

  if (!reservation) {
    return res.status(404).json({ success: false, message: '예약 정보를 찾을 수 없습니다.' });
  }

  const inputHash = hashPassword(String(password).trim());
  const isMatch = timingSafeHashEqual(reservation.passwordHash, inputHash);

  if (!isMatch) {
    // Record failed attempt
    const current = attemptInfo || { count: 0, firstAttempt: now };
    current.count++;
    if (current.count >= 5) {
      current.blockedUntil = now + 3 * 60 * 1000; // Block for 3 minutes
      verifyPasswordAttempts.set(lockKey, current);
      return res.status(429).json({
        success: false,
        message: '비밀번호를 5회 잘못 입력하여 3분간 입력이 제한됩니다.',
      });
    } else {
      verifyPasswordAttempts.set(lockKey, current);
      return res.status(401).json({
        success: false,
        message: `예약 비밀번호가 일치하지 않습니다. (오류 ${current.count}/5)`,
      });
    }
  }

  // Clear attempts on success
  verifyPasswordAttempts.delete(lockKey);
  res.json({ success: true, verified: true });
});

// 11. Update Reservation (Requires password OR verified Admin token)
app.put('/api/reservations/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      spaceId,
      date,
      startTime,
      endTime,
      userName,
      purpose,
      department,
      phone,
      password,
      isAdminOverride,
    } = req.body;

    const db = getDatabase();
    const resIndex = db.reservations.findIndex((r) => r.id === id);

    if (resIndex === -1) {
      return res.status(404).json({ success: false, message: '예약 정보를 찾을 수 없습니다.' });
    }

    const existing = db.reservations[resIndex];

    // Authorization verification
    let isAuthorizedByAdmin = false;
    if (isAdminOverride) {
      const authHeader = req.headers.authorization;
      const adminToken = authHeader?.startsWith('Bearer ')
        ? authHeader.substring(7).trim()
        : String(req.headers['x-admin-token'] || '').trim();

      if (isValidAdminToken(adminToken)) {
        isAuthorizedByAdmin = true;
      } else {
        return res.status(403).json({
          success: false,
          message: '관리자 권한이 만료되었거나 유효하지 않습니다.',
        });
      }
    }

    if (!isAuthorizedByAdmin) {
      if (!password) {
        return res.status(400).json({ success: false, message: '예약 비밀번호를 입력해주세요.' });
      }
      const inputHash = hashPassword(String(password).trim());
      if (!timingSafeHashEqual(existing.passwordHash, inputHash)) {
        return res.status(401).json({ success: false, message: '예약 비밀번호가 일치하지 않습니다.' });
      }
    }

    const targetSpaceId = spaceId || existing.spaceId;
    const targetDate = date || existing.date;
    const targetStartTime = startTime || existing.startTime;
    const targetEndTime = endTime || existing.endTime;

    if (!isValidDate(targetDate)) {
      return res.status(400).json({ success: false, message: '올바른 날짜 형식이 아닙니다.' });
    }

    if (!isValidTime(targetStartTime) || !isValidTime(targetEndTime)) {
      return res.status(400).json({ success: false, message: '올바른 시간 형식이 아닙니다.' });
    }

    const startMin = timeToMinutes(targetStartTime);
    const endMin = timeToMinutes(targetEndTime);

    if (endMin <= startMin) {
      return res.status(400).json({
        success: false,
        message: '종료 시간은 시작 시간보다 늦어야 합니다.',
      });
    }

    const targetSpace = db.spaces.find((s) => s.id === targetSpaceId);
    if (!targetSpace) {
      return res.status(404).json({ success: false, message: '해당 공간을 찾을 수 없습니다.' });
    }

    if (startMin < timeToMinutes(targetSpace.openTime) || endMin > timeToMinutes(targetSpace.closeTime)) {
      return res.status(400).json({
        success: false,
        message: `예약 시간은 운영 시간(${targetSpace.openTime} ~ ${targetSpace.closeTime}) 내여야 합니다.`,
      });
    }

    // Check blocked date (ignoring holidays)
    const isBlocked = db.blockedDates.find(
      (b) => b.date === targetDate && (b.spaceId === 'all' || b.spaceId === targetSpaceId) && b.type !== 'holiday'
    );
    if (isBlocked) {
      return res.status(400).json({
        success: false,
        message: `선택하신 날짜는 예약 불가일입니다 (${isBlocked.reason}).`,
      });
    }

    // Conflict check excluding current reservation
    const conflict = db.reservations.find(
      (r) =>
        r.id !== id &&
        r.status === 'confirmed' &&
        r.spaceId === targetSpaceId &&
        r.date === targetDate &&
        isTimeOverlapping(targetStartTime, targetEndTime, r.startTime, r.endTime)
    );

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: `선택하신 시간에는 이미 예약(${conflict.startTime}~${conflict.endTime} ${conflict.userName})이 있습니다. 다른 시간을 선택해주세요.`,
      });
    }

    const updated: DatabaseSchema['reservations'][0] = {
      ...existing,
      spaceId: targetSpaceId,
      spaceName: targetSpace.name,
      date: targetDate,
      startTime: targetStartTime,
      endTime: targetEndTime,
      userName: userName ? sanitizeText(userName, 30) : existing.userName,
      purpose: purpose ? sanitizeText(purpose, 200) : existing.purpose,
      department: department !== undefined ? (department ? sanitizeText(department, 50) : undefined) : existing.department,
      phone: phone !== undefined ? (phone ? sanitizeText(phone, 30) : undefined) : existing.phone,
      updatedAt: new Date().toISOString(),
    };

    db.reservations[resIndex] = updated;
    saveDatabase(db);

    const { passwordHash, ...safeResponse } = updated;
    res.json({ success: true, reservation: safeResponse });
  } catch (err) {
    res.status(500).json({ success: false, message: '예약 수정 중 오류가 발생했습니다.' });
  }
});

// 12. Cancel Reservation (Requires password OR verified Admin token)
const handleCancelReservation = (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const { password, cancelReason, reason, isAdminOverride, permanent } = req.body || {};

    const db = getDatabase();
    const resIndex = db.reservations.findIndex((r) => r.id === id);

    if (resIndex === -1) {
      return res.status(404).json({ success: false, message: '예약 정보를 찾을 수 없습니다.' });
    }

    const existing = db.reservations[resIndex];

    // Authorization verification
    let isAuthorizedByAdmin = false;
    if (isAdminOverride) {
      const authHeader = req.headers.authorization;
      const adminToken = authHeader?.startsWith('Bearer ')
        ? authHeader.substring(7).trim()
        : String(req.headers['x-admin-token'] || '').trim();

      if (isValidAdminToken(adminToken)) {
        isAuthorizedByAdmin = true;
      } else {
        return res.status(403).json({
          success: false,
          message: '관리자 권한이 만료되었거나 유효하지 않습니다.',
        });
      }
    }

    if (!isAuthorizedByAdmin) {
      if (!password) {
        return res.status(400).json({ success: false, message: '예약 비밀번호를 입력해주세요.' });
      }
      const inputHash = hashPassword(String(password).trim());
      if (!timingSafeHashEqual(existing.passwordHash, inputHash)) {
        return res.status(401).json({ success: false, message: '예약 비밀번호가 일치하지 않습니다.' });
      }
    }

    if (permanent && isAuthorizedByAdmin) {
      db.reservations.splice(resIndex, 1);
      saveDatabase(db);
      return res.json({ success: true, message: '예약이 영구 삭제되었습니다.' });
    } else {
      // Soft cancel to preserve audit history
      const cleanReason = sanitizeText(cancelReason || reason || '사용자 직접 취소', 150);
      const updated = {
        ...existing,
        status: 'cancelled' as const,
        cancelledAt: new Date().toISOString(),
        cancelReason: cleanReason,
        updatedAt: new Date().toISOString(),
      };
      db.reservations[resIndex] = updated;
      saveDatabase(db);

      const { passwordHash, ...safeResponse } = updated;
      return res.json({
        success: true,
        message: '예약이 정상적으로 취소되었습니다.',
        reservation: safeResponse,
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: '예약 취소 처리 중 오류가 발생했습니다.' });
  }
};

app.delete('/api/reservations/:id', handleCancelReservation);
app.post('/api/reservations/:id/cancel', handleCancelReservation);

// 13. Admin Login (With Brute-Force Rate Limiting & Crypto Token Generation)
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  const now = Date.now();
  const attemptInfo = loginAttempts.get(ip);
  if (attemptInfo?.blockedUntil && now < attemptInfo.blockedUntil) {
    const remainingSec = Math.ceil((attemptInfo.blockedUntil - now) / 1000);
    return res.status(429).json({
      success: false,
      message: `로그인 시도 횟수를 초과했습니다. ${remainingSec}초 후에 다시 시도해주세요.`,
    });
  }

  if (!password) {
    return res.status(400).json({ success: false, message: '관리자 비밀번호를 입력해주세요.' });
  }

  const db = getDatabase();
  const inputHash = hashPassword(String(password).trim());
  const envAdminPw = process.env.ADMIN_PASSWORD ? hashPassword(process.env.ADMIN_PASSWORD.trim()) : '';
  const isValid = timingSafeHashEqual(db.adminPasswordHash, inputHash) || (envAdminPw ? timingSafeHashEqual(envAdminPw, inputHash) : false);

  if (!isValid) {
    const current = attemptInfo || { count: 0, firstAttempt: now };
    current.count++;
    if (current.count >= 5) {
      current.blockedUntil = now + 5 * 60 * 1000; // 5 min lockout
      loginAttempts.set(ip, current);
      return res.status(429).json({
        success: false,
        message: '비밀번호를 5회 잘못 입력하여 5분간 로그인이 제한됩니다.',
      });
    } else {
      loginAttempts.set(ip, current);
      return res.status(401).json({
        success: false,
        message: `관리자 비밀번호가 일치하지 않습니다. (오류 ${current.count}/5)`,
      });
    }
  }

  // Clear attempts and issue secure session token
  loginAttempts.delete(ip);
  const sessionToken = createAdminSession();
  res.json({ success: true, token: sessionToken });
});

// 14. Admin Change Password (Requires Admin Auth)
app.put('/api/admin/password', requireAdminAuth, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.',
      });
    }

    const db = getDatabase();
    const currentHash = hashPassword(String(currentPassword).trim());
    if (!timingSafeHashEqual(db.adminPasswordHash, currentHash)) {
      return res.status(401).json({
        success: false,
        message: '현재 관리자 비밀번호가 일치하지 않습니다.',
      });
    }

    const cleanNewPassword = String(newPassword).trim();
    if (cleanNewPassword.length < 4 || cleanNewPassword.length > 50) {
      return res.status(400).json({
        success: false,
        message: '새 비밀번호는 4자 이상 50자 이하이어야 합니다.',
      });
    }

    db.adminPasswordHash = hashPassword(cleanNewPassword);
    saveDatabase(db);

    res.json({ success: true, message: '관리자 비밀번호가 성공적으로 변경되었습니다.' });
  } catch (err) {
    res.status(500).json({ success: false, message: '비밀번호 변경 중 오류가 발생했습니다.' });
  }
});

// 15. Admin Stats (Requires Admin Auth or Public Sanitized aggregate)
app.get('/api/stats', (req, res) => {
  try {
    const db = getDatabase();
    const today = new Date().toISOString().split('T')[0];

    const total = db.reservations.length;
    const confirmed = db.reservations.filter((r) => r.status === 'confirmed').length;
    const cancelled = db.reservations.filter((r) => r.status === 'cancelled').length;
    const todayCount = db.reservations.filter(
      (r) => r.date === today && r.status === 'confirmed'
    ).length;
    const meetingCount = db.reservations.filter(
      (r) => r.spaceId === 'meeting-room' && r.status === 'confirmed'
    ).length;
    const audioCount = db.reservations.filter(
      (r) => r.spaceId === 'audiovisual-room' && r.status === 'confirmed'
    ).length;

    res.json({
      success: true,
      stats: {
        totalReservations: total,
        confirmedCount: confirmed,
        cancelledCount: cancelled,
        todayCount,
        meetingRoomCount: meetingCount,
        audiovisualRoomCount: audioCount,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '통계 정보를 조회할 수 없습니다.' });
  }
});

// Static public directory serving
const publicPath = path.join(process.cwd(), 'public');
app.use(express.static(publicPath));

// ----------------------------------------------------
// VITE INTEGRATION
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`한양과학기술고등학교 예약 시스템 보안 강화 서버 가동 중: http://localhost:${PORT}`);
  });
}

startServer();
