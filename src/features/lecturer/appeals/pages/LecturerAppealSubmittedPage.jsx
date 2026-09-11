import React, { useEffect, useMemo } from 'react';
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router-dom';
import useLecturerAppealDetail from '../../../../hooks/useLecturerAppealDetail';
import LecturerAppealStatusBadge from '../components/LecturerAppealStatusBadge';
import LecturerScoreBreakdownTable from '../components/LecturerScoreBreakdownTable';
import {
  buildSubmittedQuestionRows,
  formatAppealDate,
  formatAppealScore,
  getScoreDelta,
} from '../helpers/appealHelpers';

function SummaryCard({ label, value, toneClassName = 'text-slate-900', subtleClassName = 'border-slate-200 bg-white' }) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${subtleClassName}`}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-black ${toneClassName}`}>{value}</p>
    </div>
  );
}

function MetaChip({ label, value }) {
  if (!value) return null;

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </span>
  );
}

function SubmittedPageSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="h-48 animate-pulse rounded-3xl bg-slate-100" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
      </div>
      <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
      <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
    </div>
  );
}

export default function LecturerAppealSubmittedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { appealId } = useParams();
  const { setPageMeta } = useOutletContext();
  const { data, loading } = useLecturerAppealDetail(appealId);

  const stateResult = location.state?.result ?? null;

  const submittedResult = useMemo(() => {
    if (stateResult && data) {
      const stateQuestionScores = stateResult.newQuestionScores || {};
      const dataQuestionScores = data.newQuestionScores || {};

      return {
        ...data,
        ...stateResult,
        gradingDetail: stateResult.gradingDetail || data.gradingDetail || null,
        newQuestionScores:
          Object.keys(stateQuestionScores).length > 0
            ? stateQuestionScores
            : dataQuestionScores,
      };
    }

    return stateResult ?? data ?? null;
  }, [stateResult, data]);

  const questionRows = useMemo(
    () =>
      buildSubmittedQuestionRows({
        gradingDetail: submittedResult?.gradingDetail,
        newQuestionScores: submittedResult?.newQuestionScores,
      }),
    [submittedResult?.gradingDetail, submittedResult?.newQuestionScores],
  );

  const scoreDelta = useMemo(
    () => getScoreDelta(submittedResult?.originalScore, submittedResult?.newScore),
    [submittedResult?.originalScore, submittedResult?.newScore],
  );

  const scoreChanged = useMemo(
    () => Math.abs(Number(scoreDelta.value || 0)) > 0,
    [scoreDelta.value],
  );

  const summaryRow = useMemo(
    () => ({
      originalScore: submittedResult?.originalScore,
      newScore: submittedResult?.newScore,
      deltaLabel: scoreDelta.label,
      deltaToneClassName: scoreDelta.toneClassName,
    }),
    [submittedResult?.originalScore, submittedResult?.newScore, scoreDelta],
  );

  const submittedAtLabel = useMemo(
    () =>
      formatAppealDate(
        submittedResult?.completedAt ||
          submittedResult?.updatedAt ||
          submittedResult?.createdAt,
      ),
    [
      submittedResult?.completedAt,
      submittedResult?.updatedAt,
      submittedResult?.createdAt,
    ],
  );

  useEffect(() => {
    setPageMeta({
      title: 'Kết quả phúc khảo đã gửi',
      subtitle: 'Tóm tắt kết quả review sau khi giảng viên gửi lên hệ thống.',
      breadcrumbs: [
        { label: 'Dashboard', to: '/lecturer' },
        { label: 'Phúc khảo', to: '/lecturer/appeals' },
        { label: 'Đã gửi kết quả' },
      ],
      headerActions: null,
    });
  }, [setPageMeta]);

  if (loading && !submittedResult) {
    return <SubmittedPageSkeleton />;
  }

  if (!submittedResult) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
        <p className="text-base font-semibold text-slate-900">
          Không có dữ liệu kết quả để hiển thị.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Hãy quay lại danh sách phúc khảo và mở lại đơn review tương ứng.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#F37021]">
                Review submitted
              </span>
              <LecturerAppealStatusBadge
                status={submittedResult.status || 'COMPLETED'}
              />
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                  scoreChanged
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-slate-100 text-slate-600'
                }`}
              >
                {scoreChanged ? 'Thay đổi điểm' : 'Giữ nguyên điểm'}
              </span>
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
              {submittedResult.studentName || 'Sinh viên'}
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {submittedResult.studentMssv || '—'}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <MetaChip label="Kỳ thi" value={submittedResult.examName} />
              <MetaChip label="Học kỳ" value={submittedResult.semester} />
              <MetaChip label="Block" value={submittedResult.blockName} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-[320px]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Thời gian gửi
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {submittedAtLabel}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                File bài nộp
              </p>
              <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-900">
                {submittedResult.submissionFileName || '—'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <SummaryCard
          label="Điểm cũ"
          value={formatAppealScore(submittedResult.originalScore)}
          subtleClassName="border-slate-200 bg-slate-50"
        />
        <SummaryCard
          label="Điểm mới"
          value={formatAppealScore(submittedResult.newScore)}
          toneClassName="text-[#F37021]"
          subtleClassName="border-orange-200 bg-orange-50"
        />
        <SummaryCard
          label="Thay đổi"
          value={scoreDelta.label}
          toneClassName={scoreDelta.toneClassName}
          subtleClassName="border-emerald-200 bg-emerald-50"
        />
        <SummaryCard
          label="Điểm testcase"
          value={formatAppealScore(submittedResult.testCaseScore)}
          toneClassName="text-blue-700"
          subtleClassName="border-blue-200 bg-blue-50"
        />
        <SummaryCard
          label="Điểm OOP"
          value={formatAppealScore(submittedResult.oopScore)}
          toneClassName="text-violet-700"
          subtleClassName="border-violet-200 bg-violet-50"
        />
      </section>

      <LecturerScoreBreakdownTable
        rows={questionRows}
        summaryRow={summaryRow}
        description="Điểm được hiển thị theo từng câu của bài làm sau khi giảng viên gửi kết quả review."
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
          Nhận xét của giảng viên
        </p>
        <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
          {submittedResult.lecturerComment || '—'}
        </p>
      </section>

      <div className="flex flex-wrap items-center gap-3 pb-2">
        <button
          type="button"
          onClick={() => navigate('/lecturer/appeals')}
          className="inline-flex items-center gap-2 rounded-xl bg-[#F37021] px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#de611d]"
        >
          <span className="material-symbols-outlined text-[18px]">
            arrow_back
          </span>
          Quay về danh sách
        </button>
        <button
          type="button"
          onClick={() => navigate(`/lecturer/appeals/${appealId}`)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-[#F37021] hover:text-[#F37021]"
        >
          <span className="material-symbols-outlined text-[18px]">
            visibility
          </span>
          Xem lại chi tiết đơn
        </button>
      </div>
    </div>
  );
}
