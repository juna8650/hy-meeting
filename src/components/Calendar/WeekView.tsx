import { Space, Reservation, BlockedDate } from '../../types';
import {
  getWeekDays,
  generateTimeSlots,
  timeToMinutes,
  isTimeOverlapping,
  formatKoreanDate,
} from '../../utils/dateUtils';
import { ChevronLeft, ChevronRight, Plus, Ban, Clock, Calendar } from 'lucide-react';

interface WeekViewProps {
  space: Space;
  reservations: Reservation[];
  blockedDates: BlockedDate[];
  selectedDate: string;
  todayStr: string;
  onSelectDate: (date: string) => void;
  onOpenBookingModal: (date: string, defaultStartTime?: string) => void;
  onSelectReservation: (res: Reservation) => void;
}

export default function WeekView({
  space,
  reservations,
  blockedDates,
  selectedDate,
  todayStr,
  onSelectDate,
  onOpenBookingModal,
  onSelectReservation,
}: WeekViewProps) {
  const weekDays = getWeekDays(selectedDate, todayStr);
  const timeSlots = generateTimeSlots(space.openTime, space.closeTime, 30);

  const handlePrevWeek = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d - 7);
    const yStr = date.getFullYear();
    const mStr = String(date.getMonth() + 1).padStart(2, '0');
    const dStr = String(date.getDate()).padStart(2, '0');
    onSelectDate(`${yStr}-${mStr}-${dStr}`);
  };

  const handleNextWeek = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d + 7);
    const yStr = date.getFullYear();
    const mStr = String(date.getMonth() + 1).padStart(2, '0');
    const dStr = String(date.getDate()).padStart(2, '0');
    onSelectDate(`${yStr}-${mStr}-${dStr}`);
  };

  const isMeeting = space.id === 'meeting-room';

  return (
    <div className="space-y-4">
      {/* Week Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center bg-slate-100/80 p-1 rounded-2xl border border-slate-200 shrink-0">
            <button
              onClick={handlePrevWeek}
              className="p-1.5 sm:p-2 text-slate-700 hover:text-slate-900 hover:bg-white rounded-xl transition-all active:scale-95"
              title="이전 주"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 h-5" />
            </button>
            <span className="font-bold text-slate-900 text-xs sm:text-base px-2 sm:px-4 tracking-tight shrink-0">
              {weekDays[0]?.date} ~ {weekDays[6]?.date}
            </span>
            <button
              onClick={handleNextWeek}
              className="p-1.5 sm:p-2 text-slate-700 hover:text-slate-900 hover:bg-white rounded-xl transition-all active:scale-95"
              title="다음 주"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => onSelectDate(todayStr)}
            className="px-3 sm:px-4 py-1.5 sm:py-2.5 text-xs sm:text-base font-bold text-slate-900 bg-slate-100/80 hover:bg-white border border-slate-200 rounded-2xl transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs shrink-0"
          >
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
            이번 주
          </button>
        </div>
      </div>

      {/* Mobile Scroll Guide */}
      <div className="sm:hidden flex items-center justify-between px-3 py-1.5 bg-blue-50/60 rounded-xl text-[11px] text-blue-700 border border-blue-100">
        <span>👈 좌우로 스크롤하여 요일별 일정을 확인하세요 👉</span>
      </div>

      {/* Week Time Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-x-auto touch-pan-x">
        <div className="min-w-[680px] sm:min-w-[800px]">
          {/* Week Days Header Row */}
          <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50 text-center py-2.5 sm:py-3">
            {/* Sticky Time Header */}
            <div className="sticky left-0 bg-slate-50 z-20 flex items-center justify-center text-slate-400 py-1 text-xs font-semibold border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
              시간
            </div>

            {weekDays.map((day, i) => {
              const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];
              const isSelected = day.date === selectedDate;
              const isSun = i === 0;
              const isSat = i === 6;

              const blocked = blockedDates.find(
                (b) =>
                  b.date === day.date && (b.spaceId === 'all' || b.spaceId === space.id)
              );
              const isHoliday = day.isHoliday || (blocked && blocked.type === 'holiday');
              const holidayTitle = day.holidayName || (blocked && blocked.type === 'holiday' ? blocked.reason : null);
              const isRed = isSun || isHoliday;

              return (
                <div
                  key={day.date}
                  onClick={() => onSelectDate(day.date)}
                  className={`cursor-pointer px-1 py-1 sm:py-1.5 rounded-xl transition-all flex flex-col items-center justify-center ${
                    isSelected ? 'bg-blue-50/80' : 'hover:bg-slate-100/70'
                  }`}
                >
                  <span
                    className={`block text-xs sm:text-sm font-semibold mb-1 ${
                      isRed ? 'text-rose-600 font-bold' : isSat ? 'text-blue-600 font-bold' : 'text-slate-600'
                    }`}
                  >
                    {dayLabels[i]}
                  </span>
                  <span
                    className={`inline-flex items-center justify-center text-sm sm:text-base font-bold w-7 h-7 sm:w-8 sm:h-8 rounded-full ${
                      day.isToday
                        ? 'bg-blue-600 text-white shadow-xs'
                        : isHoliday
                        ? 'text-rose-600 bg-rose-50 border border-rose-200 shadow-2xs font-extrabold'
                        : isRed
                        ? 'text-rose-600 font-extrabold'
                        : blocked && blocked.type === 'blocked'
                        ? 'bg-slate-200 text-slate-700'
                        : isSelected
                        ? 'bg-slate-900 text-white'
                        : isSat
                        ? 'text-blue-600 font-bold'
                        : 'text-slate-800'
                    }`}
                  >
                    {day.dayNumber}
                  </span>
                  {holidayTitle && (
                    <span className="text-[10px] text-rose-600 bg-rose-50 border border-rose-200/80 font-bold rounded px-1 truncate max-w-full mt-1 shadow-3xs">
                      {holidayTitle}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Time Slot Rows */}
          <div className="divide-y divide-slate-100">
            {timeSlots.slice(0, -1).map((slotTime, slotIdx) => {
              const nextSlotTime = timeSlots[slotIdx + 1];

              return (
                <div key={slotTime} className="grid grid-cols-8 min-h-[50px] sm:min-h-[54px]">
                  {/* Sticky Time label */}
                  <div className="sticky left-0 bg-slate-50/95 z-10 p-1.5 sm:p-2 border-r border-slate-200 text-slate-500 text-xs font-semibold flex items-center justify-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                    {slotTime}
                  </div>

                  {/* 7 Days cells */}
                  {weekDays.map((day) => {
                    // Check if date is blocked
                    const blocked = blockedDates.find(
                      (b) =>
                        b.date === day.date && (b.spaceId === 'all' || b.spaceId === space.id)
                    );

                    // Find reservation covering this slot
                    const coveringRes = reservations.find(
                      (r) =>
                        r.date === day.date &&
                        r.spaceId === space.id &&
                        r.status === 'confirmed' &&
                        isTimeOverlapping(slotTime, nextSlotTime, r.startTime, r.endTime)
                    );

                    const isStartOfReservation = coveringRes && coveringRes.startTime === slotTime;

                    if (blocked && blocked.type === 'blocked') {
                      return (
                        <div
                          key={day.date}
                          className="border-r border-slate-100 p-1 text-[10px] flex items-center justify-center bg-slate-50 text-slate-400"
                        >
                          <Ban className="w-3.5 h-3.5 opacity-60" />
                        </div>
                      );
                    }

                    if (coveringRes) {
                      return (
                        <div
                          key={day.date}
                          onClick={() => onSelectReservation(coveringRes)}
                          className={`border-r border-slate-100 p-1.5 cursor-pointer transition-all ${
                            isMeeting
                              ? 'bg-blue-100/90 text-blue-950 hover:bg-blue-200'
                              : 'bg-indigo-100/90 text-indigo-950 hover:bg-indigo-200'
                          }`}
                          title={`${coveringRes.startTime}~${coveringRes.endTime} ${coveringRes.department ? `[${coveringRes.department}]` : ''}`}
                        >
                          {isStartOfReservation && (
                            <div className="text-[11px] truncate">
                              <span className="text-[10px] block text-blue-800 font-bold">
                                {coveringRes.startTime}~{coveringRes.endTime}
                              </span>
                              {coveringRes.department && (
                                <span className="font-semibold text-slate-800 text-[11px] block truncate mt-0.5">
                                  {coveringRes.department}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={day.date}
                        onClick={() => {
                          onSelectDate(day.date);
                          onOpenBookingModal(day.date, slotTime);
                        }}
                        className="border-r border-slate-100 p-1 hover:bg-blue-50/50 cursor-pointer group flex items-center justify-center transition-colors"
                        title={`${day.date} ${slotTime} 예약하기`}
                      >
                        <Plus className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
