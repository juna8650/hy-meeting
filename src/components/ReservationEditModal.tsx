import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Reservation, Space, SpaceId, ConflictCheckResult } from '../types';
import { generateTimeSlots, formatKoreanDate, timeToMinutes } from '../utils/dateUtils';
import { api } from '../services/api';
import CustomSelect from './CustomSelect';
import {
  X,
  Calendar,
  Clock,
  User,
  FileText,
  Building,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Edit3,
} from 'lucide-react';

interface ReservationEditModalProps {
  isOpen: boolean;
  reservation: Reservation | null;
  spaces: Space[];
  verifiedPassword?: string;
  isAdminLoggedIn: boolean;
  onClose: () => void;
  onSuccess: (updated: Reservation) => void;
}

export default function ReservationEditModal({
  isOpen,
  reservation,
  spaces,
  verifiedPassword,
  isAdminLoggedIn,
  onClose,
  onSuccess,
}: ReservationEditModalProps) {
  const [spaceId, setSpaceId] = useState<SpaceId>('meeting-room');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [userName, setUserName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');

  const [isCheckingConflict, setIsCheckingConflict] = useState(false);
  const [conflictResult, setConflictResult] = useState<ConflictCheckResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && reservation && (!wasOpenRef.current || reservation.id)) {
      setSpaceId(reservation.spaceId);
      setDate(reservation.date);
      setStartTime(reservation.startTime);
      setEndTime(reservation.endTime);
      setUserName(reservation.userName);
      setPurpose(reservation.purpose);
      setDepartment(reservation.department || '');
      setPassword(verifiedPassword || '');
      setErrorMessage('');
      setConflictResult(null);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, reservation?.id, verifiedPassword]);

  const activeSpace = spaces.find((s) => s.id === spaceId) || spaces[0];
  const timeSlots = generateTimeSlots(activeSpace?.openTime || '08:30', activeSpace?.closeTime || '18:30', 30);

  // Available end times (strictly greater than current start time)
  const availableEndTimes = timeSlots.filter(
    (t) => timeToMinutes(t) > timeToMinutes(startTime)
  );

  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    const startMin = timeToMinutes(newStart);
    const currentEndMin = timeToMinutes(endTime);

    if (currentEndMin <= startMin) {
      const closeMin = timeToMinutes(activeSpace?.closeTime || '18:30');
      const nextEndMin = Math.min(startMin + 60, closeMin);
      const endH = Math.floor(nextEndMin / 60);
      const endM = nextEndMin % 60;
      setEndTime(`${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`);
    }
  };

  // Check conflicts
  useEffect(() => {
    if (!isOpen || !reservation || !date || !startTime || !endTime) return;

    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      setConflictResult({
        hasConflict: true,
        message: '종료 시간은 시작 시간보다 늦어야 합니다.',
      });
      return;
    }

    let isMounted = true;
    const runCheck = async () => {
      setIsCheckingConflict(true);
      try {
        const res = await api.checkConflict({
          spaceId,
          date,
          startTime,
          endTime,
          excludeReservationId: reservation.id,
        });
        if (isMounted) setConflictResult(res);
      } catch {
        if (isMounted) setConflictResult(null);
      } finally {
        if (isMounted) setIsCheckingConflict(false);
      }
    };

    const timer = setTimeout(runCheck, 200);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [spaceId, date, startTime, endTime, isOpen, reservation]);

  if (!isOpen || !reservation) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!userName.trim()) {
      setErrorMessage('예약자명을 입력해주세요.');
      return;
    }
    if (!department.trim()) {
      setErrorMessage('과/부서를 입력해주세요.');
      return;
    }
    if (!purpose.trim()) {
      setErrorMessage('사용 목적을 입력해주세요.');
      return;
    }
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      setErrorMessage('종료 시간은 시작 시간보다 늦어야 합니다.');
      return;
    }
    if (!isAdminLoggedIn && !password.trim()) {
      setErrorMessage('예약 비밀번호를 입력해주세요.');
      return;
    }
    if (conflictResult?.hasConflict) {
      setErrorMessage(conflictResult.message || '해당 시간에 중복 예약이 있습니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const updated = await api.updateReservation(reservation.id, {
        spaceId,
        date,
        startTime,
        endTime,
        userName: userName.trim(),
        purpose: purpose.trim(),
        department: department.trim() || undefined,
        password: isAdminLoggedIn ? undefined : password.trim(),
        isAdminOverride: isAdminLoggedIn,
      });

      onSuccess(updated);
    } catch (err: any) {
      setErrorMessage(err.message || '예약 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="edit-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        id="edit-modal-content"
        className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-900/10 w-full max-w-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 ring-1 ring-blue-400/30 flex items-center justify-center text-white font-bold shadow-xs">
              <Edit3 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs sm:text-[13px] text-blue-300 font-bold uppercase tracking-wider block">
                Modify Reservation
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">예약 정보 수정</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-800 text-sm sm:text-base flex items-start gap-2.5 shadow-2xs">
              <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
              <div className="font-semibold">{errorMessage}</div>
            </div>
          )}

          {/* Space & Date (Mobile 1-col, Desktop 2-col) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className="block text-[15px] sm:text-base font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-blue-600" />
                <span>예약 공간</span>
              </label>
              <CustomSelect
                value={spaceId}
                onChange={(val) => setSpaceId(val as SpaceId)}
                options={spaces.map((s) => ({
                  value: s.id,
                  label:
                    s.id === 'meeting-room'
                      ? '회의실 (본관 2층)'
                      : s.id === 'audiovisual-room'
                      ? '시청각실 (본관 2층)'
                      : `${s.name} (${s.location})`,
                }))}
              />
            </div>

            <div>
              <label className="block text-[15px] sm:text-base font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>예약 날짜</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-base font-medium text-slate-900 bg-slate-50/60 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                required
              />
            </div>
          </div>

          {/* Time interval */}
          <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3.5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="text-[15px] sm:text-base font-semibold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>예약 시간</span>
                <span className="text-xs sm:text-sm font-normal text-slate-500">
                  (운영 {activeSpace.openTime} ~ {activeSpace.closeTime})
                </span>
              </label>
              {isCheckingConflict && (
                <span className="text-xs sm:text-sm text-slate-500 flex items-center gap-1 font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  중복 검사 중...
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <span className="text-xs sm:text-sm text-slate-600 block mb-1.5 font-semibold">시작 시간</span>
                <CustomSelect
                  value={startTime}
                  onChange={(val) => handleStartTimeChange(val)}
                  options={timeSlots.slice(0, -1).map((t) => ({ value: t, label: t }))}
                />
              </div>

              <div>
                <span className="text-xs sm:text-sm text-slate-600 block mb-1.5 font-semibold">종료 시간</span>
                <CustomSelect
                  value={endTime}
                  onChange={(val) => setEndTime(val)}
                  options={
                    availableEndTimes.length > 0
                      ? availableEndTimes.map((t) => ({ value: t, label: t }))
                      : timeSlots.slice(1).map((t) => ({ value: t, label: t }))
                  }
                />
              </div>
            </div>

            {/* Real-time Conflict Alert - Stable Container */}
            <div className="min-h-[46px] flex items-center">
              {conflictResult?.hasConflict ? (
                <div className="w-full p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm sm:text-[15px] font-medium flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{conflictResult.message}</span>
                </div>
              ) : isCheckingConflict ? (
                <div className="w-full p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-sm sm:text-[15px] font-medium flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>예약 가능 여부 확인 중...</span>
                </div>
              ) : conflictResult ? (
                <div className="w-full p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-sm sm:text-[15px] font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>선택하신 시간에 예약이 가능합니다.</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* User Name & Department (Mobile 1-col, Desktop 2-col) + Purpose */}
          <div className="space-y-4 sm:space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-[15px] sm:text-base font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>예약자명</span>
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="예: 이한양"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-base text-slate-900 placeholder:text-[15px] sm:placeholder:text-base bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[15px] sm:text-base font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-blue-600" />
                  <span>과/부서</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="예: 교무기획부"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-base text-slate-900 placeholder:text-[15px] sm:placeholder:text-base bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[15px] sm:text-base font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>사용 목적</span>
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="예: 교과협의회"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-base text-slate-900 placeholder:text-[15px] sm:placeholder:text-base bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                required
              />
            </div>
          </div>

          {!isAdminLoggedIn && !verifiedPassword && (
            <div>
              <label className="block text-[15px] sm:text-base font-semibold text-slate-800 mb-2">
                예약 비밀번호 확인
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="예약 시 설정한 비밀번호"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-base text-slate-900 placeholder:text-[15px] sm:placeholder:text-base bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                required
              />
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 text-base font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
            >
              닫기
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (conflictResult?.hasConflict ?? false)}
              className="px-7 py-3 rounded-xl text-base sm:text-[17px] font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>수정 중...</span>
                </>
              ) : (
                '수정 완료'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
