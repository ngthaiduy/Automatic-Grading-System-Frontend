import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  const guideSteps = [
    {
      step: '01', icon: 'login', title: 'Đăng nhập',
      desc: 'Sử dụng tài khoản FPT University để đăng nhập vào hệ thống.',
    },
    {
      step: '02', icon: 'upload_file', title: 'Nộp bài',
      desc: 'Upload file .zip bài làm bao gồm thư mục run/ (file .jar) và dist/ (source code).',
    },
    {
      step: '03', icon: 'play_circle', title: 'Chấm tự động',
      desc: 'Hệ thống tự động thực thi test case và thẩm định cấu trúc OOP toàn diện của bài làm.',
    },
    {
      step: '04', icon: 'bar_chart', title: 'Xem kết quả',
      desc: 'Nhận kết quả chi tiết với điểm từng câu, kết quả test case và phản hồi chi tiết cấu trúc OOP.',
    },
  ];

  return (
    <div className="bg-[#0a0b10] text-gray-300 font-display min-h-screen overflow-x-hidden relative">

      {/* ── Blueprint grid overlay ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.18] bg-[linear-gradient(rgba(243,112,33,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(243,112,33,0.15)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* ── Floating glass navbar ── */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl rounded-2xl glass-nav px-6 py-3 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 border border-primary/50 p-2 rounded-xl cyber-box-glow">
              <span className="material-symbols-outlined text-primary text-xl">terminal</span>
            </div>
            <h2 className="text-white text-lg font-extrabold tracking-wider uppercase">
              Java <span className="text-primary cyber-glow">OOP</span> Exam
            </h2>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#hero" className="text-gray-300 hover:text-primary font-medium tracking-wide transition-colors text-sm uppercase">Trang chủ</a>
            <a href="#features" className="text-gray-300 hover:text-primary font-medium tracking-wide transition-colors text-sm uppercase">Tính năng</a>
            <a href="#guide" className="text-gray-300 hover:text-primary font-medium tracking-wide transition-colors text-sm uppercase">Hướng dẫn</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="bg-transparent border border-primary text-primary px-6 py-2 rounded-xl font-bold text-sm hover:bg-primary hover:text-white transition-all cyber-box-glow uppercase tracking-wider"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </header>
      {/* ── Hero Section ── */}
      <section id="hero" className="relative min-h-screen flex items-center pt-32 pb-24 lg:pt-40 lg:pb-32 z-10">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="circuit-line top-[20%] left-[-20%] w-[60%] rotate-45 opacity-30" />
          <div className="circuit-line bottom-[30%] right-[-10%] w-[50%] -rotate-45 opacity-30" />
          <div className="absolute top-[15%] right-[10%] w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
          <div className="absolute bottom-[10%] left-[5%] w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative">

          {/* Left: Text content */}
          <div className="text-left relative z-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border-l-4 border-primary mb-8 backdrop-blur-sm">
              <span className="material-symbols-outlined text-primary text-sm animate-pulse">memory</span>
              <span className="text-primary text-xs font-bold uppercase tracking-[0.2em]">
                Nền tảng chấm điểm tự động // SYS.ACTIVE
              </span>
            </div>

            <h1 className="font-black mb-8">
              <span className="block text-6xl md:text-8xl text-white tracking-tight leading-none pb-4">
                Hệ thống
              </span>
              <span className="block text-6xl md:text-8xl text-primary tracking-tight leading-none pb-3">
                Chấm điểm
              </span>
              <span className="block text-xl md:text-2xl text-gray-300 uppercase tracking-[0.35em] font-semibold leading-none">
                Java OOP
              </span>
            </h1>

            <p className="text-lg text-gray-400 max-w-xl mb-12 font-light border-l border-gray-700 pl-4">
              Nền tảng chấm điểm tự động, chính xác và bảo mật tuyệt đối dành riêng cho sinh viên
              FPT University. Tối ưu hóa quy trình thi cử 4.0.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Link
                to="/login"
                className="relative overflow-hidden px-8 py-4 rounded-xl bg-primary text-white font-bold text-sm uppercase tracking-wider hover:bg-[#ff8c42] transition-all w-full sm:w-auto text-center flex items-center justify-center gap-2 group"
              >
                <span className="material-symbols-outlined text-sm">login</span>
                Đăng nhập hệ thống
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
              </Link>
              <a
                href="#guide"
                className="px-8 py-4 rounded-xl border border-gray-600 bg-transparent text-gray-300 font-bold text-sm uppercase tracking-wider hover:border-primary hover:text-primary transition-all w-full sm:w-auto text-center"
              >
                Xem hướng dẫn sử dụng
              </a>
            </div>
          </div>

          {/* Right: Hologram panel */}
          <div className="relative z-20 h-[500px] flex items-center justify-center">
            <div className="absolute bottom-0 w-3/4 h-8 bg-primary/20 blur-xl rounded-[100%]" />

            <div className="hologram-panel p-6 rounded-2xl w-full max-w-md relative">
              {/* Corner brackets */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-primary" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-primary" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-primary" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-primary" />

              <div className="flex justify-between items-center border-b border-gray-700/50 pb-4 mb-6">
                <div className="text-primary font-mono text-xs tracking-widest">ExamSubmission.java</div>
                <div className="text-green-400 font-mono text-xs flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  100% CORRECT
                </div>
              </div>

              <div className="space-y-2 font-mono text-sm">
                {/* Class header */}
                <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 flex justify-between items-center group hover:border-primary/50 transition-colors">
                  <div>
                    <span className="text-blue-400">public class</span>{' '}
                    <span className="text-yellow-400">StudentGrading</span>
                  </div>
                  <span className="material-symbols-outlined text-gray-500 text-sm group-hover:text-primary">schema</span>
                </div>
                {/* Fields */}
                <div className="ml-6 flex flex-col gap-2 border-l border-gray-700 pl-4">
                  <div className="bg-gray-800/30 p-2 rounded-md text-xs flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-400 text-xs">vpn_key</span>
                    <span className="text-blue-300">private</span>{' '}
                    <span className="text-green-300">String</span> studentId;
                  </div>
                  <div className="bg-gray-800/30 p-2 rounded-md text-xs flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-400 text-xs">data_object</span>
                    <span className="text-blue-300">private</span>{' '}
                    <span className="text-orange-300">double</span> score;
                  </div>
                </div>
                {/* Method */}
                <div className="ml-6 bg-gray-800/50 p-3 rounded-lg border border-gray-700 relative">
                  <div className="absolute -left-4 top-4 w-4 h-px bg-gray-700" />
                  <div className="text-blue-400 mb-2">
                    <span className="text-purple-400">@Override</span>
                  </div>
                  <div>
                    <span className="text-blue-300">public void</span>{' '}
                    <span className="text-yellow-300">calculateResult()</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400 border-t border-gray-700/50 pt-2 flex justify-between">
                    <span>Execution: <span className="text-green-400">0.02s</span></span>
                    <span>Status: <span className="text-primary">PASS</span></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating stat badge */}
            <div className="absolute -right-4 top-1/4 bg-[#1a1c23] border border-gray-700 p-3 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-md hidden md:block">
              <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-1">Processing</div>
              <div className="text-primary font-bold text-xl flex items-center gap-1">
                99.9%
                <span className="material-symbols-outlined text-sm">trending_up</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section (skewed) ── */}
      <section id="features" className="py-24 relative z-10 skew-section bg-[#1a1c23] border-y border-gray-800">
        <div className="max-w-7xl mx-auto px-6 unskew-content">
          <div className="mb-16 border-l-4 border-primary pl-6">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-2 tracking-tight uppercase">
              Tính năng <span className="text-primary">nổi bật</span>
            </h2>
            <p className="text-gray-400 font-mono text-sm tracking-wider uppercase">
              Quy trình chuyên nghiệp được thiết kế riêng cho môn Lập trình hướng đối tượng.
            </p>
          </div>

          <div className="relative">
            <div className="absolute top-1/2 left-0 w-full h-px bg-gray-700 hidden lg:block -translate-y-1/2" />
            <div className="absolute top-1/2 left-0 w-1/3 h-px bg-gradient-to-r from-primary to-transparent hidden lg:block -translate-y-1/2" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="relative bg-[#0a0b10] p-8 rounded-2xl border border-gray-800 hover:border-primary/50 transition-all group z-10">
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-transparent group-hover:border-primary transition-colors" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-transparent group-hover:border-primary transition-colors" />
                <div className="w-12 h-12 rounded-xl bg-gray-900 border border-gray-700 text-primary flex items-center justify-center mb-6 relative">
                  <span className="material-symbols-outlined text-2xl relative z-10">code_blocks</span>
                  <div className="absolute inset-0 bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3 font-mono uppercase tracking-wide">
                  01. Chấm điểm tự động Java
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Hệ thống tự động thực thi file .jar và chạy các test case theo đề thi để đánh giá
                  tính đúng đắn của logic OOP.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="relative bg-[#0a0b10] p-8 rounded-2xl border border-gray-800 hover:border-blue-500/50 transition-all group z-10">
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-transparent group-hover:border-blue-500 transition-colors" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-transparent group-hover:border-blue-500 transition-colors" />
                <div className="w-12 h-12 rounded-xl bg-gray-900 border border-gray-700 text-blue-500 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-2xl">schema</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-3 font-mono uppercase tracking-wide">
                  02. Thẩm định cấu trúc OOP
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Thẩm định cấu trúc mã nguồn theo các tiêu chí OOP chuẩn hóa (sự tồn tại của Class/Interface, kế thừa Extends/Implements, Constructor, Thuộc tính, Phương thức, Getter/Setter và Naming Convention) thông qua phân tích tĩnh (JavaParser) & phân tích động (Reflection) tự động.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="relative bg-[#0a0b10] p-8 rounded-2xl border border-gray-800 hover:border-purple-500/50 transition-all group z-10">
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-transparent group-hover:border-purple-500 transition-colors" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-transparent group-hover:border-purple-500 transition-colors" />
                <div className="w-12 h-12 rounded-xl bg-gray-900 border border-gray-700 text-purple-500 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-2xl">analytics</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-3 font-mono uppercase tracking-wide">
                  03. Kết quả chi tiết
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Sau khi Phòng khảo thí kích hoạt chấm, sinh viên xem được điểm từng câu, kết quả
                  từng test case và chi tiết phản hồi cấu trúc OOP.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Guide Section ── */}
      <section id="guide" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 border-l-4 border-primary pl-6">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-2 tracking-tight uppercase">
              Hướng dẫn <span className="text-primary">sử dụng</span>
            </h2>
            <p className="text-gray-400 font-mono text-sm tracking-wider uppercase">
              Quy trình đơn giản, rõ ràng — chỉ vài bước là hoàn tất.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {guideSteps.map(({ step, icon, title, desc }) => (
              <div key={step} className="relative group">
                <div className="relative bg-[#1a1c23] border border-gray-800 rounded-2xl p-8 hover:border-primary/50 transition-all h-full">
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-transparent group-hover:border-primary transition-colors" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-transparent group-hover:border-primary transition-colors" />
                  <div className="text-primary/50 font-mono text-xs tracking-widest mb-4">STEP_{step}</div>
                  <div className="w-12 h-12 rounded-xl bg-gray-900 border border-gray-700 text-primary flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-2xl">{icon}</span>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-3 font-mono uppercase tracking-wide">{title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-primary text-white font-bold text-sm uppercase tracking-wider hover:bg-[#ff8c42] transition-all"
            >
              <span className="material-symbols-outlined text-sm">login</span>
              Bắt đầu ngay
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#050608] py-16 text-gray-400 border-t border-gray-800 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">

            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary text-xl">terminal</span>
                <h2 className="text-white text-lg font-bold tracking-widest uppercase">Hệ thống Chấm điểm Java OOP</h2>
              </div>
              <p className="text-gray-500 max-w-sm mb-6 leading-relaxed text-sm font-mono">
                Hệ thống chuẩn hóa quy trình chấm thi thực hành Java tại FPT University,
                đảm bảo tính công bằng và chính xác cao nhất.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-8 h-8 rounded-lg border border-gray-700 flex items-center justify-center hover:border-primary hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-sm">public</span>
                </a>
                <a href="#" className="w-8 h-8 rounded-lg border border-gray-700 flex items-center justify-center hover:border-primary hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-sm">mail</span>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-white uppercase tracking-widest text-xs font-mono">Liên kết //</h4>
              <ul className="space-y-3 text-sm">
                {[['#hero', 'Trang chủ'], ['#features', 'Tính năng'], ['#guide', 'Hướng dẫn']].map(([href, label]) => (
                  <li key={href}>
                    <a href={href} className="hover:text-primary transition-colors flex items-center gap-2">
                      <span className="text-primary text-xs">›</span>{label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-white uppercase tracking-widest text-xs font-mono">Hỗ trợ //</h4>
              <ul className="space-y-3 text-sm">
                {[['Email hỗ trợ'], ['Tài liệu API'], ['Trạng thái hệ thống']].map(([label]) => (
                  <li key={label}>
                    <a href="#" className="hover:text-primary transition-colors flex items-center gap-2">
                      <span className="text-primary text-xs">›</span>{label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono">
            <p>© 2026 Hệ thống Chấm điểm Java OOP. Built for FPT University Students.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-white">Chính sách bảo mật</a>
              <a href="#" className="hover:text-white">Điều khoản sử dụng</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;