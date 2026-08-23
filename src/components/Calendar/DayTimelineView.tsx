import { Space, Reservation, BlockedDate } from '../../types';
import {
  generateTimeSlots,
  isTimeOverlapping,
  formatKoreanDate,
} from '../../utils/dateUtils';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Ban,
  CheckCircle2,
  Calendar,
  User,
} from 'lucide-react';

interface DayTimelineViewProps {
  space: Space;
  reservations: Reservation[];
  blockedDates: BlockedDate[];
  selectedDate: string;
  todayStr: string;
  onSelectDate: (date: string) => void;
  onOpenBookingModal: (date: string, defaultStartTime?: string) => void;
  onSelectReservation: (res: Reservation) => void;
}

export default function DayTimelineView({
  space,
  reservations,
  blockedDates,
  selectedDate,
  todayStr,
  onSelectDate,
  onOpenBookingModal,
  onSelectReservation,
}: DayTimelineViewProps) {
  const timeSlots = generateTimeSlots(space.openTime, space.closeTime, 30);

  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d - 1);
    const yStr = date.getFullYear();
    const mStr = String(date.getMonth() + 1).padStart(2, '0');
    const dStr = String(date.getDate()).padStart(2, '0');
    onSelectDate(`${yStr}-${mStr}-${dStr}`);
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d + 1);
    const yStr = date.getFullYear();
    const mStr = String(date.getMonth() + 1).padStart(2, '0');
    const dStr = String(date.getDate()).padStart(2, '0');
    onSelectDate(`${yStr}-${mStr}-${dStr}`);
  };

  const blocked = blockedDates.find(
    (b) =>
      b.date === selectedDate && (b.spaceId === 'all' || b.spaceId === space.id)
  );

  const dayReservations = reservations.filter(
    (r) =>
      r.date === selectedDate &&
      r.spaceId === space.id &&
      r.status === 'confirmed'
  );

  const isMeeting = space.id === 'meeting-room';

  return (
    <div className="space-y-4">
      {/* Day Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center bg-slate-100/80 p-1 rounded-2xl border border-slate-200 shrink-0">
            <button
              onClick={handlePrevDay}
              className="p-2 text-slate-700 hover:text-slate-900 hover:bg-white rounded-xl transition-all active:scale-95"
              title="이전 날짜"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 px-4 tracking-tight shrink-0">
              {formatKoreanDate(selectedDate, true)}
            </h3>
            <button
              onClick={handleNextDay}
              className="p-2 text-slate-700 hover:text-slate-900 hover:bg-white rounded-xl transition-all active:scale-95"
              title="다음 날짜"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {selectedDate !== todayStr && (
            <button
              onClick={() => onSelectDate(todayStr)}
              className="px-4 py-2 sm:py-2.5 text-base sm:text-lg font-bold text-slate-900 bg-slate-100/80 hover:bg-white border border-slate-200 rounded-2xl transition-all flex items-center gap-2 active:scale-95 shadow-2xs shrink-0"
            >
              <Calendar className="w-4 h-4 sm:w-5 h-5 text-blue-600" />
              오늘로 이동
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">

          {(!blocked || blocked.type === 'holiday') && (
            <button
              id="day-view-book-btn"
              onClick={() => onOpenBookingModal(selectedDate)}
              className={`px-4 py-2 text-xs sm:text-sm font-bold text-white rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95 ${
                isMeeting
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
              }`}
            >
              <Plus className="w-4 h-4" />
              이 날짜에 예약하기
            </button>
          )}
        </div>
      </div>

      {/* Blocked Date Alert */}
      {blocked && (
        blocked.type === 'holiday' ? (
          <div className="p-5 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3.5 shadow-2xs">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm">학교 휴일 / 공휴일({blocked.reason})입니다</h4>
              <p className="text-xs text-rose-600 mt-0.5">
                공휴일로 지정된 날이지만, 사용을 원하시는 교사분들은 정상적으로 예약을 신청하여 이용하실 수 있습니다.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 text-slate-800 flex items-center gap-3.5 shadow-2xs">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm">예약이 차단된 일자입니다 (사용 불가)</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                사유: {blocked.reason} (관리자 설정에 의해 해당 일자는 선택하신 공간의 예약 신청이 제한됩니다.)
              </p>
            </div>
          </div>
        )
      )}

      {/* Timeline Slot List */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {timeSlots.slice(0, -1).map((startTime, idx) => {
          const endTime = timeSlots[idx + 1];

          // Check if slot is occupied by a confirmed reservation
          const occupyingRes = dayReservations.find((r) =>
            isTimeOverlapping(startTime, endTime, r.startTime, r.endTime)
          );

          return (
            <div
              key={startTime}
              className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                occupyingRes
                  ? isMeeting
                    ? 'bg-blue-50/30'
                    : 'bg-indigo-50/30'
                  : 'hover:bg-slate-50/80'
              }`}
            >
              {/* Time Interval Label */}
              <div className="flex items-center gap-3 w-44 shrink-0">
                <div className="w-9 h-9 rounded-xl bg-slate-100/90 border border-slate-200/70 flex items-center justify-center text-slate-500">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-sm">
                    {startTime} ~ {endTime}
                  </span>
                  <span className="text-[11px] text-slate-400 block font-medium">30분 단위</span>
                </div>
              </div>

              {/* Status & Details */}
              <div className="flex-1">
                {occupyingRes ? (
                  <div
                    onClick={() => onSelectReservation(occupyingRes)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all shadow-2xs ${
                      isMeeting
                        ? 'bg-white border-blue-200 hover:border-blue-400 hover:shadow-xs'
                        : 'bg-white border-indigo-200 hover:border-indigo-400 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                            isMeeting
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                          }`}
                        >
                          예약됨 ({occupyingRes.startTime}~{occupyingRes.endTime})
                        </span>
                        <span className="font-bold text-slate-900 text-sm">
                          {occupyingRes.userName} 교사
                        </span>
                        {occupyingRes.department && (
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                            {occupyingRes.department}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-blue-600 hover:underline font-bold">
                        상세/수정/취소 &rarr;
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium mt-1.5">
                      목적: {occupyingRes.purpose}
                    </p>
                  </div>
                ) : blocked && blocked.type === 'blocked' ? (
                  <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                    <Ban className="w-3.5 h-3.5 text-slate-400" />
                    예약 불가 ({blocked.reason})
                  </span>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      예약 가능 {blocked && blocked.type === 'holiday' && (
                        <span className="text-xs text-rose-600 font-bold ml-2">({blocked.reason})</span>
                      )}
                    </span>
                    <button
                      onClick={() => onOpenBookingModal(selectedDate, startTime)}
                      className="text-xs font-bold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-3.5 py-1.5 rounded-xl border border-slate-200 transition-all flex items-center gap-1 active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      이 시간에 예약
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
