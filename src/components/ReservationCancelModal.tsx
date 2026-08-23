import { useState, type FormEvent } from 'react';
import { Reservation } from '../types';
import { formatKoreanDate } from '../utils/dateUtils';
import { api } from '../services/api';
import {
  X,
  Trash2,
  Calendar,
  Clock,
  User,
  Building,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface ReservationCancelModalProps {
  isOpen: boolean;
  reservation: Reservation | null;
  verifiedPassword?: string;
  isAdminLoggedIn: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReservationCancelModal({
  isOpen,
  reservation,
  verifiedPassword,
  isAdminLoggedIn,
  onClose,
  onSuccess,
}: ReservationCancelModalProps) {
  const [password, setPassword] = useState(verifiedPassword || '');
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !reservation) return null;

  const handleCancel = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isAdminLoggedIn && !verifiedPassword && !password.trim()) {
      setErrorMessage('예약 비밀번호를 입력해주세요.');
      return;
    }

    setIsCancelling(true);

    try {
      await api.cancelReservation(reservation.id, {
        password: isAdminLoggedIn ? undefined : verifiedPassword || password.trim(),
        cancelReason: cancelReason.trim() || undefined,
        isAdminOverride: isAdminLoggedIn,
      });

      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || '예약 취소 중 오류가 발생했습니다.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div
      id="cancel-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="cancel-modal-content"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-900/10 w-full max-w-md overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-rose-600 text-white p-6 flex items-center justify-between border-b border-rose-700">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/20 ring-1 ring-white/30 flex items-center justify-center text-white font-bold shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-rose-100 font-bold uppercase tracking-wider block">
                Cancel Reservation
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight">예약 취소 확인</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-rose-200 hover:text-white hover:bg-rose-700/80 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleCancel} className="p-6 sm:p-8 space-y-5">
          <p className="text-slate-800 text-sm font-semibold leading-relaxed">
            정말 이 예약을 취소하시겠습니까? 취소 후에는 다른 교직원이 해당 시간을 예약할 수 있습니다.
          </p>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold shadow-2xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Reservation Summary */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4.5 space-y-2.5 text-xs shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">공간</span>
              <span className="font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200/60 shadow-2xs">{reservation.spaceName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">일시</span>
              <span className="font-bold text-slate-900">
                {formatKoreanDate(reservation.date, true)} {reservation.startTime}~{reservation.endTime}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">예약자</span>
              <span className="font-bold text-slate-900">{reservation.userName}</span>
            </div>
            <div className="flex flex-col gap-1 pt-1">
              <span className="text-slate-500 font-medium">목적</span>
              <span className="text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200/70 font-medium leading-relaxed shadow-2xs">
                {reservation.purpose}
              </span>
            </div>
          </div>

          {/* Optional reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              취소 사유 (선택)
            </label>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="예: 회의 일정 변경, 행사 연기"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
            />
          </div>

          {!isAdminLoggedIn && !verifiedPassword && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                예약 비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="예약 비밀번호 입력"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-900 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errorMessage
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-200 focus:ring-rose-500/20 focus:border-rose-500'
                }`}
                required
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
            >
              돌아가기
            </button>
            <button
              type="submit"
              disabled={isCancelling}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 flex items-center gap-1.5 shadow-sm shadow-rose-500/20 transition-all cursor-pointer"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  취소 처리 중...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  예약 취소 확정
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
