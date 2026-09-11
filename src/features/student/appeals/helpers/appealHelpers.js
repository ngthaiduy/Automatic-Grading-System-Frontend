const CURRENCY_FORMATTER = new Intl.NumberFormat('vi-VN');
const DEFAULT_MIN_REASON_LENGTH = 10;
const MAX_REASON_LENGTH = 2000;

const RECEIVED_STATUSES = ['PENDING_PAYMENT', 'PENDING'];
const ASSIGNED_STATUSES = ['PROCESSING', 'COMPLETED'];
const DONE_STATUSES = ['APPROVED', 'DENIED', 'CANCELLED', 'CANCELED'];
const REVIEW_OUTCOME_STATUSES = ['APPROVED', 'DENIED', 'CANCELLED', 'CANCELED'];

function normalizeAppealStatus(status) {
  return String(status ?? '').trim().toUpperCase();
}

function toScoreNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function getNestedPayload(response) {
  const raw = response?.data ?? response ?? null;
  return raw?.data ?? raw ?? null;
}

function resolveQuestionScoreValue(value) {
  if (value && typeof value === 'object') {
    return getScoreCandidates(value, [
      'oldScore',
      'originalScore',
      'currentScore',
      'answerScore',
      'questionScore',
      'score',
      'newScore',
      'value',
      'reviewedScore',
    ]);
  }

  return toScoreNumber(value);
}

function sumFromQuestionScores(questionScores) {
  if (!questionScores || typeof questionScores !== 'object') return null;

  const entries = Object.values(questionScores)
    .map((value) => resolveQuestionScoreValue(value))
    .filter((value) => value != null);

  if (!entries.length) return null;
  return Number(entries.reduce((total, value) => total + value, 0).toFixed(2));
}

function resolveAnswerScore(answer) {
  return toScoreNumber(
    answer?.questionScore
    ?? answer?.score
    ?? answer?.answerScore
    ?? answer?.rawTestCaseScore,
  );
}

function sumFromAnswers(answers) {
  if (!Array.isArray(answers) || !answers.length) return null;

  const entries = answers
    .map((answer) => resolveAnswerScore(answer))
    .filter((value) => value != null);

  if (!entries.length) return null;
  return Number(entries.reduce((total, value) => total + value, 0).toFixed(2));
}

function extractQuestionNumberFromKey(rawKey) {
  const matched = String(rawKey ?? '').match(/(\d+)/);
  if (!matched) return null;
  const questionNumber = Number(matched[1]);
  return Number.isFinite(questionNumber) ? questionNumber : null;
}

function buildQuestionKey(questionNumber, fallbackKey = null) {
  if (Number.isFinite(Number(questionNumber))) {
    return `q${Number(questionNumber)}`;
  }
  return String(fallbackKey || '').trim() || null;
}

function extractReviewScore(rawValue) {
  if (rawValue && typeof rawValue === 'object') {
    return getScoreCandidates(rawValue, ['score', 'newScore', 'value', 'reviewedScore']);
  }
  return toScoreNumber(rawValue);
}

function getScoreCandidates(item, keys = []) {
  for (const key of keys) {
    const resolved = toScoreNumber(item?.[key]);
    if (resolved != null) return resolved;
  }
  return null;
}

function hasResolvedScore(value) {
  return value != null;
}

function hasMeaningfulGradingDetail(gradingDetail = null) {
  return Boolean(
    (Array.isArray(gradingDetail?.answers) && gradingDetail.answers.length)
    || toScoreNumber(gradingDetail?.totalScore) != null,
  );
}

function resolveOriginalScoreFromAppeal(item) {
  return (
    getScoreCandidates(item, ['originalScore', 'oldScore', 'currentScore', 'initialScore'])
    ?? sumFromQuestionScores(item?.originalQuestionScores)
    ?? sumFromQuestionScores(item?.oldQuestionScores)
    ?? sumFromAnswers(item?.gradingDetail?.answers)
    ?? sumFromAnswers(item?.answers)
    ?? null
  );
}

function resolveOriginalScoreFromDetail(gradingDetail, item) {
  return (
    sumFromAnswers(gradingDetail?.answers)
    ?? toScoreNumber(gradingDetail?.totalScore)
    ?? getScoreCandidates(item, ['originalScore', 'oldScore', 'currentScore', 'initialScore'])
    ?? sumFromQuestionScores(item?.originalQuestionScores)
    ?? sumFromQuestionScores(item?.oldQuestionScores)
    ?? sumFromAnswers(item?.gradingDetail?.answers)
    ?? sumFromAnswers(item?.answers)
    ?? null
  );
}

export function unwrapApiData(response) {
  return getNestedPayload(response);
}

export function resolveAppealsList(data) {
  const payload = getNestedPayload(data);

  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.appeals)
      ? payload.appeals
      : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.content)
          ? payload.content
          : Array.isArray(data?.appeals)
            ? data.appeals
            : [];

  return [...list].sort((left, right) => {
    const leftTime = left?.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right?.createdAt ? new Date(right.createdAt).getTime() : 0;
    return rightTime - leftTime;
  });
}

export function formatCurrency(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '0 ₫';
  return `${CURRENCY_FORMATTER.format(number)} ₫`;
}

export function formatScore(value, digits = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return number.toFixed(digits);
}

export function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh',
  });
}

export function formatShortDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
}

export function normalizeAppealReason(value) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/\r\n/g, '\n')
    .slice(0, MAX_REASON_LENGTH);
}

export function validateAppealReason(value) {
  const reason = normalizeAppealReason(value).trim();

  if (!reason) {
    return 'Vui lòng nhập lý do phúc khảo.';
  }

  if (reason.length < DEFAULT_MIN_REASON_LENGTH) {
    return 'Lý do phúc khảo cần cụ thể hơn, tối thiểu 10 ký tự.';
  }

  return '';
}

export function extractAppealErrorMessage(error, fallback = 'Đã xảy ra lỗi. Vui lòng thử lại.') {
  const status = Number(error?.response?.status || error?.status || 0);
  const serverMessage = String(error?.response?.data?.message || '').trim();

  if (serverMessage) return serverMessage;

  if (!error?.response) {
    return 'Không thể kết nối lúc này. Vui lòng kiểm tra mạng và thử lại.';
  }

  if (status === 400) return 'Dữ liệu phúc khảo chưa hợp lệ. Vui lòng kiểm tra lại.';
  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác phúc khảo này.';
  if (status === 404) return 'Không tìm thấy bài nộp hoặc thông tin phúc khảo tương ứng.';
  if (status === 409) return 'Bài nộp này đã có đơn phúc khảo hoặc đang ở trạng thái không cho phép.';
  if (status >= 500) return 'Hệ thống đang bận. Vui lòng thử lại sau ít phút.';

  return fallback;
}

export function getAppealLifecycleStage(status) {
  const normalized = normalizeAppealStatus(status);

  if (RECEIVED_STATUSES.includes(normalized)) return 'RECEIVED';
  if (ASSIGNED_STATUSES.includes(normalized)) return 'ASSIGNED';
  if (DONE_STATUSES.includes(normalized)) return 'DONE';
  return 'UNKNOWN';
}

export function matchesAppealStatusFilter(status, filter) {
  if (!filter || filter === 'ALL') return true;

  const stage = getAppealLifecycleStage(status);

  if (filter === 'RECEIVED') return stage === 'RECEIVED';
  if (filter === 'ASSIGNED') return stage === 'ASSIGNED';
  if (filter === 'DONE') return stage === 'DONE';

  return normalizeAppealStatus(status) === normalizeAppealStatus(filter);
}

export function getAppealStatusMeta(status) {
  const normalized = normalizeAppealStatus(status);

  const map = {
    PENDING_PAYMENT: {
      label: 'Đã tiếp nhận',
      className: 'border-sky-200 bg-sky-50 text-sky-700',
      dotClassName: 'bg-sky-500',
      accentClassName: 'border-l-sky-400',
    },
    PENDING: {
      label: 'Đã tiếp nhận',
      className: 'border-sky-200 bg-sky-50 text-sky-700',
      dotClassName: 'bg-sky-500',
      accentClassName: 'border-l-sky-400',
    },
    PROCESSING: {
      label: 'Đã phân công',
      className: 'border-indigo-200 bg-indigo-50 text-indigo-700',
      dotClassName: 'bg-indigo-500',
      accentClassName: 'border-l-indigo-400',
    },
    COMPLETED: {
      label: 'Đã phân công',
      className: 'border-indigo-200 bg-indigo-50 text-indigo-700',
      dotClassName: 'bg-indigo-500',
      accentClassName: 'border-l-indigo-400',
    },
    APPROVED: {
      label: 'Đã chấp nhận',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      dotClassName: 'bg-emerald-500',
      accentClassName: 'border-l-emerald-500',
    },
    DENIED: {
      label: 'Đã từ chối',
      className: 'border-rose-200 bg-rose-50 text-rose-700',
      dotClassName: 'bg-rose-500',
      accentClassName: 'border-l-rose-500',
    },
    CANCELLED: {
      label: 'Đã hủy',
      className: 'border-slate-200 bg-slate-50 text-slate-700',
      dotClassName: 'bg-slate-400',
      accentClassName: 'border-l-slate-300',
    },
    CANCELED: {
      label: 'Đã hủy',
      className: 'border-slate-200 bg-slate-50 text-slate-700',
      dotClassName: 'bg-slate-400',
      accentClassName: 'border-l-slate-300',
    },
  };

  return map[normalized] || {
    label: normalized || '—',
    className: 'border-slate-200 bg-slate-50 text-slate-700',
    dotClassName: 'bg-slate-400',
    accentClassName: 'border-l-slate-300',
  };
}

export function isAppealFinalStatus(status) {
  return getAppealLifecycleStage(status) === 'DONE';
}

export function hasAppealReviewOutcome(status) {
  return REVIEW_OUTCOME_STATUSES.includes(normalizeAppealStatus(status));
}

export function getAppealProgressSteps(status) {
  const stage = getAppealLifecycleStage(status);

  const stepIndexMap = {
    RECEIVED: 0,
    ASSIGNED: 1,
    DONE: 2,
  };

  const currentStep = stepIndexMap[stage] ?? -1;

  const labels = [
    'Đã tiếp nhận',
    'Đã phân công',
    'Hoàn thành đơn',
  ];

  return labels.map((label, index) => ({
    label,
    // Every step up to and including the current stage gets a checkmark.
    // PENDING (0): [✓, -, -] | PROCESSING/COMPLETED (1): [✓, ✓, -] | DONE (2): [✓, ✓, ✓]
    isDone: index <= currentStep,
    isCurrent: false,
  }));
}



export function canRenderAppealScoreComparison(item) {
  const normalizedStatus = normalizeAppealStatus(item?.status);
  const hasReviewedTotalScore = toScoreNumber(item?.newScore) != null;
  const reviewedQuestionScores = normalizeReviewedQuestionScores(item);
  const hasReviewedQuestionScores = Object.keys(reviewedQuestionScores).length > 0;

  return normalizedStatus === 'APPROVED' && hasReviewedTotalScore && hasReviewedQuestionScores;
}

export function resolveAppealScores(item, gradingDetail = null) {
  const originalScore = hasMeaningfulGradingDetail(gradingDetail)
    ? resolveOriginalScoreFromDetail(gradingDetail, item)
    : resolveOriginalScoreFromAppeal(item);

  const newScore =
    getScoreCandidates(item, ['newScore', 'reviewedScore', 'finalScore'])
    ?? sumFromQuestionScores(item?.newQuestionScores)
    ?? sumFromQuestionScores(item?.reviewedQuestionScores)
    ?? null;

  return {
    originalScore,
    newScore,
    hasOriginal: hasResolvedScore(originalScore),
    hasNew: hasResolvedScore(newScore),
    changed:
      originalScore != null
      && newScore != null
      && Math.abs(newScore - originalScore) > 0.00001,
  };
}


export function buildOriginalQuestionScoresMap(gradingDetail = null) {
  const answers = Array.isArray(gradingDetail?.answers) ? gradingDetail.answers : [];

  return answers.reduce((accumulator, answer, index) => {
    const questionNumber = Number(answer?.questionNumber ?? index + 1);
    const key = buildQuestionKey(questionNumber, answer?.questionId || answer?.answerId || `q${index + 1}`);
    const score = resolveAnswerScore(answer);

    if (key && score != null) {
      accumulator[key] = score;
    }

    return accumulator;
  }, {});
}

export function normalizeReviewedQuestionScores(source = null) {
  const scoreSource =
    source?.newQuestionScores
    ?? source?.reviewedQuestionScores
    ?? source
    ?? {};

  if (!scoreSource || typeof scoreSource !== 'object') return {};

  return Object.entries(scoreSource).reduce((accumulator, [rawKey, rawValue]) => {
    const score = extractReviewScore(rawValue);
    if (score == null) return accumulator;

    const questionNumber = extractQuestionNumberFromKey(rawKey);
    const normalizedKey = buildQuestionKey(questionNumber, rawKey);

    if (normalizedKey) {
      accumulator[normalizedKey] = score;
    }

    return accumulator;
  }, {});
}

export function mergeQuestionScoreMaps(originalScores = {}, reviewedScores = {}) {
  return {
    ...(originalScores || {}),
    ...(reviewedScores || {}),
  };
}

export function sumQuestionScoreMap(scoreMap = {}) {
  if (!scoreMap || typeof scoreMap !== 'object') return null;

  const entries = Object.values(scoreMap)
    .map((value) => resolveQuestionScoreValue(value))
    .filter((value) => value != null);

  if (!entries.length) return null;
  return Number(entries.reduce((total, value) => total + value, 0).toFixed(2));
}

export function resolveSubmissionScoreComparison(item, gradingDetail = null) {
  const fallbackScores = resolveAppealScores(item, gradingDetail);
  const originalQuestionScores = buildOriginalQuestionScoresMap(gradingDetail);
  const reviewedQuestionScores = normalizeReviewedQuestionScores(item);
  const mergedQuestionScores = mergeQuestionScoreMaps(originalQuestionScores, reviewedQuestionScores);

  const originalTotal =
    sumQuestionScoreMap(originalQuestionScores)
    ?? fallbackScores.originalScore
    ?? null;

  const computedReviewedTotal = sumQuestionScoreMap(mergedQuestionScores);
  const hasReviewedQuestionScores = Object.keys(reviewedQuestionScores).length > 0;
  const newTotal =
    fallbackScores.newScore
    ?? (hasReviewedQuestionScores ? (computedReviewedTotal ?? null) : null);

  return {
    originalTotal,
    newTotal,
    originalQuestionScores,
    reviewedQuestionScores,
    mergedQuestionScores,
    hasOriginal: originalTotal != null,
    hasNew: newTotal != null,
    changed:
      originalTotal != null
      && newTotal != null
      && Math.abs(newTotal - originalTotal) > 0.00001,
  };
}

export function getAppealScoreSummary(item, gradingDetail = null) {
  const { originalScore, newScore, hasOriginal, hasNew, changed } = resolveAppealScores(item, gradingDetail);

  if (!hasOriginal) {
    return {
      variant: 'empty',
      originalText: '—',
      newText: '—',
      changed: false,
      originalScore: null,
      newScore: null,
    };
  }

  if (!hasNew) {
    return {
      variant: 'single',
      originalText: formatScore(originalScore),
      newText: '—',
      changed: false,
      originalScore,
      newScore: null,
    };
  }

  return {
    variant: 'delta',
    originalText: formatScore(originalScore),
    newText: formatScore(newScore),
    changed,
    originalScore,
    newScore,
  };
}

export function buildAppealSearchIndex(item) {
  return [
    item?.appealCode,
    item?.examName,
    item?.semester,
    item?.assignedLecturerName,
    item?.reason,
    item?.lecturerComment,
    item?.status,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function resolveAppealOverview(data) {
  const appeals = resolveAppealsList(data);

  return {
    totalAppeals: appeals.length,
    receivedCount: appeals.filter((item) => getAppealLifecycleStage(item?.status) === 'RECEIVED').length,
    assignedCount: appeals.filter((item) => getAppealLifecycleStage(item?.status) === 'ASSIGNED').length,
    doneCount: appeals.filter((item) => getAppealLifecycleStage(item?.status) === 'DONE').length,
    appeals,
  };
}

export function resolveAppealCreatePrefill(prefill, submissionId) {
  return {
    submissionId: prefill?.submissionId || submissionId,
    examName: prefill?.examName || prefill?.blockName || 'Bài nộp cần phúc khảo',
    semesterName: prefill?.semesterName || prefill?.semester || '—',
    blockName: prefill?.blockName || '—',
    totalScore: prefill?.totalScore,
    maxScore: prefill?.maxScore,
    gradedAt: prefill?.gradedAt,
  };
}

export function findAppealById(appeals, appealId) {
  return resolveAppealsList(appeals).find((item) => String(item?.appealId) === String(appealId)) || null;
}

export function findAppealBySubmissionId(appeals, submissionId) {
  return resolveAppealsList(appeals).find((item) => String(item?.submissionId) === String(submissionId)) || null;
}

export function getAppealReviewerName(appeal) {
  return (
    appeal?.reviewedByName
    || appeal?.reviewerName
    || appeal?.lecturerName
    || appeal?.assignedLecturerName
    || appeal?.assignedLecturer?.fullName
    || appeal?.assignedLecturer?.fullname
    || ''
  );
}
