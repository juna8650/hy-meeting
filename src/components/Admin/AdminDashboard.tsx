import { useState, useMemo, type FormEvent } from 'react';
import { Space, Reservation, BlockedDate, AdminStats, SpaceId } from '../../types';
import { formatKoreanDate, getMonthCalendarDays } from '../../utils/dateUtils';
import { api } from '../../services/api';
import CustomSelect from '../CustomSelect';
import {
  Calendar,
  Clock,
  User,
  Building,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit3,
  Download,
  Ban,
  Settings,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Tv,
  DoorClosed,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';

interface AdminDashboardProps {
  spaces: Space[];
  reservations: Reservation[];
  blockedDates: BlockedDate[];
  stats: AdminStats | null;
  todayStr: string;
  onNavigateHome: () => void;
  onRefreshData: () => void;
  onSelectReservation: (res: Reservation) => void;
  onOpenEditReservation: (res: Reservation) => void;
  onOpenCancelReservation: (res: Reservation) => void;
}

export default function AdminDashboard({
  spaces,
  reservations,
  blockedDates,
  stats,
  todayStr,
  onNavigateHome,
  onRefreshData,
  onSelectReservation,
  onOpenEditReservation,
  onOpenCancelReservation,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'calendar' | 'reservations' | 'spaces' | 'blocked' | 'password'>('calendar');

  // Calendar comparison state
  const [calYear, setCalYear] = useState(() => Number(todayStr.split('-')[0]));
  const [calMonth, setCalMonth] = useState(() => Number(todayStr.split('-')[1]) - 1); // 0-indexed

  // Reservation list filter state
  const [resSearch, setResSearch] = useState('');
  const [resSpaceFilter, setResSpaceFilter] = useState<string>('all');
  const [resStatusFilter, setResStatusFilter] = useState<string>('all');
  const [resDateFilter, setResDateFilter] = useState<string>('');

  // Space settings edit state
  const [selectedSpaceSettings, setSelectedSpaceSettings] = useState<Space>(spaces[0]);
  const [spaceSaveLoading, setSpaceSaveLoading] = useState(false);
  const [spaceSaveSuccess, setSpaceSaveSuccess] = useState(false);

  // Blocked date form state
  const [newBlockDate, setNewBlockDate] = useState(todayStr);
  const [newBlockSpaceId, setNewBlockSpaceId] = useState<string>('all');
  const [newBlockReason, setNewBlockReason] = useState('');
  const [newBlockType, setNewBlockType] = useState<'holiday' | 'blocked'>('holiday');
  const [blockLoading, setBlockLoading] = useState(false);
  const [blockError, setBlockError] = useState('');

  // Password change state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmNewPw, setConfirmNewPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmNewPw, setShowConfirmNewPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filtered reservations for list tab
  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      if (resSpaceFilter !== 'all' && r.spaceId !== resSpaceFilter) return false;
      if (resStatusFilter !== 'all' && r.status !== resStatusFilter) return false;
      if (resDateFilter && r.date !== resDateFilter) return false;
      if (resSearch.trim()) {
        const q = resSearch.toLowerCase().trim();
        const matchName = r.userName.toLowerCase().includes(q);
        const matchPurpose = r.purpose.toLowerCase().includes(q);
        const matchDept = r.department ? r.department.toLowerCase().includes(q) : false;
        if (!matchName && !matchPurpose && !matchDept) return false;
      }
      return true;
    });
  }, [reservations, resSpaceFilter, resStatusFilter, resDateFilter, resSearch]);

  // Calendar comparison days
  const calendarDays = useMemo(() => {
    return getMonthCalendarDays(calYear, calMonth, todayStr);
  }, [calYear, calMonth, todayStr]);

  // Handle Space Settings Save
  const handleSaveSpaceSettings = async (e: FormEvent) => {
    e.preventDefault();
    setSpaceSaveLoading(true);
    setSpaceSaveSuccess(false);
    try {
      await api.updateSpace(selectedSpaceSettings.id, selectedSpaceSettings);
      setSpaceSaveSuccess(true);
      onRefreshData();
      setTimeout(() => setSpaceSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || '공간 설정 저장에 실패했습니다.');
    } finally {
      setSpaceSaveLoading(false);
    }
  };

  // Handle Add Blocked Date
  const handleAddBlockedDate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newBlockDate || !newBlockReason.trim()) {
      setBlockError('날짜와 사유를 입력해주세요.');
      return;
    }
    setBlockLoading(true);
    setBlockError('');
    try {
      await api.addBlockedDate(newBlockDate, newBlockSpaceId, newBlockReason.trim(), newBlockType);
      setNewBlockReason('');
      onRefreshData();
    } catch (err: any) {
      setBlockError(err.message || '휴일 등록에 실패했습니다.');
    } finally {
      setBlockLoading(false);
    }
  };

  // Handle Delete Blocked Date
  const handleDeleteBlockedDate = async (id: string) => {
    if (!confirm('해당 휴일/사용 불가일을 삭제하시겠습니까?')) return;
    try {
      await api.deleteBlockedDate(id);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || '삭제에 실패했습니다.');
    }
  };

  // Handle Admin Password Change
  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwMessage(null);
    if (!currentPw || !newPw) {
      setPwMessage({ type: 'error', text: '모든 비밀번호 항목을 입력해주세요.' });
      return;
    }
    if (newPw.length < 4) {
      setPwMessage({ type: 'error', text: '새 비밀번호는 4자리 이상이어야 합니다.' });
      return;
    }
    if (newPw !== confirmNewPw) {
      setPwMessage({ type: 'error', text: '새 비밀번호 확인이 일치하지 않습니다.' });
      return;
    }

    setPwLoading(true);
    try {
      await api.adminChangePassword(currentPw, newPw);
      setPwMessage({ type: 'success', text: '관리자 비밀번호가 성공적으로 변경되었습니다.' });
      setCurrentPw('');
      setNewPw('');
      setConfirmNewPw('');
    } catch (err: any) {
      setPwMessage({ type: 'error', text: err.message || '비밀번호 변경에 실패했습니다.' });
    } finally {
      setPwLoading(false);
    }
  };

  // CSV Export helper
  const handleExportCSV = () => {
    const headers = [
      '예약ID',
      '공간명',
      '예약날짜',
      '시작시간',
      '종료시간',
      '예약자명',
      '과/부서',
      '사용목적',
      '예약상태',
      '등록일시',
    ];

    const rows = filteredReservations.map((r) => [
      r.id,
      r.spaceName,
      r.date,
      r.startTime,
      r.endTime,
      `"${r.userName.replace(/"/g, '""')}"`,
      `"${(r.department || '').replace(/"/g, '""')}"`,
      `"${r.purpose.replace(/"/g, '""')}"`,
      r.status === 'confirmed' ? '확정' : '취소됨',
      r.createdAt,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `한양과학기술고_공간예약현황_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={onNavigateHome}
            className="p-2.5 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-all flex items-center gap-1.5 font-semibold text-xs sm:text-sm border border-slate-700/60 shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>홈으로</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/20 text-amber-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-500/40">
                ADMIN CONSOLE
              </span>
              <span className="text-xs text-slate-400 font-medium">시설 통합 관리 시스템</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              관리자 대시보드
            </h2>
          </div>
        </div>

        <button
          onClick={onRefreshData}
          className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 transition-all border border-slate-700 shadow-2xs cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 text-blue-400" />
          <span>데이터 새로고침</span>
        </button>
      </div>

      {/* Quick Statistics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 block">전체 누적 예약</span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 mt-1 block tracking-tight">
            {stats?.totalReservations ?? reservations.length}건
          </span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-600 block">정상 확정 예약</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-700 mt-1 block tracking-tight">
            {stats?.confirmedCount ?? reservations.filter((r) => r.status === 'confirmed').length}건
          </span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-rose-600 block">취소된 예약</span>
          <span className="text-xl sm:text-2xl font-black text-rose-700 mt-1 block tracking-tight">
            {stats?.cancelledCount ?? reservations.filter((r) => r.status === 'cancelled').length}건
          </span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-blue-600 block">오늘 예약 일정</span>
          <span className="text-xl sm:text-2xl font-black text-blue-700 mt-1 block tracking-tight">
            {stats?.todayCount ?? reservations.filter((r) => r.date === todayStr && r.status === 'confirmed').length}건
          </span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-700 block">회의실 확정</span>
          <span className="text-xl sm:text-2xl font-black text-blue-600 mt-1 block tracking-tight">
            {stats?.meetingRoomCount ?? reservations.filter((r) => r.spaceId === 'meeting-room' && r.status === 'confirmed').length}건
          </span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-700 block">시청각실 확정</span>
          <span className="text-xl sm:text-2xl font-black text-indigo-600 mt-1 block tracking-tight">
            {stats?.audiovisualRoomCount ?? reservations.filter((r) => r.spaceId === 'audiovisual-room' && r.status === 'confirmed').length}건
          </span>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200/80 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'calendar'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>전체 공간 비교 캘린더</span>
        </button>

        <button
          onClick={() => setActiveTab('reservations')}
          className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'reservations'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4" />
          <span>전체 예약 목록 관리</span>
        </button>

        <button
          onClick={() => setActiveTab('spaces')}
          className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'spaces'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>공간 및 운영시간 설정</span>
        </button>

        <button
          onClick={() => setActiveTab('blocked')}
          className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'blocked'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Ban className="w-4 h-4" />
          <span>휴일 / 사용 불가일 설정</span>
        </button>

        <button
          onClick={() => setActiveTab('password')}
          className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'password'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>관리자 비밀번호 변경</span>
        </button>
      </div>

      {/* TAB 1: Comparison Calendar */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          {/* Calendar Month Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (calMonth === 0) {
                    setCalYear(calYear - 1);
                    setCalMonth(11);
                  } else {
                    setCalMonth(calMonth - 1);
                  }
                }}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                {calYear}년 {calMonth + 1}월 전체 공간 예약 대조표
              </h3>
              <button
                onClick={() => {
                  if (calMonth === 11) {
                    setCalYear(calYear + 1);
                    setCalMonth(0);
                  } else {
                    setCalMonth(calMonth + 1);
                  }
                }}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-blue-800 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200/70 shadow-2xs">
                <DoorClosed className="w-3.5 h-3.5 text-blue-600" /> 회의실
              </span>
              <span className="flex items-center gap-1.5 text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200/70 shadow-2xs">
                <Tv className="w-3.5 h-3.5 text-indigo-600" /> 시청각실
              </span>
            </div>
          </div>

          {/* Side-by-Side Date Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200/90">
                  <tr>
                    <th className="p-4 w-36 border-r border-slate-200/90">날짜</th>
                    <th className="p-4 w-1/2 border-r border-slate-200/90 bg-blue-50/50 text-blue-950">
                      🏢 회의실 예약 현황
                    </th>
                    <th className="p-4 w-1/2 bg-indigo-50/50 text-indigo-950">
                      🎥 시청각실 예약 현황
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {calendarDays
                    .filter((d) => d.isCurrentMonth)
                    .map((day) => {
                      const dayMeeting = reservations.filter(
                        (r) =>
                          r.date === day.date &&
                          r.spaceId === 'meeting-room' &&
                          r.status === 'confirmed'
                      );

                      const dayAudio = reservations.filter(
                        (r) =>
                          r.date === day.date &&
                          r.spaceId === 'audiovisual-room' &&
                          r.status === 'confirmed'
                      );

                      const blockedMeeting = blockedDates.find(
                        (b) => b.date === day.date && (b.spaceId === 'all' || b.spaceId === 'meeting-room')
                      );
                      const blockedAudio = blockedDates.find(
                        (b) => b.date === day.date && (b.spaceId === 'all' || b.spaceId === 'audiovisual-room')
                      );

                      return (
                        <tr
                          key={day.date}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            day.isToday ? 'bg-blue-50/20' : ''
                          }`}
                        >
                          {/* Date Col */}
                          <td className="p-4 border-r border-slate-200/80 font-medium">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-bold ${
                                  day.isToday
                                    ? 'text-blue-600'
                                    : day.isRedDay
                                    ? 'text-rose-600'
                                    : day.isWeekend
                                    ? 'text-blue-600'
                                    : 'text-slate-900'
                                }`}
                              >
                                {day.dayNumber}일 ({formatKoreanDate(day.date).split('(')[1]}
                              </span>
                              {day.isToday && (
                                <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs">
                                  오늘
                                </span>
                              )}
                              {day.holidayName && (
                                <span className="bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs">
                                  {day.holidayName}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                              {day.date}
                            </span>
                          </td>

                          {/* Meeting Room Col */}
                          <td className="p-4 border-r border-slate-200/80 align-top">
                            {blockedMeeting ? (
                              <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200/70 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-2xs">
                                <Ban className="w-3 h-3 text-rose-500" /> 불가 ({blockedMeeting.reason})
                              </span>
                            ) : dayMeeting.length === 0 ? (
                              <span className="text-slate-300 text-xs font-medium">-</span>
                            ) : (
                              <div className="space-y-2">
                                {dayMeeting.map((res) => (
                                  <div
                                    key={res.id}
                                    onClick={() => onSelectReservation(res)}
                                    className="p-2.5 bg-blue-50/70 hover:bg-blue-100/90 border border-blue-200/80 rounded-xl cursor-pointer transition-all shadow-2xs"
                                  >
                                    <div className="font-bold text-blue-950 flex items-center justify-between text-xs">
                                      <span>
                                        {res.startTime}~{res.endTime} {res.userName}
                                      </span>
                                      {res.department && (
                                        <span className="text-[11px] text-slate-500 font-medium">
                                          {res.department}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-slate-600 text-xs mt-1 truncate font-medium">
                                      {res.purpose}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>

                          {/* Audiovisual Room Col */}
                          <td className="p-4 align-top">
                            {blockedAudio ? (
                              <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200/70 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-2xs">
                                <Ban className="w-3 h-3 text-rose-500" /> 불가 ({blockedAudio.reason})
                              </span>
                            ) : dayAudio.length === 0 ? (
                              <span className="text-slate-300 text-xs font-medium">-</span>
                            ) : (
                              <div className="space-y-2">
                                {dayAudio.map((res) => (
                                  <div
                                    key={res.id}
                                    onClick={() => onSelectReservation(res)}
                                    className="p-2.5 bg-indigo-50/70 hover:bg-indigo-100/90 border border-indigo-200/80 rounded-xl cursor-pointer transition-all shadow-2xs"
                                  >
                                    <div className="font-bold text-indigo-950 flex items-center justify-between text-xs">
                                      <span>
                                        {res.startTime}~{res.endTime} {res.userName}
                                      </span>
                                      {res.department && (
                                        <span className="text-[11px] text-slate-500 font-medium">
                                          {res.department}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-slate-600 text-xs mt-1 truncate font-medium">
                                      {res.purpose}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Reservation Master List */}
      {activeTab === 'reservations' && (
        <div className="space-y-6">
          {/* Action & Filter Bar */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-bold text-slate-900 text-base tracking-tight">
                전체 예약 내역 ({filteredReservations.length}건)
              </h3>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm shadow-emerald-500/20 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>엑셀(CSV) 다운로드</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                value={resSearch}
                onChange={(e) => setResSearch(e.target.value)}
                placeholder="예약자명, 목적, 과/부서 검색"
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
              />

              <CustomSelect
                value={resSpaceFilter}
                onChange={(val) => setResSpaceFilter(val)}
                options={[
                  { value: 'all', label: '전체 공간' },
                  ...spaces.map((s) => ({ value: s.id, label: s.name })),
                ]}
              />

              <CustomSelect
                value={resStatusFilter}
                onChange={(val) => setResStatusFilter(val)}
                options={[
                  { value: 'all', label: '전체 상태' },
                  { value: 'confirmed', label: '확정 예약' },
                  { value: 'cancelled', label: '취소된 예약' },
                ]}
              />

              <input
                type="date"
                value={resDateFilter}
                onChange={(e) => setResDateFilter(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-900 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Master Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200/90">
                  <tr>
                    <th className="p-4">상태</th>
                    <th className="p-4">공간</th>
                    <th className="p-4">일시</th>
                    <th className="p-4">예약자(과/부서)</th>
                    <th className="p-4">사용 목적</th>
                    <th className="p-4">등록일시</th>
                    <th className="p-4 text-right">관리 작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReservations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-slate-400 font-medium">
                        조건에 일치하는 예약 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredReservations.map((res) => {
                      const isCancelled = res.status === 'cancelled';
                      return (
                        <tr
                          key={res.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isCancelled ? 'bg-slate-50/40 text-slate-400' : ''
                          }`}
                        >
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                                isCancelled
                                  ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                              }`}
                            >
                              {isCancelled ? '취소됨' : '확정'}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-slate-900">
                            {res.spaceName}
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-900">{res.date}</div>
                            <span className="text-xs font-bold text-blue-700">
                              {res.startTime} ~ {res.endTime}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-slate-900">{res.userName}</span>
                            {res.department && (
                              <span className="text-xs text-slate-500 block font-medium">
                                {res.department}
                              </span>
                            )}
                          </td>
                          <td className="p-4 max-w-xs truncate text-slate-800 font-medium">
                            {res.purpose}
                          </td>
                          <td className="p-4 text-slate-400 text-xs font-medium">
                            {res.createdAt ? new Date(res.createdAt).toLocaleDateString() : '-'}
                          </td>
                          <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => onSelectReservation(res)}
                              className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl transition-all shadow-2xs cursor-pointer"
                            >
                              상세
                            </button>
                            {!isCancelled && (
                              <>
                                <button
                                  onClick={() => onOpenEditReservation(res)}
                                  className="px-3 py-1.5 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/70 rounded-xl transition-all shadow-2xs cursor-pointer"
                                >
                                  수정
                                </button>
                                <button
                                  onClick={() => onOpenCancelReservation(res)}
                                  className="px-3 py-1.5 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/70 rounded-xl transition-all shadow-2xs cursor-pointer"
                                >
                                  강제취소
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Space & Operating Hours */}
      {activeTab === 'spaces' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Space Picker Sidebar */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
            <h4 className="font-bold text-sm text-slate-900 mb-2">공간 선택</h4>
            {spaces.map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedSpaceSettings({ ...s })}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedSpaceSettings.id === s.id
                    ? 'border-blue-500 bg-blue-50/70 shadow-xs ring-1 ring-blue-400/20'
                    : 'border-slate-200/80 hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center border border-slate-200 shadow-2xs text-slate-700">
                    {s.id === 'meeting-room' ? (
                      <DoorClosed className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Tv className="w-5 h-5 text-indigo-600" />
                    )}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">{s.name}</h5>
                    <span className="text-xs text-slate-500 font-medium">
                      {s.openTime} ~ {s.closeTime}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Space Edit Form */}
          <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-2xs">
            <form onSubmit={handleSaveSpaceSettings} className="space-y-5">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <h4 className="text-lg font-bold text-slate-900 tracking-tight">
                  {selectedSpaceSettings.name} 설정 및 운영시간 관리
                </h4>
                {spaceSaveSuccess && (
                  <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 저장 완료
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    공간 명칭
                  </label>
                  <input
                    type="text"
                    value={selectedSpaceSettings.name}
                    onChange={(e) =>
                      setSelectedSpaceSettings({ ...selectedSpaceSettings, name: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    위치 (교내 호실)
                  </label>
                  <input
                    type="text"
                    value={selectedSpaceSettings.location}
                    onChange={(e) =>
                      setSelectedSpaceSettings({ ...selectedSpaceSettings, location: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    운영 시작 시간 (예약 가능 시작)
                  </label>
                  <input
                    type="time"
                    value={selectedSpaceSettings.openTime}
                    onChange={(e) =>
                      setSelectedSpaceSettings({ ...selectedSpaceSettings, openTime: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    운영 마감 시간 (예약 가능 마감)
                  </label>
                  <input
                    type="time"
                    value={selectedSpaceSettings.closeTime}
                    onChange={(e) =>
                      setSelectedSpaceSettings({ ...selectedSpaceSettings, closeTime: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  수용 인원
                </label>
                <input
                  type="text"
                  value={selectedSpaceSettings.capacity}
                  onChange={(e) =>
                    setSelectedSpaceSettings({ ...selectedSpaceSettings, capacity: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  공간 상세 설명
                </label>
                <textarea
                  rows={3}
                  value={selectedSpaceSettings.description}
                  onChange={(e) =>
                    setSelectedSpaceSettings({ ...selectedSpaceSettings, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={spaceSaveLoading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
                >
                  {spaceSaveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '설정 저장하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: Blocked Dates / Holidays */}
      {activeTab === 'blocked' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Form */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
            <h4 className="font-bold text-base text-slate-900 flex items-center gap-2 tracking-tight">
              <Ban className="w-5 h-5 text-rose-600" />
              휴일 및 사용 불가일 추가
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              학교 행사, 시설 점검, 공휴일 등 예약 접수를 차단할 날짜를 등록합니다.
            </p>

            {blockError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold shadow-2xs">
                {blockError}
              </div>
            )}

            <form onSubmit={handleAddBlockedDate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  날짜 구분 <span className="text-rose-500">*</span>
                </label>
                <CustomSelect
                  value={newBlockType}
                  onChange={(val) => setNewBlockType(val as 'holiday' | 'blocked')}
                  options={[
                    { value: 'holiday', label: '공휴일/학교휴일 (전체 공간 차단 & 빨강 표시)' },
                    { value: 'blocked', label: '특정사유 불가일 (선택 공간 차단 & 회색 표시)' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  불가 날짜
                </label>
                <input
                  type="date"
                  value={newBlockDate}
                  onChange={(e) => setNewBlockDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-2xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  적용 대상 공간
                </label>
                <CustomSelect
                  value={newBlockSpaceId}
                  onChange={(val) => setNewBlockSpaceId(val)}
                  options={[
                    { value: 'all', label: '전체 공간 (회의실 + 시청각실)' },
                    ...spaces.map((s) => ({ value: s.id, label: `${s.name}만 차단` })),
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  차단 사유
                </label>
                <input
                  type="text"
                  value={newBlockReason}
                  onChange={(e) => setNewBlockReason(e.target.value)}
                  placeholder="예: 개교기념일, 시청각실 정기 음향점검"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-2xs"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={blockLoading}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm shadow-rose-500/20 transition-all cursor-pointer"
              >
                {blockLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '불가일 등록하기'}
              </button>
            </form>
          </div>

          {/* Blocked Dates List */}
          <div className="lg:col-span-2 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
            <h4 className="font-bold text-base text-slate-900 tracking-tight">
              등록된 사용 불가일 목록 ({blockedDates.length}건)
            </h4>

            {blockedDates.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm font-medium">
                등록된 휴일 및 사용 불가일이 없습니다.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {blockedDates.map((b) => (
                  <div
                    key={b.id}
                    className="py-3.5 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{b.date}</span>
                        <span className="text-xs text-slate-500 font-medium">
                          ({formatKoreanDate(b.date)})
                        </span>
                        <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-200/60 shadow-2xs">
                          {b.spaceId === 'all'
                            ? '전체 공간'
                            : spaces.find((s) => s.id === b.spaceId)?.name}
                        </span>
                        {b.type === 'holiday' ? (
                          <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-lg shadow-2xs">
                            공휴일/휴일
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-lg shadow-2xs">
                            사용 불가일
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-rose-700 font-semibold mt-1 flex items-center gap-1.5">
                        <Ban className="w-3.5 h-3.5 text-rose-500" />
                        사유: {b.reason}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteBlockedDate(b.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: Password Change */}
      {activeTab === 'password' && (
        <div className="max-w-md mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5">
          <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
            <div className="w-11 h-11 rounded-2xl bg-amber-100/80 border border-amber-200/80 text-amber-700 flex items-center justify-center font-bold shadow-2xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 tracking-tight">관리자 비밀번호 변경</h4>
              <p className="text-xs text-slate-500 font-medium">마스터 관리자 인증 키를 수정합니다.</p>
            </div>
          </div>

          {pwMessage && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold shadow-2xs ${
                pwMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {pwMessage.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                현재 관리자 비밀번호
              </label>
              <div className="relative">
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all shadow-2xs"
                  placeholder="현재 비밀번호"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title={showCurrentPw ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                새 관리자 비밀번호 (4자 이상)
              </label>
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all shadow-2xs"
                  placeholder="새 비밀번호"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title={showNewPw ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                새 관리자 비밀번호 확인
              </label>
              <div className="relative">
                <input
                  type={showConfirmNewPw ? 'text' : 'password'}
                  value={confirmNewPw}
                  onChange={(e) => setConfirmNewPw(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all shadow-2xs"
                  placeholder="새 비밀번호 재입력"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmNewPw(!showConfirmNewPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title={showConfirmNewPw ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  {showConfirmNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={pwLoading}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm shadow-slate-900/20 transition-all cursor-pointer"
            >
              {pwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '비밀번호 변경'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
