import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StudentLayout from '../../components/layouts/student';
import examApi from '../../services/examApi';
import blockApi from '../../services/blockApi';
import submissionApi from '../../services/submissionApi';
import gradingApi from '../../services/gradingApi';

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

function ScoreBadge({ score, maxScore }) {
  if (score == null) {
    return <span className="text-slate-400 font-medium text-sm">—</span>;
  }
  const num = parseFloat(score);
  const max = parseFloat(maxScore) || 10;
  const pct = Math.min(100, (num / max) * 100);
  const color = num >= 8 ? '#22c55e' : num >= 5 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex flex-col gap-1.5 min-w-[80px]">
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-black" style={{ color }}>{num.toFixed(1)}</span>
        <span className="text-xs text-slate-400 font-medium">/ {max.toFixed(1)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden w-full">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

const gradingStatusMap = {
  PASS: { label: 'Đạt', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  FAIL: { label: 'Không đạt', cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
  GRADING: { label: 'Đang chấm', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400 animate-pulse' },
  SUBMITTED: { label: 'Chờ chấm', cls: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-400' },
  PENDING: { label: 'Chờ chấm', cls: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-400' },
};

function StatusBadge({ status }) {
  const info = gradingStatusMap[status]
    || { label: status || '—', cls: 'bg-slate-50 text-slate-600 border-slate-200', dot: 'bg-slate-400' };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${info.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${info.dot}`} />
      {info.label}
    </span>
  );
}

export default function StudentResultsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const examRes = await examApi.getAll({ page: 0, size: 100, sort: 'startTime,desc' });
      const exams = examRes?.data?.content ?? [];

      const blockResults = await Promise.allSettled(
        exams.map(async (exam) => {
          const res = await blockApi.getByExam(exam.examId);
          const blocks = Array.isArray(res) ? res : res?.data ?? [];
          return blocks.map((b) => ({
            ...b,
            examName: exam.name,
            examSemester: exam.semester ?? '',
            examStatus: exam.status,
          }));
        }),
      );

      const allBlocks = blockResults
        .filter((r) => r.status === 'fulfilled')
        .flatMap((r) => r.value);

      if (allBlocks.length === 0) {
        setRows([]);
        return;
      }

      const enriched = await Promise.allSettled(
        allBlocks.map(async (block, idx) => {
          let sub = null;
          try {
            const subRes = await submissionApi.getMySubmission(block.examId, block.blockId);
            const data = subRes?.data ?? subRes;
            if (data?.submissionId) sub = data;
          } catch {
            // block chưa nộp
          }

          if (!sub) return null;

          let grading = null;
          try {
            const gRes = await gradingApi.getMyResult(block.examId, block.blockId);
            grading = gRes?.data ?? gRes;
          } catch {
            // chưa có kết quả
          }

          return {
            _idx: idx,
            examId: block.examId,
            blockId: block.blockId,
            submissionId: sub.submissionId,
            examName: block.examName,
            semester: block.examSemester,
            blockName: block.name,
            examDate: block.startTime,
            submittedAt: sub.submittedAt,
            totalScore: grading?.totalScore ?? null,
            maxScore: grading?.maxScore ?? null,
            gradingStatus: grading
              ? grading.status
              : sub.status === 'GRADING'
                ? 'GRADING'
                : 'SUBMITTED',
            gradedAt: grading?.gradedAt ?? null,
            gradingResultId: grading?.gradingResultId ?? null,
          };
        }),
      );

      const list = enriched
        .filter((r) => r.status === 'fulfilled' && r.value)
        .map((r) => r.value)
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

      setRows(list);
    } catch (e) {
      console.error('[StudentResultsPage] loadData error:', e);
      setError('Không thể tải kết quả. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const headerActions = (
    <button
      type="button"
      onClick={loadData}
      title="Làm mới"
      className="w-9 h-9 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-all"
    >
      <span className={`material-symbols-outlined text-xl ${loading ? 'animate-spin' : ''}`}>refresh</span>
    </button>
  );

  return (
    <StudentLayout
      activeNavKey="results"
      title="Kết quả chấm bài"
      breadcrumbs={[
        { label: 'Trang chủ', to: '/student' },
        { label: 'Kết quả' },
      ]}
      headerActions={headerActions}
      bodyClassName="px-8 py-8 max-w-7xl mx-auto space-y-6"
    >
      <section className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 shadow-sm px-6 py-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Lịch sử kết quả nộp bài</h2>
          <p className="text-sm text-slate-500 mt-1">Theo dõi trạng thái chấm và điểm số của từng kỳ thi.</p>
        </div>
        <div className="hidden sm:flex w-11 h-11 rounded-xl bg-[#F37021]/10 text-[#F37021] items-center justify-center">
          <span className="material-symbols-outlined">bar_chart</span>
        </div>
      </section>

      {loading && (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full border-4 border-[#F37021]/30 border-t-[#F37021] animate-spin" />
          <p className="text-slate-500 font-medium">Đang tải kết quả chấm bài...</p>
        </div>
      )}

      {!loading && error && (
        <div className="bg-white rounded-2xl border border-red-200 p-12 flex flex-col items-center text-center gap-3 shadow-sm">
          <span className="material-symbols-outlined text-red-400 text-5xl">error</span>
          <p className="font-bold text-slate-700">{error}</p>
          <button
            type="button"
            onClick={loadData}
            className="px-6 py-2.5 bg-[#F37021] text-white rounded-xl font-bold text-sm hover:bg-orange-500 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center text-center gap-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-slate-300 text-4xl">assignment_late</span>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">Chưa có kết quả nào</h2>
            <p className="text-sm text-slate-500 mt-1">Bạn chưa có bài nộp nào trong các kỳ thi gần đây.</p>
          </div>
          <Link
            to="/student/submit"
            className="mt-1 px-6 py-2.5 bg-[#F37021] text-white rounded-xl font-bold text-sm hover:bg-orange-500 transition-colors"
          >
            Đi đến trang nộp bài
          </Link>
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="bg-white/95 backdrop-blur rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-800">Lịch sử nộp bài &amp; kết quả</h2>
              <p className="text-xs text-slate-400 mt-0.5">{rows.length} bài nộp</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] table-fixed text-sm">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-100 text-center text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="px-5 py-3.5 w-[56px] text-center">#</th>
                  <th className="px-5 py-3.5 w-[18%] text-center">Tên kỳ thi</th>
                  <th className="px-5 py-3.5 w-[8%] text-center">Kỳ</th>
                  <th className="px-5 py-3.5 w-[18%] text-center">Block / Ca</th>
                  <th className="px-5 py-3.5 w-[14%] text-center">Ngày thi</th>
                  <th className="px-5 py-3.5 w-[14%] text-center">Điểm số</th>
                  <th className="px-5 py-3.5 w-[13%] text-center">Trạng thái</th>
                  <th className="px-5 py-3.5 w-[12%] text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((r, i) => (
                  <tr
                    key={r.submissionId}
                    className="odd:bg-white even:bg-slate-50/30 hover:bg-orange-50/40 transition-colors group"
                  >
                    <td className="px-5 py-4 text-slate-400 font-bold text-xs text-center align-middle">{i + 1}</td>

                    <td className="px-5 py-4 text-center align-middle">
                      <p className="font-bold text-slate-800 leading-snug line-clamp-2 max-w-[180px] mx-auto">{r.examName}</p>
                    </td>

                    <td className="px-5 py-4 text-center align-middle">
                      {r.semester ? (
                        <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">{r.semester}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-center align-middle">
                      <p className="text-slate-700 font-semibold">{r.blockName || '—'}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Nộp: {fmtDate(r.submittedAt)}</p>
                    </td>

                    <td className="px-5 py-4 text-slate-600 whitespace-nowrap text-center align-middle">
                      {fmtDate(r.examDate)}
                    </td>

                    <td className="px-5 py-4 text-center align-middle">
                      <div className="flex justify-center">
                        <ScoreBadge score={r.totalScore} maxScore={r.maxScore} />
                      </div>
                    </td>

                    <td className="px-5 py-4 text-center align-middle">
                      <div className="flex flex-col items-center">
                        <StatusBadge status={r.gradingStatus} />
                        {r.gradedAt && (
                          <p className="text-[10px] text-slate-400 mt-1">Chấm: {fmtDate(r.gradedAt)}</p>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-center align-middle">
                      <div className="flex items-center justify-center gap-2">
                        {r.gradingResultId ? (
                          <Link
                            to={`/student/results/${r.submissionId}`}
                            state={{
                              examId: r.examId,
                              blockId: r.blockId,
                              prefill: {
                                submissionId: r.submissionId,
                                gradingResultId: r.gradingResultId,
                                examName: r.examName,
                                semesterName: r.semester,
                                blockName: r.blockName,
                                totalScore: r.totalScore,
                                maxScore: r.maxScore,
                                gradedAt: r.gradedAt,
                                status: r.gradingStatus,
                              },
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F37021]/10 text-[#F37021] text-xs font-bold hover:bg-[#F37021]/20 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[14px]">visibility</span>
                            Chi tiết
                          </Link>
                        ) : (
                          <span className="inline-flex items-center whitespace-nowrap gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-400 text-xs font-bold cursor-not-allowed select-none">
                            <span className="material-symbols-outlined text-[14px]">hourglass_empty</span>
                            Chờ kết quả
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}
