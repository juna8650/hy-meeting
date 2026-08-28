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
  FileText,
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-4">
          <button
            onClick={onNavigateHome}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100/80 hover:bg-slate-200/80 rounded-xl transition-all flex items-center gap-1.5 font-semibold text-xs sm:text-sm shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>홈으로</span>
          </button>
          <div>
            <span className="text-[11px] text-blue-600 font-bold uppercase tracking-wider block">
              Reservation Lookup
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              예약 조회 및 관리
            </h2>
          </div>
        </div>
        <div className="text-xs text-slate-500 font-medium bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/60 shadow-2xs">
          과/부서명을 검색하여 예약을 확인하고 수정/취소할 수 있습니다.
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              id="lookup-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="과/부서 검색 (예: 교무기획부)"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-900 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
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
          <div className="flex items-center justify-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterSpace('all');
                setFilterStatus('confirmed');
                setFilterDate('');
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              필터 초기화
            </button>
          </div>
        )}
      </div>

      {/* Results List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
          <span>검색 결과: 총 {filteredReservations.length}건</span>
        </div>

        {filteredReservations.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center text-slate-400 space-y-2 shadow-2xs">
            <Search className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700">일치하는 예약 내역이 없습니다.</p>
            <p className="text-xs text-slate-400 font-medium">검색어나 필터 조건을 변경해보세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReservations.map((res) => {
              const isCancelled = res.status === 'cancelled';
              const isMeeting = res.spaceId === 'meeting-room';

              return (
                <div
                  key={res.id}
                  id={`lookup-card-${res.id}`}
                  onClick={() => onSelectReservation(res)}
                  className={`bg-white p-5 sm:p-6 rounded-2xl border transition-all cursor-pointer shadow-2xs hover:shadow-md hover:-translate-y-0.5 ${
                    isCancelled
                      ? 'border-slate-200 opacity-60'
                      : isMeeting
                      ? 'border-blue-100 hover:border-blue-300'
                      : 'border-indigo-100 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border ${
                        isMeeting
                          ? 'bg-blue-50 text-blue-800 border-blue-200/70'
                          : 'bg-indigo-50 text-indigo-800 border-indigo-200/70'
                      }`}
                    >
                      {res.spaceName}
                    </span>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border ${
                        isCancelled
                          ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                      }`}
                    >
                      {isCancelled ? <XCircle className="w-3 h-3 text-rose-500" /> : <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                      {isCancelled ? '취소됨' : '확정'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold mb-2.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 w-fit">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{res.department || '과/부서 미지정'}</span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{formatKoreanDate(res.date, true)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-800">
                        {res.startTime} ~ {res.endTime}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                    <span className="text-slate-500 font-medium">비밀번호로 수정 / 취소</span>
                    <span className="hover:translate-x-0.5 transition-transform">상세보기 &rarr;</span>
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
