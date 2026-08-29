import { useState, useRef, type FormEvent } from 'react';
import { api } from '../../services/api';
import {
  X,
  ShieldCheck,
  Lock,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export default function AdminLoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
}: AdminLoginModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMessage('관리자 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      await api.adminLogin(password.trim());
      onLoginSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || '관리자 비밀번호가 일치하지 않습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="admin-login-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        id="admin-login-content"
        className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-900/10 w-full max-w-md overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30 flex items-center justify-center font-bold shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs sm:text-[13px] text-amber-300 font-bold uppercase tracking-wider block">
                Administrator
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">관리자 로그인</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-6">
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
            한양과학기술고등학교 시설 관리자 전용 인증 화면입니다. 관리자 비밀번호를 입력해주세요.
          </p>

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-800 text-sm sm:text-base font-semibold flex items-center gap-2.5 shadow-2xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-[15px] sm:text-base font-semibold text-slate-800 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-600" />
              <span>관리자 비밀번호</span>
            </label>
            <div className="relative">
              <input
                id="admin-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="관리자 비밀번호 입력"
                className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 text-base text-slate-900 placeholder:text-[15px] sm:placeholder:text-base bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all shadow-2xs"
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 text-base font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
            >
              닫기
            </button>
            <button
              id="admin-login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="px-7 py-3 rounded-xl text-base sm:text-[17px] font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-slate-900/20 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>인증 중...</span>
                </>
              ) : (
                '로그인'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
