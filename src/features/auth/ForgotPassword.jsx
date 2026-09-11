import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPasswordApi } from '../../services/authApi';

// Step states: 'input' → 'sent'
const ForgotPassword = () => {
  const [step, setStep] = useState('input'); // 'input' | 'sent'
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    try {
      setLoading(true);
      await forgotPasswordApi(email.trim());
      setStep('sent');
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0] ||
        'Gửi yêu cầu thất bại. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex font-display bg-[#0C0C0F]">

      {/* ═══ LEFT PANEL ═══ */}
      <div className="hidden lg:flex w-1/2 h-full flex-col relative overflow-hidden">

        {/* Background */}
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

          {/* Center content */}
          <div className="flex-1 flex flex-col justify-center space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-2xl">lock_reset</span>
                </div>
              </div>
              <h1 className="text-white font-black leading-tight tracking-tight mb-4" style={{ fontSize: 'clamp(2rem, 3vw, 2.8rem)' }}>
                Lấy lại<br />
                quyền truy cập<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-amber-300">
                  tài khoản.
                </span>
              </h1>
              <p className="text-white/40 text-[15px] leading-relaxed max-w-[300px]">
                Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu qua email đã đăng ký với tài khoản của bạn.
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {[
                { num: '1', text: 'Nhập tên đăng nhập của bạn', done: step === 'sent' },
                { num: '2', text: 'Kiểm tra email được liên kết', done: false },
                { num: '3', text: 'Tạo mật khẩu mới', done: false },
              ].map(({ num, text, done }) => (
                <div key={num} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black transition-all ${
                    done ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/30'
                  }`}>
                    {done
                      ? <span className="material-symbols-outlined text-[14px]">check</span>
                      : num
                    }
                  </div>
                  <p className={`text-sm transition-colors ${done ? 'text-white/60 line-through' : 'text-white/35'}`}>{text}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="relative text-white/20 text-[10px] text-center tracking-wider uppercase">
            © 2026 FPT University · Hệ thống Chấm điểm Java OOP
          </p>
        </div>
      </div>

      {/* ═══ RIGHT PANEL ═══ */}
      <div className="flex-1 h-full bg-[#0f1014] flex flex-col relative">

        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.07] bg-[linear-gradient(rgba(243,112,33,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(243,112,33,0.4)_1px,transparent_1px)] bg-[size:40px_40px]" />

        {/* Top bar */}
        <div className="relative flex-shrink-0 flex items-center justify-between px-10 py-5 border-b border-gray-800">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-gray-500 hover:text-white text-sm font-semibold transition-colors group"
          >
            <span className="material-symbols-outlined text-base group-hover:-translate-x-0.5 transition-transform">
              arrow_back
            </span>
            Quay lại đăng nhập
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Chưa có tài khoản?</span>
            <Link to="/register" className="font-bold text-primary hover:underline underline-offset-2">
              Đăng ký ngay →
            </Link>
          </div>
        </div>

        {/* Form area */}
        <div className="relative flex-1 flex items-center justify-center overflow-y-auto px-8 py-8">
          <div className="w-full max-w-[420px]">

            {step === 'input' ? (
              <>
                {/* Heading */}
                <div className="mb-10">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-primary text-3xl">lock_reset</span>
                  </div>
                  <h2 className="text-white font-black tracking-tight leading-tight mb-2.5" style={{ fontSize: '1.9rem' }}>
                    Quên mật khẩu?
                  </h2>
                  <p className="text-gray-400 text-[15px] leading-relaxed">
                    Nhập tên đăng nhập của bạn — chúng tôi sẽ gửi link đặt lại mật khẩu vào email đã đăng ký.
                  </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.14em]">
                      Email FPT
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-gray-600 group-focus-within:text-primary text-[18px] transition-colors">
                          mail
                        </span>
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="anv@fpt.edu.vn"
                        autoFocus
                        required
                        disabled={loading}
                        className="w-full h-[52px] pl-11 pr-4 bg-gray-900/80 border border-gray-700 rounded-xl text-[15px] text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/70 focus:shadow-[0_0_0_3px_rgba(243,112,33,0.1)] transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Notice */}
                  <div className="flex items-start gap-3 bg-amber-900/20 border border-amber-500/30 rounded-xl px-4 py-3.5">
                    <span className="material-symbols-outlined text-amber-400 text-[18px] mt-0.5 flex-shrink-0">info</span>
                    <p className="text-amber-300/80 text-xs leading-relaxed">
                      Nhập địa chỉ email FPT đã đăng ký tài khoản. Hệ thống sẽ gửi link đặt lại mật khẩu vào email đó.
                    </p>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="flex items-start gap-3 px-4 py-3 bg-red-900/20 border border-red-500/30 rounded-xl">
                      <span className="material-symbols-outlined text-red-400 text-[18px] flex-shrink-0 mt-0.5">error</span>
                      <p className="text-red-400 text-sm font-medium leading-snug">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-[54px] bg-primary hover:bg-[#ff8c42] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-black text-[15px] tracking-wide transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5 shadow-xl shadow-primary/20"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">send</span>
                        Gửi yêu cầu đặt lại
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* ── Success state ── */
              <div className="text-center">
                <div className="w-20 h-20 rounded-xl bg-green-900/20 border border-green-500/30 flex items-center justify-center mx-auto mb-8">
                  <span className="material-symbols-outlined text-green-400 text-4xl">mark_email_read</span>
                </div>
                <h2 className="text-white font-black text-2xl tracking-tight mb-3">
                  Đã gửi yêu cầu!
                </h2>
                <p className="text-gray-400 text-[15px] leading-relaxed mb-2">
                  Nếu email <span className="font-bold text-gray-200">{email}</span> tồn tại trong hệ thống,
                  link đặt lại mật khẩu sẽ được gửi trong vài phút.
                </p>
                <p className="text-gray-500 text-sm mb-10">
                  Kiểm tra cả hộp thư <span className="font-semibold text-gray-400">Spam / Junk</span> nếu không thấy email.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => { setStep('input'); setEmail(''); setError(''); }}
                    className="w-full h-[52px] border border-gray-700 hover:border-primary/50 rounded-xl font-bold text-[15px] text-gray-400 hover:text-primary transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[17px]">refresh</span>
                    Thử email khác
                  </button>
                  <Link
                    to="/login"
                    className="w-full h-[52px] bg-primary hover:bg-[#ff8c42] text-white rounded-xl font-black text-[15px] transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2.5 shadow-xl shadow-primary/20"
                  >
                    <span className="material-symbols-outlined text-[17px]">arrow_back</span>
                    Quay lại đăng nhập
                  </Link>
                </div>
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

export default ForgotPassword;
