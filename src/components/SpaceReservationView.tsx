import { useState } from 'react';
import { Space, Reservation, BlockedDate, SpaceId } from '../types';
import MonthView from './Calendar/MonthView';
import WeekView from './Calendar/WeekView';
import DayTimelineView from './Calendar/DayTimelineView';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Plus,
  Tv,
  DoorClosed,
  ChevronRight,
} from 'lucide-react';
import { formatKoreanDate } from '../utils/dateUtils';

interface SpaceReservationViewProps {
  space: Space;
  allSpaces: Space[];
  reservations: Reservation[];
  blockedDates: BlockedDate[];
  todayStr: string;
  onNavigateHome: () => void;
  onSelectSpace: (spaceId: SpaceId) => void;
  onOpenBookingModal: (date: string, defaultStartTime?: string) => void;
  onSelectReservation: (res: Reservation) => void;
}

export default function SpaceReservationView({
  space,
  allSpaces,
  reservations,
  blockedDates,
  todayStr,
  onNavigateHome,
  onSelectSpace,
  onOpenBookingModal,
  onSelectReservation,
}: SpaceReservationViewProps) {
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const isMeeting = space.id === 'meeting-room';

  // Filter reservations for this space
  const spaceReservations = reservations.filter((r) => r.spaceId === space.id);

  // Selected date's confirmed reservations
  const selectedDateReservations = spaceReservations.filter(
    (r) => r.date === selectedDate && r.status === 'confirmed'
  );

  const blocked = blockedDates.find(
    (b) =>
      b.date === selectedDate && (b.spaceId === 'all' || b.spaceId === space.id)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <button
              id="back-to-home-btn"
              onClick={onNavigateHome}
              className="p-2 sm:p-2.5 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl transition-all flex items-center gap-1.5 font-bold text-xs sm:text-sm border border-slate-200/80 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>홈으로</span>
            </button>

            <div
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shadow-xs border shrink-0 ${
                isMeeting
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : 'bg-indigo-50 text-indigo-600 border-indigo-200'
              }`}
            >
              {isMeeting ? <DoorClosed className="w-5 h-5 sm:w-6 sm:h-6" /> : <Tv className="w-5 h-5 sm:w-6 sm:h-6" />}
            </div>

            <div>
              <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-slate-900">
                {space.name} 예약 현황
              </h2>
            </div>
          </div>
        </div>

        {/* Space Switcher & Action */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Switch space button */}
          {allSpaces
            .filter((s) => s.id !== space.id)
            .map((otherSpace) => (
              <button
                key={otherSpace.id}
                onClick={() => onSelectSpace(otherSpace.id)}
                className="flex-1 sm:flex-initial justify-center px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all flex items-center gap-1.5 active:scale-95"
              >
                <span>{otherSpace.name}로 전환</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            ))}

          {/* Primary Book Button */}
          <button
            id="space-page-book-btn"
            onClick={() => onOpenBookingModal(selectedDate)}
            className={`flex-1 sm:flex-initial justify-center px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm md:text-base font-bold text-white shadow-sm flex items-center gap-1.5 sm:gap-2 transition-all active:scale-95 ${
              isMeeting
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>신규 예약 등록</span>
          </button>
        </div>
      </div>

      {/* Calendar View Selector Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex bg-slate-200/70 p-1 rounded-2xl border border-slate-200">
          <button
            id="view-month-tab"
            onClick={() => setCalendarView('month')}
            className={`text-center py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              calendarView === 'month'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            월간 캘린더
          </button>
          <button
            id="view-week-tab"
            onClick={() => setCalendarView('week')}
            className={`text-center py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              calendarView === 'week'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            주간 보기
          </button>
          <button
            id="view-day-tab"
            onClick={() => setCalendarView('day')}
            className={`text-center py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              calendarView === 'day'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            일간 타임라인
          </button>
        </div>
      </div>

      {/* Main Content Area: Calendar Grid + Selected Date Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Calendar View (3 cols on lg) */}
        <div className="lg:col-span-3">
          {calendarView === 'month' && (
            <MonthView
              space={space}
              reservations={spaceReservations}
              blockedDates={blockedDates}
              selectedDate={selectedDate}
              todayStr={todayStr}
              onSelectDate={(d) => setSelectedDate(d)}
              onOpenBookingModal={(d) => onOpenBookingModal(d)}
              onSelectReservation={onSelectReservation}
            />
          )}

          {calendarView === 'week' && (
            <WeekView
              space={space}
              reservations={spaceReservations}
              blockedDates={blockedDates}
              selectedDate={selectedDate}
              todayStr={todayStr}
              onSelectDate={(d) => setSelectedDate(d)}
              onOpenBookingModal={(d, time) => onOpenBookingModal(d, time)}
              onSelectReservation={onSelectReservation}
            />
          )}

          {calendarView === 'day' && (
            <DayTimelineView
              space={space}
              reservations={spaceReservations}
              blockedDates={blockedDates}
              selectedDate={selectedDate}
              todayStr={todayStr}
              onSelectDate={(d) => setSelectedDate(d)}
              onOpenBookingModal={(d, time) => onOpenBookingModal(d, time)}
              onSelectReservation={onSelectReservation}
            />
          )}
        </div>

        {/* Selected Date Summary Sidebar (1 col on lg) */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4 sticky top-24">
          <div className="pb-3 border-b border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Selected Date
            </span>
            <h4 className="text-base font-bold text-slate-900 mt-0.5">
              {formatKoreanDate(selectedDate, true)}
            </h4>
          </div>

          {/* Quick Schedule for Selected Date */}
          <div className="space-y-2.5">
            <h5 className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>예약 현황</span>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                {selectedDateReservations.length}건
              </span>
            </h5>

            {blocked && blocked.type === 'blocked' ? (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                <span className="font-bold block mb-0.5 text-base">예약 불가일</span>
                {blocked.reason}
              </div>
            ) : selectedDateReservations.length === 0 ? (
              <div className="p-5 rounded-2xl bg-slate-50/80 text-slate-500 text-sm text-center border border-slate-100">
                예약된 일정이 없습니다.
                <br />
                원하시는 시간에 예약해보세요.
              </div>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {selectedDateReservations.map((res) => (
                  <div
                    key={res.id}
                    onClick={() => onSelectReservation(res)}
                    className="p-3.5 bg-slate-50/80 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-2xl cursor-pointer transition-all text-sm"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                      <span className="font-semibold text-blue-700">{res.startTime} ~ {res.endTime}</span>
                      <span>{res.userName}</span>
                    </div>
                    <p className="text-slate-600 line-clamp-1 font-medium">{res.purpose}</p>
                    {res.department && (
                      <span className="text-xs text-slate-400 mt-1 block">
                        {res.department}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action button */}
          {(!blocked || blocked.type === 'holiday') && (
            <button
              onClick={() => onOpenBookingModal(selectedDate)}
              className={`w-full py-3 rounded-2xl text-sm sm:text-base font-bold text-white shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.99] ${
                isMeeting
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
              }`}
            >
              <Plus className="w-4 h-4" />
              선택한 날짜에 예약하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
