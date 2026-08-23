import { useState } from 'react';
import { Space, Reservation, BlockedDate } from '../../types';
import {
  getMonthCalendarDays,
  formatKoreanDate,
  isWeekend,
} from '../../utils/dateUtils';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Ban,
  Calendar as CalendarIcon,
} from 'lucide-react';

interface MonthViewProps {
  space: Space;
  reservations: Reservation[];
  blockedDates: BlockedDate[];
  selectedDate: string;
  todayStr: string;
  onSelectDate: (date: string) => void;
  onOpenBookingModal: (date: string) => void;
  onSelectReservation: (res: Reservation) => void;
}

export default function MonthView({
  space,
  reservations,
  blockedDates,
  selectedDate,
  todayStr,
  onSelectDate,
  onOpenBookingModal,
  onSelectReservation,
}: MonthViewProps) {
  // Current displayed year & month
  const [viewDate, setViewDate] = useState(() => {
    const [y, m] = selectedDate.split('-').map(Number);
    return new Date(y, m - 1, 1);
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-indexed

  const calendarDays = getMonthCalendarDays(year, month, todayStr);

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const [y, m] = todayStr.split('-').map(Number);
    setViewDate(new Date(y, m - 1, 1));
    onSelectDate(todayStr);
  };

  const isMeeting = space.id === 'meeting-room';

  return (
    <div className="space-y-4">
      {/* Calendar Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center bg-slate-100/80 p-1 rounded-2xl border border-slate-200 shrink-0">
            <button
              id="prev-month-btn"
              onClick={handlePrevMonth}
              className="p-2 text-slate-700 hover:text-slate-900 hover:bg-white rounded-xl transition-all active:scale-95"
              title="이전 달"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 px-4 tracking-tight shrink-0">
              {year}년 {month + 1}월
            </h3>
            <button
              id="next-month-btn"
              onClick={handleNextMonth}
              className="p-2 text-slate-700 hover:text-slate-900 hover:bg-white rounded-xl transition-all active:scale-95"
              title="다음 달"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button
            id="today-btn"
            onClick={handleToday}
            className="px-4 py-2 sm:py-2.5 text-base sm:text-lg font-bold text-slate-900 bg-slate-100/80 hover:bg-white border border-slate-200 rounded-2xl transition-all flex items-center gap-2 active:scale-95 shadow-2xs shrink-0"
          >
            <CalendarIcon className="w-4 h-4 sm:w-5 h-5 text-blue-600" />
            오늘
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center py-3.5 text-sm sm:text-base font-extrabold text-slate-700">
          <div className="text-rose-500 font-extrabold">일</div>
          <div>월</div>
          <div>화</div>
          <div>수</div>
          <div>목</div>
          <div>금</div>
          <div className="text-blue-500 font-extrabold">토</div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-slate-100/50">
          {calendarDays.map((day, idx) => {
            const isSelected = day.date === selectedDate;
            const isSun = idx % 7 === 0;
            const isSat = idx % 7 === 6;

            // Blocked date check
            const blocked = blockedDates.find(
              (b) =>
                b.date === day.date && (b.spaceId === 'all' || b.spaceId === space.id)
            );

            // Day's confirmed reservations
            const dayReservations = reservations.filter(
              (r) =>
                r.date === day.date &&
                r.spaceId === space.id &&
                r.status === 'confirmed'
            );

            return (
              <div
                key={day.date}
                id={`cal-cell-${day.date}`}
                onClick={() => onSelectDate(day.date)}
                className={`min-h-[125px] sm:min-h-[155px] p-1.5 sm:p-2 bg-white transition-all flex flex-col justify-between cursor-pointer group hover:bg-blue-50/30 relative ${
                  !day.isCurrentMonth ? 'bg-slate-50/40 opacity-40' : ''
                } ${isSelected ? 'ring-2 ring-blue-600 ring-inset z-10' : ''}`}
              >
                {/* Cell Header: Day number & Quick add */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`inline-flex items-center justify-center text-sm sm:text-base font-bold w-7 h-7 sm:w-8 sm:h-8 rounded-full ${
                      day.isToday
                        ? 'bg-blue-600 text-white shadow-xs font-bold'
                        : blocked && blocked.type === 'holiday'
                        ? 'bg-rose-50 text-rose-600 font-extrabold border border-rose-200 shadow-2xs'
                        : blocked && blocked.type === 'blocked'
                        ? 'bg-slate-200 text-slate-700'
                        : isSun
                        ? 'text-rose-600'
                        : isSat
                        ? 'text-blue-600'
                        : 'text-slate-800'
                    } ${isSelected && !day.isToday && !blocked ? 'bg-slate-900 text-white' : ''}`}
                  >
                    {day.dayNumber}
                  </span>

                  {day.isCurrentMonth && (!blocked || blocked.type === 'holiday') && (
                    <button
                      id={`quick-book-${day.date}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDate(day.date);
                        onOpenBookingModal(day.date);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="이 날짜에 바로 예약"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Cell Body: Blocked reason or Reservation chips */}
                <div className="flex-1 space-y-1 overflow-y-auto max-h-[90px] sm:max-h-[110px] scrollbar-none flex flex-col gap-1">
                  {blocked && blocked.type === 'holiday' && (
                    <div className="p-1 px-1.5 rounded-lg border border-rose-300 bg-rose-50 text-rose-600 text-xs sm:text-sm font-semibold text-center shadow-3xs">
                      <span className="font-semibold">{blocked.reason}</span>
                    </div>
                  )}

                  {blocked && blocked.type === 'blocked' ? (
                    <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs sm:text-sm font-semibold flex items-center gap-1">
                      <Ban className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{blocked.reason}</span>
                    </div>
                  ) : (
                    dayReservations.map((res) => {
                      const showOnlyTime = dayReservations.length >= 3;
                      return (
                        <div
                          key={res.id}
                          id={`cal-chip-${res.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectReservation(res);
                          }}
                          className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg text-xs sm:text-sm border transition-all cursor-pointer shadow-3xs ${
                            isMeeting
                              ? 'bg-blue-50/90 text-blue-950 border-blue-200 hover:bg-blue-100 hover:border-blue-300 hover:shadow-xs'
                              : 'bg-indigo-50/90 text-indigo-950 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 hover:shadow-xs'
                          }`}
                          title={`${res.startTime}~${res.endTime} ${res.userName} (${res.purpose})`}
                        >
                          <div className="font-medium text-[10px] sm:text-xs text-slate-700 whitespace-nowrap overflow-visible">
                            {res.startTime}~{res.endTime}
                          </div>
                          {!showOnlyTime && (
                            <div className="text-slate-600 text-[10px] sm:text-xs font-normal truncate hidden sm:block mt-0.5 opacity-90">
                              {res.purpose}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Reservation summary count dot for mobile */}
                {dayReservations.length > 0 && (
                  <div className="sm:hidden text-[9px] font-bold text-blue-600 mt-1 flex items-center justify-end gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                    <span>{dayReservations.length}건</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
