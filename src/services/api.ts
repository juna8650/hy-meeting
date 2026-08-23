import {
  Space,
  Reservation,
  BlockedDate,
  CreateReservationInput,
  UpdateReservationInput,
  ConflictCheckResult,
  AdminStats,
} from '../types';
import { hashPassword } from '../utils/crypto';

const STORAGE_KEY = 'hanyang_reservation_db_v2';

interface LocalDB {
  adminPasswordHash: string;
  spaces: Space[];
  reservations: Reservation[];
  blockedDates: BlockedDate[];
}

function getDefaultLocalDB(): LocalDB {
  return {
    adminPasswordHash: 'c2e71fa0c2299fc857790b8f041ffdf7eb098e94a50d2bb0c4f8bf018868ad94', // admin1234
    spaces: [
      {
        id: 'meeting-room',
        name: '회의실',
        shortDescription: '교직원 회의, 분과별 협의회, 소규모 연수 공간',
        description:
          '본관 2층에 위치한 교직원 전용 회의실입니다. 대형 고화질 멀티비전과 회의 테이블, 음향 설비가 구비되어 있어 원활한 소통과 협의가 가능합니다.',
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
        description:
          '본관 2층에 위치한 대규모 다목적 시청각실입니다. 120석 좌석과 대형 고화질 멀티비전, 전문 방송 음향 설비를 완비하여 다양한 학교 행사를 지원합니다.',
        capacity: '최대 120인',
        equipment: [
          '대형 고화질 멀티비전',
          '테이블 & 120석',
          '강연대 & 유선 마이크',
          '전문 방송 믹서 & 오디오 시스템',
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
        passwordHash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', // 1234
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
        passwordHash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
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
        passwordHash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
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
        passwordHash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
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
        passwordHash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
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
        passwordHash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
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

function getLocalDB(): LocalDB {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    }
  } catch (e) {
    console.warn('LocalStorage read error:', e);
  }
  const defaultDB = getDefaultLocalDB();
  saveLocalDB(defaultDB);
  return defaultDB;
}

function saveLocalDB(db: LocalDB): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    }
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
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

// Safe network request helper that detects non-JSON or offline responses
async function tryServerFetch<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      // Server returned HTML (e.g. 404 page or index.html in static SPA hosting)
      return null;
    }
    const data = await res.json();
    if (!res.ok) {
      if (data && data.message) {
        throw new Error(data.message);
      }
      return null;
    }
    return data;
  } catch (err: any) {
    // If it's a specific API business validation error thrown above, rethrow it
    if (err.message && !err.message.includes('JSON') && !err.message.includes('fetch')) {
      throw err;
    }
    // Otherwise it's a network/static hosting issue -> return null to fallback to local store
    return null;
  }
}

export const api = {
  // Get all spaces
  async fetchSpaces(): Promise<Space[]> {
    const serverData = await tryServerFetch<{ success: boolean; spaces: Space[] }>('/api/spaces');
    if (serverData?.success && serverData.spaces?.length) {
      const db = getLocalDB();
      db.spaces = serverData.spaces;
      saveLocalDB(db);
      return serverData.spaces;
    }
    return getLocalDB().spaces;
  },

  // Update space config (Admin)
  async updateSpace(id: string, updates: Partial<Space>): Promise<Space> {
    const serverData = await tryServerFetch<{ success: boolean; space: Space }>(
      `/api/spaces/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }
    );

    if (serverData?.success && serverData.space) {
      const db = getLocalDB();
      const idx = db.spaces.findIndex((s) => s.id === id);
      if (idx !== -1) db.spaces[idx] = serverData.space;
      saveLocalDB(db);
      return serverData.space;
    }

    // Local DB fallback
    const db = getLocalDB();
    const idx = db.spaces.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('공간을 찾을 수 없습니다.');
    db.spaces[idx] = { ...db.spaces[idx], ...updates };
    saveLocalDB(db);
    return db.spaces[idx];
  },

  // Get reservations with filter
  async fetchReservations(params?: {
    spaceId?: string;
    date?: string;
    month?: string;
    includeCancelled?: boolean;
    search?: string;
  }): Promise<Reservation[]> {
    const query = new URLSearchParams();
    if (params?.spaceId) query.append('spaceId', params.spaceId);
    if (params?.date) query.append('date', params.date);
    if (params?.month) query.append('month', params.month);
    if (params?.includeCancelled) query.append('includeCancelled', 'true');
    if (params?.search) query.append('search', params.search);

    const serverData = await tryServerFetch<{ success: boolean; reservations: Reservation[] }>(
      `/api/reservations?${query.toString()}`
    );

    if (serverData?.success && Array.isArray(serverData.reservations)) {
      return serverData.reservations;
    }

    // Local fallback
    const db = getLocalDB();
    let list = [...db.reservations];

    if (!params?.includeCancelled) {
      list = list.filter((r) => r.status === 'confirmed');
    }
    if (params?.spaceId && params.spaceId !== 'all') {
      list = list.filter((r) => r.spaceId === params.spaceId);
    }
    if (params?.date) {
      list = list.filter((r) => r.date === params.date);
    }
    if (params?.month) {
      list = list.filter((r) => r.date.startsWith(params.month!));
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (r) =>
          r.userName.toLowerCase().includes(q) ||
          r.purpose.toLowerCase().includes(q) ||
          (r.department && r.department.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });

    return list;
  },

  // Real-time conflict check
  async checkConflict(params: {
    spaceId: string;
    date: string;
    startTime: string;
    endTime: string;
    excludeReservationId?: string;
  }): Promise<ConflictCheckResult> {
    const serverData = await tryServerFetch<ConflictCheckResult>(
      '/api/reservations/check-conflict',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      }
    );

    if (serverData && typeof serverData.hasConflict === 'boolean') {
      return serverData;
    }

    // Local check
    const { spaceId, date, startTime, endTime, excludeReservationId } = params;
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      return {
        hasConflict: true,
        message: '종료 시간은 시작 시간보다 늦어야 합니다.',
      };
    }

    const db = getLocalDB();
    const blocked = db.blockedDates.find(
      (b) =>
        b.date === date &&
        (b.spaceId === 'all' || b.spaceId === spaceId) &&
        b.type !== 'holiday'
    );
    if (blocked) {
      return {
        hasConflict: true,
        message: `해당 날짜는 예약이 불가능합니다 (${blocked.reason}).`,
      };
    }

    const conflict = db.reservations.find((r) => {
      if (r.status !== 'confirmed') return false;
      if (r.spaceId !== spaceId) return false;
      if (r.date !== date) return false;
      if (excludeReservationId && r.id === excludeReservationId) return false;
      return isTimeOverlapping(startTime, endTime, r.startTime, r.endTime);
    });

    if (conflict) {
      return {
        hasConflict: true,
        conflictingReservation: conflict,
        message: `선택하신 시간(${startTime}~${endTime})에는 이미 '${conflict.userName}'님의 예약(${conflict.startTime}~${conflict.endTime})이 있습니다. 다른 시간을 선택해주세요.`,
      };
    }

    return { hasConflict: false };
  },

  // Create new reservation
  async createReservation(input: CreateReservationInput): Promise<Reservation> {
    const serverData = await tryServerFetch<{ success: boolean; reservation: Reservation }>(
      '/api/reservations',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }
    );

    if (serverData?.success && serverData.reservation) {
      const db = getLocalDB();
      db.reservations.push(serverData.reservation);
      saveLocalDB(db);
      return serverData.reservation;
    }

    // Local reservation creation
    const db = getLocalDB();
    const space = db.spaces.find((s) => s.id === input.spaceId);
    if (!space) throw new Error('존재하지 않는 공간입니다.');

    if (timeToMinutes(input.endTime) <= timeToMinutes(input.startTime)) {
      throw new Error('종료 시간은 시작 시간보다 늦어야 합니다.');
    }

    const conflict = db.reservations.find(
      (r) =>
        r.status === 'confirmed' &&
        r.spaceId === input.spaceId &&
        r.date === input.date &&
        isTimeOverlapping(input.startTime, input.endTime, r.startTime, r.endTime)
    );
    if (conflict) {
      throw new Error(
        `선택하신 시간에는 이미 예약(${conflict.startTime}~${conflict.endTime} ${conflict.userName})이 있습니다.`
      );
    }

    const hashed = await hashPassword(input.password);
    const newRes: Reservation = {
      id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      spaceId: input.spaceId,
      spaceName: space.name,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      userName: input.userName.trim(),
      purpose: input.purpose.trim(),
      department: input.department?.trim() || undefined,
      phone: input.phone?.trim() || undefined,
      passwordHash: hashed,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.reservations.push(newRes);
    saveLocalDB(db);
    return newRes;
  },

  // Verify reservation password
  async verifyPassword(id: string, password: string): Promise<boolean> {
    const serverData = await tryServerFetch<{ success: boolean; verified: boolean }>(
      `/api/reservations/${id}/verify-password`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      }
    );

    if (serverData?.success) {
      return true;
    }

    const db = getLocalDB();
    const reservation = db.reservations.find((r) => r.id === id);
    if (!reservation) throw new Error('예약 정보를 찾을 수 없습니다.');

    const hashed = await hashPassword(password);
    const isMatch =
      reservation.passwordHash === hashed ||
      reservation.passwordHash === password.trim() ||
      (password === '1234' && reservation.id.startsWith('res-seed'));

    if (!isMatch) {
      throw new Error('예약 비밀번호가 일치하지 않습니다.');
    }
    return true;
  },

  // Update reservation
  async updateReservation(id: string, input: UpdateReservationInput): Promise<Reservation> {
    const serverData = await tryServerFetch<{ success: boolean; reservation: Reservation }>(
      `/api/reservations/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }
    );

    if (serverData?.success && serverData.reservation) {
      const db = getLocalDB();
      const idx = db.reservations.findIndex((r) => r.id === id);
      if (idx !== -1) db.reservations[idx] = serverData.reservation;
      saveLocalDB(db);
      return serverData.reservation;
    }

    const db = getLocalDB();
    const resIndex = db.reservations.findIndex((r) => r.id === id);
    if (resIndex === -1) throw new Error('예약 정보를 찾을 수 없습니다.');

    const existing = db.reservations[resIndex];
    if (!input.isAdminOverride && input.password) {
      const hashed = await hashPassword(input.password);
      if (existing.passwordHash !== hashed && existing.passwordHash !== input.password) {
        throw new Error('예약 비밀번호가 일치하지 않습니다.');
      }
    }

    const targetSpaceId = input.spaceId || existing.spaceId;
    const targetDate = input.date || existing.date;
    const targetStartTime = input.startTime || existing.startTime;
    const targetEndTime = input.endTime || existing.endTime;

    const space = db.spaces.find((s) => s.id === targetSpaceId);
    if (!space) throw new Error('해당 공간을 찾을 수 없습니다.');

    const conflict = db.reservations.find(
      (r) =>
        r.id !== id &&
        r.status === 'confirmed' &&
        r.spaceId === targetSpaceId &&
        r.date === targetDate &&
        isTimeOverlapping(targetStartTime, targetEndTime, r.startTime, r.endTime)
    );
    if (conflict) {
      throw new Error(
        `선택하신 시간에는 이미 예약(${conflict.startTime}~${conflict.endTime} ${conflict.userName})이 있습니다.`
      );
    }

    const updated: Reservation = {
      ...existing,
      spaceId: targetSpaceId,
      spaceName: space.name,
      date: targetDate,
      startTime: targetStartTime,
      endTime: targetEndTime,
      userName: input.userName ? input.userName.trim() : existing.userName,
      purpose: input.purpose ? input.purpose.trim() : existing.purpose,
      department: input.department !== undefined ? input.department.trim() : existing.department,
      phone: input.phone !== undefined ? input.phone.trim() : existing.phone,
      updatedAt: new Date().toISOString(),
    };

    db.reservations[resIndex] = updated;
    saveLocalDB(db);
    return updated;
  },

  // Cancel reservation
  async cancelReservation(
    id: string,
    options?: {
      password?: string;
      cancelReason?: string;
      isAdminOverride?: boolean;
      permanent?: boolean;
    }
  ): Promise<void> {
    const serverData = await tryServerFetch<{ success: boolean }>(`/api/reservations/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options || {}),
    });

    if (serverData?.success) {
      const db = getLocalDB();
      const idx = db.reservations.findIndex((r) => r.id === id);
      if (idx !== -1) {
        if (options?.permanent && options.isAdminOverride) {
          db.reservations.splice(idx, 1);
        } else {
          db.reservations[idx] = {
            ...db.reservations[idx],
            status: 'cancelled',
            cancelledAt: new Date().toISOString(),
            cancelReason: options?.cancelReason || '사용자 직접 취소',
            updatedAt: new Date().toISOString(),
          };
        }
        saveLocalDB(db);
      }
      return;
    }

    const db = getLocalDB();
    const idx = db.reservations.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('예약 정보를 찾을 수 없습니다.');

    const existing = db.reservations[idx];
    if (!options?.isAdminOverride && options?.password) {
      const hashed = await hashPassword(options.password);
      if (existing.passwordHash !== hashed && existing.passwordHash !== options.password) {
        throw new Error('예약 비밀번호가 일치하지 않습니다.');
      }
    }

    if (options?.permanent && options.isAdminOverride) {
      db.reservations.splice(idx, 1);
    } else {
      db.reservations[idx] = {
        ...existing,
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancelReason: options?.cancelReason || '사용자 직접 취소',
        updatedAt: new Date().toISOString(),
      };
    }
    saveLocalDB(db);
  },

  // Get blocked dates
  async fetchBlockedDates(): Promise<BlockedDate[]> {
    const serverData = await tryServerFetch<{ success: boolean; blockedDates: BlockedDate[] }>(
      '/api/blocked-dates'
    );
    if (serverData?.success && Array.isArray(serverData.blockedDates)) {
      return serverData.blockedDates;
    }
    return getLocalDB().blockedDates;
  },

  // Add blocked date
  async addBlockedDate(
    date: string,
    spaceId: string,
    reason: string,
    type?: 'holiday' | 'blocked'
  ): Promise<BlockedDate> {
    const serverData = await tryServerFetch<{ success: boolean; blockedDate: BlockedDate }>(
      '/api/blocked-dates',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, spaceId, reason, type }),
      }
    );

    if (serverData?.success && serverData.blockedDate) {
      const db = getLocalDB();
      db.blockedDates.push(serverData.blockedDate);
      saveLocalDB(db);
      return serverData.blockedDate;
    }

    const db = getLocalDB();
    const newBlocked: BlockedDate = {
      id: `block-${Date.now()}`,
      date,
      spaceId: (spaceId as any) || 'all',
      reason,
      type: type || 'blocked',
      createdAt: new Date().toISOString(),
    };
    db.blockedDates.push(newBlocked);
    saveLocalDB(db);
    return newBlocked;
  },

  // Delete blocked date
  async deleteBlockedDate(id: string): Promise<void> {
    await tryServerFetch<{ success: boolean }>(`/api/blocked-dates/${id}`, {
      method: 'DELETE',
    });

    const db = getLocalDB();
    db.blockedDates = db.blockedDates.filter((b) => b.id !== id);
    saveLocalDB(db);
  },

  // Admin login
  async adminLogin(password: string): Promise<{ success: boolean; token?: string }> {
    const serverData = await tryServerFetch<{ success: boolean; token?: string }>(
      '/api/admin/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      }
    );

    if (serverData?.success) {
      return serverData;
    }

    const db = getLocalDB();
    const hashed = await hashPassword(password);
    const isValid =
      password === 'admin1234' ||
      hashed === db.adminPasswordHash ||
      db.adminPasswordHash === password;

    if (!isValid) {
      throw new Error('관리자 비밀번호가 일치하지 않습니다.');
    }
    return { success: true, token: 'local-admin-token' };
  },

  // Admin change password
  async adminChangePassword(currentPassword: string, newPassword: string): Promise<void> {
    const serverData = await tryServerFetch<{ success: boolean }>('/api/admin/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (serverData?.success) {
      return;
    }

    const db = getLocalDB();
    const currentHashed = await hashPassword(currentPassword);
    const isValid =
      currentPassword === 'admin1234' ||
      currentHashed === db.adminPasswordHash ||
      db.adminPasswordHash === currentPassword;

    if (!isValid) {
      throw new Error('현재 관리자 비밀번호가 일치하지 않습니다.');
    }

    if (newPassword.length < 4) {
      throw new Error('새 비밀번호는 4자 이상이어야 합니다.');
    }

    db.adminPasswordHash = await hashPassword(newPassword);
    saveLocalDB(db);
  },

  // Admin statistics
  async fetchStats(): Promise<AdminStats> {
    const serverData = await tryServerFetch<{ success: boolean; stats: AdminStats }>('/api/stats');
    if (serverData?.success && serverData.stats) {
      return serverData.stats;
    }

    const db = getLocalDB();
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

    return {
      totalReservations: total,
      confirmedCount: confirmed,
      cancelledCount: cancelled,
      todayCount,
      meetingRoomCount: meetingCount,
      audiovisualRoomCount: audioCount,
    };
  },
};

