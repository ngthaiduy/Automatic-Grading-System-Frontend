import { saveAs } from 'file-saver';

function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

function formatScore(value) {
  if (!isFiniteNumber(value)) return '0';
  const numericValue = Number(value);
  return Number.isInteger(numericValue)
    ? String(numericValue)
    : numericValue.toFixed(2).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
}

function cleanComment(comment) {
  if (comment == null) return 'Không có AI Code Review.';

  const normalized = String(comment)
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return normalized || 'Không có AI Code Review.';
}

function buildQuestionSection(answer, index) {
  const questionNumber = answer?.questionNumber ?? index + 1;
  const oopScore = answer?.aiReview?.oopScore;
  const comment = answer?.aiReview?.comment;

  return [`Q${questionNumber} ${formatScore(oopScore)}`, cleanComment(comment)].join('\n');
}

function resolveFileName(detail) {
  const submissionId = detail?.submissionId || 'submission';
  const examName = String(detail?.examName || 'ai-code-review')
    .trim()
    .replace(/[^a-zA-Z0-9-_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);

  return `${examName || 'ai-code-review'}_${submissionId}.txt`;
}

export function buildSubmissionAiReviewTxt(detail) {
  const answers = Array.isArray(detail?.answers) ? detail.answers : [];

  if (!answers.length) {
    return 'Không có dữ liệu answer để export.';
  }

  return answers
    .map((answer, index) => buildQuestionSection(answer, index))
    .join('\n\n');
}

export function exportSubmissionAiReviewTxt(detail) {
  const content = buildSubmissionAiReviewTxt(detail);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, resolveFileName(detail));
}
