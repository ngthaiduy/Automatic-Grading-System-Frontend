import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { verifyResetTokenApi, resetPasswordApi } from '../../services/authApi';

/**
 * ResetPassword — /reset-password?token=UUID
 *
 * Flow:
 *  1. On mount → GET /api/auth/verify-reset-token?token=<UUID>
 *     - 'verifying' → spinner
 *     - Error → 'invalid' or 'expired' state (no form shown)
 *     - OK → 'form' state (show password inputs)
 *  2. Submit form → POST /api/auth/reset-password { token, newPassword, confirmPassword }
 *     - OK → 'success' state
 *     - Error → show inline error
 */

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  // 'verifying' | 'form' | 'invalid' | 'expired' | 'submitting' | 'success'
  const [pageState, setPageState] = useState('verifying');
  const [tokenError, setTokenError] = useState('');

  const [newPassword, setNewPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew]               = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);
  const [formError, setFormError]           = useState('');

  // ── Verify token on mount ──
  useEffect(() => {
    if (!token) {
      setTokenError('Không tìm thấy token trong URL. Vui lòng kiểm tra lại link.');
      setPageState('invalid');
      return;
    }

    verifyResetTokenApi(token)
      .then(() => setPageState('form'))
      .catch((err) => {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.errors?.[0] ||
          'Link khôi phục không hợp lệ.';
        const status = err?.response?.status;
        if (status === 401 && msg.toLowerCase().includes('hết hạn')) {
          setPageState('expired');
        } else {
          setPageState('invalid');
        }
        setTokenError(msg);
      });
  }, [token]);

  // ── Submit new password ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!PASSWORD_REGEX.test(newPassword)) {
      setFormError('Mật khẩu phải có ít nhất 8 ký tự, gồm chữ in hoa, số và ký tự đặc biệt.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError('Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      setPageState('submitting');
      await resetPasswordApi(token, newPassword, confirmPassword);
      setPageState('success');
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0] ||
        'Đặt lại mật khẩu thất bại. Vui lòng thử lại.';
      setFormError(msg);
      setPageState('form');
    }
  };

  // ── LEFT PANEL (shared) ──
  const LeftPanel = () => (
    <div className="hidden lg:flex w-1/2 h-full flex-col relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#180800] via-[#0C0C0F] to-[#0C0C0F]" />
        <div className="absolute -top-32 -left-32 w-[560px] h-[560px] bg-orange-500/[0.07] rounded-full blur-[140px]" />
        <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-sky-500/[0.04] rounded-full blur-[120px]" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />
      </div>

      <div className="relative flex flex-col h-full px-14 py-12">
        {/* Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-amber-400 rounded-lg flex items-center justify-center shadow-md shadow-primary/30">
            <span className="material-symbols-outlined text-white text-lg">terminal</span>
          </div>
          <div>
            <p className="text-white text-sm font-black tracking-tight leading-none">Chấm điểm Java OOP</p>
            <p className="text-white/30 text-[10px] mt-0.5 uppercase tracking-widest">FPT University</p>
          </div>
        </div>

        {/* Hero */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-primary/40" />
                <span className="w-2 h-2 rounded-full bg-primary/20" />
              </div>
              <span className="text-primary text-xs font-bold tracking-[0.18em] uppercase">Khôi phục mật khẩu</span>
            </div>

            <div>
              <h1 className="text-white font-black leading-[1.06] tracking-tight" style={{ fontSize: 'clamp(2.2rem, 3vw, 3rem)' }}>
                Đặt lại<br />
                mật khẩu<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-amber-300">
                  an toàn.
                </span>
              </h1>
              <p className="text-white/40 text-[15px] leading-relaxed mt-5 max-w-[320px]">
                Tạo mật khẩu mới đủ mạnh để bảo vệ tài khoản học tập của bạn.
              </p>
            </div>

            {/* Password requirements */}
            <div className="space-y-2.5">
              {[
                { icon: 'check_circle', text: 'Ít nhất 8 ký tự' },
                { icon: 'check_circle', text: 'Có ít nhất 1 chữ in hoa (A-Z)' },
                { icon: 'check_circle', text: 'Có ít nhất 1 chữ số (0-9)' },
                { icon: 'check_circle', text: 'Có ít nhất 1 ký tự đặc biệt (!@#...)' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary/60 text-[16px]">{icon}</span>
                  <span className="text-white/40 text-sm">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex-shrink-0 pt-8 border-t border-white/[0.07]">
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: 'Bảo mật', label: 'BCrypt hashed' },
              { value: '24h', label: 'Link hết hạn' },
              { value: 'FPT', label: 'Chính thống' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-white font-black text-xl tracking-tight">{value}</p>
                <p className="text-white/30 text-[10px] mt-0.5 leading-tight">{label}</p>
              </div>
            ))}
          </div>
          <p className="text-white/20 text-[10px] mt-6 text-center tracking-wider uppercase">
            © 2026 FPT University · Hệ thống Chấm điểm Java OOP
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen overflow-hidden flex font-display bg-[#0C0C0F]">
      <LeftPanel />

      {/* ═══ RIGHT PANEL ═══ */}
      <div className="flex-1 h-full bg-[#0f1014] flex flex-col relative">

        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.07] bg-[linear-gradient(rgba(243,112,33,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(243,112,33,0.4)_1px,transparent_1px)] bg-[size:40px_40px]" />

        {/* Top bar */}
        <div className="relative flex-shrink-0 flex items-center justify-between px-10 py-5 border-b border-gray-800">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-white text-sm font-semibold transition-colors group">
            <span className="material-symbols-outlined text-base group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
            Đăng nhập
          </Link>
          <Link to="/forgot-password" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
            Yêu cầu link mới →
          </Link>
        </div>

        {/* Form area */}
        <div className="relative flex-1 flex items-center justify-center overflow-y-auto px-8 py-8">
          <div className="w-full max-w-[420px]">

            {/* ── Verifying ── */}
            {pageState === 'verifying' && (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-6">
                  <span className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin block" />
                </div>
                <p className="text-white font-bold text-lg mb-2">Đang kiểm tra link...</p>
                <p className="text-gray-500 text-sm">Vui lòng chờ trong giây lát</p>
              </div>
            )}

            {/* ── Invalid token ── */}
            {pageState === 'invalid' && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-xl bg-red-900/20 border border-red-500/30 flex items-center justify-center mx-auto mb-7">
                  <span className="material-symbols-outlined text-red-400 text-4xl">link_off</span>
                </div>
                <h2 className="text-white font-black text-2xl tracking-tight mb-3">Link không hợp lệ</h2>
                <p className="text-gray-400 text-[15px] leading-relaxed mb-2">{tokenError}</p>
                <p className="text-gray-600 text-sm mb-10">Link có thể đã được sử dụng hoặc không đúng định dạng.</p>
                <Link to="/forgot-password" className="w-full h-[52px] bg-primary hover:bg-[#ff8c42] text-white rounded-xl font-black text-[15px] flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 shadow-xl shadow-primary/20">
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                  Yêu cầu link mới
                </Link>
              </div>
            )}

            {/* ── Expired token ── */}
            {pageState === 'expired' && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-xl bg-amber-900/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-7">
                  <span className="material-symbols-outlined text-amber-400 text-4xl">timer_off</span>
                </div>
                <h2 className="text-white font-black text-2xl tracking-tight mb-3">Link đã hết hạn</h2>
                <p className="text-gray-400 text-[15px] leading-relaxed mb-2">{tokenError}</p>
                <p className="text-gray-600 text-sm mb-10">Link khôi phục chỉ có hiệu lực trong 24 giờ kể từ khi gửi.</p>
                <div className="space-y-3">
                  <Link to="/forgot-password" className="w-full h-[52px] bg-primary hover:bg-[#ff8c42] text-white rounded-xl font-black text-[15px] flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 shadow-xl shadow-primary/20">
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    Gửi lại link khôi phục
                  </Link>
                  <Link to="/login" className="w-full h-[52px] border border-gray-700 hover:border-primary/50 rounded-xl font-bold text-[15px] text-gray-400 hover:text-primary flex items-center justify-center gap-2 transition-all">
                    <span className="material-symbols-outlined text-[17px]">arrow_back</span>
                    Quay lại đăng nhập
                  </Link>
                </div>
              </div>
            )}

            {/* ── Form ── */}
            {(pageState === 'form' || pageState === 'submitting') && (
              <>
                <div className="mb-10">
                  <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs font-bold px-3 py-1.5 rounded-xl mb-5 tracking-wide">
                    <span className="material-symbols-outlined text-[14px]">lock_reset</span>
                    Đặt lại mật khẩu
                  </div>
                  <h2 className="text-white font-black tracking-tight leading-tight mb-2.5" style={{ fontSize: '1.9rem' }}>
                    Mật khẩu mới
                  </h2>
                  <p className="text-gray-400 text-[15px] leading-relaxed">
                    Nhập mật khẩu mới cho tài khoản của bạn. Đảm bảo đủ mạnh và không chia sẻ với ai.
                  </p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                  {/* New password */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.14em]">
                      Mật khẩu mới
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-gray-600 group-focus-within:text-primary text-[18px] transition-colors">lock</span>
                      </span>
                      <input
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Tối thiểu 8 ký tự"
                        required
                        disabled={pageState === 'submitting'}
                        className="w-full h-[52px] pl-11 pr-12 bg-gray-900/80 border border-gray-700 rounded-xl text-[15px] text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/70 focus:shadow-[0_0_0_3px_rgba(243,112,33,0.1)] transition-all disabled:opacity-50"
                      />
                      <button type="button" onClick={() => setShowNew(!showNew)} className="absolute inset-y-0 right-4 flex items-center text-gray-600 hover:text-gray-300 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">{showNew ? 'visibility' : 'visibility_off'}</span>
                      </button>
                    </div>
                    {/* Strength hint */}
                    {newPassword && (
                      <p className={`text-xs mt-1 ${PASSWORD_REGEX.test(newPassword) ? 'text-green-400' : 'text-amber-400'}`}>
                        {PASSWORD_REGEX.test(newPassword)
                          ? '✓ Mật khẩu đủ mạnh'
                          : '⚠ Chưa đủ yêu cầu — cần chữ in hoa, số và ký tự đặc biệt'}
                      </p>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.14em]">
                      Xác nhận mật khẩu
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-gray-600 group-focus-within:text-primary text-[18px] transition-colors">lock_clock</span>
                      </span>
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu"
                        required
                        disabled={pageState === 'submitting'}
                        className="w-full h-[52px] pl-11 pr-12 bg-gray-900/80 border border-gray-700 rounded-xl text-[15px] text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/70 focus:shadow-[0_0_0_3px_rgba(243,112,33,0.1)] transition-all disabled:opacity-50"
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute inset-y-0 right-4 flex items-center text-gray-600 hover:text-gray-300 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">{showConfirm ? 'visibility' : 'visibility_off'}</span>
                      </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-xs mt-1 text-red-400">✗ Mật khẩu chưa khớp</p>
                    )}
                    {confirmPassword && newPassword === confirmPassword && (
                      <p className="text-xs mt-1 text-green-400">✓ Mật khẩu khớp</p>
                    )}
                  </div>

                  {/* Form error */}
                  {formError && (
                    <div className="flex items-start gap-3 px-4 py-3 bg-red-900/20 border border-red-500/30 rounded-xl">
                      <span className="material-symbols-outlined text-red-400 text-[18px] flex-shrink-0 mt-0.5">error</span>
                      <p className="text-red-400 text-sm font-medium leading-snug">{formError}</p>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={pageState === 'submitting'}
                    className="w-full h-[54px] bg-primary hover:bg-[#ff8c42] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-black text-[15px] tracking-wide transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5 shadow-xl shadow-primary/20"
                  >
                    {pageState === 'submitting' ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">save</span>
                        Đặt lại mật khẩu
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* ── Success ── */}
            {pageState === 'success' && (
              <div className="text-center">
                <div className="w-20 h-20 rounded-xl bg-green-900/20 border border-green-500/30 flex items-center justify-center mx-auto mb-8">
                  <span className="material-symbols-outlined text-green-400 text-4xl">check_circle</span>
                </div>
                <h2 className="text-white font-black text-2xl tracking-tight mb-3">Đặt lại thành công!</h2>
                <p className="text-gray-400 text-[15px] leading-relaxed mb-10">
                  Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập ngay bây giờ.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full h-[54px] bg-primary hover:bg-[#ff8c42] text-white rounded-xl font-black text-[15px] transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2.5 shadow-xl shadow-primary/20"
                >
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  Đăng nhập ngay
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Bottom note */}
        <div className="relative flex-shrink-0 text-center py-4 border-t border-gray-800">
          <p className="text-gray-600 text-xs">
            Chỉ dành cho sinh viên & cán bộ{' '}
            <span className="font-bold text-gray-500">FPT University</span>
          </p>
        </div>

      </div>
    </div>
  );
};

export default ResetPassword;
