import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import StudentLayout from '../../components/layouts/student';
import appealApi from '../../services/appealApi';
import gradingApi from '../../services/gradingApi';
import AppealProgressTimeline from './appeals/components/AppealProgressTimeline';
import AppealStatusBadge from './appeals/components/AppealStatusBadge';
import {
  extractAppealErrorMessage,
  findAppealById,
  formatDateTime,
  formatScore,
  getAppealReviewerName,
  hasAppealReviewOutcome,
  resolveAppealScores,
  unwrapApiData,
} from './appeals/helpers/appealHelpers';

function MetaCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value || '—'}</p>
    </div>
  );
}

function ScoreCard({ label, value, emphasize = false, strike = false }) {
  const hasValue = value != null && value !== '—' && value !== '';

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${emphasize ? 'border-orange-200 bg-orange-50' : 'border-slate-200 bg-white'}`}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        {hasValue ? (
          <span className={`text-3xl font-black ${strike ? 'text-slate-400 line-through' : emphasize ? 'text-[#F37021]' : 'text-emerald-600'}`}>
            {value}
          </span>
        ) : (
          <span className="text-3xl font-black text-slate-400">—</span>
        )}
      </div>
    </div>
  );
}

export default function StudentAppealDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { appealId } = useParams();

  const [appeal, setAppeal] = useState(location.state?.appeal ?? null);
  const [gradingDetail, setGradingDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [noticeDismissed, setNoticeDismissed] = useState(false);

  const loadAppeal = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await appealApi.getMyAppeals();
      const payload = unwrapApiData(response);
      const matchedAppeal = findAppealById(payload?.appeals ?? payload, appealId);

      if (!matchedAppeal) {
        setError('Không tìm thấy đơn phúc khảo bạn đang cần xem.');
        setAppeal(null);
        setGradingDetail(null);
        return;
      }

      setAppeal(matchedAppeal);

      if (matchedAppeal?.submissionId) {
        try {
          const gradingResponse = await gradingApi.getSubmissionResult(matchedAppeal.submissionId);
          setGradingDetail(unwrapApiData(gradingResponse));
        } catch {
          setGradingDetail(null);
        }
      } else {
        setGradingDetail(null);
      }
    } catch (apiError) {
      setError(
        extractAppealErrorMessage(
          apiError,
          'Không thể tải chi tiết đơn phúc khảo lúc này. Vui lòng thử lại.',
        ),
      );
      setAppeal(null);
      setGradingDetail(null);
    } finally {
      setLoading(false);
    }
  }, [appealId]);

  useEffect(() => {
    loadAppeal();
  }, [loadAppeal]);

  useEffect(() => {
    if (!appeal && location.state?.appeal) {
      setAppeal(location.state.appeal);
    }
  }, [appeal, location.state]);

  const hasReviewOutcome = hasAppealReviewOutcome(appeal?.status);
  const reviewerName = getAppealReviewerName(appeal);
  const scoreInfo = useMemo(
    () => resolveAppealScores(appeal, gradingDetail),
    [appeal, gradingDetail],
  );

  const scoreDeltaLabel = useMemo(() => {
    if (!hasReviewOutcome || scoreInfo.originalScore == null || scoreInfo.newScore == null) return 'Chưa có';
    const delta = scoreInfo.newScore - scoreInfo.originalScore;
    const sign = delta > 0 ? '+' : '';
    return `${sign}${formatScore(delta)}`;
  }, [hasReviewOutcome, scoreInfo]);

  const originalScoreLabel = scoreInfo.originalScore != null ? formatScore(scoreInfo.originalScore) : '—';
  const reviewedScoreLabel = hasReviewOutcome && scoreInfo.newScore != null
    ? formatScore(scoreInfo.newScore)
    : 'Chưa có';
  const lecturerFeedbackLabel = hasReviewOutcome
    ? (appeal?.lecturerComment || 'Chưa có')
    : 'Chưa có';

  return (
    <StudentLayout
      activeNavKey="appeals"
      title="Chi tiết đơn phúc khảo"
      breadcrumbs={[
        { label: 'Trang chủ', to: '/student' },
        { label: 'Phúc khảo', to: '/student/appeals' },
        { label: 'Chi tiết đơn' },
      ]}
      bodyClassName="mx-auto max-w-6xl space-y-6 px-8 py-8"
    >
      {loading ? (
        <div className="space-y-4">
          <div className="h-40 animate-pulse rounded-3xl bg-slate-100" />
          <div className="h-32 animate-pulse rounded-3xl bg-slate-100" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          </div>
          <div className="h-72 animate-pulse rounded-3xl bg-slate-100" />
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-white p-10 text-center shadow-sm">
          <span className="material-symbols-outlined text-[44px] text-rose-500">error</span>
          <h2 className="mt-3 text-xl font-black text-slate-900">Không thể tải chi tiết đơn</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">{error}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={loadAppeal}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#F37021] px-5 text-sm font-black text-white transition-colors hover:bg-orange-500"
            >
              Thử lại
            </button>
            <button
              type="button"
              onClick={() => navigate('/student/appeals')}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      ) : !appeal ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-base font-semibold text-slate-900">Không tìm thấy đơn phúc khảo.</p>
        </div>
      ) : (
        <>
          {hasReviewOutcome && !noticeDismissed ? (
            <section className="rounded-3xl border border-emerald-200 bg-emerald-50 px-6 py-5 text-emerald-900 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <span className="material-symbols-outlined">task_alt</span>
                  </div>
                  <div>
                    <p className="text-base font-black">Đơn phúc khảo đã có kết quả</p>
                    <p className="mt-1 text-sm leading-6 text-emerald-800">
                      Bạn có thể xem lại điểm cũ, điểm mới và phản hồi trực tiếp trên trang này.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setNoticeDismissed(true)}
                  className="inline-flex h-10 items-center justify-center rounded-2xl border border-current/15 bg-white/70 px-4 text-sm font-bold transition-colors hover:bg-white"
                >
                  Đã hiểu
                </button>
              </div>
            </section>
          ) : null}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/student/appeals')}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-[#F37021] hover:text-[#F37021]"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  </button>
                  <AppealStatusBadge status={appeal?.status} />
                </div>

                <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
                  {appeal?.examName || 'Đơn phúc khảo'}
                </h1>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:w-[420px]">
                <MetaCard label="Ngày tạo đơn" value={formatDateTime(appeal?.createdAt)} />
                <MetaCard label="Học kỳ" value={appeal?.semesterName || appeal?.semester || '—'} />
                <MetaCard label="Giảng viên chấm lại" value={reviewerName || 'Chưa phân công'} />
                <MetaCard label="Block / ca thi" value={appeal?.blockName || appeal?.block?.name || '—'} />
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <ScoreCard
              label="Điểm cũ"
              value={originalScoreLabel}
              strike={hasReviewOutcome && scoreInfo.newScore != null}
            />
            <ScoreCard
              label="Điểm mới"
              value={reviewedScoreLabel}
              emphasize
            />
            <ScoreCard label="Chênh lệch" value={scoreDeltaLabel} />
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Tiến trình xử lý</h2>
            <div className="mt-4">
              <AppealProgressTimeline status={appeal?.status} />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Mã yêu cầu</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{appeal?.appealCode || appeal?.appealId || '—'}</p>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-6">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Lý do phúc khảo</p>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">{appeal?.reason || '—'}</p>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-6">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Phản hồi của giảng viên</p>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">{lecturerFeedbackLabel}</p>
            </section>
          </section>

          <section className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <Link
              to="/student/appeals"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Quay lại danh sách phúc khảo
            </Link>

            {appeal?.submissionId ? (
              <Link
                to={`/student/results/${appeal.submissionId}`}
                state={{ appealId: appeal?.appealId, fromAppeal: true }}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#F37021] px-5 text-sm font-black text-white transition-colors hover:bg-orange-500"
              >
                Xem kết quả bài nộp
              </Link>
            ) : (
              <div />
            )}
          </section>
        </>
      )}
    </StudentLayout>
  );
}
