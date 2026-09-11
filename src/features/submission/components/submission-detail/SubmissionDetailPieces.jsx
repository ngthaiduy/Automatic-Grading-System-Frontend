import React from 'react';
import {
  fmtDateTime,
  num,
  questionTone,
  resolveFinalGradeDisplay,
  tcStatusClass,
} from './submissionDetail.helpers.js';

function SubmissionScoreSkeleton() {
  return (
    <div className="flex items-end justify-center lg:justify-end gap-2">
      <span className="h-7 w-16 rounded-lg bg-slate-200 animate-pulse"></span>
      <span className="h-12 w-28 rounded-xl bg-slate-200 animate-pulse"></span>
      <span className="h-7 w-14 rounded-lg bg-slate-200 animate-pulse"></span>
    </div>
  );
}

function SubmissionSingleScoreDisplay({ value, maxScore }) {
  const hasValue = Number.isFinite(Number(value));
  const hasMaxScore = Number.isFinite(Number(maxScore));

  if (!hasValue) {
    return (
      <div className="flex items-end justify-center lg:justify-end gap-1.5">
        <span className="text-5xl font-black text-slate-400">-</span>
        {hasMaxScore ? <span className="text-xl font-bold text-slate-400">/ {num(maxScore)}</span> : null}
      </div>
    );
  }

  return (
    <div className="flex items-end justify-center lg:justify-end gap-1.5">
      <span className="text-5xl font-black text-emerald-600">
        {num(value)}
      </span>
      {hasMaxScore ? <span className="text-xl font-bold text-slate-400">/ {num(maxScore)}</span> : null}
    </div>
  );
}

function SubmissionComparedScoreDisplay({ originalValue, nextValue, maxScore, emphasize = false }) {
  const hasOriginal = Number.isFinite(Number(originalValue));
  const hasNext = Number.isFinite(Number(nextValue));

  if (!hasOriginal || !hasNext) {
    return <SubmissionSingleScoreDisplay value={originalValue ?? nextValue} maxScore={maxScore} />;
  }

  return (
    <div className="flex flex-wrap items-end justify-center gap-2 lg:justify-end">
      <span className="text-2xl font-bold text-slate-400 line-through">{num(originalValue)}</span>
      <span className={`text-5xl font-black ${emphasize ? 'text-emerald-600' : 'text-emerald-600'}`}>
        {num(nextValue)}
      </span>
      <span className="text-xl font-bold text-slate-400">/ {num(maxScore)}</span>
    </div>
  );
}

function SubmissionSingleMetricDisplay({ value, tone = 'neutral' }) {
  const hasValue = Number.isFinite(Number(value));

  if (!hasValue) {
    return (
      <span className="text-base font-black text-slate-400 bg-slate-50 px-2.5 py-0.5 rounded-lg border border-slate-100">-</span>
    );
  }

  const toneClassName = tone === 'success'
    ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
    : 'text-slate-800 bg-slate-50 border-slate-100';

  return (
    <span className={`text-base font-black px-2.5 py-0.5 rounded-lg border ${toneClassName}`}>
      {num(value)}
    </span>
  );
}

function SubmissionComparedMetricDisplay({ originalValue, nextValue, tone = 'success' }) {
  const hasOriginal = Number.isFinite(Number(originalValue));
  const hasNext = Number.isFinite(Number(nextValue));

  if (!hasOriginal || !hasNext) {
    return <SubmissionSingleMetricDisplay value={originalValue ?? nextValue} tone={tone} />;
  }

  const toneClassName = tone === 'success'
    ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
    : 'text-slate-800 bg-slate-50 border-slate-100';

  return (
    <div className="flex items-center gap-2 text-right">
      <span className="text-sm font-bold text-slate-400 line-through">{num(originalValue)}</span>
      <span className={`text-base font-black px-2.5 py-0.5 rounded-lg border ${toneClassName}`}>
        {num(nextValue)}
      </span>
    </div>
  );
}

export const TopActions = React.memo(function TopActions({
  onBack,
  isStudentView,
  onAppeal,
  onRegrade,
  isRegrading,
  disableRegrade = false,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-100 rounded-full hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-sm font-bold text-slate-700 shadow-sm"
      >
        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        Quay lại
      </button>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {isStudentView ? (
          <button
            type="button"
            onClick={onAppeal}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#F37021] to-orange-500 text-white rounded-full hover:from-orange-500 hover:to-[#F37021] hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5 transition-all duration-300 text-sm font-bold shadow-sm group border-0"
          >
            <span className="material-symbols-outlined text-[20px] group-hover:-translate-y-0.5 transition-transform duration-300">
              gavel
            </span>
            Gửi yêu cầu phúc khảo
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onRegrade}
              disabled={isRegrading || disableRegrade}
              title={disableRegrade ? 'Bài đã có kết quả phúc khảo, không thể chấm lại.' : undefined}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#F37021] to-orange-500 text-white rounded-full hover:from-orange-500 hover:to-[#F37021] hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5 transition-all duration-300 text-sm font-bold shadow-sm disabled:opacity-70 disabled:hover:-translate-y-0 disabled:cursor-not-allowed group border-0"
            >
              {isRegrading ? (
                <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
              ) : (
                <span className="material-symbols-outlined text-[20px] group-hover:rotate-180 transition-transform duration-500">
                  refresh
                </span>
              )}
              Chấm lại
            </button>
          </>
        )}
      </div>
    </div>
  );
});

export const LoadingState = React.memo(function LoadingState({ hasDetail }) {
  if (!hasDetail) {
    return (
      <div className="bg-white rounded-[2rem] border border-slate-100 p-16 text-center shadow-xl shadow-slate-200/40">
        <div className="w-12 h-12 mx-auto rounded-full border-4 border-orange-100 border-t-[#F37021] animate-spin mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">Đang nạp dữ liệu đánh giá...</p>
      </div>
    );
  }

  return (
    <div className="bg-orange-50 border border-orange-100 rounded-2xl px-5 py-3 text-sm font-semibold text-[#F37021] inline-flex items-center gap-3 shadow-sm">
      <span className="w-4 h-4 rounded-full border-2 border-orange-200 border-t-[#F37021] animate-spin" />
      Đang cập nhật dữ liệu mới nhất...
    </div>
  );
});

export const AlertBox = React.memo(function AlertBox({ type = 'error', text }) {
  const typeMap = {
    error: {
      box: 'bg-rose-50 border-rose-200 text-rose-700',
      icon: 'error',
      iconCls: 'text-rose-500',
    },
    warning: {
      box: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: 'warning',
      iconCls: 'text-amber-500',
    },
  };
  const current = typeMap[type] || typeMap.error;

  return (
    <div className={`rounded-2xl border px-5 py-4 shadow-sm flex items-start gap-3 ${current.box}`}>
      <span className={`material-symbols-outlined mt-0.5 ${current.iconCls}`}>{current.icon}</span>
      <div className="font-medium text-sm">{text}</div>
    </div>
  );
});

export const OverviewHeader = React.memo(function OverviewHeader({
  detail,
  status,
  appealScores,
  showScoreComparison = false,
  isScoreResolving = false,
  gradingMode,
}) {
  const finalGradeDisplay = resolveFinalGradeDisplay(
    detail,
    appealScores,
    showScoreComparison,
  );

  // Resolve grading mode display: label + %TC/%OOP breakdown
  const modeInfo = React.useMemo(() => {
    const m = String(gradingMode || detail?.gradingMode || '').toUpperCase();
    switch (m) {
      case 'MODE_1': return { label: 'Mode 1', tc: 100, oop: 0 };
      case 'MODE_2': return { label: 'Mode 2', tc: 50, oop: 50 };
      case 'MODE_3': return { label: 'Mode 3', tc: 0, oop: 100 };
      case 'MODE_4': return { label: 'Mode 4', tc: 100, oop: 0, oopNote: 'OOP comment' };
      case 'MODE_5': return { label: 'Mode 5', tc: 60, oop: 40 };
      default: return m ? { label: m, tc: null, oop: null } : null;
    }
  }, [gradingMode, detail?.gradingMode]);

  const semester = detail?.semesterName || detail?.semester || null;

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
      <div className="h-1.5 w-full bg-gradient-to-r from-[#F37021] to-amber-400"></div>
      <div className="p-7 sm:p-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start lg:items-center justify-between">
          <div className="flex items-center gap-5 min-w-0">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#F37021] to-orange-500 text-white text-2xl font-black flex items-center justify-center shadow-xl shadow-orange-500/30 shrink-0">
              {detail?.studentName?.charAt(0)?.toUpperCase() || 'S'}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Detail Report</span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm ${status.cls}`}>
                  {status.label}
                </span>
              </div>

              <h2 className="text-3xl font-black text-slate-800 tracking-tight truncate max-w-full">
                {detail?.studentName || '-'}
              </h2>

              <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-500 mt-2.5">
                <span className="flex items-center gap-1.5 bg-slate-100/50 px-2.5 py-1 rounded-md">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">badge</span>
                  {detail?.studentCode || '-'}
                </span>
                <span className="flex items-center gap-1.5 bg-slate-100/50 px-2.5 py-1 rounded-md max-w-full">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">mail</span>
                  <span className="truncate">{detail?.studentEmail || '-'}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50/80 border border-slate-100 rounded-3xl p-6 w-full lg:w-auto text-center lg:text-right shadow-inner shrink-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Final Grade</p>
            {isScoreResolving ? (
              <SubmissionScoreSkeleton />
            ) : finalGradeDisplay.variant === 'comparison' ? (
              <SubmissionComparedScoreDisplay
                originalValue={finalGradeDisplay.originalScore}
                nextValue={finalGradeDisplay.newScore}
                maxScore={detail?.maxScore}
                emphasize
              />
            ) : (
              <SubmissionSingleScoreDisplay
                value={finalGradeDisplay.currentScore}
                maxScore={detail?.maxScore}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export const QuestionCard = React.memo(function QuestionCard({
  ans,
  index,
  isOpen,
  onToggle,
  reviewedScore,
  originalScore,
  gradingMode,
  reviewerName,
  isScoreResolving = false,
}) {
  const testCases = Array.isArray(ans?.testCaseResults) ? ans.testCaseResults : [];
  const passCount = testCases.filter(
    (x) => String(x?.status || '').toUpperCase() === 'PASS_TESTCASE'
  ).length;
  const oopScore = ans?.aiReview?.oopScore;
  const rawTestCaseScore = Number(ans?.rawTestCaseScore);
  const rawOopScore = Number(ans?.rawOopScore);
  const hasRawTestCaseScore = Number.isFinite(rawTestCaseScore);
  const hasRawOopScore = Number.isFinite(rawOopScore);

  // Badge: cho biết điểm OOP được tính từ tiêu chí criteria (không ảnh hưởng tính toán)
  const criteriaResults = Array.isArray(ans?.criteriaResults) ? ans.criteriaResults : [];
  const hasCriteriaSum = criteriaResults.length > 0;

  const resolveModeWeights = (mode) => {
    const normalized = String(mode || '').toUpperCase();
    switch (normalized) {
      case 'MODE_2':
        return { tcWeight: 0.5, oopWeight: 0.5 };
      case 'MODE_3':
        return { tcWeight: 0.0, oopWeight: 1.0 };
      case 'MODE_4':
        return { tcWeight: 1.0, oopWeight: 0.0 }; // OOP comment only
      case 'MODE_5':
        // DB (V14): TestCaseWeight=60%, StructureWeight=40% (OopWeight=0 unused)
        // criteriaResults dùng StructureWeight để hiển thị 40% cho OOP column
        return { tcWeight: 0.6, oopWeight: 0.4 };
      case 'MODE_1':
      default:
        return { tcWeight: 1.0, oopWeight: 0.0 };
    }
  };

  const { tcWeight, oopWeight } = resolveModeWeights(gradingMode);
  const weightedTestCaseScore = hasRawTestCaseScore
    ? Number((rawTestCaseScore * tcWeight).toFixed(2))
    : null;
  // rawOopScore từ backend = SUM(criteria.earnedScore) - đã đúng, chỉ cần nhân weight
  const weightedOopScore = hasRawOopScore
    ? Number((rawOopScore * oopWeight).toFixed(2))
    : null;

  const baseOriginalQuestionScore = Number.isFinite(Number(originalScore)) ? Number(originalScore) : Number(ans?.questionScore);
  const nextQuestionScore = Number(reviewedScore);
  const hasReviewedScore = Number.isFinite(nextQuestionScore);

  return (
    <div className={`bg-white rounded-3xl border border-slate-100 shadow-md hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group border-l-4 ${questionTone(ans)}`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-5 flex flex-wrap md:flex-nowrap items-center justify-between transition-colors hover:bg-slate-50/50 relative gap-4"
      >
        <div className="flex items-center gap-5 text-left w-full md:w-auto">
          <div className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl font-bold text-sm shadow-sm border bg-white text-slate-700 border-slate-100">
            {ans?.questionNumber ?? index + 1}
          </div>

          <div>
            <p className="font-bold text-slate-800 text-[16px] group-hover:text-[#F37021] transition-colors">
              {ans?.questionTitle || `Question ${ans?.questionNumber ?? index + 1}`}
            </p>
            <div className="flex items-center flex-wrap gap-2 mt-1.5 text-[12px] font-medium text-slate-500">
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                Điểm tối đa: {num(ans?.maxScore)}
              </span>
              {ans?.guardRuleTriggered && (
                <span className="text-rose-600 font-bold uppercase tracking-wider text-[10px] bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">warning</span>
                  Guard Rule
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 shrink-0 ml-auto md:ml-0">
          <div className="text-right">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Score</p>
            {isScoreResolving ? (
              <div className="flex items-center gap-2">
                <span className="h-5 w-12 rounded bg-slate-200 animate-pulse"></span>
                <span className="h-6 w-12 rounded bg-slate-200 animate-pulse"></span>
              </div>
            ) : hasReviewedScore ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-400 line-through">{num(baseOriginalQuestionScore)}</span>
                <span className="text-lg font-black text-emerald-600">{num(nextQuestionScore)}</span>
              </div>
            ) : (
              <p className="text-lg font-black text-slate-800">{num(baseOriginalQuestionScore)}</p>
            )}
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 bg-slate-50 text-slate-400 group-hover:bg-orange-50 group-hover:text-[#F37021] ${isOpen ? 'rotate-180 bg-orange-50 text-[#F37021]' : ''}`}>
            <span className="material-symbols-outlined text-[20px]">keyboard_arrow_down</span>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="px-6 pb-6 pt-2 bg-slate-50/30 border-t border-slate-100">
          <div className="mt-4 space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-slate-400 bg-slate-100 p-1 rounded-md">bug_report</span>
                Unit Test Results và Danh sách test case
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 gap-4">
                  <span className="text-sm font-semibold text-slate-600">Passed Tests</span>
                  <div className="flex flex-1 items-center gap-3 max-w-[200px]">
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{
                          width: testCases.length
                            ? `${(passCount / testCases.length) * 100}%`
                            : '0%',
                        }}
                      ></div>
                    </div>
                    <span className="font-black text-slate-800 text-sm w-10 text-right">
                      {passCount}/{testCases.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {testCases.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 font-medium">
                      Không có test case nào để hiển thị.
                    </div>
                  )}

                  {testCases.map((tc, tIdx) => {
                    const isPass = String(tc?.status || '').toUpperCase() === 'PASS_TESTCASE';
                    const badgeClass = tcStatusClass(tc?.status);
                    const hasExpected = tc?.expectedOutput != null && tc.expectedOutput !== '';
                    const hasActual = tc?.actualOutput != null && tc.actualOutput !== '';
                    return (
                      <div
                        key={tc?.testCaseResultId || tIdx}
                        className={`rounded-2xl border bg-white shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden ${isPass ? 'border-emerald-200' : 'border-rose-200'}`}
                      >
                        {/* Header row */}
                        <div className={`flex flex-wrap items-center justify-between gap-4 p-4 border-b ${isPass ? 'bg-emerald-50/80 border-emerald-100' : 'bg-rose-50/80 border-rose-100'}`}>
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shadow-sm border ${isPass ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                              {tc?.testCaseNumber ?? tIdx + 1}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border shadow-sm ${badgeClass}`}>
                              {isPass ? 'PASS' : tc?.status || 'FAIL'}
                            </span>
                            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px] text-slate-400">timer</span>
                              {tc?.executionTimeMs ?? 0} ms
                            </span>
                          </div>
                          <span className={`text-sm font-black ${isPass ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {num(tc?.scoreEarned)} đ
                          </span>
                        </div>

                        {/* Expected / Actual output panels */}
                        <div className="p-4 space-y-4">
                          {(hasExpected || hasActual) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[14px]">fact_check</span>
                                  Expected Output
                                </p>
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[13px] font-sans text-slate-700 overflow-auto whitespace-pre-wrap break-all max-h-40 shadow-inner">
                                  {hasExpected ? tc.expectedOutput : '(none)'}
                                </div>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                  <span className={`material-symbols-outlined text-[14px] ${isPass ? 'text-emerald-500' : 'text-rose-400'}`}>
                                    {isPass ? 'check_circle' : 'cancel'}
                                  </span>
                                  Student Output
                                </p>
                                <div className={`p-3 rounded-xl border text-[13px] font-sans overflow-auto whitespace-pre-wrap break-all max-h-40 shadow-inner ${isPass ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' : 'bg-rose-50/80 border-rose-200 text-rose-900'}`}>
                                  {hasActual ? tc.actualOutput : '(no output)'}
                                </div>
                              </div>
                            </div>
                          )}

                          {!!tc?.errorMessage && (
                            <div className="mt-2 p-3 bg-rose-50/70 rounded-xl text-[13px] font-medium text-rose-800 border border-rose-100/70 font-sans overflow-auto shadow-sm">
                              {tc.errorMessage}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* OOP Criteria Results (NEW) */}
            {(() => {
              const criteriaResults = Array.isArray(ans?.criteriaResults) ? ans.criteriaResults : [];
              const hasCriteria = criteriaResults.length > 0;
              const passCount = criteriaResults.filter(c => c.passed).length;
              const totalCount = criteriaResults.length;

              if (!hasCriteria) return null;

              return (
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <p className="text-[11px] font-bold text-[#F37021] uppercase tracking-widest flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-[#F37021] bg-orange-50 p-1 rounded-md">rule</span>
                      Tiêu chí OOP
                    </p>
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full border shadow-sm ${passCount === totalCount ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                      {passCount}/{totalCount} đạt
                    </span>
                  </div>

                  {reviewerName ? (
                    <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Người chấm lại</p>
                      <p className="text-sm font-semibold text-slate-800">{reviewerName}</p>
                    </div>
                  ) : null}

                  <div className="space-y-3">
                    {criteriaResults.map((cr, crIdx) => (
                      <div
                        key={cr?.criteriaResultId || crIdx}
                        className={`flex flex-col gap-2 p-4 rounded-2xl border transition-all hover:shadow-sm ${cr.passed
                          ? 'bg-emerald-50/80 border-emerald-200'
                          : 'bg-rose-50/80 border-rose-200'}`}
                      >
                        {/* Criterion header */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 min-w-0">
                            {cr.passed ? (
                              <span className="material-symbols-outlined text-[20px] text-emerald-500 shrink-0 mt-0.5">check_circle</span>
                            ) : (
                              <span className="material-symbols-outlined text-[20px] text-rose-500 shrink-0 mt-0.5">cancel</span>
                            )}
                            <div className="min-w-0 flex items-center gap-2.5">
                              <span className="shrink-0 text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm font-mono tracking-wide">
                                {cr.criteriaCode}
                              </span>
                              <span className="text-sm font-semibold text-slate-800 leading-snug">
                                {cr.description}
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`text-base font-black ${cr.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {num(cr.earnedScore)}
                            </span>
                            <span className="text-xs text-slate-400 font-bold">/{num(cr.maxScore)}</span>
                          </div>
                        </div>

                        {/* Feedback */}
                        {!!cr.feedback && (
                          <div className={`mt-2 ml-8 px-4 py-3 rounded-xl text-[13px] font-medium leading-relaxed font-sans border shadow-inner ${cr.passed
                            ? 'bg-emerald-100/40 text-emerald-900 border-emerald-200'
                            : 'bg-rose-100/40 text-rose-900 border-rose-200'}`}>
                            {cr.feedback}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* [OLD] AI Code Review - kept for reference, replaced by OOP Criteria Results above
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm ring-1 ring-slate-900/5 hover:shadow-lg transition-all duration-300">
              <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-indigo-500 bg-indigo-50 p-1 rounded-md">psychology</span>
                AI Code Review
              </p>

              {reviewerName ? (
                <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Người chấm lại</p>
                  <p className="text-sm font-semibold text-slate-800">{reviewerName}</p>
                </div>
              ) : null}

              {ans?.aiReview ? (
                <div className="space-y-4 text-sm">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-sm font-semibold text-slate-600">OOP Score</span>
                    <span className="text-2xl font-black text-indigo-600">{num(oopScore)}</span>
                  </div>

                  {Array.isArray(ans?.aiReview?.hardCodedValues) && ans.aiReview.hardCodedValues.length > 0 ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5">
                      <p className="text-[11px] font-bold text-rose-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">warning</span>
                        Phát hiện hard code
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-xs text-rose-800 font-medium">
                        {ans.aiReview.hardCodedValues.map((value, idx) => (
                          <li key={`${value}-${idx}`}>{value}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 whitespace-pre-wrap text-slate-700 leading-7">
                    {ans?.aiReview?.comment || 'Không có nhận xét AI.'}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 font-medium">
                  Chưa có dữ liệu AI review cho câu này.
                </div>
              )}
            </div>
            END [OLD] AI Code Review */}


            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 space-y-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Điểm câu</p>

              {ans?.guardRuleTriggered && (
                <div className="bg-rose-50 text-rose-700 text-[12px] font-semibold p-3.5 rounded-xl border border-rose-200 shadow-sm flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5 animate-pulse">gavel</span>
                  <span>{ans?.guardRuleNote?.split(' (')[0] || 'Phát hiện vi phạm quy tắc'}</span>
                </div>
              )}

              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white shadow-[0_2px_8px_rgb(0,0,0,0.04)]">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Tổng điểm
                </span>
                {isScoreResolving ? (
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-14 rounded bg-slate-200 animate-pulse"></span>
                    <span className="h-8 w-16 rounded bg-slate-200 animate-pulse"></span>
                  </div>
                ) : (
                  <div className="text-right space-y-2">
                    <div className="inline-flex flex-wrap items-center justify-end gap-2 text-[12px] font-semibold">
                      <span className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                        TC: <span className="font-black text-emerald-700">{Number.isFinite(Number(weightedTestCaseScore)) ? num(weightedTestCaseScore) : '-'}</span>
                      </span>
                      <span className="text-slate-400 font-bold">+</span>
                      <span className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                        OOP: <span className="font-black text-[#F37021]">
                          {Number.isFinite(Number(weightedOopScore)) ? num(weightedOopScore) : '-'}
                        </span>
                        {hasCriteriaSum && (
                          <span className="text-[10px] text-slate-400 ml-1">(criteria)</span>
                        )}
                      </span>
                      <span className="text-slate-400 font-bold">=</span>
                      <span className={`px-3 py-1 rounded-lg border font-black ${ans?.guardRuleTriggered
                        ? 'border-rose-200 bg-rose-50 text-rose-700'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                        {num(baseOriginalQuestionScore)}
                      </span>
                    </div>

                    {hasReviewedScore ? (
                      <p className="text-[12px] font-semibold text-[#F37021]">
                        Điểm chấm lại:
                        <span className="ml-1.5 inline-flex items-center px-2.5 py-0.5 rounded-md border border-orange-200 bg-orange-50 font-black">
                          {num(nextQuestionScore)}
                        </span>
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export const QuestionsSection = React.memo(function QuestionsSection({
  answers,
  openQuestion,
  onToggleQuestion,
  reviewedQuestionScores,
  originalQuestionScores,
  gradingMode,
  reviewerName,
  isScoreResolving = false,
}) {
  return (
    <>
      <div className="flex items-center justify-between pt-2">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[#F37021] text-[24px]">analytics</span>
          Chi tiết từng câu
        </h3>
      </div>

      <div className="space-y-5">
        {answers.map((ans, idx) => {
          const questionKey = `q${ans?.questionNumber ?? idx + 1}`;
          return (
            <QuestionCard
              key={ans?.answerId || idx}
              ans={ans}
              index={idx}
              isOpen={openQuestion === idx}
              onToggle={() => onToggleQuestion(idx)}
              reviewedScore={reviewedQuestionScores?.[questionKey]}
              originalScore={originalQuestionScores?.[questionKey]}
              gradingMode={gradingMode}
              reviewerName={reviewerName}
              isScoreResolving={isScoreResolving}
            />
          );
        })}
      </div>
    </>
  );
});

export const SummarySidebar = React.memo(function SummarySidebar({
  detail,
  submissionInfo,
  displaySubmissionStatus,
  tcSummary,
  gradingDurationLabel,
  appealRecord,
  appealScores,
  reviewerName,
  showScoreComparison = false,
  isScoreResolving = false,
}) {
  const cleanedNote = detail?.note
    ?.replace('Chế độ: OOP chỉ nhận xét, không tính điểm.', '')
    .trim();

  const reviewedTestCaseScore =
    Number.isFinite(Number(appealScores?.newScore)) && Number.isFinite(Number(detail?.oopScore))
      ? Number(appealScores.newScore) - Number(detail.oopScore)
      : null;

  return (
    <div className="sticky top-8 space-y-6">
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-[#F37021] to-amber-400"></div>
        <div className="p-8">
          <h4 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#F37021] bg-orange-50 p-1.5 rounded-lg">
              assessment
            </span>
            Tổng quan chấm bài
          </h4>

          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100/80">
              <span className="text-sm font-medium text-slate-500">Học kỳ</span>
              <span className="text-[13px] font-bold text-slate-900 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-lg">
                {detail?.semesterName || '-'}
              </span>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100/80">
              <span className="text-sm font-medium text-slate-500">Năm học</span>
              <span className="text-[13px] font-bold bg-blue-50 border border-blue-100 text-blue-700 px-2.5 py-1 rounded-lg">
                {detail?.academicYear || '-'}
              </span>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100/80">
              <span className="text-sm font-medium text-slate-500">Block thi</span>
              <span className="text-[13px] font-bold text-slate-900 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-lg">
                {detail?.blockName || '-'}
              </span>
            </div>
            <div className="flex items-start justify-between pb-4 border-b border-slate-100/80 gap-3">
              <span className="text-sm font-medium text-slate-500 shrink-0">Tên file</span>
              <span className="text-[12px] font-bold text-slate-800 bg-slate-50 border border-slate-200/60 px-2 py-1 rounded-lg text-right break-all font-mono max-w-[60%]">
                {submissionInfo?.fileName || '-'}
              </span>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100/80">
              <span className="text-sm font-medium text-slate-500">Dung lượng</span>
              <span className="text-[13px] font-bold text-slate-700 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-lg font-mono">
                {submissionInfo?.fileSizeBytes != null
                  ? submissionInfo.fileSizeBytes >= 1_048_576
                    ? `${(submissionInfo.fileSizeBytes / 1_048_576).toFixed(2)} MB`
                    : `${(submissionInfo.fileSizeBytes / 1024).toFixed(1)} KB`
                  : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100/80">
              <span className="text-sm font-medium text-slate-500">Nộp bài lúc</span>
              <span className="text-[11px] font-bold text-slate-700 bg-slate-50 border border-slate-200/60 px-2 py-1 rounded-lg uppercase tracking-wide">
                {submissionInfo?.submittedAt ? fmtDateTime(submissionInfo.submittedAt) : '-'}
              </span>
            </div>
            <div className="flex items-start justify-between pb-4 border-b border-slate-100/80 gap-3">
              <span className="text-sm font-medium text-slate-500 shrink-0">Mode chấm</span>
              <span className={`text-[12px] font-bold px-2.5 py-1 rounded-lg border ${
                detail?.gradingMode === 'MODE_5'
                  ? 'bg-violet-50 border-violet-200 text-violet-700'
                  : detail?.gradingMode === 'MODE_4'
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : detail?.gradingMode === 'MODE_3'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : detail?.gradingMode === 'MODE_2'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                {detail?.gradingMode
                  ? ({
                      MODE_1: '100% TC · 0% OOP',
                      MODE_2: '50% TC · 50% OOP',
                      MODE_3: '0% TC · 100% OOP',
                      MODE_4: '100% TC · OOP: nhận xét',
                      MODE_5: '60% TC · 40% OOP',
                    }[detail.gradingMode] ?? detail.gradingMode)
                  : '-'}
              </span>
            </div>

            <div className="flex items-center justify-between pb-4 border-b border-slate-100/80 gap-4">
              <span className="text-sm font-medium text-slate-500">Tổng điểm TestCase</span>
              {isScoreResolving ? (
                <span className="h-8 w-24 rounded-lg bg-slate-200 animate-pulse"></span>
              ) : showScoreComparison ? (
                <SubmissionComparedMetricDisplay
                  originalValue={detail?.testCaseScore}
                  nextValue={reviewedTestCaseScore}
                  tone="success"
                />
              ) : (
                <SubmissionSingleMetricDisplay value={detail?.testCaseScore} />
              )}
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100/80">
              <span className="text-sm font-medium text-slate-500">Tổng điểm OOP</span>
              <span className="text-base font-black text-slate-800 bg-slate-50 px-2.5 py-0.5 rounded-lg border border-slate-100">
                {num(detail?.oopScore)}
              </span>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100/80">
              <span className="text-sm font-medium text-slate-500">TestCase đạt</span>
              <span className="text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg shadow-sm">
                {tcSummary.pass}/{tcSummary.total}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">Thời gian chấm</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded border border-slate-100">
                {fmtDateTime(detail?.gradedAt)}
              </span>
            </div>
          </div>

          {!!cleanedNote && (
            <div className="mt-8 bg-amber-50/50 rounded-2xl p-5 border border-amber-200/50 shadow-inner">
              <p className="text-[11px] font-bold text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">info</span>
                Ghi chú cấu hình
              </p>
              <p className="text-xs font-medium text-amber-900/80 leading-relaxed whitespace-pre-wrap">
                {cleanedNote}
              </p>
            </div>
          )}

          {appealRecord ? (
            <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50/60 p-5 shadow-inner">
              <p className="text-[11px] font-bold text-[#F37021] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">assignment_turned_in</span>
                Thông tin chấm lại
              </p>
              <div className="space-y-2 text-sm text-slate-700">
                <p>
                  Người chấm lại:{' '}
                  <span className="font-semibold text-slate-900">{reviewerName || 'Chưa cập nhật'}</span>
                </p>
                <p>
                  Trạng thái phúc khảo:{' '}
                  <span className="font-semibold text-slate-900">{appealRecord?.status || '-'}</span>
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
});
