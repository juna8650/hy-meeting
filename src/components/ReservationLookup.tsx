import { useState, useMemo } from 'react';
import { Reservation, Space, SpaceId } from '../types';
import { formatKoreanDate } from '../utils/dateUtils';
import CustomSelect from './CustomSelect';
import {
  Search,
  ArrowLeft,
  Calendar,
  Clock,
  Briefcase,
  Building,
  Filter,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface ReservationLookupProps {
  reservations: Reservation[];
  spaces: Space[];
  onNavigateHome: () => void;
  onSelectReservation: (res: Reservation) => void;
}

export default function ReservationLookup({
  reservations,
  spaces,
  onNavigateHome,
  onSelectReservation,
}: ReservationLookupProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpace, setFilterSpace] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'cancelled'>('confirmed');
  const [filterDate, setFilterDate] = useState('');

  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      // Status filter
      if (filterStatus !== 'all' && r.status !== filterStatus) {
        return false;
      }

      // Space filter
      if (filterSpace !== 'all' && r.spaceId !== filterSpace) {
        return false;
      }

      // Date filter
      if (filterDate && r.date !== filterDate) {
        return false;
      }

      // Search term (Search by department only)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchDept = r.department ? r.department.toLowerCase().includes(q) : false;
        if (!matchDept) return false;
      }

      return true;
    });
  }, [reservations, searchTerm, filterSpace, filterStatus, filterDate]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <button
            onClick={onNavigateHome}
            className="p-2.5 sm:px-4 sm:py-2.5 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-2 font-bold text-sm sm:text-base shadow-2xs border border-slate-200/80 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>홈으로</span>
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2 sm:gap-2.5">
              <Search className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-blue-600 shrink-0" />
              <span>예약 조회 및 관리</span>
            </h2>
          </div>
        </div>
        <div className="text-sm sm:text-[15px] text-slate-600 font-medium bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200/60 shadow-2xs">
          과/부서명을 검색하여 예약을 확인하고 수정/취소할 수 있습니다.
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              id="lookup-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="과/부서 검색 (예: 교무기획부)"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-base text-slate-900 placeholder:text-[15px] sm:placeholder:text-base bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
            />
          </div>

          {/* Space Filter */}
          <div>
            <CustomSelect
              id="lookup-space-select"
              value={filterSpace}
              onChange={(val) => setFilterSpace(val)}
              options={[
                { value: 'all', label: '전체 공간' },
                ...spaces.map((s) => ({ value: s.id, label: s.name })),
              ]}
            />
          </div>

          {/* Date Filter */}
          <div>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-base font-medium text-slate-900 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
            />
          </div>

          {/* Status Filter */}
          <div>
            <CustomSelect
              id="lookup-status-select"
              value={filterStatus}
              onChange={(val) => setFilterStatus(val as any)}
              options={[
                { value: 'confirmed', label: '확정된 예약만 보기' },
                { value: 'all', label: '전체 (취소 포함)' },
                { value: 'cancelled', label: '취소된 예약만 보기' },
              ]}
            />
          </div>
        </div>

        {/* Reset button */}
        {(searchTerm || filterSpace !== 'all' || filterStatus !== 'confirmed' || filterDate) && (
          <div className="flex items-center justify-end pt-1">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterSpace('all');
                setFilterStatus('confirmed');
                setFilterDate('');
              }}
              className="text-sm sm:text-base font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              필터 초기화
            </button>
          </div>
        )}
      </div>

      {/* Results List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-base sm:text-lg font-bold text-slate-800 px-1">
          <span>검색 결과: 총 {filteredReservations.length}건</span>
        </div>

        {filteredReservations.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-12 sm:p-16 text-center text-slate-400 space-y-3 shadow-2xs">
            <Search className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-base sm:text-lg font-bold text-slate-800">일치하는 예약 내역이 없습니다.</p>
            <p className="text-sm text-slate-500 font-medium">검색어나 필터 조건을 변경해보세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {filteredReservations.map((res) => {
              const isCancelled = res.status === 'cancelled';
              const isMeeting = res.spaceId === 'meeting-room';

              return (
                <div
                  key={res.id}
                  id={`lookup-card-${res.id}`}
                  onClick={() => onSelectReservation(res)}
                  className={`bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all cursor-pointer shadow-2xs hover:shadow-lg hover:-translate-y-0.5 space-y-4 group ${
                    isCancelled
                      ? 'border-slate-200 opacity-60'
                      : isMeeting
                      ? 'border-blue-100/90 hover:border-blue-300'
                      : 'border-indigo-100/90 hover:border-indigo-300'
                  }`}
                >
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-sm sm:text-[15px] font-bold px-3.5 py-1 rounded-xl border ${
                        isMeeting
                          ? 'bg-blue-50 text-blue-800 border-blue-200/80'
                          : 'bg-indigo-50 text-indigo-800 border-indigo-200/80'
                      }`}
                    >
                      {res.spaceName}
                    </span>

                    <span
                      className={`text-xs sm:text-sm font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border ${
                        isCancelled
                          ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                      }`}
                    >
                      {isCancelled ? <XCircle className="w-3.5 h-3.5 text-rose-500" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                      {isCancelled ? '취소됨' : '확정'}
                    </span>
                  </div>

                  {/* Department */}
                  <div className="flex items-center gap-1.5 text-sm sm:text-base text-slate-800 font-bold bg-slate-100/90 px-3.5 py-1.5 rounded-xl border border-slate-200/70 w-fit shadow-3xs">
                    <Briefcase className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>{res.department || '과/부서 미지정'}</span>
                  </div>

                  {/* Date & Time */}
                  <div className="space-y-2.5 text-base text-slate-700 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2.5 font-medium">
                      <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="text-slate-800">{formatKoreanDate(res.date, true)}</span>
                    </div>

                    <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-blue-700">
                      <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>
                        {res.startTime} ~ {res.endTime}
                      </span>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-sm sm:text-base font-bold text-blue-600">
                    <span className="text-slate-500 font-medium text-xs sm:text-sm">비밀번호로 수정 / 취소</span>
                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      상세보기 &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
