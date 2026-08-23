import { useState, type FormEvent } from 'react';
import { api } from '../../services/api';
import {
  X,
  ShieldCheck,
  Lock,
  AlertCircle,
  Loader2,
  KeyRound,
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
      onClick={onClose}
    >
      <div
        id="admin-login-content"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-900/10 w-full max-w-md overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30 flex items-center justify-center font-bold shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-amber-300 font-bold uppercase tracking-wider block">
                Administrator
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight">관리자 로그인</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            한양과학기술고등학교 시설 관리자 전용 인증 화면입니다. 관리자 비밀번호를 입력해주세요.
          </p>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 shadow-2xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              관리자 비밀번호
            </label>
            <input
              id="admin-password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="관리자 비밀번호 입력"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-mono transition-all shadow-2xs"
              autoFocus
              required
            />
          </div>

          {/* Quick Demo Hint */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 text-slate-500 text-xs flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-1.5 font-medium text-slate-600">
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              <span>기본 관리자 비밀번호:</span>
            </div>
            <code className="bg-slate-200/80 px-2.5 py-0.5 rounded-lg font-mono font-bold text-slate-800 border border-slate-300/60 shadow-2xs">
              admin1234
            </code>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
            >
              닫기
            </button>
            <button
              id="admin-login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-slate-900/20 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  인증 중...
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
