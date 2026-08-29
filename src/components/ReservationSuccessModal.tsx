import { useEffect, useRef } from 'react';
import { Reservation } from '../types';
import { formatKoreanDate } from '../utils/dateUtils';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Calendar,
  Clock,
  User,
  FileText,
  Building,
  ArrowRight,
  Edit3,
  Trash2,
  Lock,
} from 'lucide-react';

interface ReservationSuccessModalProps {
  isOpen: boolean;
  reservation: Reservation | null;
  onClose: () => void;
  onEdit: (reservation: Reservation) => void;
  onCancel: (reservation: Reservation) => void;
}

export default function ReservationSuccessModal({
  isOpen,
  reservation,
  onClose,
  onEdit,
  onCancel,
}: ReservationSuccessModalProps) {
  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 60,
          spread: 55,
          origin: { y: 0.55 },
        });
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen || !reservation) return null;

  return (
    <div
      id="success-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        id="success-modal-content"
        className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-900/10 w-full max-w-md overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Compact & Refined Header */}
        <div className="bg-slate-900 text-white py-5 px-6 text-center border-b border-slate-800 flex items-center justify-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            예약이 완료되었습니다
          </h3>
        </div>

        {/* Voucher Content */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="bg-slate-50/90 rounded-2xl border border-slate-200 divide-y divide-slate-200/80 shadow-2xs overflow-hidden text-base">
            {/* Space */}
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-slate-600 flex items-center gap-2 font-medium shrink-0">
                <Building className="w-4 h-4 text-slate-400 shrink-0" /> 예약 공간
              </span>
              <span className="font-bold text-slate-900 text-right">
                {reservation.spaceName}
              </span>
            </div>

            {/* Date */}
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-slate-600 flex items-center gap-2 font-medium shrink-0">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" /> 예약 날짜
              </span>
              <span className="font-bold text-slate-900 text-right">
                {formatKoreanDate(reservation.date, true)}
              </span>
            </div>

            {/* Time */}
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-slate-600 flex items-center gap-2 font-medium shrink-0">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" /> 예약 시간
              </span>
              <span className="font-bold text-slate-900 text-right">
                {reservation.startTime} ~ {reservation.endTime}
              </span>
            </div>

            {/* User */}
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-slate-600 flex items-center gap-2 font-medium shrink-0">
                <User className="w-4 h-4 text-slate-400 shrink-0" /> 예약자명
              </span>
              <span className="font-bold text-slate-900 text-right">
                {reservation.userName}
                {reservation.department ? ` (${reservation.department})` : ''}
              </span>
            </div>

            {/* Purpose */}
            <div className="flex items-start justify-between px-4 py-3.5 gap-3">
              <span className="text-slate-600 flex items-center gap-2 font-medium shrink-0 pt-0.5">
                <FileText className="w-4 h-4 text-slate-400 shrink-0" /> 사용 목적
              </span>
              <span className="font-bold text-slate-900 text-right leading-relaxed max-w-[65%] break-words">
                {reservation.purpose}
              </span>
            </div>
          </div>

          {/* Password Security Reminder */}
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-600 bg-slate-100/90 py-3 px-4 rounded-xl border border-slate-200/80 font-medium">
            <Lock className="w-4 h-4 text-slate-500 shrink-0" />
            <span>예약 수정 및 취소 시 등록하신 비밀번호가 사용됩니다.</span>
          </div>

          {/* Action Buttons with balanced typography and alignment */}
          <div className="space-y-2.5 pt-1">
            <button
              id="success-modal-return-cal-btn"
              onClick={onClose}
              className="w-full py-3.5 px-5 rounded-xl text-base sm:text-[17px] font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-sm shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>캘린더로 돌아가기</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                id="success-modal-edit-btn"
                onClick={() => {
                  onClose();
                  onEdit(reservation);
                }}
                className="py-3 px-4 rounded-xl text-base font-bold text-slate-700 bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-200/90 flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer"
              >
                <Edit3 className="w-4 h-4 text-slate-500" />
                <span>예약 수정</span>
              </button>

              <button
                id="success-modal-cancel-btn"
                onClick={() => {
                  onClose();
                  onCancel(reservation);
                }}
                className="py-3 px-4 rounded-xl text-base font-bold text-rose-700 bg-rose-50/80 hover:bg-rose-100/80 active:bg-rose-100 border border-rose-200/80 flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-500" />
                <span>예약 취소</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
