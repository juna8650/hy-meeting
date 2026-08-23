import {
  Space,
  Reservation,
  BlockedDate,
  CreateReservationInput,
  UpdateReservationInput,
  ConflictCheckResult,
  AdminStats,
} from '../types';

export const api = {
  // Get all spaces
  async fetchSpaces(): Promise<Space[]> {
    const res = await fetch('/api/spaces');
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || '공간 목록을 불러오는데 실패했습니다.');
    }
    return data.spaces;
  },

  // Update space config (Admin)
  async updateSpace(id: string, updates: Partial<Space>): Promise<Space> {
    const res = await fetch(`/api/spaces/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || '공간 설정 저장에 실패했습니다.');
    }
    return data.space;
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

    const res = await fetch(`/api/reservations?${query.toString()}`);
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || '예약 목록을 불러오는데 실패했습니다.');
    }
    return data.reservations;
  },

  // Real-time conflict check
  async checkConflict(params: {
    spaceId: string;
    date: string;
    startTime: string;
    endTime: string;
    excludeReservationId?: string;
  }): Promise<ConflictCheckResult> {
    const res = await fetch('/api/reservations/check-conflict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    return data;
  },

  // Create new reservation
  async createReservation(input: CreateReservationInput): Promise<Reservation> {
    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || '예약 등록에 실패했습니다.');
    }
    return data.reservation;
  },

  // Verify reservation password
  async verifyPassword(id: string, password: string): Promise<boolean> {
    const res = await fetch(`/api/reservations/${id}/verify-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || '예약 비밀번호가 일치하지 않습니다.');
    }
    return true;
  },

  // Update reservation
  async updateReservation(id: string, input: UpdateReservationInput): Promise<Reservation> {
    const res = await fetch(`/api/reservations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || '예약 수정에 실패했습니다.');
    }
    return data.reservation;
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
    const res = await fetch(`/api/reservations/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options || {}),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || '예약 취소에 실패했습니다.');
    }
  },

  // Get blocked dates
  async fetchBlockedDates(): Promise<BlockedDate[]> {
    const res = await fetch('/api/blocked-dates');
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || '휴일/사용 불가일 목록을 불러오지 못했습니다.');
    }
    return data.blockedDates;
  },

  // Add blocked date
  async addBlockedDate(date: string, spaceId: string, reason: string, type?: 'holiday' | 'blocked'): Promise<BlockedDate> {
    const res = await fetch('/api/blocked-dates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, spaceId, reason, type }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || '휴일 등록에 실패했습니다.');
    }
    return data.blockedDate;
  },

  // Delete blocked date
  async deleteBlockedDate(id: string): Promise<void> {
    const res = await fetch(`/api/blocked-dates/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || '휴일 삭제에 실패했습니다.');
    }
  },

  // Admin login
  async adminLogin(password: string): Promise<{ success: boolean; token?: string }> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || '관리자 비밀번호가 일치하지 않습니다.');
    }
    return data;
  },

  // Admin change password
  async adminChangePassword(currentPassword: string, newPassword: string): Promise<void> {
    const res = await fetch('/api/admin/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || '비밀번호 변경에 실패했습니다.');
    }
  },

  // Admin statistics
  async fetchStats(): Promise<AdminStats> {
    const res = await fetch('/api/stats');
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || '통계를 불러오는데 실패했습니다.');
    }
    return data.stats;
  },
};
