import { useState, type FormEvent } from 'react';
import { Reservation, Space } from '../types';
import { formatKoreanDate } from '../utils/dateUtils';
import { api } from '../services/api';
import {
  X,
  Calendar,
  Clock,
  User,
  FileText,
  Building,
  Phone,
  Lock,
  Edit3,
  Trash2,
  ShieldAlert,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface ReservationDetailModalProps {
  isOpen: boolean;
  reservation: Reservation | null;
  spaces: Space[];
  isAdminLoggedIn: boolean;
  onClose: () => void;
  onOpenEdit: (reservation: Reservation, verifiedPassword?: string) => void;
  onOpenCancel: (reservation: Reservation, verifiedPassword?: string) => void;
}

export default function ReservationDetailModal({
  isOpen,
  reservation,
  spaces,
  isAdminLoggedIn,
  onClose,
  onOpenEdit,
  onOpenCancel,
}: ReservationDetailModalProps) {
  const [authMode, setAuthMode] = useState<'none' | 'edit' | 'cancel'>('none');
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !reservation) return null;

  const isCancelled = reservation.status === 'cancelled';

  const handleStartAuth = (mode: 'edit' | 'cancel') => {
    if (isAdminLoggedIn) {
      if (mode === 'edit') onOpenEdit(reservation, undefined);
      if (mode === 'cancel') onOpenCancel(reservation, undefined);
      return;
    }
    setAuthMode(mode);
    setPassword('');
    setErrorMessage('');
  };

  const handleVerifyPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMessage('예약 비밀번호를 입력해주세요.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');

    try {
      await api.verifyPassword(reservation.id, password.trim());
      const verifiedPw = password.trim();
      const targetMode = authMode;
      setAuthMode('none');
      setPassword('');

      if (targetMode === 'edit') {
        onOpenEdit(reservation, verifiedPw);
      } else if (targetMode === 'cancel') {
        onOpenCancel(reservation, verifiedPw);
      }
    } catch (err: any) {
      setErrorMessage(err.message || '예약 비밀번호가 일치하지 않습니다.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      id="detail-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="detail-modal-content"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-900/10 w-full max-w-lg overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 ring-1 ring-blue-400/30 flex items-center justify-center text-white font-bold shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-blue-300 font-bold uppercase tracking-wider block">
                Reservation Details
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight">예약 상세 정보</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-500">예약 상태</span>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                isCancelled
                  ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isCancelled ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
              />
              {isCancelled ? '취소된 예약' : '예약 확정됨'}
            </span>
          </div>

          {/* Details List */}
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Building className="w-4 h-4 text-slate-400" /> 공간
              </span>
              <span className="font-bold text-slate-900">
                {reservation.spaceName}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 text-slate-400" /> 날짜
              </span>
              <span className="font-bold text-slate-900">
                {formatKoreanDate(reservation.date, true)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-slate-400" /> 시간
              </span>
              <span className="font-bold text-slate-900">
                {reservation.startTime} ~ {reservation.endTime}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <User className="w-4 h-4 text-slate-400" /> 예약자
              </span>
              <span className="font-bold text-slate-900">
                {reservation.userName}
              </span>
            </div>

            {reservation.department && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Building className="w-4 h-4 text-slate-400" /> 부서
                </span>
                <span className="font-bold text-slate-900">{reservation.department}</span>
              </div>
            )}

            {/* Admin view extras */}
            {isAdminLoggedIn && reservation.phone && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Phone className="w-4 h-4 text-slate-400" /> 연락처
                </span>
                <span className="font-bold text-slate-900">
                  {reservation.phone}
                </span>
              </div>
            )}

            {/* Purpose */}
            <div className="pt-2">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium mb-1.5">
                <FileText className="w-4 h-4 text-slate-400" /> 사용 목적
              </span>
              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-slate-900 font-medium leading-relaxed shadow-2xs">
                {reservation.purpose}
              </div>
            </div>

            {isCancelled && reservation.cancelReason && (
              <div className="p-3.5 rounded-2xl bg-rose-50/90 border border-rose-200/80 text-rose-800 text-xs shadow-2xs">
                <span className="font-bold block mb-1">취소 사유:</span>
                <span className="font-medium leading-relaxed">{reservation.cancelReason}</span>
              </div>
            )}
          </div>

          {/* Password Authentication Sub-Form for Edit/Cancel */}
          {authMode !== 'none' && !isAdminLoggedIn && (
            <div className="bg-amber-50/70 rounded-2xl border border-amber-200/80 p-4 space-y-3 shadow-2xs animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-900">
                    예약 {authMode === 'edit' ? '수정' : '취소'}를 위해 예약 비밀번호를 입력해주세요.
                  </h4>
                  <p className="text-[11px] text-amber-700/90 mt-0.5 font-medium">
                    예약 시 등록한 4자리 이상 비밀번호입니다.
                  </p>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2 shadow-2xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="leading-tight">
                    <span className="block font-bold text-rose-900">비밀번호가 일치하지 않습니다.</span>
                    <span className="text-[11px] text-rose-700 font-normal">예약 시 입력한 비밀번호를 다시 확인해주세요.</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleVerifyPassword} className="flex gap-2">
                <input
                  id="detail-verify-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="예약 비밀번호 입력"
                  className={`flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 text-slate-900 shadow-2xs transition-all ${
                    errorMessage
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20'
                      : 'border-amber-300/80 focus:ring-amber-500/30 focus:border-amber-500'
                  }`}
                  autoFocus
                  required
                />
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  {isVerifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '확인'}
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('none')}
                  className="px-3 py-2.5 bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition-all"
                >
                  취소
                </button>
              </form>
            </div>
          )}

          {/* Action Buttons */}
          {!isCancelled && authMode === 'none' && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                id="detail-edit-trigger-btn"
                onClick={() => handleStartAuth('edit')}
                className="py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer"
              >
                <Edit3 className="w-4 h-4 text-slate-500" />
                <span>예약 수정</span>
              </button>

              <button
                id="detail-cancel-trigger-btn"
                onClick={() => handleStartAuth('cancel')}
                className="py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/80 flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-500" />
                <span>예약 취소</span>
              </button>
            </div>
          )}

          {isAdminLoggedIn && (
            <div className="pt-1 text-[11px] text-amber-800 bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 flex items-center gap-2 font-medium shadow-2xs">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>관리자 모드로 접속 중이므로 비밀번호 확인 없이 즉시 수정/강제 취소가 가능합니다.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
