import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import StudentLayout from '../../components/layouts/student';
import examApi from '../../services/examApi';
import blockApi from '../../services/blockApi';

// ─── Status badge config ──────────────────────────────────────────────────────
const statusInfo = {
  GRADED:    { label: 'Đã có kết quả', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  GRADING:   { label: 'Đang chấm',     cls: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500 animate-pulse' },
  SUBMITTED: { label: 'Đã nộp',        cls: 'bg-sky-50 text-sky-700 border-sky-200',             dot: 'bg-sky-500' },
};

// ─── Countdown hook ───────────────────────────────────────────────────────────
function useCountdown(target) {
  const compute = () => {
    const diff = new Date(target) - new Date();
    if (diff <= 0) return { days: 0, hours: 0, mins: 0, secs: 0, expired: true };
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      mins: Math.floor((diff % 3600000) / 60000),
      secs: Math.floor((diff % 60000) / 1000),
      expired: false,
    };
  };

  const [cd, setCd] = useState(compute);

  useEffect(() => {
    if (!target) return undefined;
    setCd(compute());
    const id = setInterval(() => setCd(compute()), 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return cd;
}

// ─── Digit Flip card ──────────────────────────────────────────────────────────
function DigitBox({ value, label }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-16 h-[72px] rounded-2xl bg-[#1C1C1E] border border-white/10 flex items-center justify-center overflow-hidden shadow-lg shadow-black/30">
        <div className="absolute inset-x-0 top-0 h-1/2 bg-white/[0.04]" />
        <div className="absolute inset-x-0 top-1/2 h-px bg-black/40" />
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5" />
        <span className="text-white text-3xl font-black tabular-nums tracking-tight relative z-10">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-white/40 text-[9px] uppercase tracking-[0.2em] font-bold">{label}</span>
    </div>
  );
}

// ─── Helper: tìm block gần nhất ───────────────────────────────────────────────
function findNearestBlock(blocks) {
  const now = new Date();
  const activeBlocks = blocks.filter((b) => b.endTime && new Date(b.endTime) > now);
  if (activeBlocks.length === 0) return null;

  const ongoingBlocks = activeBlocks.filter(
    (b) => b.startTime && new Date(b.startTime) <= now,
  );

  if (ongoingBlocks.length > 0) {
    return ongoingBlocks.sort((a, b) => new Date(a.endTime) - new Date(b.endTime))[0];
  }

  return activeBlocks.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))[0];
}

const StudentDashboard = () => {
  const [nearestBlock, setNearestBlock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const now = new Date();
  const isOngoing = nearestBlock
    && new Date(nearestBlock.startTime) <= now
    && new Date(nearestBlock.endTime) > now;

  const countdownTarget = nearestBlock
    ? (isOngoing ? nearestBlock.endTime : nearestBlock.startTime)
    : null;

  const countdown = useCountdown(countdownTarget);
  const isExpired = nearestBlock && new Date(nearestBlock.endTime) <= now;
  const canSubmit = nearestBlock && isOngoing;

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const examRes = await examApi.getAll({ page: 0, size: 100, sort: 'startTime,asc' });
      const exams = examRes?.data?.content ?? [];

      if (exams.length === 0) {
        setNearestBlock(null);
        return;
      }

      const relevantExams = exams.filter((e) => e.status !== 'COMPLETED');

      const blockResults = await Promise.allSettled(
        relevantExams.map((exam) =>
          blockApi.getByExam(exam.examId).then((res) => {
            const blocks = Array.isArray(res) ? res : res?.data ?? [];
            return blocks.map((b) => ({
              ...b,
              examName: exam.name,
              examSemester: exam.semester,
              examStatus: exam.status,
            }));
          })),
      );

      const allBlocks = blockResults
        .filter((r) => r.status === 'fulfilled')
        .flatMap((r) => r.value);

      setNearestBlock(findNearestBlock(allBlocks));
    } catch (err) {
      console.error('[StudentDashboard] fetchDashboardData error:', err);
      setError('Không thể tải thông tin kỳ thi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const fmtDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    const p = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
      timeZone: 'Asia/Ho_Chi_Minh',
    }).formatToParts(d);
    const get = (type) => p.find((x) => x.type === type)?.value ?? '00';
    return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}`;
  };

  return (
    <StudentLayout
      activeNavKey="dashboard"
      title="Trang chủ"
      bodyClassName="px-8 py-8 max-w-5xl mx-auto space-y-6"
    >
      <section>
        {loading && (
          <div className="relative rounded-3xl overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1C1008] via-[#1a1a1a] to-[#111]" />
            <div className="relative p-8 flex items-center justify-center min-h-[200px]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full border-4 border-[#F37021]/30 border-t-[#F37021] animate-spin" />
                <p className="text-white/40 text-sm font-medium">Đang tải thông tin kỳ thi...</p>
              </div>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="relative rounded-3xl overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1C1008] via-[#1a1a1a] to-[#111]" />
            <div className="relative p-8 flex items-center justify-center min-h-[200px]">
              <div className="flex flex-col items-center gap-3 text-center">
                <span className="material-symbols-outlined text-red-400 text-4xl">error</span>
                <p className="text-white/70 text-sm font-medium">{error}</p>
                <button
                  type="button"
                  onClick={fetchDashboardData}
                  className="mt-2 px-5 py-2 rounded-full bg-[#F37021]/20 text-[#F37021] text-sm font-bold border border-[#F37021]/30 hover:bg-[#F37021]/30 transition-colors"
                >
                  Thử lại
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && !nearestBlock && (
          <div className="relative rounded-3xl overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1C1008] via-[#1a1a1a] to-[#111]" />
            <div className="relative p-8 flex items-center justify-center min-h-[200px]">
              <div className="flex flex-col items-center gap-3 text-center">
                <span className="material-symbols-outlined text-white/20 text-4xl">event_busy</span>
                <p className="text-white/60 text-base font-bold">Không có kỳ thi nào sắp diễn ra</p>
                <p className="text-white/30 text-sm">Hãy kiểm tra lại sau khi Phòng khảo thí công bố lịch thi.</p>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && nearestBlock && (
          <div className="relative rounded-3xl overflow-hidden shadow-[0_24px_50px_rgba(249,115,22,0.18)] ring-1 ring-orange-400/20">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1C1008] via-[#1a1a1a] to-[#111]" />
            <div className="absolute -top-20 -left-20 w-72 h-72 bg-[#F37021]/20 rounded-full blur-[80px]" />
            <div className="absolute -bottom-10 right-20 w-48 h-48 bg-amber-400/10 rounded-full blur-[60px]" />
            <div
              className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
            />
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#F37021]/60 to-transparent" />

            <div className="relative p-8">
              <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
                <div className="flex-1 space-y-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F37021]/15 border border-[#F37021]/30 rounded-full backdrop-blur-sm">
                    <span className="w-2 h-2 rounded-full bg-[#F37021] animate-pulse shadow-sm shadow-[#F37021]" />
                    <span className="text-[#F37021] text-[10px] font-bold uppercase tracking-[0.2em]">
                      {isOngoing ? 'Kỳ thi đang diễn ra' : 'Kỳ thi sắp diễn ra'}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-white text-2xl font-black leading-tight tracking-tight">
                      {nearestBlock.examName}
                    </h2>
                    <p className="text-white/50 text-sm mt-1 font-medium">
                      {nearestBlock.name}
                      {nearestBlock.examSemester ? ` — ${nearestBlock.examSemester}` : ''}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/40">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        Bắt đầu:
                        <span className="text-white/60 font-semibold ml-1">{fmtDate(nearestBlock.startTime)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">timer_off</span>
                        Kết thúc:
                        <span className="text-white/60 font-semibold ml-1">{fmtDate(nearestBlock.endTime)}</span>
                      </span>
                    </div>
                  </div>

                  {canSubmit ? (
                    <Link
                      to={`/student/submit?examId=${nearestBlock.examId}&blockId=${nearestBlock.blockId}`}
                      className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-white text-sm bg-[#F37021] hover:bg-orange-500 shadow-xl shadow-[#F37021]/30 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <span className="material-symbols-outlined text-[18px]">upload_file</span>
                      Nộp bài ngay
                      <span className="material-symbols-outlined text-[16px] ml-0.5">arrow_forward</span>
                    </Link>
                  ) : isExpired ? (
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        disabled
                        className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-red-300/60 text-sm bg-red-500/10 border border-red-500/20 cursor-not-allowed select-none"
                      >
                        <span className="material-symbols-outlined text-[18px]">timer_off</span>
                        Đã hết hạn nộp bài
                      </button>
                      <p className="text-white/25 text-xs">Kỳ thi này đã đóng.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        disabled
                        className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-white/40 text-sm bg-white/5 border border-white/10 cursor-not-allowed select-none"
                      >
                        <span className="material-symbols-outlined text-[18px]">schedule</span>
                        Chưa đến giờ nộp bài
                      </button>
                      <p className="text-white/25 text-xs">Bạn sẽ có thể nộp bài khi block bắt đầu.</p>
                    </div>
                  )}
                </div>

                <div className="w-full lg:w-auto lg:min-w-[310px] rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-5 shadow-inner shadow-black/20">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <p className="text-white/70 text-sm font-bold">{isOngoing ? 'Thời gian còn lại' : 'Đếm ngược đến giờ mở'}</p>
                      <p className="text-white/30 text-[11px] mt-0.5">
                        {isOngoing ? 'Nộp bài trước khi hết giờ để tránh bị quá hạn.' : 'Chuẩn bị sẵn source code trước giờ thi.'}
                      </p>
                    </div>
                    {nearestBlock.examStatus && statusInfo[nearestBlock.examStatus] && (
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusInfo[nearestBlock.examStatus].cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusInfo[nearestBlock.examStatus].dot}`} />
                        {statusInfo[nearestBlock.examStatus].label}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-3 justify-items-center">
                    <DigitBox value={countdown.days} label="days" />
                    <DigitBox value={countdown.hours} label="hours" />
                    <DigitBox value={countdown.mins} label="mins" />
                    <DigitBox value={countdown.secs} label="secs" />
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#F37021] text-[18px] mt-0.5">info</span>
                    <p className="text-white/45 text-xs leading-relaxed">
                      Hệ thống chỉ nhận file .zip đúng cấu trúc. Hãy kiểm tra kỹ thư mục
                      <span className="text-white/70 font-semibold"> run/</span> và
                      <span className="text-white/70 font-semibold"> src/</span> trước khi nộp.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4">
        {[
          {
            icon: 'folder_zip',
            gradient: 'from-sky-500/10 to-sky-500/5',
            border: 'border-sky-200/60',
            iconBg: 'bg-sky-100',
            iconColor: 'text-sky-500',
            dot: 'bg-sky-400',
            title: 'Cấu trúc file',
            desc: 'File .zip phải có thư mục run/ (chứa .jar) và src/ (source code Java).',
          },
          {
            icon: 'fact_check',
            gradient: 'from-emerald-500/10 to-emerald-500/5',
            border: 'border-emerald-200/60',
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-600',
            dot: 'bg-emerald-400',
            title: 'Kiểm tra code theo tiêu chí',
            desc: 'Sử dụng JavaParser và Java Reflection để phân tích, đối chiếu mã nguồn sinh viên với từng tiêu chí chấm.',
          },
          {
            icon: 'gavel',
            gradient: 'from-amber-500/10 to-amber-500/5',
            border: 'border-amber-200/60',
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-600',
            dot: 'bg-amber-400',
            title: 'Phúc khảo',
            desc: 'Không đồng ý với điểm? Gửi đơn phúc khảo sau khi có kết quả chính thức.',
          },
        ].map((tip) => (
          <div
            key={tip.title}
            className={`bg-gradient-to-br ${tip.gradient} border ${tip.border} rounded-3xl p-5 flex gap-4 items-start hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
          >
            <div className={`w-10 h-10 rounded-2xl ${tip.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm`}>
              <span className={`material-symbols-outlined ${tip.iconColor} text-[20px]`}>{tip.icon}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-1.5 h-1.5 rounded-full ${tip.dot}`} />
                <p className="text-slate-800 font-bold text-sm">{tip.title}</p>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed">{tip.desc}</p>
            </div>
          </div>
        ))}
      </section>
    </StudentLayout>
  );
};

export default StudentDashboard;
