import { useState, useEffect } from 'react';
import {
  Building2,
  DoorClosed,
  Tv,
  Search,
  ShieldCheck,
  LogOut,
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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-2.5 lg:py-0 lg:h-20 gap-2 lg:gap-4">
          {/* Logo & School Name */}
          <div className="flex items-center justify-between">
            <div
              id="brand-logo-button"
              onClick={onNavigateHome}
              className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer group select-none py-0.5"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onNavigateHome()}
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/10 p-0.5 flex items-center justify-center shadow-md shadow-black/30 border border-white/20 group-hover:scale-105 transition-all shrink-0 overflow-hidden">
                <img
                  src="/app-icon.png"
                  alt="한양과학기술고등학교 공간 예약 시스템 아이콘"
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== window.location.origin + '/icon.png') {
                      target.src = '/icon.png';
                    } else {
                      target.style.display = 'none';
                      if (target.nextElementSibling) {
                        (target.nextElementSibling as HTMLElement).style.display = 'flex';
                      }
                    }
                  }}
                />
                <div style={{ display: 'none' }} className="w-full h-full items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-white group-hover:text-blue-200 transition-colors flex items-center gap-1.5 sm:gap-2">
                  <span className="whitespace-nowrap">한양과학기술고등학교</span>
                  <span className="text-slate-600 hidden sm:inline">|</span>
                  <span className="font-normal text-slate-300 text-xs sm:text-sm hidden xs:inline whitespace-nowrap">
                    공간 예약 시스템
                  </span>
                  {isAdminLoggedIn && (
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-500/40 ml-1 whitespace-nowrap">
                      관리자
                    </span>
                  )}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-blue-400 uppercase whitespace-nowrap">
                    HANYANG SCIENCE AND TECHNOLOGY HIGH SCHOOL
                  </span>
                </div>
              </div>
            </div>

            {/* Admin Logout icon on mobile/tablet header if logged in */}
            {isAdminLoggedIn && (
              <button
                onClick={onAdminLogout}
                title="관리자 로그아웃"
                className="lg:hidden p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors text-xs flex items-center gap-1 border border-slate-800"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="text-[11px]">로그아웃</span>
              </button>
            )}
          </div>

          {/* Navigation & Actions */}
          <div className="flex items-center justify-between lg:justify-end gap-2 sm:gap-3 w-full lg:w-auto py-0.5">
            {/* Live Clock on large screens */}
            <div className="hidden xl:flex items-center text-xs font-medium text-slate-300 bg-slate-800/90 px-3.5 py-1.5 rounded-xl border border-slate-700/80 shadow-xs shrink-0 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-2.5"></span>
              {currentDateTime}
            </div>

            {/* Nav Menu Tabs */}
            <nav className="flex items-center gap-1 sm:gap-2 w-full lg:w-auto justify-between lg:justify-start">
              <button
                id="nav-home-btn"
                onClick={onNavigateHome}
                className={`flex-1 lg:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  currentView === 'home'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Home className="w-4 h-4 shrink-0" />
                <span>홈</span>
              </button>

              <button
                id="nav-meeting-btn"
                onClick={() => onSelectSpace('meeting-room')}
                className={`flex-1 lg:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  currentView === 'space' && selectedSpaceId === 'meeting-room'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <DoorClosed className="w-4 h-4 shrink-0" />
                <span>회의실</span>
              </button>

              <button
                id="nav-audiovisual-btn"
                onClick={() => onSelectSpace('audiovisual-room')}
                className={`flex-1 lg:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  currentView === 'space' && selectedSpaceId === 'audiovisual-room'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Tv className="w-4 h-4 shrink-0" />
                <span>시청각실</span>
              </button>

              <button
                id="nav-lookup-btn"
                onClick={onOpenLookup}
                className={`flex-1 lg:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  currentView === 'lookup'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                title="예약 조회 및 수정/취소"
              >
                <Search className="w-4 h-4 shrink-0" />
                <span>예약 조회</span>
              </button>

              {isAdminLoggedIn && (
                <div className="hidden lg:flex items-center gap-2">
                  <button
                    id="nav-admin-dashboard-btn"
                    onClick={onOpenAdmin}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                      currentView === 'admin'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>대시보드</span>
                  </button>
                  <button
                    id="admin-logout-btn"
                    onClick={onAdminLogout}
                    title="관리자 로그아웃"
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
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

