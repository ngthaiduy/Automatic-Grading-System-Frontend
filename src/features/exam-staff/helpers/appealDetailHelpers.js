const toNumber = (value) => {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const REVIEWED_SCORE_VISIBLE_STATUSES = ['COMPLETED', 'APPROVED'];

const normalizeStatus = (status) => String(status ?? '').trim().toUpperCase();

export const canDisplayReviewedScores = (status) => {
  return REVIEWED_SCORE_VISIBLE_STATUSES.includes(normalizeStatus(status));
};

const extractQuestionNumberFromKey = (key) => {
  const normalized = String(key || '').trim().toLowerCase();
  if (!normalized) return null;

  const match = normalized.match(/(?:^|\b)(?:q|question|cau|câu)?\s*0*(\d+)(?:\b|$)/i);
  if (!match) return null;

  const value = Number(match[1]);
  return Number.isNaN(value) ? null : value;
};

export const buildAppealQuestionRows = ({ gradingDetail, newQuestionScores, status } = {}) => {
  const answers = Array.isArray(gradingDetail?.answers) ? gradingDetail.answers : [];
  const editedMap = newQuestionScores ?? {};
  const shouldDisplayReviewedScores = canDisplayReviewedScores(status);

  const mappedRows = answers.map((answer, index) => {
    const questionNumber = Number(answer?.questionNumber ?? index + 1);
    const questionKey = `Q${questionNumber}`;
    const oldScore = toNumber(answer?.questionScore);

    const directKeyCandidates = [
      questionKey,
      `q${questionNumber}`,
      `question${questionNumber}`,
      `question ${questionNumber}`,
      `cau${questionNumber}`,
      `câu ${questionNumber}`,
    ];

    let editedValue = null;

    for (const candidate of directKeyCandidates) {
      if (Object.prototype.hasOwnProperty.call(editedMap, candidate)) {
        editedValue = editedMap[candidate];
        break;
      }
    }

    if (editedValue == null) {
      const matchedEntry = Object.entries(editedMap).find(([rawKey]) => {
        return extractQuestionNumberFromKey(rawKey) === questionNumber;
      });
      editedValue = matchedEntry?.[1] ?? null;
    }

    const reviewedScore = toNumber(editedValue);
    const newScore = shouldDisplayReviewedScores ? (reviewedScore ?? oldScore) : null;

    return {
      id: answer?.answerId || `${questionKey}-${index}`,
      questionNumber,
      questionKey,
      questionTitle: answer?.questionTitle || `Question ${questionNumber}`,
      maxScore: toNumber(answer?.maxScore),
      oldScore,
      newScore,
      delta:
        oldScore == null || newScore == null ? null : Number(newScore) - Number(oldScore),
      guardRuleTriggered: Boolean(answer?.guardRuleTriggered),
      guardRuleNote: answer?.guardRuleNote || '',
    };
  });

  const knownNumbers = new Set(mappedRows.map((row) => row.questionNumber));
  const extraRows = shouldDisplayReviewedScores ? Object.entries(editedMap)
    .map(([key, value], index) => {
      const questionNumber = extractQuestionNumberFromKey(key);
      if (questionNumber == null || knownNumbers.has(questionNumber)) return null;

      const newScore = toNumber(value);
      return {
        id: `extra-${key}-${index}`,
        questionNumber,
        questionKey: key,
        questionTitle: null,
        maxScore: null,
        oldScore: null,
        newScore,
        delta: null,
        guardRuleTriggered: false,
        guardRuleNote: '',
      };
    })
    .filter(Boolean) : [];

  return [...mappedRows, ...extraRows].sort((a, b) => {
    if (a.questionNumber != null && b.questionNumber != null) {
      return a.questionNumber - b.questionNumber;
    }
    return String(a.questionKey || '').localeCompare(String(b.questionKey || ''), 'vi');
  });
};

export const sumQuestionScoreRows = (rows, fieldName) => {
  const numericValues = (rows || [])
    .map((row) => toNumber(row?.[fieldName]))
    .filter((value) => value != null);

  if (!numericValues.length) return null;
  return numericValues.reduce((total, value) => total + value, 0);
};

export const resolveOriginalScore = (detail, gradingDetail, questionRows) => {
  const summedOldScore = sumQuestionScoreRows(questionRows, 'oldScore');
  if (summedOldScore != null) return summedOldScore;

  const detailOriginal = toNumber(detail?.originalScore);
  if (detailOriginal != null) return detailOriginal;

  const gradingTotal = toNumber(gradingDetail?.totalScore);
  if (gradingTotal != null) return gradingTotal;

  return null;
};

export const resolveNewScore = (detail, questionRows, originalScore) => {
  if (!canDisplayReviewedScores(detail?.status)) return null;

  const detailNew = toNumber(detail?.newScore);
  if (detailNew != null) return detailNew;

  const sumNew = sumQuestionScoreRows(questionRows, 'newScore');
  if (sumNew != null) return sumNew;

  return originalScore ?? null;
};

export const resolveScoreDelta = (originalScore, newScore) => {
  if (originalScore == null || newScore == null) return null;
  return Number(newScore) - Number(originalScore);
};

export const getDeltaClassName = (delta) => {
  if (delta == null || delta === 0) return 'text-slate-700';
  if (delta > 0) return 'text-emerald-700';
  return 'text-rose-700';
};

export const formatDeltaLabel = (delta, formatter) => {
  if (delta == null) return '—';
  const formatted = formatter(Math.abs(delta));
  if (delta > 0) return `+${formatted}`;
  if (delta < 0) return `-${formatted}`;
  return formatter(0);
};
