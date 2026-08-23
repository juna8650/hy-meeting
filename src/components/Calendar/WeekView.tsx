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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center bg-slate-100/80 p-1 rounded-2xl border border-slate-200 shrink-0">
            <button
              onClick={handlePrevWeek}
              className="p-2 text-slate-700 hover:text-slate-900 hover:bg-white rounded-xl transition-all active:scale-95"
              title="이전 주"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-extrabold text-slate-900 text-base sm:text-lg px-4 tracking-tight shrink-0">
              {weekDays[0]?.date} ~ {weekDays[6]?.date}
            </span>
            <button
              onClick={handleNextWeek}
              className="p-2 text-slate-700 hover:text-slate-900 hover:bg-white rounded-xl transition-all active:scale-95"
              title="다음 주"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => onSelectDate(todayStr)}
            className="px-4 py-2 sm:py-2.5 text-base sm:text-lg font-bold text-slate-900 bg-slate-100/80 hover:bg-white border border-slate-200 rounded-2xl transition-all flex items-center gap-2 active:scale-95 shadow-2xs shrink-0"
          >
            <Calendar className="w-4 h-4 sm:w-5 h-5 text-blue-600" />
            이번 주
          </button>
        </div>
      </div>

      {/* Week Time Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Week Days Header Row */}
          <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50 text-center py-3 text-xs font-bold">
            <div className="text-slate-400 py-1 text-[11px] font-semibold">시간</div>
            {weekDays.map((day, i) => {
              const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];
              const isSelected = day.date === selectedDate;
              return (
                <div
                  key={day.date}
                  onClick={() => onSelectDate(day.date)}
                  className={`cursor-pointer px-1 py-1.5 rounded-xl transition-all ${
                    isSelected ? 'bg-blue-100/80 font-extrabold text-blue-900' : 'hover:bg-slate-100'
                  }`}
                >
                  <span
                    className={`block font-bold ${
                      i === 0 ? 'text-rose-600' : i === 6 ? 'text-blue-600' : 'text-slate-600'
                    }`}
                  >
                    {dayLabels[i]}
                  </span>
                  <span
                    className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      day.isToday
                        ? 'bg-blue-600 text-white shadow-xs'
                        : isSelected
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-800'
                    }`}
                  >
                    {day.dayNumber}일
                  </span>
                </div>
              );
            })}
          </div>

          {/* Time Slot Rows */}
          <div className="divide-y divide-slate-100">
            {timeSlots.slice(0, -1).map((slotTime, slotIdx) => {
              const nextSlotTime = timeSlots[slotIdx + 1];

              return (
                <div key={slotTime} className="grid grid-cols-8 min-h-[54px]">
                  {/* Time label */}
                  <div className="p-2 border-r border-slate-100 text-slate-500 text-xs font-semibold flex items-center justify-center bg-slate-50/50">
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
                        >
                          {isStartOfReservation && (
                            <div className="text-[11px] font-bold truncate">
                              <span className="text-[10px] block text-blue-800 font-semibold">
                                {coveringRes.startTime}~{coveringRes.endTime}
                              </span>
                              <span>{coveringRes.userName}</span>
                              <span className="text-slate-600 font-normal text-[10px] block truncate">
                                {coveringRes.purpose}
                              </span>
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
