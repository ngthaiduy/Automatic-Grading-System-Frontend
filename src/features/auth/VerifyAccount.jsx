import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { verifyAccountApi } from '../../services/authApi';

/**
 * VerifyAccount — /verify-account?token=JWT
 *
 * Flow:
 *  1. On mount → GET /api/auth/verify-account?token=<JWT> (auto, no user action)
 *     - 'loading' → spinner
 *     - OK       → 'success' state
 *     - Error    → 'error' state (token hết hạn / sai / không tìm thấy user)
 */
const VerifyAccount = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  // 'loading' | 'success' | 'error'
  const [pageState, setPageState] = useState('loading');
  const [errorMsg, setErrorMsg]   = useState('');

  useEffect(() => {
    if (!token) {
      setErrorMsg('Không tìm thấy token trong URL. Vui lòng kiểm tra lại link email.');
      setPageState('error');
      return;
    }

    verifyAccountApi(token)
      .then(() => setPageState('success'))
      .catch((err) => {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.errors?.[0] ||
          'Link kích hoạt không hợp lệ hoặc đã hết hạn.';
        setErrorMsg(msg);
        setPageState('error');
      });
  }, [token]);

  return (
    <div className="h-screen overflow-hidden flex font-display bg-[#0C0C0F]">

      {/* ═══ LEFT PANEL ═══ */}
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
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="w-2 h-2 rounded-full bg-green-400/40" />
                  <span className="w-2 h-2 rounded-full bg-green-400/20" />
                </div>
                <span className="text-green-400 text-xs font-bold tracking-[0.18em] uppercase">Xác thực tài khoản</span>
              </div>

              <div>
                <h1 className="text-white font-black leading-[1.06] tracking-tight" style={{ fontSize: 'clamp(2.2rem, 3vw, 3rem)' }}>
                  Kích hoạt<br />
                  tài khoản<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-amber-300">
                    của bạn.
                  </span>
                </h1>
                <p className="text-white/40 text-[15px] leading-relaxed mt-5 max-w-[320px]">
                  Chỉ còn một bước nữa — xác nhận email để bắt đầu hành trình học tập tại FPT University.
                </p>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                {[
                  { icon: 'person_add',     label: 'Tạo tài khoản',      done: true  },
                  { icon: 'mark_email_read', label: 'Xác thực email',     done: true  },
                  { icon: 'login',           label: 'Đăng nhập & sử dụng', done: false },
                ].map(({ icon, label, done }, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${done ? 'bg-green-400/15 border border-green-400/30' : 'bg-white/5 border border-white/10'}`}>
                      <span className={`material-symbols-outlined text-[15px] ${done ? 'text-green-400' : 'text-white/25'}`}>{icon}</span>
                    </div>
                    <span className={`text-sm font-semibold ${done ? 'text-white/70' : 'text-white/25'}`}>{label}</span>
                    {done && <span className="material-symbols-outlined text-green-400/70 text-[14px] ml-auto">check</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex-shrink-0 pt-8 border-t border-white/[0.07]">
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: 'Email', label: 'Xác thực FPT' },
                { value: 'JWT',   label: 'Link bảo mật' },
                { value: 'FPT',   label: 'Chính thống'  },
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

      {/* ═══ RIGHT PANEL ═══ */}
      <div className="flex-1 h-full bg-[#0f1014] flex flex-col relative">

        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.07] bg-[linear-gradient(rgba(243,112,33,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(243,112,33,0.4)_1px,transparent_1px)] bg-[size:40px_40px]" />

        {/* Top bar */}
        <div className="relative flex-shrink-0 flex items-center justify-between px-10 py-5 border-b border-gray-800">
          <Link to="/" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-white text-sm font-semibold transition-colors group">
            <span className="material-symbols-outlined text-base group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
            Trang chủ
          </Link>
          <Link to="/register" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
            Tạo tài khoản mới →
          </Link>
        </div>

        {/* Content area */}
        <div className="relative flex-1 flex items-center justify-center px-8 py-8">
          <div className="w-full max-w-[420px] text-center">

            {/* ── Loading ── */}
            {pageState === 'loading' && (
              <>
                <div className="relative w-24 h-24 mx-auto mb-8">
                  {/* Outer ring */}
                  <div className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20" />
                  {/* Spinner */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="w-10 h-10 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin block" />
                  </div>
                </div>
                <h2 className="text-white font-black text-2xl tracking-tight mb-3">Đang kích hoạt...</h2>
                <p className="text-gray-400 text-[15px] leading-relaxed">
                  Hệ thống đang xác thực link kích hoạt của bạn. Vui lòng chờ trong giây lát.
                </p>
                {/* Animated dots */}
                <div className="flex items-center justify-center gap-2 mt-8">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full bg-primary/50 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </>
            )}

            {/* ── Success ── */}
            {pageState === 'success' && (
              <>
                {/* Icon with glow ring */}
                <div className="relative w-24 h-24 mx-auto mb-8">
                  <div className="absolute inset-0 rounded-xl bg-green-900/20 border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.1)]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-green-400 text-5xl">verified_user</span>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 bg-green-900/20 border border-green-500/30 text-green-400 text-xs font-bold px-3 py-1.5 rounded-xl mb-5 tracking-wide">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Xác thực thành công
                </div>

                <h2 className="text-white font-black text-3xl tracking-tight mb-3">
                  Chào mừng bạn! 🎉
                </h2>
                <p className="text-gray-400 text-[15px] leading-relaxed mb-2">
                  Tài khoản đã được kích hoạt thành công.
                </p>
                <p className="text-gray-600 text-sm mb-10">
                  Bạn có thể đăng nhập ngay để bắt đầu sử dụng Hệ thống Chấm điểm Java OOP.
                </p>

                <button
                  onClick={() => navigate('/login')}
                  className="w-full h-[54px] bg-primary hover:bg-[#ff8c42] text-white rounded-xl font-black text-[15px] tracking-wide transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5 shadow-xl shadow-primary/20 mb-3"
                >
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  Đăng nhập ngay
                </button>
                <Link
                  to="/"
                  className="w-full h-[52px] border border-gray-700 hover:border-primary/50 rounded-xl font-bold text-[15px] text-gray-400 hover:text-primary flex items-center justify-center gap-2 transition-all"
                >
                  <span className="material-symbols-outlined text-[17px]">home</span>
                  Về trang chủ
                </Link>
              </>
            )}

            {/* ── Error ── */}
            {pageState === 'error' && (
              <>
                <div className="relative w-24 h-24 mx-auto mb-8">
                  <div className="absolute inset-0 rounded-xl bg-red-900/20 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.08)]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-red-400 text-5xl">gpp_bad</span>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 bg-red-900/20 border border-red-500/30 text-red-400 text-xs font-bold px-3 py-1.5 rounded-xl mb-5 tracking-wide">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  Kích hoạt thất bại
                </div>

                <h2 className="text-white font-black text-2xl tracking-tight mb-3">Link không hợp lệ</h2>
                <p className="text-gray-400 text-[15px] leading-relaxed mb-2">{errorMsg}</p>
                <p className="text-gray-600 text-sm mb-10">
                  Link kích hoạt chỉ có hiệu lực trong <span className="text-gray-500 font-semibold">24 giờ</span> sau khi đăng ký. Nếu link hết hạn, hãy đăng ký lại.
                </p>

                <div className="space-y-3">
                  <Link
                    to="/register"
                    className="w-full h-[54px] bg-primary hover:bg-[#ff8c42] text-white rounded-xl font-black text-[15px] transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2.5 shadow-xl shadow-primary/20"
                  >
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                    Đăng ký lại
                  </Link>
                  <Link
                    to="/login"
                    className="w-full h-[52px] border border-gray-700 hover:border-primary/50 rounded-xl font-bold text-[15px] text-gray-400 hover:text-primary flex items-center justify-center gap-2 transition-all"
                  >
                    <span className="material-symbols-outlined text-[17px]">login</span>
                    Thử đăng nhập
                  </Link>
                </div>
              </>
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

export default VerifyAccount;
