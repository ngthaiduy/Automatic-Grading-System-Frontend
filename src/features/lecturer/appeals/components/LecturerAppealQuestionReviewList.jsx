import React from 'react';
import { formatScore } from '../../../../components/utils/Utils';
import {
  getQuestionTestCaseSummary,
  getReviewQuestionTone,
  getTestCaseStatusMeta,
  splitReviewCommentToLines,
} from '../helpers/appealHelpers';

function TestCaseItem({ item, index }) {
  const meta = getTestCaseStatusMeta(item?.status);

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Test case {item?.testCaseNumber ?? index + 1}
          </p>
          {!!item?.errorMessage ? (
            <p className="mt-1 text-xs leading-5 text-slate-500">{item.errorMessage}</p>
          ) : null}
        </div>

        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${meta.className}`}
        >
          {meta.label}
        </span>
      </div>
    </div>
  );
}

function DetailBlock({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <h4 className="text-sm font-black text-slate-900">{title}</h4>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function GuardRuleTag({ show }) {
  if (!show) return null;

  return (
    <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-rose-600">
      <span className="material-symbols-outlined mr-1 text-[13px]">warning</span>
      Bị AI đánh dấu
    </span>
  );
}

function AiReviewContent({ comment }) {
  const lines = splitReviewCommentToLines(comment);

  if (!lines.length) {
    return <p className="mt-2 text-sm leading-6 text-slate-500">Không có nhận xét OOP.</p>;
  }

  return (
    <div className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
      {lines.map((line, index) => (
        <p key={`${line}-${index}`}>{line}</p>
      ))}
    </div>
  );
}

function QuestionCard({ question, isOpen, onToggle }) {
  const testCaseSummary = getQuestionTestCaseSummary(question);
  const aiReview = question?.aiReview;
  const showGuardTag = Boolean(question?.guardRuleTriggered && Number(question?.originalScore ?? 0) <= 0);

  return (
    <article
      className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm ${getReviewQuestionTone(question)}`}
    >
      <div className="px-5 py-5">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-base font-black text-slate-700">
            {question?.questionNumber}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-black text-slate-900">{question?.questionTitle}</h3>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                Điểm tối đa: {formatScore(question?.maxScore)} điểm
              </span>
              {!question?.scoreEditable ? (
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                  Không có bài làm
                </span>
              ) : null}
              <GuardRuleTag show={showGuardTag} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Điểm cũ</p>
              <p className="mt-1 text-3xl font-black text-slate-900">{formatScore(question?.originalScore)}</p>
            </div>

            <button
              type="button"
              onClick={onToggle}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-[#F37021]"
              aria-label={isOpen ? 'Thu gọn câu hỏi' : 'Mở chi tiết câu hỏi'}
            >
              <span
                className={`material-symbols-outlined text-[20px] transition-transform ${
                  isOpen ? 'rotate-180' : ''
                }`}
              >
                keyboard_arrow_down
              </span>
            </button>
          </div>
        </div>
      </div>

      {isOpen ? (
        <div className="space-y-4 border-t border-slate-100 px-5 py-5">
          <DetailBlock title="Điểm testcase">
            <p className="text-2xl font-black text-slate-900">{formatScore(question?.rawTestCaseScore)}</p>
            <p className="mt-2 text-sm text-slate-600">
              Pass {testCaseSummary.passCount}/{testCaseSummary.totalCount} test case
            </p>
            {!question?.scoreEditable ? (
              <p className="mt-2 text-xs leading-5 text-amber-700">{question?.scoreEditBlockedReason}</p>
            ) : null}
          </DetailBlock>

          <DetailBlock title="Kết quả test case">
            <div className="space-y-3">
              {question?.testCaseResults?.length ? (
                question.testCaseResults.map((item, index) => (
                  <TestCaseItem
                    key={item?.testCaseResultId || `${question.id}-tc-${index}`}
                    item={item}
                    index={index}
                  />
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-500">
                  Không có testcase nào để hiển thị.
                </div>
              )}
            </div>
          </DetailBlock>

          <DetailBlock title="Điểm OOP">
            <p className="text-2xl font-black text-slate-900">{formatScore(question?.rawOopScore)}</p>
            <AiReviewContent comment={aiReview?.comment} />
          </DetailBlock>
        </div>
      ) : null}
    </article>
  );
}

export default function LecturerAppealQuestionReviewList({
  questions,
  openQuestion,
  onToggleQuestion,
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3 px-1">
        <div>
          <h2 className="flex items-center gap-2 text-base font-black text-slate-900">
            <span className="material-symbols-outlined text-[20px] text-slate-500">analytics</span>
            Chi tiết từng câu
          </h2>
        </div>
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          {questions?.length || 0} câu hỏi
        </span>
      </div>

      <div className="space-y-4">
        {questions?.length ? (
          questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              isOpen={openQuestion === index}
              onToggle={() => onToggleQuestion(index)}
            />
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <p className="text-base font-semibold text-slate-900">
              Backend chưa trả về grading detail cho đơn phúc khảo này.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Cần có <span className="font-semibold">gradingDetail.answers</span> để giảng viên xem chi tiết từng câu.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
