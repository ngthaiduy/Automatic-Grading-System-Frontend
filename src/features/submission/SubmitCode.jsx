import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import blockApi from '../../services/blockApi';
import examApi from '../../services/examApi';
import submissionApi from '../../services/submissionApi';
import configApi from '../../services/configApi';
import StudentLayout from '../../components/layouts/student';
// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const p = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh',
  }).formatToParts(d);
  const get = (type) => p.find((x) => x.type === type)?.value ?? '00';
  return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}`;
}

/** Trả về 'before' | 'ongoing' | 'ended' */
function getBlockPhase(startTime, endTime) {
  const now = new Date();
  if (!startTime || !endTime) return 'before';
  if (now < new Date(startTime)) return 'before';
  if (now > new Date(endTime)) return 'ended';
  return 'ongoing';
}

// ─── Countdown hook ───────────────────────────────────────────────────────────
function useCountdown(target) {
  const compute = () => {
    const diff = new Date(target) - new Date();
    if (diff <= 0) return { h: 0, m: 0, s: 0, expired: true };
    return {
      h: Math.floor(diff / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
      expired: false,
    };
  };
  const [cd, setCd] = useState(compute);
  useEffect(() => {
    if (!target) return;
    setCd(compute());
    const id = setInterval(() => setCd(compute()), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return cd;
}

const pad = (n) => String(n).padStart(2, '0');

// ═══════════════════════════════════════════════════════════════════════════════
export default function SubmitCode() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const examId  = searchParams.get('examId');
  const blockId = searchParams.get('blockId');

  const fileInputRef = useRef(null);
  const [dragging, setDragging]         = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // ── Block fetch state ──────────────────────────────────────────────────────
  const [blockInfo, setBlockInfo]       = useState(null); // { name, examName, startTime, endTime }
  const [loading, setLoading]           = useState(true);
  const [fetchError, setFetchError]     = useState(null);

  // ── Config & Submission state ──────────────────────────────────────────────
  const [maxUploadMb, setMaxUploadMb]             = useState(null);   // từ /api/admin/config/system
  const [existingSubmission, setExistingSubmission] = useState(null); // bài đã nộp trước đó
  const [submitting, setSubmitting]               = useState(false);  // đang upload
  const [toast, setToast]                         = useState(null);   // { type: 'success'|'error', msg }
  const [fileError, setFileError]                 = useState(null);   // lỗi client-side validate file
  const [submitError, setSubmitError]             = useState(null);   // lỗi server-side khi nộp bài
  const [successBanner, setSuccessBanner]         = useState(null);   // thông báo nộp bài thành công (không tắt)

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  };

  // Nếu không có params → tìm block gần nhất (giống Dashboard)
  const fetchBlock = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      if (examId && blockId) {
        // Có đủ params → gọi trực tiếp
        const [blockRes, examRes] = await Promise.all([
          blockApi.getById(examId, blockId),
          examApi.getById(examId),
        ]);
        // blockApi trả về object trực tiếp (không wrap { success, data })
        const block = blockRes?.blockId ? blockRes : blockRes?.data ?? blockRes;
        const exam  = examRes?.data     ?? examRes;
        setBlockInfo({
          blockId:   block.blockId,
          examId:    examId,
          name:      block.name,
          examName:  exam.name || `Exam ${examId.slice(0, 8).toUpperCase()}`,
          startTime: block.startTime,
          endTime:   block.endTime,
        });
      } else {
        // Không có params → tìm block ongoing/upcoming gần nhất
        const examRes = await examApi.getAll({ page: 0, size: 100, sort: 'startTime,asc' });
        const exams   = examRes?.data?.content ?? [];
        const relevant = exams.filter((e) => e.status !== 'COMPLETED');
        const blockResults = await Promise.allSettled(
          relevant.map((exam) =>
            blockApi.getByExam(exam.examId).then((res) => {
              const blocks = Array.isArray(res) ? res : res?.data ?? [];
              return blocks.map((b) => ({ ...b, examName: exam.name }));
            }),
          ),
        );
        const allBlocks = blockResults
          .filter((r) => r.status === 'fulfilled')
          .flatMap((r) => r.value);
        const now = new Date();
        const active = allBlocks.filter((b) => b.endTime && new Date(b.endTime) > now);
        const ongoing = active.filter((b) => b.startTime && new Date(b.startTime) <= now);
        const nearest = ongoing.length
          ? ongoing.sort((a, b) => new Date(a.endTime) - new Date(b.endTime))[0]
          : active.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))[0] ?? null;
        if (nearest) {
          setBlockInfo({
            blockId:   nearest.blockId,
            examId:    nearest.examId,
            name:      nearest.name,
            examName:  nearest.examName,
            startTime: nearest.startTime,
            endTime:   nearest.endTime,
          });
        } else {
          setBlockInfo(null);
        }
      }
    } catch (err) {
      console.error('[SubmitCode] fetchBlock error:', err);
      setFetchError('Không thể tải thông tin kỳ thi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [examId, blockId]);

  useEffect(() => { fetchBlock(); }, [fetchBlock]);

  // ── Chặn browser mở file khi kéo ra ngoài drop zone ───────────────────────
  useEffect(() => {
    const preventBrowserDrop = (e) => {
      // Chỉ chặn nếu có file đang được kéo (dataTransfer.types có 'Files')
      if (e.dataTransfer?.types?.includes('Files')) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'none';
      }
    };
    document.addEventListener('dragover', preventBrowserDrop);
    document.addEventListener('drop', preventBrowserDrop);
    return () => {
      document.removeEventListener('dragover', preventBrowserDrop);
      document.removeEventListener('drop', preventBrowserDrop);
    };
  }, []);

  // ── Fetch config (maxUploadSizeMb) và existing submission khi có blockInfo ──
  useEffect(() => {
    if (!blockInfo) return;
    // Fetch system config để lấy maxUploadSizeMb
    configApi.getSystemSettings().then((res) => {
      const mb = res?.data?.maxUploadSizeMb ?? res?.maxUploadSizeMb ?? 50;
      setMaxUploadMb(mb);
    }).catch(() => { /* Fallback 50MB nếu student không có quyền đọc config */ });

    // Fetch bài đã nộp trước đó (nếu có)
    submissionApi.getMySubmission(blockInfo.examId, blockInfo.blockId).then((res) => {
      const sub = res?.data ?? res;
      if (sub?.submissionId) setExistingSubmission(sub);
    }).catch(() => { /* Chưa nộp lần nào → bỏ qua */ });
  }, [blockInfo]);

  // ── Xác định block phase ───────────────────────────────────────────────────
  const phase = blockInfo
    ? getBlockPhase(blockInfo.startTime, blockInfo.endTime)
    : 'before';

  // Countdown tới startTime (nếu before) hoặc tới endTime (nếu ongoing)
  const countdownTarget = blockInfo
    ? (phase === 'before' ? blockInfo.startTime : blockInfo.endTime)
    : null;
  const cd = useCountdown(countdownTarget);

  // Label cho countdown trong form ongoing
  const ongoingCd = `${pad(cd.h)}:${pad(cd.m)}:${pad(cd.s)}`;

  // ── examLabel cho breadcrumb ───────────────────────────────────────────────
  const examLabel = useMemo(() => {
    if (blockInfo) return `${blockInfo.examName} — ${blockInfo.name}`;
    const examShort  = examId  ? examId.slice(0, 8)  : 'Exam';
    const blockShort = blockId ? blockId.slice(0, 8) : 'Block';
    return `${examShort} | ${blockShort}`;
  }, [blockInfo, examId, blockId]);

  // ── handlePick: validate kích thước file theo maxUploadMb ─────────────────
  const handlePick = (file) => {
    if (!file) return;
    setFileError(null);
    setSubmitError(null);
    // Validate định dạng file
    const name = file.name.toLowerCase();
    if (!name.endsWith('.zip') && !name.endsWith('.rar')) {
      setFileError(`Định dạng file không hợp lệ: "${file.name}". Hệ thống chỉ chấp nhận file .zip hoặc .rar.`);
      return;
    }
    // Validate kích thước file
    const limitBytes = (maxUploadMb ?? 50) * 1024 * 1024;
    if (file.size > limitBytes) {
      setFileError(`File vượt quá giới hạn ${maxUploadMb ?? 50} MB (file của bạn: ${fmtSize(file.size)}).`);
      return;
    }
    setSelectedFile(file);
  };

  // ── handleSubmit: gọi submissionApi.submit ─────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedFile || !blockInfo) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await submissionApi.submit(blockInfo.examId, blockInfo.blockId, selectedFile);
      const sub = res?.data ?? res;
      setExistingSubmission(sub);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      const successMsg = sub?.resubmit
        ? 'Nộp lại bài thành công! Bài nộp cũ đã được ghi đè.'
        : 'Bài làm đã được nộp thành công!';
      setSuccessBanner(successMsg);
      showToast('success', successMsg);
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Nộp bài thất bại. Vui lòng thử lại.';
      setSubmitError(msg);
      showToast('error', msg);
    } finally {
      setSubmitting(false);
    }
  };


  // ═════════════════════════════════════════════════════════════════════════════
  // Shared layout wrapper
  // ═════════════════════════════════════════════════════════════════════════════
  const PageShell = ({ children }) => (
    <div className="relative min-h-screen font-[Inter] text-slate-900 bg-[#f8f9fa] overflow-hidden">
      {/* Nền background pattern dot hiện đại */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-60"></div>
      {/* Gradient orbs mềm mại */}
      <div className="pointer-events-none absolute -top-40 -left-20 h-96 w-96 rounded-full bg-orange-400/20 blur-[100px] z-0" />
      <div className="pointer-events-none absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-blue-500/10 blur-[100px] z-0" />
      
      <div className="relative max-w-5xl mx-auto w-full p-6 sm:p-8 space-y-8 z-10">
        {/* Header breadcrumb - Cải tiến glassmorphism */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Nộp bài thi</h1>
            <div className="flex items-center text-xs font-semibold text-slate-500 gap-2 mt-1.5">
              <Link to="/student" className="hover:text-[#f27121] transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">home</span>
                Trang chủ
              </Link>
              <span className="material-symbols-outlined text-[14px] text-slate-300">chevron_right</span>
              <span className="text-slate-600">Kỳ thi của tôi</span>
              <span className="material-symbols-outlined text-[14px] text-slate-300">chevron_right</span>
              <span className="text-[#f27121] bg-orange-50 px-2 py-0.5 rounded-md">Nộp bài thi</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-[#f27121]/10 flex items-center justify-center text-[#f27121]">
               <span className="material-symbols-outlined text-xl">school</span>
             </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center min-h-[400px] bg-white/60 backdrop-blur-md rounded-3xl border border-white shadow-xl">
          <div className="flex flex-col items-center gap-5">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-[#f27121] border-t-transparent animate-spin"></div>
            </div>
            <p className="text-slate-600 font-semibold text-sm tracking-wide animate-pulse">Đang đồng bộ dữ liệu kỳ thi...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  // ─── Fetch error ───────────────────────────────────────────────────────────
  if (fetchError) {
    return (
      <PageShell>
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-red-100 p-12 flex flex-col items-center gap-5 text-center shadow-[0_8px_30px_rgb(239,68,68,0.1)]">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
             <span className="material-symbols-outlined text-red-500 text-4xl">warning</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Đã xảy ra lỗi</h2>
            <p className="text-slate-500 font-medium">{fetchError}</p>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={fetchBlock}
              className="px-6 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors"
            >
              Thử lại
            </button>
            <button
              onClick={() => navigate('/student')}
              className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition-colors shadow-lg shadow-slate-800/20"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  // ─── Không có kỳ thi nào ──────────────────────────────────────────────────
  if (!blockInfo) {
    return (
      <PageShell>
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white p-14 flex flex-col items-center gap-5 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-300">
            <span className="material-symbols-outlined text-slate-300 text-5xl">event_busy</span>
          </div>
          <div>
            <h2 className="text-slate-800 font-black text-2xl tracking-tight">Không có Kỳ thi nào</h2>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mt-2 leading-relaxed">
              Hiện tại hệ thống không ghi nhận kỳ thi hoặc ca thi nào đang diễn ra cho bạn. Hãy kiểm tra lại lịch trên trang chủ.
            </p>
          </div>
          <button
            onClick={() => navigate('/student')}
            className="mt-4 px-8 py-3.5 bg-[#f27121] text-white rounded-xl font-bold text-sm hover:bg-[#e06010] transition-all shadow-lg shadow-[#f27121]/30 hover:-translate-y-0.5"
          >
            Quay lại trang chủ
          </button>
        </div>
      </PageShell>
    );
  }

  // ─── BEFORE — Kỳ thi chưa mở ──────────────────────────────────────────────
  if (phase === 'before') {
    return (
      <PageShell>
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] relative">
          {/* Top accent line */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-[#f27121]" />
          
          <div className="p-10 flex flex-col items-center gap-8 text-center">
            {/* 3D-ish Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400 blur-xl opacity-20 rounded-full"></div>
              <div className="relative w-24 h-24 rounded-[2rem] bg-gradient-to-br from-amber-50 md:from-white to-amber-100 border border-amber-200/60 shadow-inner flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-500 text-5xl">lock_clock</span>
              </div>
            </div>

            {/* Tiêu đề */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 border border-amber-200/60 text-amber-700 rounded-full shadow-sm">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping absolute opacity-75" />
                <span className="w-2 h-2 rounded-full bg-amber-500 relative" />
                <span className="text-[11px] font-black uppercase tracking-[0.15em] pt-px">Chưa đến giờ thi</span>
              </div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Kỳ thi chưa mở</h2>
              <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                Hệ thống nộp bài sẽ tự động mở khóa khi thời gian thi bắt đầu.
              </p>
            </div>

            {/* Info block hiện đại */}
            <div className="w-full max-w-lg bg-white border border-slate-100 shadow-sm rounded-2xl p-6 text-left space-y-5">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-indigo-500 text-xl">school</span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Kỳ thi & Ca thi</p>
                  <p className="text-slate-800 font-bold text-base mt-0.5">{blockInfo.examName}</p>
                  <p className="text-slate-500 text-sm mt-0.5">{blockInfo.name}</p>
                </div>
              </div>
              <div className="h-px w-full bg-slate-100" />
              <div className="grid grid-cols-2 gap-4">
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-green-500 text-sm">schedule</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Bắt đầu</p>
                    <p className="text-slate-800 font-bold text-sm mt-0.5">{fmtDate(blockInfo.startTime)}</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-rose-500 text-sm">timer_off</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Kết thúc</p>
                    <p className="text-slate-800 font-bold text-sm mt-0.5">{fmtDate(blockInfo.endTime)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Countdown LCD style */}
            {!cd.expired && (
              <div className="w-full max-w-lg bg-slate-900 rounded-3xl p-8 text-center relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                <p className="text-amber-400/80 text-[10px] uppercase tracking-[0.3em] font-black mb-6">
                  Sẽ tự động mở sau
                </p>
                <div className="flex items-center justify-center gap-4 text-white font-black text-5xl tabular-nums tracking-tight">
                  <div className="flex flex-col items-center gap-2">
                    <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl w-20 h-24 flex items-center justify-center shadow-inner">
                      <span>{pad(cd.h)}</span>
                    </div>
                    <span className="text-slate-500 text-[10px] uppercase tracking-widest">Giờ</span>
                  </div>
                  <span className="text-slate-700/50 mb-6 text-4xl">:</span>
                  <div className="flex flex-col items-center gap-2">
                    <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl w-20 h-24 flex items-center justify-center shadow-inner">
                      <span>{pad(cd.m)}</span>
                    </div>
                    <span className="text-slate-500 text-[10px] uppercase tracking-widest">Phút</span>
                  </div>
                  <span className="text-slate-700/50 mb-6 text-4xl">:</span>
                  <div className="flex flex-col items-center gap-2">
                    <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl w-20 h-24 flex items-center justify-center shadow-inner">
                      <span className="text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">{pad(cd.s)}</span>
                    </div>
                    <span className="text-slate-500 text-[10px] uppercase tracking-widest">Giây</span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => navigate('/student')}
              className="mt-2 group flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors bg-white border border-slate-200 shadow-sm px-6 py-3 rounded-xl hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
              Quay về trang chủ
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  // ─── ENDED — Kỳ thi đã kết thúc ──────────────────────────────────────────
  if (phase === 'ended') {
    return (
      <PageShell>
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-slate-300 via-slate-400 to-slate-500" />
          <div className="p-12 flex flex-col items-center gap-6 text-center">
            <div className="w-24 h-24 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center relative">
              <span className="material-symbols-outlined text-slate-400 text-5xl">timer_off</span>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-red-50 border border-red-100 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500 text-sm">close</span>
              </div>
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 border border-slate-200 text-slate-600 rounded-full mb-4">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em]">Đã khóa</span>
              </div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Kỳ thi đã kết thúc</h2>
              <p className="text-slate-500 mt-3 text-sm max-w-md mx-auto leading-relaxed">
                Hệ thống nộp bài đã đóng. Bạn không thể thao tác thêm trên bài thi <strong className="text-slate-700">{blockInfo.examName} — {blockInfo.name}</strong>.
              </p>
            </div>
            <div className="w-full max-w-sm bg-white shadow-sm border border-slate-100 rounded-2xl p-5 text-sm">
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-semibold text-slate-500">Đóng lúc</span>
                <span className="font-black text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">{fmtDate(blockInfo.endTime)}</span>
              </div>
            </div>
            <div className="flex gap-4 mt-2">
              <button
                onClick={() => navigate('/student')}
                className="px-8 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
              >
                Về trang chủ
              </button>
              <Link
                to="/student/results"
                className="px-8 py-3.5 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-900 transition-all shadow-lg shadow-slate-800/20"
              >
                Xem kết quả
              </Link>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  // ─── ONGOING — Hiển thị form nộp bài ─────────────────────────────────────
  return (
    <PageShell>

      {/* Khối Context Bar & Timer */}

      <div className="bg-white/85 backdrop-blur-xl rounded-3xl border border-white/90 shadow-[0_12px_35px_rgba(15,23,42,0.06)] p-6 sm:p-7 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="min-w-0 flex flex-col gap-1.5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight break-words">{examLabel}</h2>
            <p className="text-sm font-semibold text-slate-500">Block hiện tại: {blockInfo.name}</p>
            {existingSubmission && (
              <span className="mt-1 inline-flex w-fit items-center gap-1.5 text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5 shadow-sm shadow-emerald-500/10">
                <span className="material-symbols-outlined text-[13px]">task_alt</span>
                Đã nộp lúc {fmtDate(existingSubmission.submittedAt)}
              </span>
            )}
          </div>
          
          {/* Ticker đếm ngược */}
          <div className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl border transition-all ${
            cd.h === 0 && cd.m < 10
              ? 'bg-gradient-to-br from-red-50 to-white border-red-200/70 shadow-[0_8px_24px_rgba(239,68,68,0.15)] ring-1 ring-red-500/10'
              : 'bg-gradient-to-br from-amber-50/70 to-white border-amber-200/70 shadow-[0_8px_24px_rgba(245,158,11,0.12)]'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cd.h === 0 && cd.m < 10 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
              <span className={`material-symbols-outlined ${cd.h === 0 && cd.m < 10 ? 'animate-pulse' : ''}`}>
                {cd.h === 0 && cd.m < 10 ? 'alarm_on' : 'timer'}
              </span>
            </div>
            <div>
              <p className={`font-black font-mono text-2xl tracking-widest leading-none ${cd.h === 0 && cd.m < 10 ? 'text-red-600' : 'text-amber-700'}`}>
                {cd.expired ? '00:00:00' : ongoingCd}
              </p>
              <p className={`text-[10px] uppercase tracking-[0.2em] font-extrabold mt-1 ${cd.h === 0 && cd.m < 10 ? 'text-red-500' : 'text-amber-600/80'}`}>
                Thời gian còn lại
              </p>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="group relative overflow-hidden rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/60 p-4 min-h-[106px] shadow-sm shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/15">
            <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-emerald-300/20 blur-2xl" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Trạng thái</p>
            <div className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-extrabold bg-white text-emerald-700 border border-emerald-200 shadow-sm">
              <span className="material-symbols-outlined text-[15px]">verified</span>
              <span className="tracking-wide">Đang diễn ra</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="mt-2 text-[11px] font-semibold text-emerald-700/80">Bạn có thể nộp/chỉnh sửa bài trong thời gian thi.</p>
          </div>
          <div className="group relative overflow-hidden rounded-2xl border border-orange-200/70 bg-gradient-to-br from-orange-50 via-white to-amber-50/60 p-4 min-h-[106px] shadow-sm shadow-orange-500/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-500/15">
            <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-orange-300/20 blur-2xl" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Kỳ thi</p>
            <div className="inline-flex max-w-full items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-extrabold bg-white text-orange-700 border border-orange-200 shadow-sm">
              <span className="material-symbols-outlined text-[15px]">school</span>
              <span className="tracking-wide">Thông tin kỳ thi</span>
            </div>
            <p className="mt-2 text-sm font-bold text-slate-700 line-clamp-2" title={blockInfo.examName}>{blockInfo.examName}</p>
          </div>
          <div className="group relative overflow-hidden rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50 via-white to-blue-50/60 p-4 min-h-[106px] shadow-sm shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/15">
            <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-indigo-300/20 blur-2xl" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Block</p>
            <div className="inline-flex max-w-full items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-extrabold bg-white text-indigo-700 border border-indigo-200 shadow-sm">
              <span className="material-symbols-outlined text-[15px]">calendar_clock</span>
              <span className="tracking-wide">Block hiện tại</span>
            </div>
            <p className="mt-2 text-sm font-bold text-slate-700 line-clamp-2" title={blockInfo.name}>{blockInfo.name}</p>
          </div>
        </div>
      </div>

      {/* Upload Zone & Check Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Cột trái: Kéo thả file */}
        <div className="lg:col-span-7 space-y-6 flex flex-col">
          <div className="bg-white/85 backdrop-blur-xl rounded-3xl shadow-[0_12px_35px_rgba(15,23,42,0.06)] border border-white/90 overflow-hidden flex-1 flex flex-col relative group">
            <div className="h-1 bg-gradient-to-r from-[#f27121] to-[#fb923c] absolute top-0 inset-x-0" />
            <div className="p-6 sm:p-8 flex-1 flex flex-col">
              <h3 className="font-extrabold text-lg text-slate-900 mb-4">Tải bài làm lên hệ thống</h3>
              
              <div
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(true); }}
                onDragLeave={(e) => { e.stopPropagation(); setDragging(false); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragging(false);
                  handlePick(e.dataTransfer.files?.[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex-1 rounded-[2rem] border-2 border-dashed p-8 sm:p-10 flex flex-col items-center justify-center gap-5 transition-all duration-300 cursor-pointer overflow-hidden ${
                  dragging 
                  ? 'border-[#f27121] bg-orange-50/60 scale-[0.98] shadow-inner' 
                  : 'border-slate-300 bg-slate-50/60 hover:border-[#f27121]/50 hover:bg-orange-50/25'
                }`}
              >
                {/* Glow effect when dragging */}
                {dragging && <div className="absolute inset-0 bg-[#f27121] opacity-[0.03] blur-xl" />}
                
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-transform duration-300 ${dragging ? 'scale-110 bg-[#f27121] text-white shadow-lg shadow-orange-500/30' : 'bg-white border border-slate-200 text-[#f27121] shadow-sm group-hover:-translate-y-1 group-hover:shadow-md'}`}>
                  <span className="material-symbols-outlined text-4xl">cloud_upload</span>
                </div>
                <div className="text-center z-10">
                  <p className="text-lg font-bold text-slate-700 mb-1">Kéo thả file vào đây</p>
                  <p className="text-sm text-slate-500">hoặc click để chọn file <span className="font-bold text-slate-700">.zip</span> / <span className="font-bold text-slate-700">.rar</span></p>
                  <p className="text-[11px] font-semibold text-slate-400 mt-4 uppercase tracking-wider">
                    Kích thước tối đa: {maxUploadMb ? `${maxUploadMb} MB` : '...'}
                  </p>
                  <div className="mt-3 px-4 py-2.5 bg-amber-50 border border-amber-200/70 rounded-xl max-w-xs">
                    <p className="text-[11px] text-amber-700 leading-relaxed font-semibold">
                      ⚠️ Sinh viên cần nén bài làm về định dạng <strong>.zip</strong> hoặc <strong>.rar</strong> trước khi nộp bài. Hệ thống không nhận bất kì định dạng file nào khác.
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip,.rar"
                  className="hidden"
                  onChange={(e) => handlePick(e.target.files?.[0])}
                />
              </div>

              {/* Lỗi kích thước file */}
              {fileError && (
                <div className="mt-5 flex items-start gap-3 p-4 bg-red-50/90 border border-red-200 rounded-2xl shadow-sm shadow-red-500/10">
                  <span className="material-symbols-outlined text-red-500 text-xl flex-shrink-0">error</span>
                  <p className="text-sm font-semibold text-red-700">{fileError}</p>
                </div>
              )}

              {/* File đã chọn */}
              {selectedFile && !fileError && (
                <div className="mt-5 p-4 bg-white border border-green-200 rounded-2xl shadow-md shadow-green-500/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 flex items-center justify-center text-green-600">
                        <span className="material-symbols-outlined text-2xl">folder_zip</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 truncate max-w-[200px] sm:max-w-xs">{selectedFile.name}</p>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">{fmtSize(selectedFile.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setSelectedFile(null); setFileError(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-red-100 hover:text-red-600 flex items-center justify-center text-slate-400 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-full w-full rounded-full" />
                  </div>
                </div>
              )}

              {/* Bài đã nộp trước đó */}
              {existingSubmission && (
                <div className="mt-5 p-4 bg-blue-50/80 border border-blue-200 rounded-2xl shadow-sm shadow-blue-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                      <span className="material-symbols-outlined text-xl">cloud_done</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-wider text-blue-500 mb-0.5">Bài nộp gần nhất</p>
                      <p className="text-sm font-bold text-slate-800 truncate">{existingSubmission.fileName}</p>
                      <p className="text-xs text-slate-500">
                        {fmtSize(existingSubmission.fileSizeBytes)} · {fmtDate(existingSubmission.submittedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 items-start p-5 bg-gradient-to-br from-amber-50 to-orange-50/60 border border-amber-200/70 rounded-2xl shadow-md shadow-amber-500/10">
            <div className="w-10 h-10 rounded-full bg-amber-100/80 flex items-center justify-center flex-shrink-0 text-amber-600">
              <span className="material-symbols-outlined text-xl">error_outline</span>
            </div>
            <div>
               <p className="text-sm font-bold text-amber-900 mb-1">Lưu ý quan trọng</p>
               <p className="text-xs text-amber-700/80 leading-relaxed">
                 Việc nộp bài mới sẽ <strong>tự động ghi đè</strong> lên các bản nộp trước đó. Đảm bảo file nén của bạn chứa đầy đủ tất cả source code cho các câu hỏi.
               </p>
            </div>
          </div>
        </div>

        {/* Cột phải: Hướng dẫn cấu trúc (Window Mockup) */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-[520px]">
          <div className="bg-white/85 backdrop-blur-xl rounded-3xl shadow-[0_12px_35px_rgba(15,23,42,0.06)] border border-white/90 flex flex-col h-full overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-white/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">rule_folder</span>
                 </div>
                 <h3 className="font-extrabold text-slate-800 text-lg">Cấu trúc file chuẩn</h3>
              </div>
            </div>
            
            <div className="flex-1 p-6 bg-slate-50/90">
              {/* Fake Terminal / VSCode window */}
              <div className="rounded-xl overflow-hidden border border-slate-300 shadow-xl shadow-slate-900/10 bg-[#1e1e1e] flex flex-col h-full">
                {/* Mac-like Window Header */}
                <div className="h-9 bg-[#2d2d2d] border-b border-black/20 flex items-center px-4 gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 shadow-inner"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500 shadow-inner"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500 shadow-inner"></div>
                  <div className="flex-1 flex justify-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest hidden sm:block">Dự kiến</span>
                  </div>
                </div>
                {/* Code Body */}
                <div className="p-5 font-mono text-[13px] text-slate-300 leading-relaxed space-y-3 overflow-y-auto">
                  
                  {/* Root folder */}
                  <div className="flex items-center gap-2 text-white">
                    <span className="material-symbols-outlined text-[#4DAAFB] text-base">folder</span>
                    <span className="font-bold">SE200000_NguyenVanA</span>
                  </div>
                  
                  <div className="pl-6 border-l border-white/10 ml-2 space-y-3 pt-1">
                    {/* 1 */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#E8AB5C] text-base">folder</span>
                        <span className="text-slate-100">1</span>
                        <span className="material-symbols-outlined text-green-400 text-sm ml-auto mr-2">check_circle</span>
                      </div>
                      <div className="pl-6 border-l border-white/10 ml-2 space-y-2 pt-2">
                        <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                          <span className="material-symbols-outlined text-slate-400 text-sm">folder</span> 
                          <span>run/</span>
                        </div>
                        <div className="pl-6 flex items-center gap-2 opacity-70">
                          <span className="material-symbols-outlined text-amber-400 text-xs">deployed_code</span>
                          <span className="text-[11px] text-amber-300">.jar</span>
                        </div>
                        <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                          <span className="material-symbols-outlined text-[#4DAAFB] text-sm">folder</span> 
                          <span>src/</span>
                        </div>
                        <div className="pl-6 flex items-center gap-2 opacity-70">
                          <span className="material-symbols-outlined text-[#4DAAFB] text-xs">code</span>
                          <span className="text-[11px] text-slate-400">source code</span>
                        </div>
                      </div>
                    </div>

                    {/* Cau2 */}
                    <div>
                      <div className="flex items-center gap-2 mt-4">
                        <span className="material-symbols-outlined text-[#E8AB5C] text-base">folder</span>
                        <span className="text-slate-100">2</span>
                        <span className="material-symbols-outlined text-green-400 text-sm ml-auto mr-2">check_circle</span>
                      </div>
                      <div className="pl-6 border-l border-white/10 ml-2 space-y-2 pt-2">
                        <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                          <span className="material-symbols-outlined text-slate-400 text-sm">folder</span> 
                          <span>run/</span>
                        </div>
                        <div className="pl-6 flex items-center gap-2 opacity-70">
                          <span className="material-symbols-outlined text-amber-400 text-xs">deployed_code</span>
                          <span className="text-[11px] text-amber-300">.jar</span>
                        </div>
                        <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                          <span className="material-symbols-outlined text-[#4DAAFB] text-sm">folder</span> 
                          <span>src/</span>
                        </div>
                        <div className="pl-6 flex items-center gap-2 opacity-70">
                          <span className="material-symbols-outlined text-[#4DAAFB] text-xs">code</span>
                          <span className="text-[11px] text-slate-400">source code</span>
                        </div>
                      </div>
                    </div>

                   

                    
                  </div>
                </div>
              </div>
            </div>
            
            {/* Valid bottom line */}
            <div className="p-4 bg-white border-t border-slate-100">
               <div className="flex items-center justify-center gap-2 py-2 px-4 bg-green-50 border border-green-200/50 rounded-xl">
                 <span className="w-2 h-2 rounded-full bg-green-500" />
                 <span className="text-green-700 font-bold text-xs uppercase tracking-widest">Cấu trúc hợp lệ</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast notification - góc trên phải */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl text-sm font-bold transition-all animate-in slide-in-from-top-3 ${
          toast.type === 'success'
            ? 'bg-emerald-600 text-white shadow-emerald-600/30'
            : 'bg-red-600 text-white shadow-red-600/30'
        }`}>
          <span className="material-symbols-outlined text-xl">
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {toast.msg}
        </div>
      )}

      {/* Lỗi nộp bài từ server */}
      {submitError && (
        <div className="rounded-2xl border border-red-200 bg-red-50/90 p-5 flex gap-4 items-start shadow-md shadow-red-500/10">
          <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-red-100 flex items-center justify-center text-red-500">
            <span className="material-symbols-outlined text-2xl">error</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-red-700 text-sm mb-0.5">Không thể nộp bài</p>
            <p className="text-sm text-red-600 leading-relaxed">{submitError}</p>
          </div>
          <button
            onClick={() => setSubmitError(null)}
            className="flex-shrink-0 w-7 h-7 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center text-red-400 transition-colors"
          >
            <span className="material-symbols-outlined text-[15px]">close</span>
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col-reverse md:flex-row items-stretch md:items-center justify-end gap-4 pt-5 border-t border-slate-200/60">
        <button
          type="button"
          disabled={submitting}
          onClick={() => navigate('/student')}
          className="w-full md:w-auto px-8 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-sm hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
        >
          Hủy bỏ
        </button>
        <button
          type="button"
          disabled={!selectedFile || submitting}
          onClick={handleSubmit}
          className="w-full md:w-auto px-10 py-3.5 bg-gradient-to-r from-[#f27121] to-orange-500 text-white rounded-xl font-bold text-sm hover:from-[#e06010] hover:to-[#ea580c] disabled:opacity-50 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/35 active:translate-y-0"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Đang nộp bài...
            </>
          ) : (
            <>
              {existingSubmission ? 'Nộp lại bài' : 'Xác nhận nộp bài'}
              <span className="material-symbols-outlined text-[18px]">cloud_done</span>
            </>
          )}
        </button>
      </div>

      {/* Banner nộp bài thành công — phía dưới, không tắt */}
      {successBanner && (
        <div className="flex items-center gap-3 px-5 py-4 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/20">
          <span className="material-symbols-outlined text-xl flex-shrink-0">task_alt</span>
          <p className="font-black text-sm">Nộp bài thành công</p>
        </div>
      )}
    </PageShell>
  );
}
