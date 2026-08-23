import { useState, useEffect } from 'react';
import {
  CalendarDays,
  DoorClosed,
  Tv,
  Search,
  ShieldCheck,
  LogOut,
  Building2,
  Home,
} from 'lucide-react';
import { SpaceId } from '../types';

interface HeaderProps {
  currentView: 'home' | 'space' | 'lookup' | 'admin';
  selectedSpaceId: SpaceId | null;
  onNavigateHome: () => void;
  onSelectSpace: (spaceId: SpaceId) => void;
  onOpenLookup: () => void;
  onOpenAdmin: () => void;
  isAdminLoggedIn: boolean;
  onAdminLogout: () => void;
}

export default function Header({
  currentView,
  selectedSpaceId,
  onNavigateHome,
  onSelectSpace,
  onOpenLookup,
  onOpenAdmin,
  isAdminLoggedIn,
  onAdminLogout,
}: HeaderProps) {
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const date = String(now.getDate()).padStart(2, '0');
      const days = ['일', '월', '화', '수', '목', '금', '토'];
      const day = days[now.getDay()];
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentDateTime(`${year}.${month}.${date} (${day}) ${hours}:${minutes}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md text-white shadow-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & School Name */}
          <div
            id="brand-logo-button"
            onClick={onNavigateHome}
            className="flex items-center gap-3.5 cursor-pointer group select-none"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onNavigateHome()}
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 border border-blue-400/30 group-hover:scale-105 transition-all">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-wider text-blue-400 uppercase">
                  Hanyang Science & Tech High School
                </span>
                {isAdminLoggedIn && (
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/40">
                    관리자 모드
                  </span>
                )}
              </div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white group-hover:text-blue-200 transition-colors flex items-center gap-2 flex-wrap">
                <span>한양과학기술고등학교</span>
                <span className="text-slate-500 hidden sm:inline">|</span>
                <span className="font-medium text-slate-300 text-xs sm:text-sm">회의실 · 시청각실 공간 예약 시스템</span>
              </h1>
            </div>
          </div>

          {/* Navigation & Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Live Clock on desktop */}
            <div className="hidden xl:flex items-center text-xs font-medium text-slate-300 bg-slate-800/90 px-3.5 py-1.5 rounded-xl border border-slate-700/80 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-2.5"></span>
              {currentDateTime}
            </div>

            {/* Nav Menu */}
            <nav className="flex items-center gap-2 sm:gap-3.5">
              <button
                id="nav-home-btn"
                onClick={onNavigateHome}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm sm:text-base font-bold transition-all ${
                  currentView === 'home'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Home className="w-4.5 h-4.5" />
                <span>홈</span>
              </button>

              <button
                id="nav-meeting-btn"
                onClick={() => onSelectSpace('meeting-room')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm sm:text-base font-bold transition-all ${
                  currentView === 'space' && selectedSpaceId === 'meeting-room'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <DoorClosed className="w-4.5 h-4.5" />
                <span>회의실</span>
              </button>

              <button
                id="nav-audiovisual-btn"
                onClick={() => onSelectSpace('audiovisual-room')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm sm:text-base font-bold transition-all ${
                  currentView === 'space' && selectedSpaceId === 'audiovisual-room'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Tv className="w-4.5 h-4.5" />
                <span>시청각실</span>
              </button>

              <button
                id="nav-lookup-btn"
                onClick={onOpenLookup}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm sm:text-base font-bold transition-all ${
                  currentView === 'lookup'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                title="예약 조회 및 수정/취소"
              >
                <Search className="w-4.5 h-4.5" />
                <span>예약 조회</span>
              </button>

              {isAdminLoggedIn && (
                <div className="flex items-center gap-2">
                  <button
                    id="nav-admin-dashboard-btn"
                    onClick={onOpenAdmin}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm sm:text-base font-bold transition-all ${
                      currentView === 'admin'
                        ? 'bg-amber-600 text-white shadow-sm shadow-amber-500/30'
                        : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                    }`}
                  >
                    <ShieldCheck className="w-4.5 h-4.5" />
                    <span>관리자 대시보드</span>
                  </button>
                  <button
                    id="admin-logout-btn"
                    onClick={onAdminLogout}
                    title="관리자 로그아웃"
                    className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4.5 h-4.5" />
                  </button>
                </div>
              )}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
