import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import AppealStatusBadge from './AppealStatusBadge';
import {
  formatDateTime,
  formatScore,
  hasAppealReviewOutcome,
  isAppealFinalStatus,
  resolveAppealScores,
} from '../helpers/appealHelpers';

function AppealResultScorePanel({ scoreInfo }) {
  const originalText = scoreInfo.originalScore != null ? formatScore(scoreInfo.originalScore) : '—';
  const newText = scoreInfo.newScore != null ? formatScore(scoreInfo.newScore) : 'Chưa có';

  if (scoreInfo.originalScore == null) {
    return (
      <div className="text-right">
        <p className="text-2xl font-black text-slate-400">—</p>
      </div>
    );
  }

  return (
    <div className="text-right">
      <div className="flex items-center justify-end gap-2">
        <span className={`text-sm font-bold ${scoreInfo.newScore != null ? 'text-slate-400 line-through' : 'text-slate-500'}`}>
          {originalText}
        </span>
        {scoreInfo.newScore != null ? (
          <>
            <span className="material-symbols-outlined text-[18px] text-emerald-500">arrow_upward</span>
            <span className="text-3xl font-black text-emerald-600">{newText}</span>
          </>
        ) : (
          <span className="text-3xl font-black text-slate-800">{newText}</span>
        )}
      </div>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
        Kết quả sau phúc khảo
      </p>
    </div>
  );
}

function AppealCurrentScorePanel({ scoreInfo }) {
  const currentText = scoreInfo.originalScore != null ? formatScore(scoreInfo.originalScore) : '—';

  return (
    <div className="text-right">
      <p className="text-3xl font-black text-slate-800">{currentText}</p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
        Điểm hiện tại
      </p>
    </div>
  );
}

export default function AppealListCard({ appeal }) {
  const finalStatus = isAppealFinalStatus(appeal?.status);
  const hasReviewOutcome = hasAppealReviewOutcome(appeal?.status);
  const scoreInfo = useMemo(
    () => resolveAppealScores(appeal, appeal?.gradingDetail),
    [appeal],
  );

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="p-5 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-lg font-black leading-tight text-slate-900">
                {appeal?.examName || 'Bài thi cần phúc khảo'}
              </h3>
              <AppealStatusBadge status={appeal?.status} />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              <span>Mã yêu cầu: {appeal?.appealCode || '—'}</span>
              <span>Ngày gửi: {formatDateTime(appeal?.createdAt)}</span>
              {appeal?.semester ? <span>{appeal.semester}</span> : null}
            </div>
          </div>

          {hasReviewOutcome ? (
            <AppealResultScorePanel scoreInfo={scoreInfo} />
          ) : (
            <AppealCurrentScorePanel scoreInfo={scoreInfo} />
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5 text-sm text-slate-500">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            {appeal?.submissionId ? (
              <Link
                to={`/student/results/${appeal.submissionId}`}
                state={{ appealId: appeal?.appealId, fromAppeal: true }}
                className="font-semibold text-[#F37021] transition-colors hover:text-orange-500"
              >
                Xem kết quả bài nộp
              </Link>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={`/student/appeals/${appeal?.appealId}`}
              state={{ appeal }}
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 px-4 font-bold text-slate-700 transition-colors hover:border-[#F37021] hover:text-[#F37021]"
            >
              Xem chi tiết đơn
            </Link>
            {finalStatus ? (
              <span className="inline-flex h-10 items-center rounded-2xl bg-emerald-50 px-4 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
                Đơn đã xử lý xong
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
