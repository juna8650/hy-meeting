import { useState, useEffect, useCallback } from 'react';
import { Space, Reservation, BlockedDate, AdminStats, SpaceId } from './types';
import { api } from './services/api';
import { formatDateISO } from './utils/dateUtils';
import Header from './components/Header';
import HomeView from './components/HomeView';
import SpaceReservationView from './components/SpaceReservationView';
import ReservationLookup from './components/ReservationLookup';
import ReservationModal from './components/ReservationModal';
import ReservationSuccessModal from './components/ReservationSuccessModal';
import ReservationDetailModal from './components/ReservationDetailModal';
import ReservationEditModal from './components/ReservationEditModal';
import ReservationCancelModal from './components/ReservationCancelModal';
import AdminLoginModal from './components/Admin/AdminLoginModal';
import AdminDashboard from './components/Admin/AdminDashboard';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';

export default function App() {
  // Current app view
  const [currentView, setCurrentView] = useState<'home' | 'space' | 'lookup' | 'admin'>('home');
  const [selectedSpaceId, setSelectedSpaceId] = useState<SpaceId>('meeting-room');

  // Core Data
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Auth State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);

  // Modals & Active Selections
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingStartTime, setBookingStartTime] = useState<string | undefined>(undefined);

  const [successReservation, setSuccessReservation] = useState<Reservation | null>(null);
  const [detailReservation, setDetailReservation] = useState<Reservation | null>(null);
  const [editReservation, setEditReservation] = useState<Reservation | null>(null);
  const [cancelReservation, setCancelReservation] = useState<Reservation | null>(null);
  const [activeVerifiedPassword, setActiveVerifiedPassword] = useState<string | undefined>(undefined);

  // System Today date
  const todayStr = formatDateISO(new Date());

  // Load all initial data from backend API
  const loadAllData = useCallback(async () => {
    setIsLoadingData(true);
    setDataError(null);
    try {
      const [fetchedSpaces, fetchedReservations, fetchedBlocked, fetchedStats] =
        await Promise.all([
          api.fetchSpaces(),
          api.fetchReservations({ includeCancelled: true }),
          api.fetchBlockedDates(),
          api.fetchStats().catch(() => null),
        ]);

      setSpaces(fetchedSpaces);
      setReservations(fetchedReservations);
      setBlockedDates(fetchedBlocked);
      if (fetchedStats) setStats(fetchedStats);
    } catch (err: any) {
      console.error('Data load error:', err);
      setDataError(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Navigation handlers
  const handleNavigateHome = () => {
    setCurrentView('home');
  };

  const handleSelectSpace = (spaceId: SpaceId) => {
    setSelectedSpaceId(spaceId);
    setCurrentView('space');
  };

  const handleOpenLookup = () => {
    setCurrentView('lookup');
  };

  const handleOpenAdmin = () => {
    if (isAdminLoggedIn) {
      setCurrentView('admin');
    } else {
      setIsAdminLoginModalOpen(true);
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    setCurrentView('admin');
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    if (currentView === 'admin') {
      setCurrentView('home');
    }
  };

  // Booking Flow handlers
  const handleOpenBookingModal = (date: string, defaultStartTime?: string) => {
    setBookingDate(date);
    setBookingStartTime(defaultStartTime);
    setIsBookingModalOpen(true);
  };

  const handleBookingSuccess = (newRes: Reservation) => {
    setIsBookingModalOpen(false);
    setSuccessReservation(newRes);
    loadAllData();
  };

  // Detail / Edit / Cancel handlers
  const handleSelectReservation = (res: Reservation) => {
    setDetailReservation(res);
  };

  const handleOpenEdit = (res: Reservation, verifiedPw?: string) => {
    setDetailReservation(null);
    setEditReservation(res);
    setActiveVerifiedPassword(verifiedPw);
  };

  const handleOpenCancel = (res: Reservation, verifiedPw?: string) => {
    setDetailReservation(null);
    setCancelReservation(res);
    setActiveVerifiedPassword(verifiedPw);
  };

  const handleEditSuccess = (updatedRes: Reservation) => {
    setEditReservation(null);
    setActiveVerifiedPassword(undefined);
    loadAllData();
    // Show updated detail
    setDetailReservation(updatedRes);
  };

  const handleCancelSuccess = () => {
    setCancelReservation(null);
    setActiveVerifiedPassword(undefined);
    loadAllData();
  };

  const activeSpace = spaces.find((s) => s.id === selectedSpaceId) || spaces[0];

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Global Header */}
      <Header
        currentView={currentView}
        selectedSpaceId={selectedSpaceId}
        onNavigateHome={handleNavigateHome}
        onSelectSpace={handleSelectSpace}
        onOpenLookup={handleOpenLookup}
        onOpenAdmin={handleOpenAdmin}
        isAdminLoggedIn={isAdminLoggedIn}
        onAdminLogout={handleAdminLogout}
      />

      {/* Main Container */}
      <main className="flex-1">
        {isLoadingData && spaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            <p className="text-slate-600 font-semibold text-sm">
              한양과학기술고등학교 예약 시스템을 불러오는 중입니다...
            </p>
          </div>
        ) : dataError && spaces.length === 0 ? (
          <div className="max-w-md mx-auto my-16 p-6 bg-white rounded-3xl border border-rose-200 shadow-xl text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">시스템 연결 오류</h3>
            <p className="text-slate-600 text-xs">{dataError}</p>
            <button
              onClick={loadAllData}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <>
            {/* View 1: Home Screen */}
            {currentView === 'home' && (
              <HomeView
                spaces={spaces}
                reservations={reservations}
                todayStr={todayStr}
                onSelectSpace={handleSelectSpace}
                onOpenLookup={handleOpenLookup}
                onOpenAdmin={handleOpenAdmin}
                onSelectReservation={handleSelectReservation}
              />
            )}

            {/* View 2: Space Reservation Page */}
            {currentView === 'space' && activeSpace && (
              <SpaceReservationView
                space={activeSpace}
                allSpaces={spaces}
                reservations={reservations}
                blockedDates={blockedDates}
                todayStr={todayStr}
                onNavigateHome={handleNavigateHome}
                onSelectSpace={handleSelectSpace}
                onOpenBookingModal={handleOpenBookingModal}
                onSelectReservation={handleSelectReservation}
              />
            )}

            {/* View 3: Reservation Search / Lookup */}
            {currentView === 'lookup' && (
              <ReservationLookup
                reservations={reservations}
                spaces={spaces}
                onNavigateHome={handleNavigateHome}
                onSelectReservation={handleSelectReservation}
              />
            )}

            {/* View 4: Admin Dashboard */}
            {currentView === 'admin' && isAdminLoggedIn && (
              <AdminDashboard
                spaces={spaces}
                reservations={reservations}
                blockedDates={blockedDates}
                stats={stats}
                todayStr={todayStr}
                onNavigateHome={handleNavigateHome}
                onRefreshData={loadAllData}
                onSelectReservation={handleSelectReservation}
                onOpenEditReservation={(res) => handleOpenEdit(res, undefined)}
                onOpenCancelReservation={(res) => handleOpenCancel(res, undefined)}
              />
            )}
          </>
        )}
      </main>

      {/* Global Modals */}

      {/* 1. New Reservation Modal */}
      {activeSpace && (
        <ReservationModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          space={activeSpace}
          allSpaces={spaces}
          initialDate={bookingDate || todayStr}
          initialStartTime={bookingStartTime}
          blockedDates={blockedDates}
          onSuccess={handleBookingSuccess}
        />
      )}

      {/* 2. Reservation Success Modal */}
      <ReservationSuccessModal
        isOpen={!!successReservation}
        reservation={successReservation}
        onClose={() => setSuccessReservation(null)}
        onEdit={(res) => handleOpenEdit(res, undefined)}
        onCancel={(res) => handleOpenCancel(res, undefined)}
      />

      {/* 3. Reservation Details Modal */}
      <ReservationDetailModal
        isOpen={!!detailReservation}
        reservation={detailReservation}
        spaces={spaces}
        isAdminLoggedIn={isAdminLoggedIn}
        onClose={() => setDetailReservation(null)}
        onOpenEdit={handleOpenEdit}
        onOpenCancel={handleOpenCancel}
      />

      {/* 4. Reservation Edit Modal */}
      <ReservationEditModal
        isOpen={!!editReservation}
        reservation={editReservation}
        spaces={spaces}
        verifiedPassword={activeVerifiedPassword}
        isAdminLoggedIn={isAdminLoggedIn}
        onClose={() => {
          setEditReservation(null);
          setActiveVerifiedPassword(undefined);
        }}
        onSuccess={handleEditSuccess}
      />

      {/* 5. Reservation Cancel Modal */}
      <ReservationCancelModal
        isOpen={!!cancelReservation}
        reservation={cancelReservation}
        verifiedPassword={activeVerifiedPassword}
        isAdminLoggedIn={isAdminLoggedIn}
        onClose={() => {
          setCancelReservation(null);
          setActiveVerifiedPassword(undefined);
        }}
        onSuccess={handleCancelSuccess}
      />

      {/* 6. Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />

      {/* Global Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">한양과학기술고등학교</span>
            <span className="text-slate-600">|</span>
            <span>회의실·시청각실 공간 예약 관리 시스템</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>교내 행정실 문의: 02-000-0000 (내선 101)</span>
            <button
              onClick={handleOpenAdmin}
              className="text-slate-400 hover:text-slate-200 underline"
            >
              관리자 모드
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
