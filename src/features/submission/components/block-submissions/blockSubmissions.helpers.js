export function fmtDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
}

export function fmtSize(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export function getSubmissionStatusBadge(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'GRADING') {
    return {
      label: 'Đang chấm',
      cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
    };
  }
  if (s === 'GRADED') {
    return {
      label: 'Đã chấm',
      cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
    };
  }
  if (s === 'GRADING_FAILED') {
    return {
      label: 'Thất bại',
      cls: 'bg-red-50 text-red-700 ring-1 ring-red-600/20',
    };
  }
  return {
    label: 'Chưa chấm',
    cls: 'bg-sky-50 text-sky-700 ring-1 ring-sky-600/20',
  };
}

export function getResultBadge(gradingStatus) {
  const s = String(gradingStatus || '').toUpperCase();
  if (s === 'PASS') {
    return {
      label: 'Đạt',
      cls: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-600/30 font-bold',
    };
  }
  if (s === 'FAIL') {
    return {
      label: 'Không đạt',
      cls: 'bg-red-50 text-red-700 ring-1 ring-red-600/20 font-bold',
    };
  }
  return null;
}

export function getErrorStatus(error) {
  return Number(error?.response?.status || error?.status || 0);
}

export function extractApiErrorMessage(error, fallback = 'Đã xảy ra lỗi. Vui lòng thử lại.') {
  const status = getErrorStatus(error);
  const serverMessage = String(error?.response?.data?.message || '').trim();
  if (serverMessage) return serverMessage;

  if (!error?.response && error?.message) {
    return 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra backend hoặc mạng.';
  }

  if (status === 400) return 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại dữ liệu gửi lên.';
  if (status === 401) return 'Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập.';
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
  if (status === 404) return 'Không tìm thấy dữ liệu tương ứng hoặc API chưa sẵn sàng.';
  if (status === 409) return 'Thao tác đang xung đột với trạng thái hiện tại của hệ thống.';
  if (status >= 500) return 'Máy chủ đang gặp lỗi. Vui lòng thử lại sau.';

  return error?.message || fallback;
}

export function normalizeSubmissionsPayload(raw) {
  if (!raw) return { data: [], pagination: {}, stats: {} };
  const lv1 = raw?.data;
  const lv2 = raw?.data?.data;

  const list =
    (Array.isArray(raw?.data) && raw.data) ||
    (Array.isArray(lv1?.data) && lv1.data) ||
    (Array.isArray(lv2?.data) && lv2.data) ||
    (Array.isArray(lv1) && lv1) ||
    (Array.isArray(lv2) && lv2) ||
    [];

  return {
    data: list,
    pagination: raw?.pagination ?? lv1?.pagination ?? lv2?.pagination ?? {},
    stats: raw?.stats ?? lv1?.stats ?? lv2?.stats ?? {},
  };
}

export function mapGradingResultsFallback(items = []) {
  return items.map((it) => ({
    submissionId: it?.submissionId,
    studentId: it?.studentId,
    studentName: it?.studentName,
    studentCode: it?.studentCode,
    studentEmail: it?.studentEmail ?? null,
    fileName: it?.fileName ?? it?.submissionFileName ?? null,
    submittedAt: it?.submittedAt ?? null,
    fileSizeBytes: it?.fileSizeBytes ?? null,
    submissionStatus: it?.submissionStatus ?? 'GRADED',
    gradingResultId: it?.gradingResultId ?? null,
    gradingStatus: it?.status ?? it?.gradingStatus ?? null,
    totalScore: it?.totalScore ?? null,
    maxScore: it?.maxScore ?? null,
    gradedAt: it?.gradedAt ?? null,
  }));
}

export function canOpenSubmissionDetail(item) {
  return (
    Boolean(item?.gradingResultId) ||
    String(item?.submissionStatus || '').toUpperCase() === 'GRADED'
  );
}

export function slugifyFilePart(value, fallback = 'file') {
  const base = String(value || '').trim().toLowerCase();
  const normalized = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || fallback;
}

export function isBrowserFileDownloadSupported() {
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined' &&
    typeof URL !== 'undefined' &&
    typeof URL.createObjectURL === 'function'
  );
}

export function saveBlobFile(blobLike, fileName) {
  if (!isBrowserFileDownloadSupported()) return false;
  const blob = blobLike instanceof Blob ? blobLike : new Blob([blobLike]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return true;
}

export const PAGE_SIZE_OPTIONS = [10, 20, 50];

export const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'SUBMITTED', label: 'Chưa chấm' },
  { value: 'GRADING', label: 'Đang chấm' },
  { value: 'GRADED', label: 'Đã chấm' },
  { value: 'GRADING_FAILED', label: 'Thất bại' },
];

export const STAT_CARDS = [
  {
    key: 'total',
    label: 'Tổng số bài nộp',
    icon: 'assignment',
    bg: 'from-slate-50 via-white to-slate-50',
    iconBg: 'bg-slate-100 text-slate-600',
    blob: 'bg-slate-200/40',
  },
  {
    key: 'submitted',
    label: 'Chưa chấm',
    icon: 'schedule',
    bg: 'from-sky-50 via-white to-blue-50/70',
    iconBg: 'bg-sky-100 text-sky-600',
    blob: 'bg-sky-200/40',
  },
  {
    key: 'grading',
    label: 'Đang chấm',
    icon: 'hourglass_top',
    bg: 'from-amber-50 via-white to-orange-50/70',
    iconBg: 'bg-amber-100 text-amber-600',
    blob: 'bg-amber-200/40',
  },
  {
    key: 'graded',
    label: 'Đã chấm',
    icon: 'task_alt',
    bg: 'from-emerald-50/80 via-white to-green-50/70',
    iconBg: 'bg-emerald-100 text-emerald-600',
    blob: 'bg-emerald-200/40',
  },
  {
    key: 'failed',
    label: 'Thất bại',
    icon: 'error_outline',
    bg: 'from-red-50 via-white to-rose-50/70',
    iconBg: 'bg-red-100 text-red-600',
    blob: 'bg-red-200/40',
  },
];
