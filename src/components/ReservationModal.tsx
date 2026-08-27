import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Space, CreateReservationInput, ConflictCheckResult, BlockedDate } from '../types';
import {
  generateTimeSlots,
  formatKoreanDate,
  timeToMinutes,
} from '../utils/dateUtils';
import { api } from '../services/api';
import CustomSelect from './CustomSelect';
import {
  X,
  Calendar,
  Clock,
  User,
  FileText,
  Lock,
  Building,
  Phone,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Tv,
  DoorClosed,
} from 'lucide-react';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  space: Space;
  allSpaces: Space[];
  initialDate: string;
  initialStartTime?: string;
  blockedDates: BlockedDate[];
  onSuccess: (newReservation: any) => void;
}

export default function ReservationModal({
  isOpen,
  onClose,
  space,
  allSpaces,
  initialDate,
  initialStartTime,
  blockedDates,
  onSuccess,
}: ReservationModalProps) {
  const [selectedSpaceId, setSelectedSpaceId] = useState(space.id);
  const [date, setDate] = useState(initialDate);
  const [startTime, setStartTime] = useState(initialStartTime || '09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [userName, setUserName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isCheckingConflict, setIsCheckingConflict] = useState(false);
  const [conflictResult, setConflictResult] = useState<ConflictCheckResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const wasOpenRef = useRef(false);

  // Sync state only when modal transitions from closed to open
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setSelectedSpaceId(space.id);
      setDate(initialDate);
      const defaultStart = initialStartTime || '09:00';
      setStartTime(defaultStart);

      // Auto set endTime to 1 hour after start
      const startMin = timeToMinutes(defaultStart);
      const endMin = Math.min(startMin + 60, timeToMinutes(space.closeTime));
      const endH = Math.floor(endMin / 60);
      const endM = endMin % 60;
      setEndTime(`${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`);

      setUserName('');
      setPurpose('');
      setDepartment('');
      setPhone('');
      setPassword('');
      setConfirmPassword('');
      setErrorMessage('');
      setConflictResult(null);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, space.id, initialDate, initialStartTime, space.closeTime]);

  const activeSpace = allSpaces.find((s) => s.id === selectedSpaceId) || space;
  const timeSlots = generateTimeSlots(activeSpace.openTime, activeSpace.closeTime, 30);

  // Available end times (strictly greater than current start time)
  const availableEndTimes = timeSlots.filter(
    (t) => timeToMinutes(t) > timeToMinutes(startTime)
  );

  // Handle start time change with intelligent end time adjustment
  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    const startMin = timeToMinutes(newStart);
    const currentEndMin = timeToMinutes(endTime);

    if (currentEndMin <= startMin) {
      // Default to 1 hour after or the next available slot
      const closeMin = timeToMinutes(activeSpace.closeTime);
      const nextEndMin = Math.min(startMin + 60, closeMin);
      const endH = Math.floor(nextEndMin / 60);
      const endM = nextEndMin % 60;
      setEndTime(`${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`);
    }
  };

  // Check if current date is blocked for the selected space
  const currentBlockedDate = blockedDates.find(
    (b) =>
      b.date === date &&
      (b.spaceId === 'all' || b.spaceId === selectedSpaceId) &&
      b.type !== 'holiday'
  );

  // Check conflicts automatically when space, date, or times change
  useEffect(() => {
    if (!isOpen || !date || !startTime || !endTime) return;

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
        const result = await api.checkConflict({
          spaceId: selectedSpaceId,
          date,
          startTime,
          endTime,
        });
        if (isMounted) {
          setConflictResult(result);
        }
      } catch (err: any) {
        if (isMounted) {
          setConflictResult(null);
        }
      } finally {
        if (isMounted) setIsCheckingConflict(false);
      }
    };

    const timer = setTimeout(runCheck, 200);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [selectedSpaceId, date, startTime, endTime, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!userName.trim()) {
      setErrorMessage('예약자명을 입력해주세요.');
      return;
    }
    if (!purpose.trim()) {
      setErrorMessage('사용 목적을 입력해주세요.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('예약 비밀번호를 입력해주세요.');
      return;
    }
    if (password.trim().length < 4) {
      setErrorMessage('예약 비밀번호는 4자리 이상이어야 합니다.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('비밀번호가 일치하지 않습니다. 다시 확인해주세요.');
      return;
    }
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      setErrorMessage('종료 시간은 시작 시간보다 늦어야 합니다.');
      return;
    }
    if (conflictResult?.hasConflict) {
      setErrorMessage(conflictResult.message || '해당 시간에는 이미 예약이 있습니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const input: CreateReservationInput = {
        spaceId: selectedSpaceId,
        date,
        startTime,
        endTime,
        userName: userName.trim(),
        purpose: purpose.trim(),
        department: department.trim() || undefined,
        phone: phone.trim() || undefined,
        password: password.trim(),
      };

      const created = await api.createReservation(input);
      onSuccess(created);
    } catch (err: any) {
      setErrorMessage(err.message || '예약 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="reservation-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        id="reservation-modal-content"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-900/10 w-full max-w-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs ${
              activeSpace.id === 'meeting-room'
                ? 'bg-gradient-to-br from-blue-600 to-blue-700 ring-1 ring-blue-400/30'
                : 'bg-gradient-to-br from-indigo-600 to-indigo-700 ring-1 ring-indigo-400/30'
            }`}>
              {activeSpace.id === 'meeting-room' ? (
                <DoorClosed className="w-5 h-5" />
              ) : (
                <Tv className="w-5 h-5" />
              )}
            </div>
            <div>
              <span className="text-[11px] text-blue-300 font-bold uppercase tracking-wider block">
                {activeSpace.id === 'meeting-room' ? 'Meeting Room' : 'Audiovisual Hall'}
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {activeSpace.name} 예약 신청
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5 shadow-2xs">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <div className="font-semibold">{errorMessage}</div>
            </div>
          )}

          {/* Space & Date Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Space Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-600" />
                예약 공간 <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                id="modal-space-select"
                value={selectedSpaceId}
                onChange={(val) => setSelectedSpaceId(val as any)}
                options={allSpaces.map((s) => ({
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

            {/* Date Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                예약 날짜 <span className="text-rose-500">*</span>
              </label>
              <input
                id="modal-date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 bg-slate-50/60 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                required
              />
            </div>
          </div>

          {/* Time Interval Selection */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>예약 시간</span>
                <span className="text-[11px] font-normal text-slate-500">
                  (운영 {activeSpace.openTime} ~ {activeSpace.closeTime})
                </span>
                <span className="text-rose-500">*</span>
              </label>

              {isCheckingConflict && (
                <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                  <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                  중복 확인 중...
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-slate-500 block mb-1 font-semibold">시작 시간</span>
                <CustomSelect
                  id="modal-start-time-select"
                  value={startTime}
                  onChange={(val) => handleStartTimeChange(val)}
                  options={timeSlots.slice(0, -1).map((t) => ({ value: t, label: t }))}
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block mb-1 font-semibold">종료 시간</span>
                <CustomSelect
                  id="modal-end-time-select"
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

            {/* Blocked Date or Real-time Conflict Alert */}
            <div className="min-h-[42px] flex items-center">
              {currentBlockedDate ? (
                <div className="w-full p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>선택하신 날짜는 시설 점검({currentBlockedDate.reason})으로 예약이 제한됩니다.</span>
                </div>
              ) : conflictResult?.hasConflict ? (
                <div className="w-full p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{conflictResult.message}</span>
                </div>
              ) : isCheckingConflict ? (
                <div className="w-full p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs font-medium flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>예약 가능 여부 확인 중...</span>
                </div>
              ) : conflictResult ? (
                <div className="w-full p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>선택하신 시간에 예약이 가능합니다.</span>
                </div>
              ) : (
                <div className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-500 text-xs font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>예약 시간을 선택해주세요.</span>
                </div>
              )}
            </div>
          </div>

          {/* User Name & Purpose */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                예약자명 <span className="text-rose-500">*</span>
              </label>
              <input
                id="modal-username-input"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="예: 이한양"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                사용 목적 <span className="text-rose-500">*</span>
              </label>
              <input
                id="modal-purpose-input"
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="예: 교과협의회"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                required
              />
            </div>

            {/* Optional Dept & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  부서
                </label>
                <input
                  id="modal-dept-input"
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="예: 교무기획부"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  핸드폰 또는 교내 유선번호 (선택)
                </label>
                <input
                  id="modal-phone-input"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="예: 010-1234-5678"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="bg-amber-50/60 p-4.5 rounded-2xl border border-amber-200/70 space-y-3 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-900">
                  예약 비밀번호 설정 (4자리 이상) <span className="text-rose-500">*</span>
                </h4>
                <p className="text-[11px] text-amber-700/90 mt-0.5 leading-relaxed font-medium">
                  추후 본인의 예약을 직접 수정하거나 취소할 때 사용됩니다. 안전하게 암호화되어 보관됩니다.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <input
                  id="modal-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 (4자리 이상)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300/80 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 shadow-2xs transition-all"
                  required
                />
                {password.length > 0 && password.length < 4 && (
                  <p className="text-[11px] text-amber-700 font-medium mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    4자리 이상 입력해주세요 (현재 {password.length}자리)
                  </p>
                )}
              </div>

              <div>
                <input
                  id="modal-confirm-password-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호 재확인"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 shadow-2xs transition-all ${
                    confirmPassword.length > 0
                      ? password === confirmPassword
                        ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20 bg-emerald-50/20'
                        : 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20'
                      : 'border-amber-300/80 focus:ring-amber-500/30 focus:border-amber-500'
                  }`}
                  required
                />
                {confirmPassword.length > 0 && (
                  <div className="mt-1.5">
                    {password !== confirmPassword ? (
                      <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                        비밀번호가 일치하지 않습니다.
                      </p>
                    ) : (
                      <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                        비밀번호가 일치합니다.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
            >
              취소
            </button>
            <button
              id="submit-reservation-btn"
              type="submit"
              disabled={isSubmitting || (conflictResult?.hasConflict ?? false)}
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  예약 처리 중...
                </>
              ) : (
                '예약 신청'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
