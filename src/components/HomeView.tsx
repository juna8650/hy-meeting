import { Space, Reservation, SpaceId } from '../types';
import SpaceCard from './SpaceCard';
import {
  CalendarDays,
  Search,
  ShieldCheck,
  Info,
  Clock,
  CheckCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { formatKoreanDate } from '../utils/dateUtils';

interface HomeViewProps {
  spaces: Space[];
  reservations: Reservation[];
  todayStr: string;
  onSelectSpace: (spaceId: SpaceId) => void;
  onOpenLookup: () => void;
  onOpenAdmin: () => void;
  onSelectReservation: (res: Reservation) => void;
}

export default function HomeView({
  spaces,
  reservations,
  todayStr,
  onSelectSpace,
  onOpenLookup,
  onOpenAdmin,
  onSelectReservation,
}: HomeViewProps) {
  // Today's active reservations
  const todayReservations = reservations.filter(
    (r) => r.date === todayStr && r.status === 'confirmed'
  );

  const meetingToday = todayReservations.filter((r) => r.spaceId === 'meeting-room');
  const audioToday = todayReservations.filter((r) => r.spaceId === 'audiovisual-room');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 lg:p-10 border border-slate-700/60 shadow-xl">
        {/* Decorative background grid pattern */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="relative z-10 max-w-5xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 text-blue-300 text-xs font-semibold mb-4 border border-blue-400/30 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            한양과학기술고등학교 교직원 공간 통합 예약
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-3 leading-tight">
            회의실 · 시청각실 공간 예약 시스템
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 font-normal">
            교직원 여러분의 원활한 업무 협의와 교육 활동을 위한 실시간 공간 예약 서비스입니다. 회원가입 없이 예약자명과 비밀번호로 신속하게 예약하고 관리하세요.
          </p>

          {/* Quick buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              id="home-lookup-quick-btn"
              onClick={onOpenLookup}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm border border-white/20 transition-all backdrop-blur-sm shadow-sm"
            >
              <Search className="w-4 h-4 text-blue-300" />
              예약 조회 / 수정 / 취소
            </button>
          </div>
        </div>
      </div>

      {/* Main Section: Space Selection */}
      <section>
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="text-xs sm:text-[13px] font-bold text-blue-700 bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200/80 mb-2.5 inline-block shadow-3xs tracking-wider uppercase">
            SPACE SELECTION
          </span>
          <h2 className="text-2xl sm:text-3xl font-semibold text-slate-800 tracking-tight mt-1">
            예약할 공간을 선택하세요
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-2">
            원하시는 공간을 클릭하시면 월간 / 주간 / 일간 캘린더와 실시간 예약 현황을 확인하실 수 있습니다.
          </p>
        </div>

        {/* Space Cards Grid - 회의실(왼쪽), 시청각실(오른쪽) 순서 고정 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {[...spaces]
            .sort((a, b) => {
              if (a.id === 'meeting-room') return -1;
              if (b.id === 'meeting-room') return 1;
              return 0;
            })
            .map((space) => {
              const spaceToday = reservations.filter(
                (r) => r.spaceId === space.id && r.date === todayStr && r.status === 'confirmed'
              );
              return (
                <SpaceCard
                  key={space.id}
                  space={space}
                  todayReservations={spaceToday}
                  onSelect={() => onSelectSpace(space.id)}
                />
              );
            })}
        </div>
      </section>

      {/* Today's Schedule Overview Section */}
      <section className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 sm:pb-5 border-b border-slate-100 mb-5 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-slate-700 shadow-2xs shrink-0">
              <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h3 className="text-base sm:text-xl font-bold text-slate-900 whitespace-nowrap">
                  오늘의 공간 사용 일정
                </h3>
                <span className="text-xs sm:text-sm font-medium text-slate-600 bg-slate-100 px-2 sm:px-2.5 py-0.5 rounded-full border border-slate-200 shrink-0">
                  {formatKoreanDate(todayStr, true)}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
                총 <strong className="text-slate-800 font-bold">{todayReservations.length}건</strong>의 예약이 확정되어 있습니다.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Meeting Room Today */}
          <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/70">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                회의실 ({meetingToday.length}건)
              </div>
              <button
                onClick={() => onSelectSpace('meeting-room')}
                className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                회의실 캘린더 보기 &rarr;
              </button>
            </div>

            {meetingToday.length === 0 ? (
              <div className="py-8 text-center text-xs sm:text-sm text-slate-400 bg-white/70 rounded-xl border border-dashed border-slate-200 font-normal">
                오늘 등록된 회의실 예약이 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {meetingToday.map((res) => (
                  <div
                    key={res.id}
                    onClick={() => onSelectReservation(res)}
                    className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer flex flex-wrap sm:flex-nowrap items-center gap-3"
                  >
                    <span className="flex items-center gap-1.5 font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-lg border border-blue-100 text-xs sm:text-sm shrink-0">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      {res.startTime} ~ {res.endTime}
                    </span>
                    <span className="text-slate-800 font-semibold text-sm sm:text-base truncate flex-1 min-w-0">
                      {res.department || '과/부서 미지정'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audiovisual Room Today */}
          <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/70">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                시청각실 ({audioToday.length}건)
              </div>
              <button
                onClick={() => onSelectSpace('audiovisual-room')}
                className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                시청각실 캘린더 보기 &rarr;
              </button>
            </div>

            {audioToday.length === 0 ? (
              <div className="py-8 text-center text-xs sm:text-sm text-slate-400 bg-white/70 rounded-xl border border-dashed border-slate-200 font-normal">
                오늘 등록된 시청각실 예약이 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {audioToday.map((res) => (
                  <div
                    key={res.id}
                    onClick={() => onSelectReservation(res)}
                    className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer flex flex-wrap sm:flex-nowrap items-center gap-3"
                  >
                    <span className="flex items-center gap-1.5 font-semibold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg border border-indigo-100 text-xs sm:text-sm shrink-0">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      {res.startTime} ~ {res.endTime}
                    </span>
                    <span className="text-slate-800 font-semibold text-sm sm:text-base truncate flex-1 min-w-0">
                      {res.department || '과/부서 미지정'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* User Guides & Rules */}
      <section className="bg-slate-100/60 rounded-3xl border border-slate-200/80 p-6 sm:p-8">
        <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600" />
          공간 이용 및 예약 안내 수칙
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm text-slate-600">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <h4 className="font-semibold text-slate-900 mb-1.5 flex items-center gap-1.5 text-xs sm:text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> 1. 비밀번호 보관
            </h4>
            <p className="text-slate-500 leading-relaxed text-xs font-normal">
              예약 시 설정한 4자리 이상 비밀번호는 예약 수정 및 취소 시 본인 확인용으로 사용됩니다.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <h4 className="font-semibold text-slate-900 mb-1.5 flex items-center gap-1.5 text-xs sm:text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> 2. 중복 예약 방지
            </h4>
            <p className="text-slate-500 leading-relaxed text-xs font-normal">
              동일 공간의 겹치는 시간대는 시스템에서 실시간으로 자동 차단되므로 안심하고 예약하실 수 있습니다.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <h4 className="font-semibold text-slate-900 mb-1.5 flex items-center gap-1.5 text-xs sm:text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> 3. 사용 후 정리 정돈
            </h4>
            <p className="text-slate-500 leading-relaxed text-xs font-normal">
              기기 전원(빔프로젝터, 음향앰프 등)과 냉난방기 소등, 퇴실 시 출입문 잠금을 준수해 주시기 바랍니다.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
