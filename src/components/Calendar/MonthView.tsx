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
      <div className="flex flex-row items-center justify-between gap-2 bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center bg-slate-100/80 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border border-slate-200 shrink-0">
            <button
              id="prev-month-btn"
              onClick={handlePrevMonth}
              className="p-1.5 sm:p-2 text-slate-700 hover:text-slate-900 hover:bg-white rounded-lg sm:rounded-xl transition-all active:scale-95"
              title="이전 달"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 h-5" />
            </button>
            <h3 className="text-sm sm:text-lg font-bold text-slate-900 px-2 sm:px-4 tracking-tight shrink-0">
              {year}년 {month + 1}월
            </h3>
            <button
              id="next-month-btn"
              onClick={handleNextMonth}
              className="p-1.5 sm:p-2 text-slate-700 hover:text-slate-900 hover:bg-white rounded-lg sm:rounded-xl transition-all active:scale-95"
              title="다음 달"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 h-5" />
            </button>
          </div>

          <button
            id="today-btn"
            onClick={handleToday}
            className="px-2.5 sm:px-4 py-1.5 sm:py-2.5 text-xs sm:text-base font-bold text-slate-900 bg-slate-100/80 hover:bg-white border border-slate-200 rounded-xl sm:rounded-2xl transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs shrink-0"
          >
            <CalendarIcon className="w-3.5 h-3.5 sm:w-5 h-5 text-blue-600" />
            오늘
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center py-2 sm:py-3.5 text-xs sm:text-base font-extrabold text-slate-700">
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

            // Combined holiday check (built-in Korean holiday or custom holiday in blockedDates)
            const isHoliday = day.isHoliday || (blocked && blocked.type === 'holiday');
            const holidayTitle = day.holidayName || (blocked && blocked.type === 'holiday' ? blocked.reason : null);
            const isRed = isSun || isHoliday;

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
                className={`min-h-[75px] sm:min-h-[145px] p-1 sm:p-2 bg-white transition-all flex flex-col justify-between cursor-pointer group hover:bg-blue-50/30 relative overflow-hidden ${
                  !day.isCurrentMonth ? 'bg-slate-50/40 opacity-40' : ''
                } ${isSelected ? 'ring-2 ring-blue-600 ring-inset z-10 bg-blue-50/20' : ''}`}
              >
                {/* Cell Header: Day number & Quick add */}
                <div className="w-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 min-w-0">
                      <span
                        className={`inline-flex items-center justify-center text-xs sm:text-base font-bold w-6 h-6 sm:w-8 sm:h-8 rounded-full shrink-0 ${
                          day.isToday
                            ? 'bg-blue-600 text-white shadow-xs font-bold'
                            : isHoliday
                            ? 'bg-rose-50 text-rose-600 font-extrabold border border-rose-200'
                            : blocked && blocked.type === 'blocked'
                            ? 'bg-slate-200 text-slate-700'
                            : isRed
                            ? 'text-rose-600 font-extrabold'
                            : isSat
                            ? 'text-blue-600 font-bold'
                            : 'text-slate-800 font-bold'
                        } ${isSelected && !day.isToday && !isHoliday && (!blocked || blocked.type !== 'blocked') ? 'bg-slate-900 text-white' : ''}`}
                      >
                        {day.dayNumber}
                      </span>

                      {/* Desktop Holiday Title Tag beside date */}
                      {holidayTitle && (
                        <span className="hidden sm:inline-block text-[11px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/80 truncate max-w-[85px]">
                          {holidayTitle}
                        </span>
                      )}
                    </div>

                    {/* Quick Add Button (Desktop only) */}
                    {day.isCurrentMonth && (!blocked || blocked.type === 'holiday') && (
                      <button
                        id={`quick-book-${day.date}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDate(day.date);
                          onOpenBookingModal(day.date);
                        }}
                        className="hidden sm:block opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all shrink-0"
                        title="이 날짜에 바로 예약"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Mobile Holiday Title (under date number, cleanly truncated without breaking layout) */}
                  {holidayTitle && (
                    <div className="sm:hidden text-[9px] font-extrabold text-rose-600 truncate mt-0.5 leading-none">
                      {holidayTitle}
                    </div>
                  )}
                </div>

                {/* Cell Body: Blocked reason or Reservation chips */}
                <div className="flex-1 w-full mt-1 overflow-hidden">
                  {blocked && blocked.type === 'blocked' ? (
                    <div className="p-0.5 sm:p-1.5 rounded bg-slate-100 border border-slate-200 text-slate-600 text-[9px] sm:text-xs font-semibold flex items-center gap-0.5 sm:gap-1">
                      <Ban className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{blocked.reason}</span>
                    </div>
                  ) : (
                    <>
                      {/* Mobile View: Compact reservation badges/dots */}
                      <div className="sm:hidden space-y-0.5">
                        {dayReservations.slice(0, 2).map((res) => (
                          <div
                            key={res.id}
                            className={`px-1 py-0.5 rounded text-[9px] font-bold truncate leading-tight border ${
                              isMeeting
                                ? 'bg-blue-50 text-blue-900 border-blue-200'
                                : 'bg-indigo-50 text-indigo-900 border-indigo-200'
                            }`}
                          >
                            {res.startTime.replace(':00', '시')}
                            {res.department ? `·${res.department.slice(0, 3)}` : ''}
                          </div>
                        ))}
                        {dayReservations.length > 2 && (
                          <div className="text-[8px] font-bold text-blue-600 text-center leading-none">
                            +{dayReservations.length - 2}건 더보기
                          </div>
                        )}
                      </div>

                      {/* Desktop View: Rich reservation chips */}
                      <div className="hidden sm:flex flex-col gap-1 max-h-[90px] overflow-y-auto scrollbar-none">
                        {dayReservations.map((res) => (
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
                            title={`${res.startTime}~${res.endTime} ${res.department ? `[${res.department}]` : ''}`}
                          >
                            <div className="font-semibold text-xs text-slate-800 truncate">
                              {res.startTime}~{res.endTime}
                            </div>
                            {res.department && (
                              <div className="text-slate-600 text-[11px] font-medium truncate mt-0.5 opacity-90">
                                {res.department}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Mobile reservation dot summary when 0 or few */}
                {dayReservations.length === 0 && (
                  <div className="sm:hidden h-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
