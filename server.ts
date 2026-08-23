import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to JSON database
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Password hashing function (Server-side)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password.trim()).digest('hex');
}

// Time overlap helper
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
    spaceId: string; // 'all' or specific spaceId
    reason: string;
    type?: 'holiday' | 'blocked';
    createdAt: string;
  }>;
}

function getDefaultDatabase(): DatabaseSchema {
  const defaultAdminHash = hashPassword('admin1234');
  const samplePassHash = hashPassword('1234');

  return {
    adminPasswordHash: defaultAdminHash,
    spaces: [
      {
        id: 'meeting-room',
        name: '회의실',
        shortDescription: '교직원 회의, 분과별 협의회, 소규모 연수 공간',
        description: '본관 2층에 위치한 교직원 전용 회의실입니다. 대형 고화질 멀티비전과 회의 테이블, 음향 설비가 구비되어 있어 원활한 소통과 협의가 가능합니다.',
        capacity: '최대 20인',
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
        description: '본관 2층에 위치한 대규모 다목적 시청각실입니다. 120석 좌석과 대형 고화질 멀티비전, 전문 방송 음향 설비를 완비하여 다양한 학교 행사를 지원합니다.',
        capacity: '최대 120인',
        equipment: ['대형 고화질 멀티비전', '테이블 & 120석', '강연대 & 유선 마이크', '전문 방송 믹서 & 오디오 시스템'],
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

function saveDatabase(db: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving db.json:', err);
  }
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 2. Get Spaces
app.get('/api/spaces', (req, res) => {
  const db = getDatabase();
  res.json({ success: true, spaces: db.spaces });
});

// 3. Update Space (Admin)
app.put('/api/spaces/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const db = getDatabase();

  const spaceIndex = db.spaces.findIndex((s) => s.id === id);
  if (spaceIndex === -1) {
    return res.status(404).json({ success: false, message: '공간을 찾을 수 없습니다.' });
  }

  db.spaces[spaceIndex] = {
    ...db.spaces[spaceIndex],
    ...updates,
  };
  saveDatabase(db);

  res.json({ success: true, space: db.spaces[spaceIndex] });
});

// 4. Get Blocked Dates
app.get('/api/blocked-dates', (req, res) => {
  const db = getDatabase();
  res.json({ success: true, blockedDates: db.blockedDates });
});

// 5. Add Blocked Date (Admin)
app.post('/api/blocked-dates', (req, res) => {
  const { date, spaceId, reason, type } = req.body;
  if (!date || !reason) {
    return res.status(400).json({ success: false, message: '날짜와 사유를 입력해주세요.' });
  }

  const db = getDatabase();
  const newBlocked: DatabaseSchema['blockedDates'][0] = {
    id: `block-${Date.now()}`,
    date,
    spaceId: spaceId || 'all',
    reason,
    type: type || 'blocked',
    createdAt: new Date().toISOString(),
  };

  db.blockedDates.push(newBlocked);
  saveDatabase(db);

  res.json({ success: true, blockedDate: newBlocked });
});

// 6. Delete Blocked Date (Admin)
app.delete('/api/blocked-dates/:id', (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  db.blockedDates = db.blockedDates.filter((b) => b.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// 7. Get Reservations (with filtering)
app.get('/api/reservations', (req, res) => {
  const { spaceId, date, month, includeCancelled, search } = req.query;
  const db = getDatabase();

  let list = db.reservations;

  if (includeCancelled !== 'true') {
    list = list.filter((r) => r.status === 'confirmed');
  }

  if (spaceId && spaceId !== 'all') {
    list = list.filter((r) => r.spaceId === spaceId);
  }

  if (date) {
    list = list.filter((r) => r.date === date);
  }

  if (month) {
    // month format YYYY-MM
    list = list.filter((r) => r.date.startsWith(month as string));
  }

  if (search) {
    const q = (search as string).toLowerCase();
    list = list.filter(
      (r) =>
        r.userName.toLowerCase().includes(q) ||
        r.purpose.toLowerCase().includes(q) ||
        (r.department && r.department.toLowerCase().includes(q))
    );
  }

  // Sort by date ascending, then startTime ascending
  list.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startTime.localeCompare(b.startTime);
  });

  // Strip out passwordHash before sending to client for security
  const safeList = list.map(({ passwordHash, ...rest }) => rest);

  res.json({ success: true, reservations: safeList });
});

// 8. Check Conflict Endpoint
app.post('/api/reservations/check-conflict', (req, res) => {
  const { spaceId, date, startTime, endTime, excludeReservationId } = req.body;

  if (!spaceId || !date || !startTime || !endTime) {
    return res.status(400).json({ success: false, message: '필수 예약 정보가 누락되었습니다.' });
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
});

// 9. Create Reservation
app.post('/api/reservations', (req, res) => {
  const { spaceId, date, startTime, endTime, userName, purpose, department, phone, password } =
    req.body;

  if (!spaceId || !date || !startTime || !endTime || !userName || !purpose || !password) {
    return res.status(400).json({
      success: false,
      message: '모든 필수 항목(공간, 날짜, 시작/종료시간, 예약자명, 목적, 비밀번호)을 입력해주세요.',
    });
  }

  if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
    return res.status(400).json({
      success: false,
      message: '종료 시간은 시작 시간보다 늦어야 합니다.',
    });
  }

  const db = getDatabase();

  // Check space existence & hours
  const space = db.spaces.find((s) => s.id === spaceId);
  if (!space) {
    return res.status(404).json({ success: false, message: '존재하지 않는 공간입니다.' });
  }

  // Check operating hours
  if (
    timeToMinutes(startTime) < timeToMinutes(space.openTime) ||
    timeToMinutes(endTime) > timeToMinutes(space.closeTime)
  ) {
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
    id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    spaceId,
    spaceName: space.name,
    date,
    startTime,
    endTime,
    userName: userName.trim(),
    purpose: purpose.trim(),
    department: department?.trim() || undefined,
    phone: phone?.trim() || undefined,
    passwordHash: hashPassword(password),
    status: 'confirmed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.reservations.push(newReservation);
  saveDatabase(db);

  const { passwordHash, ...safeResponse } = newReservation;
  res.status(201).json({ success: true, reservation: safeResponse });
});

// 10. Verify Reservation Password
app.post('/api/reservations/:id/verify-password', (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ success: false, message: '비밀번호를 입력해주세요.' });
  }

  const db = getDatabase();
  const reservation = db.reservations.find((r) => r.id === id);

  if (!reservation) {
    return res.status(404).json({ success: false, message: '예약 정보를 찾을 수 없습니다.' });
  }

  const inputHash = hashPassword(password);
  const isMatch = reservation.passwordHash === inputHash;

  if (!isMatch) {
    return res.status(401).json({ success: false, message: '예약 비밀번호가 일치하지 않습니다.' });
  }

  res.json({ success: true, verified: true });
});

// 11. Update Reservation
app.put('/api/reservations/:id', (req, res) => {
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

  // Verify password unless admin override
  if (!isAdminOverride) {
    if (!password) {
      return res.status(400).json({ success: false, message: '예약 비밀번호를 입력해주세요.' });
    }
    if (existing.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ success: false, message: '예약 비밀번호가 일치하지 않습니다.' });
    }
  }

  const targetSpaceId = spaceId || existing.spaceId;
  const targetDate = date || existing.date;
  const targetStartTime = startTime || existing.startTime;
  const targetEndTime = endTime || existing.endTime;

  if (timeToMinutes(targetEndTime) <= timeToMinutes(targetStartTime)) {
    return res.status(400).json({
      success: false,
      message: '종료 시간은 시작 시간보다 늦어야 합니다.',
    });
  }

  const targetSpace = db.spaces.find((s) => s.id === targetSpaceId);
  if (!targetSpace) {
    return res.status(404).json({ success: false, message: '해당 공간을 찾을 수 없습니다.' });
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
    userName: userName ? userName.trim() : existing.userName,
    purpose: purpose ? purpose.trim() : existing.purpose,
    department: department !== undefined ? department.trim() : existing.department,
    phone: phone !== undefined ? phone.trim() : existing.phone,
    updatedAt: new Date().toISOString(),
  };

  db.reservations[resIndex] = updated;
  saveDatabase(db);

  const { passwordHash, ...safeResponse } = updated;
  res.json({ success: true, reservation: safeResponse });
});

// 12. Cancel Reservation
app.delete('/api/reservations/:id', (req, res) => {
  const { id } = req.params;
  const { password, cancelReason, isAdminOverride, permanent } = req.body || {};

  const db = getDatabase();
  const resIndex = db.reservations.findIndex((r) => r.id === id);

  if (resIndex === -1) {
    return res.status(404).json({ success: false, message: '예약 정보를 찾을 수 없습니다.' });
  }

  const existing = db.reservations[resIndex];

  // Verify password if not admin
  if (!isAdminOverride) {
    if (!password) {
      return res.status(400).json({ success: false, message: '예약 비밀번호를 입력해주세요.' });
    }
    if (existing.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ success: false, message: '예약 비밀번호가 일치하지 않습니다.' });
    }
  }

  if (permanent && isAdminOverride) {
    db.reservations.splice(resIndex, 1);
  } else {
    // Soft cancel to preserve audit history
    db.reservations[resIndex] = {
      ...existing,
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancelReason: cancelReason || '사용자 직접 취소',
      updatedAt: new Date().toISOString(),
    };
  }

  saveDatabase(db);
  res.json({ success: true, message: '예약이 정상적으로 취소되었습니다.' });
});

// 13. Admin Login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, message: '관리자 비밀번호를 입력해주세요.' });
  }

  const db = getDatabase();
  const inputHash = hashPassword(password);

  if (inputHash !== db.adminPasswordHash) {
    return res.status(401).json({ success: false, message: '관리자 비밀번호가 일치하지 않습니다.' });
  }

  res.json({ success: true, token: 'admin-authenticated-session' });
});

// 14. Admin Change Password
app.put('/api/admin/password', (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.' });
  }

  const db = getDatabase();
  if (hashPassword(currentPassword) !== db.adminPasswordHash) {
    return res.status(401).json({ success: false, message: '현재 관리자 비밀번호가 일치하지 않습니다.' });
  }

  if (newPassword.length < 4) {
    return res.status(400).json({ success: false, message: '새 비밀번호는 4자 이상이어야 합니다.' });
  }

  db.adminPasswordHash = hashPassword(newPassword);
  saveDatabase(db);

  res.json({ success: true, message: '관리자 비밀번호가 성공적으로 변경되었습니다.' });
});

// 15. Admin Stats
app.get('/api/stats', (req, res) => {
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
});

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
    console.log(`한양과학기술고등학교 예약 시스템 서버 가동 중: http://localhost:${PORT}`);
  });
}

startServer();
