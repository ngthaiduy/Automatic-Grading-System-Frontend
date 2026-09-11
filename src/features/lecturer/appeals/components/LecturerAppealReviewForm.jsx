import React from 'react';
import { formatAppealScore } from '../helpers/appealHelpers';

function TotalCard({ label, value, toneClassName, surfaceClassName }) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${surfaceClassName}`}>
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-black ${toneClassName}`}>{value}</p>
    </div>
  );
}

function ActionOption({ checked, onChange, value, label, disabled }) {
  return (
    <label
      className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm transition ${
        checked
          ? 'border-[#F37021] bg-orange-50 text-[#F37021]'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
      } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
    >
      <input
        type="radio"
        name="reviewAction"
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
        className="h-4 w-4 border-slate-300 text-[#F37021] focus:ring-[#F37021]"
      />
      <span className="font-semibold">{label}</span>
    </label>
  );
}

export default function LecturerAppealReviewForm({
  readOnly,
  reviewAction,
  onActionChange,
  questions,
  questionErrors,
  originalScore,
  computedNewScore,
  lecturerComment,
  onCommentChange,
  onScoreChange,
  onSubmit,
  submitLoading,
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4">
        <h2 className="flex items-center gap-2 text-sm font-black text-slate-900">
          <span className="material-symbols-outlined text-[20px] text-[#F37021]">edit_note</span>
          Chấm lại
        </h2>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TotalCard
            label="Điểm gốc"
            value={formatAppealScore(originalScore)}
            toneClassName="text-slate-900"
            surfaceClassName="border-slate-200 bg-slate-50"
          />
          <TotalCard
            label="Điểm mới"
            value={formatAppealScore(computedNewScore)}
            toneClassName="text-[#F37021]"
            surfaceClassName="border-orange-200 bg-orange-50"
          />
        </div>

        <div>
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Hành động
          </label>
          <div className="grid grid-cols-2 gap-3">
            <ActionOption
              value="change"
              label="Thay đổi điểm"
              checked={reviewAction === 'change'}
              onChange={onActionChange}
              disabled={readOnly}
            />
            <ActionOption
              value="keep"
              label="Giữ nguyên"
              checked={reviewAction === 'keep'}
              onChange={onActionChange}
              disabled={readOnly}
            />
          </div>
        </div>

        {reviewAction === 'change' ? (
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Điểm mới theo từng câu
            </label>
            <div className="space-y-3">
              {(questions || []).map((question) => {
                const errorMessage = questionErrors?.[question.id] || '';
                const scoreLocked = !question?.scoreEditable;

                return (
                  <div
                    key={question.id}
                    className={`rounded-2xl border px-4 py-3 ${
                      scoreLocked ? 'border-amber-200 bg-amber-50/60' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {question.questionTitle}
                          </p>
                          {scoreLocked ? (
                            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                              Không thể sửa điểm
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Điểm gốc: {formatAppealScore(question.originalScore)} / {formatAppealScore(question.maxScore)}
                        </p>
                      </div>
                      <div className="flex w-[122px] items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max={question?.maxScore || 10}
                          step="0.1"
                          value={question?.editedScore}
                          disabled={readOnly}
                          readOnly={scoreLocked}
                          onClick={() => {
                            if (scoreLocked) {
                              onScoreChange(question.id, question?.editedScore);
                            }
                          }}
                          onFocus={() => {
                            if (scoreLocked) {
                              onScoreChange(question.id, question?.editedScore);
                            }
                          }}
                          onChange={(event) => onScoreChange(question.id, event.target.value)}
                          className={`w-full rounded-xl border px-3 py-2 text-right text-sm font-semibold text-slate-900 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 ${
                            scoreLocked
                              ? 'cursor-not-allowed border-amber-200 bg-amber-50 text-slate-500 focus:border-amber-200 focus:ring-0'
                              : errorMessage
                                ? 'border-rose-300 bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-100'
                                : 'border-slate-200 bg-slate-50 focus:border-[#F37021] focus:ring-4 focus:ring-orange-100'
                          }`}
                        />
                        <span className="text-xs font-semibold text-slate-500">
                          / {formatAppealScore(question?.maxScore)}
                        </span>
                      </div>
                    </div>

                    {scoreLocked ? (
                      <p className="mt-2 text-xs text-amber-700">{question.scoreEditBlockedReason}</p>
                    ) : null}

                    {!scoreLocked && errorMessage ? (
                      <p className="mt-2 text-xs text-rose-600">{errorMessage}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
            Giữ nguyên sẽ dùng lại điểm gốc của tất cả các câu. Giảng viên chỉ cần nhập nhận xét.
          </div>
        )}

        <div>
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Nhận xét của giảng viên
          </label>
          <textarea
            rows={5}
            value={lecturerComment}
            onChange={(event) => onCommentChange(event.target.value)}
            disabled={readOnly}
            placeholder="Nhập nhận xét cho kết quả chấm lại..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#F37021] focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>

        {readOnly ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Đơn này đã được gửi review, hiện chỉ xem được nội dung.
          </div>
        ) : null}

        <button
          type="button"
          onClick={onSubmit}
          disabled={readOnly || submitLoading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F37021] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#d9641d] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-[18px]">send</span>
          {submitLoading ? 'Đang gửi...' : 'Gửi kết quả'}
        </button>
      </div>
    </section>
  );
}
