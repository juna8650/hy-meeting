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

  // Check if selectedDate is Sunday or a registered Holiday
  const [y, m, d] = selectedDate.split('-').map(Number);
  const dayOfWeek = new Date(y, m - 1, d).getDay();
  const isHoliday = dayOfWeek === 0 || (blocked && blocked.type === 'holiday');
  const isSat = dayOfWeek === 6;

  return (
    <div className="space-y-4">
      {/* Day Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center bg-slate-100/80 p-1 rounded-2xl border border-slate-200 shrink-0">
            <button
              onClick={handlePrevDay}
              className="p-1.5 sm:p-2 text-slate-700 hover:text-slate-900 hover:bg-white rounded-xl transition-all active:scale-95"
              title="이전 날짜"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 h-5" />
            </button>
            <h3
              className={`text-xs sm:text-base md:text-lg font-bold px-2 sm:px-4 tracking-tight shrink-0 ${
                isHoliday
                  ? 'text-rose-600'
                  : isSat
                  ? 'text-blue-600'
                  : 'text-slate-900'
              }`}
            >
              {formatKoreanDate(selectedDate, true)}
              {blocked && blocked.type === 'holiday' && (
                <span className="ml-1.5 text-xs font-semibold px-2 py-0.5 bg-rose-50 text-rose-600 rounded-lg border border-rose-200">
                  {blocked.reason}
                </span>
              )}
            </h3>
            <button
              onClick={handleNextDay}
              className="p-1.5 sm:p-2 text-slate-700 hover:text-slate-900 hover:bg-white rounded-xl transition-all active:scale-95"
              title="다음 날짜"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 h-5" />
            </button>
          </div>

          {selectedDate !== todayStr && (
            <button
              onClick={() => onSelectDate(todayStr)}
              className="px-3 sm:px-4 py-1.5 sm:py-2.5 text-xs sm:text-base font-bold text-slate-900 bg-slate-100/80 hover:bg-white border border-slate-200 rounded-2xl transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs shrink-0"
            >
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
              오늘로 이동
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {(!blocked || blocked.type === 'holiday') && (
            <button
              id="day-view-book-btn"
              onClick={() => onOpenBookingModal(selectedDate)}
              className={`w-full sm:w-auto justify-center px-4 py-2.5 text-xs sm:text-sm font-bold text-white rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95 ${
                isMeeting
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
              }`}
            >
              <Plus className="w-4 h-4" />
              이 날짜에 신규 예약하기
            </button>
          )}
        </div>
      </div>

      {/* Blocked Date Alert */}
      {blocked && (
        blocked.type === 'holiday' ? (
          <div className="p-4 sm:p-5 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start sm:items-center gap-3.5 shadow-2xs">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0 mt-0.5 sm:mt-0">
              <Calendar className="w-4 h-4 sm:w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm">학교 휴일 / 공휴일({blocked.reason})입니다</h4>
              <p className="text-xs text-rose-600 mt-0.5 leading-relaxed font-normal">
                공휴일로 지정된 날이지만, 사용을 원하시는 교사분들은 정상적으로 예약을 신청하여 이용하실 수 있습니다.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 border border-slate-200 text-slate-800 flex items-start sm:items-center gap-3.5 shadow-2xs">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 mt-0.5 sm:mt-0">
              <Ban className="w-4 h-4 sm:w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm">예약이 차단된 일자입니다 (사용 불가)</h4>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed font-normal">
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
              className={`p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 transition-colors ${
                occupyingRes
                  ? isMeeting
                    ? 'bg-blue-50/30'
                    : 'bg-indigo-50/30'
                  : 'hover:bg-slate-50/80'
              }`}
            >
              {/* Time Interval Label */}
              <div className="flex items-center gap-2.5 sm:gap-3 sm:w-44 shrink-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100/90 border border-slate-200/70 flex items-center justify-center text-slate-500 shrink-0">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="flex items-baseline gap-2 sm:block">
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">
                    {startTime} ~ {endTime}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-slate-400 block font-normal">30분</span>
                </div>
              </div>

              {/* Status & Details */}
              <div className="flex-1 w-full min-w-0">
                {occupyingRes ? (
                  <div
                    onClick={() => onSelectReservation(occupyingRes)}
                    className={`p-2.5 sm:p-3 rounded-2xl border cursor-pointer transition-all shadow-2xs flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 ${
                      isMeeting
                        ? 'bg-white border-blue-200 hover:border-blue-400 hover:shadow-xs'
                        : 'bg-white border-indigo-200 hover:border-indigo-400 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap min-w-0 flex-1">
                      <span
                        className={`text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-lg border shrink-0 ${
                          isMeeting
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                        }`}
                      >
                        {occupyingRes.startTime} ~ {occupyingRes.endTime}
                      </span>
                      <span className="text-slate-300 hidden sm:inline">|</span>
                      <span className="text-xs sm:text-sm font-normal text-slate-700 truncate min-w-0">
                        {occupyingRes.purpose}
                      </span>
                      <span className="text-slate-300 hidden sm:inline">|</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs sm:text-sm font-normal text-slate-700">
                          {occupyingRes.userName} 교사
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-blue-600 hover:underline font-semibold shrink-0 ml-auto flex items-center gap-1">
                      상세/수정/취소 &rarr;
                    </span>
                  </div>
                ) : blocked && blocked.type === 'blocked' ? (
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5 py-1">
                    <Ban className="w-3.5 h-3.5 text-slate-400" />
                    예약 불가 ({blocked.reason})
                  </span>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
                      <span>예약 가능</span>
                      {blocked && blocked.type === 'holiday' && (
                        <span className="text-xs text-rose-600 font-semibold ml-1">({blocked.reason})</span>
                      )}
                    </span>
                    <button
                      onClick={() => onOpenBookingModal(selectedDate, startTime)}
                      className="text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-100/90 hover:bg-blue-50 px-3 py-1.5 rounded-xl border border-slate-200 transition-all flex items-center gap-1 active:scale-95 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>예약 신청</span>
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
