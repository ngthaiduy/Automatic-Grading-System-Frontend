import { formatDateTime, formatScore } from '../../../../components/utils/Utils';

const createRowId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const LECTURER_APPEAL_STATUS_META = {
  PENDING: {
    label: 'Chờ phân công',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  PROCESSING: {
    label: 'Được phân công',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  COMPLETED: {
    label: 'Đã hoàn thành',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  APPROVED: {
    label: 'Đã hoàn thành',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  DENIED: {
    label: 'Đã hoàn thành',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  CANCELLED: {
    label: 'Đã hoàn thành',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
};

export function getLecturerAppealStatusMeta(status) {
  return LECTURER_APPEAL_STATUS_META[String(status || '').toUpperCase()] ?? {
    label: status || 'Không xác định',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  };
}

export function isLecturerAppealEditable(status) {
  return String(status || '').toUpperCase() === 'PROCESSING';
}

export function getLecturerAppealDetailPath(appealId, status) {
  if (!appealId) return '/lecturer/appeals';
  return isLecturerAppealEditable(status)
    ? `/lecturer/appeals/${appealId}`
    : `/lecturer/appeals/${appealId}/submitted`;
}

export function getLecturerAppealActionLabel(status) {
  return isLecturerAppealEditable(status) ? 'Chấm lại' : 'Xem kết quả';
}

export function splitReviewCommentToLines(comment) {
  const raw = String(comment || '').trim();
  if (!raw) return [];

  return raw
    .replace(/\s+/g, ' ')
    .replace(/([.!?;:])\s+(?=[A-ZÀ-ỸĂÂÊÔƠƯĐ])/g, '$1\n')
    .replace(/([.!?;:])\s+(?=\d+\.)/g, '$1\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function validateReviewQuestionScore(value, maxScore) {
  if (value === '' || value == null) {
    return 'Vui lòng nhập điểm cho câu này.';
  }

  const numericValue = Number(value);
  const numericMaxScore = Number(maxScore ?? 0);

  if (Number.isNaN(numericValue)) {
    return 'Điểm không hợp lệ.';
  }

  if (numericValue < 0) {
    return 'Điểm không được nhỏ hơn 0.';
  }

  if (numericMaxScore > 0 && numericValue > numericMaxScore) {
    return `Điểm không được vượt quá ${formatScore(numericMaxScore)}.`;
  }

  return '';
}

export function buildQuestionRows(questionScoreMap) {
  const entries = Object.entries(questionScoreMap ?? {});

  if (!entries.length) {
    return [{ id: createRowId(), key: '', score: '' }];
  }

  return entries.map(([key, value]) => ({
    id: createRowId(),
    key,
    score: value ?? '',
  }));
}

export function sanitizeQuestionRows(rows) {
  return rows.reduce((acc, row) => {
    const key = String(row.key || '').trim();
    const rawScore = row.score;
    const numericScore =
      rawScore === '' || rawScore == null ? null : Number(rawScore);

    if (!key || numericScore == null || Number.isNaN(numericScore)) {
      return acc;
    }

    acc[key] = numericScore;
    return acc;
  }, {});
}

export function extractAppealGradingAnswers(detail) {
  if (Array.isArray(detail?.gradingDetail?.answers)) {
    return detail.gradingDetail.answers;
  }

  if (Array.isArray(detail?.answers)) {
    return detail.answers;
  }

  return [];
}

export function getReviewScoreBlockedMessage(questionNumber) {
  return `Không thể điều chỉnh điểm cho câu ${questionNumber} vì hệ thống không tìm thấy bài làm của sinh viên ở câu này. Vui lòng giữ nguyên điểm hiện tại và kiểm tra lại dữ liệu nộp bài trước khi gửi kết quả phúc khảo.`;
}

export function buildLecturerReviewQuestions(detail) {
  const answers = extractAppealGradingAnswers(detail);
  const editedMap = detail?.newQuestionScores ?? {};

  return answers
    .map((answer, index) => {
      const questionNumber = Number(answer?.questionNumber ?? index + 1);
      const key = `q${questionNumber}`;
      const originalScore = Number(answer?.questionScore ?? 0);
      const editedScore =
        editedMap[key] != null && editedMap[key] !== ''
          ? Number(editedMap[key])
          : originalScore;
      const hasJar = Boolean(answer?.hasJar);
      const hasSource = Boolean(answer?.hasSource);
      const scoreEditable =
        typeof answer?.scoreEditable === 'boolean'
          ? answer.scoreEditable
          : (hasJar || hasSource);
      const scoreEditBlockedReason =
        answer?.scoreEditBlockedReason ||
        (!scoreEditable ? getReviewScoreBlockedMessage(questionNumber) : '');

      return {
        id: answer?.answerId || createRowId(),
        key,
        questionNumber,
        questionTitle: answer?.questionTitle || `Question ${questionNumber}`,
        maxScore: Number(answer?.maxScore ?? 0),
        originalScore,
        editedScore,
        hasJar,
        hasSource,
        scoreEditable,
        scoreEditBlockedReason,
        rawTestCaseScore: Number(answer?.rawTestCaseScore ?? 0),
        rawOopScore: Number(answer?.rawOopScore ?? 0),
        guardRuleTriggered: Boolean(answer?.guardRuleTriggered),
        guardRuleNote: answer?.guardRuleNote || '',
        testCaseResults: Array.isArray(answer?.testCaseResults)
          ? answer.testCaseResults
          : [],
        aiReview: answer?.aiReview || null,
      };
    })
    .sort((a, b) => a.questionNumber - b.questionNumber);
}

export function buildQuestionScorePayloadFromReview(questions) {
  return (questions || []).reduce((acc, question) => {
    const questionKey = String(question?.key || '').trim();
    const numericScore = Number(question?.editedScore);

    if (!questionKey || Number.isNaN(numericScore)) {
      return acc;
    }

    acc[questionKey] = numericScore;
    return acc;
  }, {});
}

export function sumReviewQuestionScores(questions) {
  return (questions || []).reduce((total, question) => {
    const numericScore = Number(question?.editedScore);
    return Number.isFinite(numericScore) ? total + numericScore : total;
  }, 0);
}

export function getQuestionTestCaseSummary(question) {
  const testCaseResults = Array.isArray(question?.testCaseResults)
    ? question.testCaseResults
    : [];

  const passCount = testCaseResults.filter(
    (item) => String(item?.status || '').toUpperCase() === 'PASS_TESTCASE',
  ).length;

  return {
    passCount,
    totalCount: testCaseResults.length,
  };
}

export function getReviewQuestionTone(question) {
  if (question?.guardRuleTriggered) {
    return 'border-l-rose-500';
  }

  const score = Number(question?.originalScore ?? 0);
  const max = Number(question?.maxScore ?? 0);

  if (max > 0 && score >= max) {
    return 'border-l-emerald-500';
  }

  if (score > 0) {
    return 'border-l-amber-400';
  }

  return 'border-l-slate-300';
}

export function getTestCaseStatusMeta(status) {
  const normalized = String(status || '').toUpperCase();

  if (normalized === 'PASS_TESTCASE') {
    return {
      label: 'PASS',
      className: 'border-emerald-200 bg-emerald-100 text-emerald-700',
    };
  }

  if (normalized === 'FAIL_TESTCASE') {
    return {
      label: 'FAIL',
      className: 'border-rose-200 bg-rose-100 text-rose-700',
    };
  }

  if (normalized === 'TIMEOUT') {
    return {
      label: 'TIMEOUT',
      className: 'border-amber-200 bg-amber-100 text-amber-700',
    };
  }

  return {
    label: normalized || 'UNKNOWN',
    className: 'border-slate-200 bg-slate-100 text-slate-700',
  };
}

export function buildDownloadFilename(appeal) {
  if (appeal?.submissionFileName) {
    return appeal.submissionFileName;
  }
  return `submission-${appeal?.appealId ?? 'appeal'}.zip`;
}

export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export function toQuestionScoreRows(questionScoreMap) {
  return Object.entries(questionScoreMap ?? {}).map(([key, value]) => ({
    key,
    value,
  }));
}

function toNumericScore(value) {
  if (value == null || value === '') return null;
  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? null : numericValue;
}

function extractQuestionNumberFromKey(key) {
  const normalizedKey = String(key || '').trim().toLowerCase();
  if (!normalizedKey) return null;

  const match = normalizedKey.match(/(?:^|\b)(?:q|question|cau|câu)?\s*0*(\d+)(?:\b|$)/i);
  if (!match) return null;

  const value = Number(match[1]);
  return Number.isNaN(value) ? null : value;
}

function sortQuestionRows(rows) {
  return [...rows].sort((left, right) => {
    if (left.questionNumber != null && right.questionNumber != null) {
      return left.questionNumber - right.questionNumber;
    }
    if (left.questionNumber != null) return -1;
    if (right.questionNumber != null) return 1;
    return String(left.questionKey || '').localeCompare(
      String(right.questionKey || ''),
      'vi',
    );
  });
}

export function buildSubmittedQuestionRows({ gradingDetail, newQuestionScores } = {}) {
  const answers = Array.isArray(gradingDetail?.answers) ? gradingDetail.answers : [];
  const rawEntries = Object.entries(newQuestionScores ?? {});

  const scoreByQuestionNumber = new Map();
  const unmatchedEntries = [];

  rawEntries.forEach(([rawKey, rawValue]) => {
    const score = toNumericScore(rawValue);
    if (score == null) return;

    const questionNumber = extractQuestionNumberFromKey(rawKey);
    if (questionNumber != null && !scoreByQuestionNumber.has(questionNumber)) {
      scoreByQuestionNumber.set(questionNumber, {
        questionNumber,
        questionKey: rawKey,
        score,
      });
      return;
    }

    unmatchedEntries.push({
      questionKey: rawKey,
      questionNumber,
      score,
    });
  });

  if (answers.length) {
    const matchedQuestionNumbers = new Set();

    const normalizedRows = answers.map((answer, index) => {
      const questionNumber = Number(answer?.questionNumber ?? index + 1);
      const originalScore = toNumericScore(answer?.questionScore);
      const mappedScore = scoreByQuestionNumber.get(questionNumber);
      const newScore = mappedScore?.score ?? originalScore;

      matchedQuestionNumbers.add(questionNumber);

      return createSubmittedScoreRow({
        questionNumber,
        questionKey: mappedScore?.questionKey ?? `Q${questionNumber}`,
        questionTitle: answer?.questionTitle,
        originalScore,
        newScore,
        isInferredNewScore: mappedScore == null,
      });
    });

    const remainingRows = unmatchedEntries
      .filter((entry) => !matchedQuestionNumbers.has(entry.questionNumber))
      .map((entry) =>
        createSubmittedScoreRow({
          questionNumber: entry.questionNumber,
          questionKey: entry.questionKey,
          questionTitle: null,
          originalScore: null,
          newScore: entry.score,
          isInferredNewScore: false,
        }),
      );

    return sortQuestionRows([...normalizedRows, ...remainingRows]);
  }

  return sortQuestionRows(
    rawEntries.map(([rawKey, rawValue]) =>
      createSubmittedScoreRow({
        questionNumber: extractQuestionNumberFromKey(rawKey),
        questionKey: rawKey,
        questionTitle: null,
        originalScore: null,
        newScore: toNumericScore(rawValue),
        isInferredNewScore: false,
      }),
    ),
  );
}

function createSubmittedScoreRow({
  questionNumber,
  questionKey,
  questionTitle,
  originalScore,
  newScore,
  isInferredNewScore,
}) {
  const delta =
    originalScore == null || newScore == null ? null : Number(newScore) - Number(originalScore);

  return {
    id: createRowId(),
    questionNumber,
    questionKey,
    questionTitle: questionTitle || null,
    questionLabel:
      questionNumber != null
        ? `Câu ${questionNumber}`
        : String(questionKey || 'Câu hỏi không xác định'),
    originalScore,
    newScore,
    delta,
    deltaLabel: formatScoreDelta(delta),
    deltaToneClassName:
      delta == null
        ? 'text-slate-400'
        : delta > 0
          ? 'text-emerald-600'
          : delta < 0
            ? 'text-red-600'
            : 'text-slate-400',
    isChanged: delta != null && Math.abs(delta) > 0,
    isInferredNewScore,
  };
}

export function formatAppealDate(value) {
  return formatDateTime(value);
}

export function formatAppealScore(value) {
  return formatScore(value);
}

export function formatAppealId(value) {
  if (!value) return '—';
  return String(value);
}

export function getScoreDelta(originalScore, newScore) {
  const original = Number(originalScore ?? 0);
  const next = Number(newScore ?? 0);
  const delta = next - original;
  const sign = delta > 0 ? '+' : '';

  return {
    value: delta,
    label: `${sign}${formatScore(delta)}`,
    toneClassName:
      delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-600' : 'text-slate-600',
  };
}

export function formatScoreDelta(delta) {
  if (delta == null) return '—';
  const numericDelta = Number(delta);
  if (Number.isNaN(numericDelta)) return '—';

  const sign = numericDelta > 0 ? '+' : '';
  return `${sign}${formatScore(numericDelta)}`;
}

export function getOverdueLabel(isOverdue) {
  return isOverdue ? 'Quá hạn' : 'Đúng hạn';
}
