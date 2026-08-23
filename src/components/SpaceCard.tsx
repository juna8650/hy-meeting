import { Space, Reservation } from '../types';
import {
  Users,
  Clock,
  MapPin,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Tv,
  DoorClosed,
  Sparkles,
} from 'lucide-react';

interface SpaceCardProps {
  key?: string;
  space: Space;
  todayReservations: Reservation[];
  onSelect: () => void;
}

export default function SpaceCard({ space, todayReservations, onSelect }: SpaceCardProps) {
  const isMeeting = space.id === 'meeting-room';

  return (
    <div
      id={`space-card-${space.id}`}
      className={`group relative bg-white rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-xl hover:-translate-y-1 ${
        isMeeting
          ? 'border-slate-200 hover:border-blue-300'
          : 'border-slate-200 hover:border-indigo-300'
      }`}
    >
      {/* Top Accent Gradient Bar */}
      <div
        className={`h-2.5 w-full bg-gradient-to-r ${
          isMeeting
            ? 'from-blue-600 via-sky-500 to-blue-700'
            : 'from-indigo-600 via-purple-500 to-indigo-700'
        }`}
      />

      <div className="p-6 sm:p-8 flex-1 flex flex-col">
        {/* Header with Icon & Title */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-4">
            <div
              className={`w-[58px] h-[58px] sm:w-[62px] sm:h-[62px] rounded-2xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 shrink-0 ${
                isMeeting
                  ? 'bg-blue-50 text-blue-600 border border-blue-200/80'
                  : 'bg-indigo-50 text-indigo-600 border border-indigo-200/80'
              }`}
            >
              {isMeeting ? <DoorClosed className="w-8 h-8" /> : <Tv className="w-8 h-8" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-600 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {space.location}
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5">{space.name}</h3>
            </div>
          </div>
 
          <span className="text-sm sm:text-base font-bold text-slate-800 bg-slate-100 px-3.5 py-2 rounded-2xl flex items-center gap-2 border border-slate-200">
            <Users className="w-4.5 h-4.5 text-slate-600" />
            {space.capacity}
          </span>
        </div>
 
        {/* Short Description */}
        <p className="text-slate-700 text-sm sm:text-base leading-relaxed mb-6 font-semibold">
          {space.shortDescription}
        </p>
 
        {/* Space Specs & Operating Hours */}
        <div className="bg-slate-50/90 rounded-2xl p-5 border border-slate-200/80 mb-6 space-y-3.5">
          <div className="flex items-center justify-between text-sm sm:text-base">
            <span className="text-slate-600 flex items-center gap-2 font-semibold">
              <Clock className="w-4.5 h-4.5 text-slate-400" /> 운영 시간
            </span>
            <span className="font-semibold text-slate-800">
              {space.openTime} ~ {space.closeTime}
            </span>
          </div>
 
          <div className="flex items-center justify-between text-sm sm:text-base">
            <span className="text-slate-600 flex items-center gap-2 font-semibold">
              <Calendar className="w-4.5 h-4.5 text-slate-400" /> 오늘 예약 현황
            </span>
            <span
              className={`font-semibold text-sm px-3 py-1 rounded-full border ${
                todayReservations.length > 0
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              {todayReservations.length > 0
                ? `${todayReservations.length}건 확정됨`
                : '오늘 예약 없음 (이용 가능)'}
            </span>
          </div>
        </div>
 
        {/* Equipment Features */}
        <div className="mb-6 flex-1">
          <h4 className="text-xs sm:text-sm font-extrabold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-slate-500" /> 주요 시설 및 구비 물품
          </h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {space.equipment.map((eq, i) => (
              <li key={i} className="text-sm sm:text-base text-slate-700 font-semibold flex items-start gap-2">
                <CheckCircle2
                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                    isMeeting ? 'text-blue-500' : 'text-indigo-500'
                  }`}
                />
                <span className="line-clamp-1">{eq}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Button */}
        <button
          id={`select-space-btn-${space.id}`}
          onClick={onSelect}
          className={`w-full py-3.5 px-6 rounded-2xl font-bold text-white shadow-sm flex items-center justify-center gap-2 text-sm sm:text-base transition-all duration-200 active:scale-[0.99] ${
            isMeeting
              ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-500/20 hover:shadow-blue-500/30'
              : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-indigo-500/20 hover:shadow-indigo-500/30'
          }`}
        >
          <span>{space.name} 예약하기</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
