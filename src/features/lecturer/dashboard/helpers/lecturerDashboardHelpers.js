import { formatDateTime } from '../../../../components/utils/Utils';

export const DASHBOARD_CARD_CONFIG = [
  {
    key: 'assignedAppeals',
    title: 'Đơn đang phụ trách',
    icon: 'assignment_ind',
    tone: 'blue',
  },
  {
    key: 'completedReviews',
    title: 'Đã hoàn thành',
    icon: 'task_alt',
    tone: 'green',
  },
  {
    key: 'overdueAppeals',
    title: 'Quá hạn',
    icon: 'warning',
    tone: 'red',
  },
];

export const URGENCY_META = {
  'CẦN XỬ LÝ NGAY': 'bg-red-50 text-red-700 border-red-200',
  'TRONG 2 NGÀY TỚI': 'bg-amber-50 text-amber-700 border-amber-200',
  'SẮP TỚI': 'bg-sky-50 text-sky-700 border-sky-200',
};

const PROCESSING_STATUS = 'PROCESSING';
const COMPLETED_STATUSES = new Set(['COMPLETED', 'APPROVED', 'DENIED']);

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function toTimestamp(value) {
  if (!value) return Number.NaN;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? Number.NaN : timestamp;
}

function sortByDateDesc(rows, selector) {
  return [...rows].sort((left, right) => {
    const rightTime = toTimestamp(selector(right));
    const leftTime = toTimestamp(selector(left));

    if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) return 0;
    if (Number.isNaN(leftTime)) return 1;
    if (Number.isNaN(rightTime)) return -1;
    return rightTime - leftTime;
  });
}

function sortByDateAsc(rows, selector) {
  return [...rows].sort((left, right) => {
    const leftTime = toTimestamp(selector(left));
    const rightTime = toTimestamp(selector(right));

    if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) return 0;
    if (Number.isNaN(leftTime)) return 1;
    if (Number.isNaN(rightTime)) return -1;
    return leftTime - rightTime;
  });
}

function normalizeStatus(status) {
  return String(status || '').trim().toUpperCase();
}

function toDashboardAppealRow(item) {
  return {
    appealId: item?.appealId,
    studentName: item?.studentName || '—',
    studentMssv: item?.studentMssv || '—',
    examName: item?.examName || '—',
    blockName: item?.blockName || '—',
    assignedDate: item?.assignedDate ?? item?.assignedAt ?? item?.createdAt ?? null,
    deadline: item?.deadline ?? item?.deadlineAt ?? null,
    status: item?.status,
  };
}

export function mapAppealsOverviewToDashboardOverview(overview) {
  return {
    assignedAppeals: Number(
      overview?.assignedAppeals
        ?? overview?.inReview
        ?? overview?.totalAssigned
        ?? 0,
    ),
    completedReviews: Number(
      overview?.completedReviews
        ?? overview?.completed
        ?? 0,
    ),
    overdueAppeals: Number(
      overview?.overdueAppeals
        ?? overview?.overdue
        ?? 0,
    ),
  };
}

export function buildAssignedAppealsFallback(appealRows, limit = 5) {
  return sortByDateDesc(
    toArray(appealRows).map(toDashboardAppealRow),
    (item) => item.assignedDate,
  ).slice(0, limit);
}

export function resolveUrgencyLabel(deadline) {
  const deadlineTime = toTimestamp(deadline);
  if (Number.isNaN(deadlineTime)) return 'SẮP TỚI';

  const now = Date.now();
  if (deadlineTime < now) return 'CẦN XỬ LÝ NGAY';

  const hoursUntilDeadline = (deadlineTime - now) / (1000 * 60 * 60);
  return hoursUntilDeadline <= 48 ? 'TRONG 2 NGÀY TỚI' : 'SẮP TỚI';
}

export function buildUpcomingDeadlinesFallback(appealRows, limit = 5) {
  return sortByDateAsc(
    toArray(appealRows)
      .filter((item) => normalizeStatus(item?.status) === PROCESSING_STATUS)
      .map((item) => ({
        appealId: item?.appealId,
        examName: item?.examName || 'Phúc khảo',
        studentName: item?.studentName || '—',
        deadline: item?.deadline ?? item?.deadlineAt ?? null,
        status: item?.status,
        urgencyLabel: resolveUrgencyLabel(item?.deadline ?? item?.deadlineAt),
      }))
      .filter((item) => item.deadline),
    (item) => item.deadline,
  ).slice(0, limit);
}

export function buildReviewStatsFallback(overview) {
  const completedReviews = Number(overview?.completedReviews ?? overview?.completed ?? 0);

  return {
    totalReviews: completedReviews,
    approvedCount: null,
    approvedPercentage: null,
    deniedCount: null,
    deniedPercentage: null,
    isPartial: true,
  };
}

export function hasUsableArray(value) {
  return Array.isArray(value);
}

export function pickPreferredArray(primary, fallback) {
  if (!Array.isArray(primary)) {
    return toArray(fallback);
  }

  if (primary.length > 0 || !Array.isArray(fallback) || fallback.length === 0) {
    return primary;
  }

  return fallback;
}

export function countCompletedFromAppealRows(appealRows) {
  return toArray(appealRows).filter((item) => COMPLETED_STATUSES.has(normalizeStatus(item?.status))).length;
}

export function getUrgencyClassName(label) {
  return URGENCY_META[label] ?? 'bg-slate-50 text-slate-700 border-slate-200';
}

export function formatDeadline(value) {
  return formatDateTime(value);
}
