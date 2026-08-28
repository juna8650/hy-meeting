export type SpaceId = 'meeting-room' | 'audiovisual-room';

export type ReservationStatus = 'confirmed' | 'cancelled';

export interface Space {
  id: SpaceId;
  name: string;
  shortDescription: string;
  description: string;
  capacity: string;
  equipment: string[];
  openTime: string; // "08:30"
  closeTime: string; // "18:30"
  slotDurationMinutes: number; // 30
  location: string;
  themeColor: 'blue' | 'indigo' | 'emerald';
  icon: 'meeting' | 'projector';
}

export interface Reservation {
  id: string;
  spaceId: SpaceId;
  spaceName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (e.g. "09:00")
  endTime: string; // HH:mm (e.g. "10:30")
  userName: string; // 예약자명 (e.g. "김철수")
  purpose: string; // 사용 목적 (e.g. "교직원 정기 회의")
  department?: string; // 부서/담당 업무 (e.g. "교무기획부")
  phone?: string; // 연락처 (e.g. "010-1234-5678" or "내선 102")
  passwordHash: string; // SHA-256 hash of reservation password
  status: ReservationStatus; // 'confirmed' | 'cancelled'
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  cancelledAt?: string;
  cancelReason?: string;
}

export interface ReservationDetail {
  id: string;
  spaceId: SpaceId;
  spaceName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  department?: string; // 부서/담당 업무
  purpose?: string; // 사용 목적
  status: ReservationStatus;
  createdAt?: string;
  updatedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  // Note: userName, phone, passwordHash are omitted for privacy on public detail view
  // (Admin session may receive userName and phone)
  userName?: string;
  phone?: string;
}

export interface BlockedDate {
  id: string;
  date: string; // YYYY-MM-DD
  spaceId?: SpaceId | 'all'; // 'all' applies to all spaces
  reason: string; // e.g. "개교기념일", "방송설비 점검"
  type?: 'holiday' | 'blocked'; // 'holiday' (휴일) or 'blocked' (사용 불가일)
  createdAt: string;
}

export interface CreateReservationInput {
  spaceId: SpaceId;
  date: string;
  startTime: string;
  endTime: string;
  userName: string;
  purpose: string;
  department?: string;
  phone?: string;
  password: string; // raw password to be hashed
}

export interface UpdateReservationInput {
  spaceId?: SpaceId;
  date?: string;
  startTime?: string;
  endTime?: string;
  userName?: string;
  purpose?: string;
  department?: string;
  phone?: string;
  password?: string; // if user updating, required for verification
  isAdminOverride?: boolean;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictingReservation?: Reservation;
  message?: string;
}

export interface AdminStats {
  totalReservations: number;
  confirmedCount: number;
  cancelledCount: number;
  todayCount: number;
  meetingRoomCount: number;
  audiovisualRoomCount: number;
}
