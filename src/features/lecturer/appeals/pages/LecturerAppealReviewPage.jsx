import React, { useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import useLecturerAppealDetail from '../../../../hooks/useLecturerAppealDetail';
import {
  downloadLecturerAppealSubmission,
  submitLecturerAppealReview,
} from '../../../../services/lecturerApi';
import LecturerAppealQuestionReviewList from '../components/LecturerAppealQuestionReviewList';
import LecturerAppealReviewForm from '../components/LecturerAppealReviewForm';
import LecturerAppealStatusBadge from '../components/LecturerAppealStatusBadge';
import {
  buildDownloadFilename,
  buildLecturerReviewQuestions,
  buildQuestionScorePayloadFromReview,
  downloadBlob,
  formatAppealDate,
  formatAppealScore,
  isLecturerAppealEditable,
  sumReviewQuestionScores,
  validateReviewQuestionScore,
} from '../helpers/appealHelpers';

export default function LecturerAppealReviewPage() {
  const navigate = useNavigate();
  const { appealId } = useParams();
  const { setPageMeta } = useOutletContext();
  const { data, loading, error } = useLecturerAppealDetail(appealId);

  const [lecturerComment, setLecturerComment] = useState('');
  const [reviewQuestions, setReviewQuestions] = useState([]);
  const [questionErrors, setQuestionErrors] = useState({});
  const [reviewAction, setReviewAction] = useState('change');
  const [openQuestion, setOpenQuestion] = useState(-1);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const readOnly = useMemo(
    () => !isLecturerAppealEditable(data?.status),
    [data?.status],
  );

  useEffect(() => {
    setPageMeta({
      title: 'Chấm phúc khảo',
      subtitle: 'Giảng viên xem chi tiết từng câu và chấm lại theo điểm từng câu.',
      breadcrumbs: [
        { label: 'Dashboard', to: '/lecturer' },
        { label: 'Phúc khảo', to: '/lecturer/appeals' },
        { label: 'Chấm lại' },
      ],
      headerActions: null,
    });
  }, [setPageMeta]);

  useEffect(() => {
    if (!data) return;

    const builtQuestions = buildLecturerReviewQuestions(data);
    const originalTotal = sumReviewQuestionScores(
      builtQuestions.map((question) => ({ ...question, editedScore: question.originalScore })),
    );
    const currentTotal = data?.newScore != null ? Number(data.newScore) : originalTotal;
    const hasScoreChanged = Number(currentTotal.toFixed(2)) !== Number(originalTotal.toFixed(2));

    setLecturerComment(data.lecturerComment ?? '');
    setReviewQuestions(builtQuestions);
    setQuestionErrors({});
    setReviewAction(hasScoreChanged ? 'change' : 'keep');
    setOpenQuestion(builtQuestions.length ? 0 : -1);
  }, [data]);

  useEffect(() => {
    if (error) {
      message.error('Không tải được chi tiết đơn phúc khảo.');
    }
  }, [error]);

  const originalQuestionTotal = useMemo(
    () => sumReviewQuestionScores(reviewQuestions.map((question) => ({ ...question, editedScore: question.originalScore }))),
    [reviewQuestions],
  );

  const changedQuestionTotal = useMemo(
    () => sumReviewQuestionScores(reviewQuestions),
    [reviewQuestions],
  );

  const computedNewScore = useMemo(
    () => (reviewAction === 'keep' ? originalQuestionTotal : changedQuestionTotal),
    [changedQuestionTotal, originalQuestionTotal, reviewAction],
  );

  const validateQuestionList = (questions) => {
    const nextErrors = {};

    questions.forEach((question) => {
      const errorMessage = validateReviewQuestionScore(question?.editedScore, question?.maxScore);
      if (errorMessage) {
        nextErrors[question.id] = errorMessage;
      }
    });

    return nextErrors;
  };

  const handleQuestionScoreChange = (questionId, value) => {
    const targetQuestion = reviewQuestions.find((question) => question.id === questionId);
    if (!targetQuestion) return;

    if (!targetQuestion.scoreEditable) {
      message.warning(
        targetQuestion.scoreEditBlockedReason ||
          'Không thể điều chỉnh điểm cho câu này vì hệ thống không tìm thấy bài làm của sinh viên.',
      );
      return;
    }

    const errorMessage = validateReviewQuestionScore(value, targetQuestion.maxScore);

    if (errorMessage && errorMessage.includes('không được vượt quá')) {
      message.warning(`${targetQuestion.questionTitle}: ${errorMessage}`);
    }

    setReviewQuestions((prev) =>
      prev.map((question) => (
        question.id === questionId
          ? {
              ...question,
              editedScore: value,
            }
          : question
      )),
    );

    setQuestionErrors((prev) => {
      const next = { ...prev };
      if (errorMessage) {
        next[questionId] = errorMessage;
      } else {
        delete next[questionId];
      }
      return next;
    });
  };

  const handleDownload = async () => {
    try {
      setDownloadLoading(true);
      const blob = await downloadLecturerAppealSubmission(appealId);
      downloadBlob(blob, buildDownloadFilename(data));
    } catch {
      message.error('Không tải được bài nộp của sinh viên.');
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!lecturerComment?.trim()) {
      message.warning('Vui lòng nhập nhận xét của giảng viên trước khi gửi.');
      return;
    }

    if (!reviewQuestions.length) {
      message.warning('Chưa có dữ liệu câu hỏi để gửi kết quả chấm lại.');
      return;
    }

    const questionsForSubmit =
      reviewAction === 'keep'
        ? reviewQuestions.map((question) => ({
            ...question,
            editedScore: question.originalScore,
          }))
        : reviewQuestions;

    if (reviewAction === 'change') {
      const nextErrors = validateQuestionList(questionsForSubmit);
      setQuestionErrors(nextErrors);

      if (Object.keys(nextErrors).length > 0) {
        message.warning('Vui lòng kiểm tra lại điểm của từng câu trước khi gửi.');
        return;
      }
    }

    const payload = {
      newScore: Number(computedNewScore.toFixed(2)),
      lecturerComment: lecturerComment.trim(),
      newQuestionScores: buildQuestionScorePayloadFromReview(questionsForSubmit),
    };

    try {
      setSubmitLoading(true);
      const response = await submitLecturerAppealReview(appealId, payload);

      const mergedResult = {
        ...data,
        ...payload,
        ...(response?.data ?? {}),
        newQuestionScores:
          response?.data?.newQuestionScores &&
          Object.keys(response.data.newQuestionScores).length > 0
            ? response.data.newQuestionScores
            : payload.newQuestionScores,
      };

      message.success(response?.message || 'Đã gửi kết quả chấm lại thành công.');

      navigate(`/lecturer/appeals/${appealId}/submitted`, {
        state: {
          result: mergedResult,
        },
      });
    } catch (err) {
      const apiMessage = err?.response?.data?.message;
      message.error(apiMessage || 'Gửi kết quả chấm lại thất bại.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-80 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-80 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
        <p className="text-base font-semibold text-slate-900">Không tìm thấy đơn phúc khảo.</p>
        <p className="mt-2 text-sm text-slate-500">
          Đơn có thể đã bị xóa hoặc bạn không có quyền truy cập.
        </p>
        <button
          type="button"
          onClick={() => navigate('/lecturer/appeals')}
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-[#F37021] hover:text-[#F37021]"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => navigate('/lecturer/appeals')}
              className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-[#F37021] hover:text-[#F37021]"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-black text-slate-900">
                  Đơn phúc khảo: {data.appealCode || '—'}
                </h2>
                <LecturerAppealStatusBadge status={data.status} />
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Sinh viên: <span className="font-semibold text-slate-800">{data.studentName || '—'}</span>{' '}
                (MSSV: {data.studentMssv || '—'})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloadLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-[#F37021] hover:text-[#F37021] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]">folder_zip</span>
            {downloadLoading ? 'Đang tải...' : 'Tải bài làm (.zip)'}
          </button>
        </div>
      </section>

      <div className="grid grid-cols-12 items-start gap-6">
        <div className="col-span-12 space-y-6 lg:col-span-3">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-5 py-4">
              <span className="material-symbols-outlined text-[20px] text-[#F37021]">info</span>
              <h3 className="text-sm font-black text-slate-900">Thông tin đơn phúc khảo</h3>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Điểm gốc
                </p>
                <p className="mt-1 text-3xl font-black text-slate-900">
                  {formatAppealScore(data.originalScore)}
                  <span className="ml-1 text-sm font-medium text-slate-400">/ 10.0</span>
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Ngày nộp đơn
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {formatAppealDate(data.createdAt)}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Lý do phúc khảo
                </p>
                <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm italic leading-6 text-slate-600">
                  {data.reason || 'Sinh viên chưa ghi rõ lý do phúc khảo.'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5">
          <LecturerAppealQuestionReviewList
            questions={reviewQuestions}
            openQuestion={openQuestion}
            onToggleQuestion={(index) => setOpenQuestion((prev) => (prev === index ? -1 : index))}
          />
        </div>

        <div className="col-span-12 lg:col-span-4 lg:sticky lg:top-24">
          <LecturerAppealReviewForm
            readOnly={readOnly}
            reviewAction={reviewAction}
            onActionChange={(value) => {
              setReviewAction(value);
              if (value === 'keep') {
                setQuestionErrors({});
                return;
              }
              setQuestionErrors(validateQuestionList(reviewQuestions));
            }}
            questions={reviewQuestions}
            questionErrors={questionErrors}
            originalScore={data.originalScore}
            computedNewScore={computedNewScore}
            lecturerComment={lecturerComment}
            onCommentChange={setLecturerComment}
            onScoreChange={handleQuestionScoreChange}
            onSubmit={handleSubmit}
            submitLoading={submitLoading}
          />
        </div>
      </div>
    </div>
  );
}
