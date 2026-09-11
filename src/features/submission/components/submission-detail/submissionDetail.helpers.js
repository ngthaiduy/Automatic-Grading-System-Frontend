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

export function num(v, digits = 2) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '0.00';
  return n.toFixed(digits);
}

export function resultBadge(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'PASS') {
    return { label: 'Đạt', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  }
  if (s === 'FAIL') {
    return { label: 'Không đạt', cls: 'bg-rose-50 text-rose-700 border-rose-200' };
  }
  if (s === 'GRADING') {
    return {
      label: 'Đang chấm',
      cls: 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse',
    };
  }
  return { label: 'Chưa chấm', cls: 'bg-slate-50 text-slate-700 border-slate-200' };
}

export function submissionStatusLabel(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'GRADING') return 'Đang chấm';
  if (s === 'GRADED') return 'Đã chấm';
  if (s === 'GRADING_FAILED') return 'Lỗi chấm';
  if (s === 'SUBMITTED') return 'Đã nộp';
  if (s === 'PENDING') return 'Chưa chấm';
  if (s === 'CANCELLED') return 'Đã hủy';
  return status || '—';
}

export function tcStatusClass(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'PASS_TESTCASE') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (s === 'FAIL_TESTCASE') return 'bg-orange-100 text-orange-700 border-orange-200';
  if (s === 'TIMEOUT') return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-rose-100 text-rose-700 border-rose-200';
}

export function questionTone(ans) {
  if (ans?.guardRuleTriggered) return 'border-l-rose-500 bg-rose-50/20';
  const score = Number(ans?.questionScore ?? 0);
  const max = Number(ans?.maxScore ?? 0);
  if (max > 0 && score >= max) return 'border-l-emerald-500 bg-emerald-50/10';
  if (score > 0) return 'border-l-amber-400 bg-amber-50/20';
  return 'border-l-slate-300 bg-slate-50/30';
}

export function extractPayload(res) {
  return res?.data?.data ?? res?.data ?? res ?? null;
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

  if (status === 400) return 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại dữ liệu.';
  if (status === 401) return 'Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập.';
  if (status === 403) return 'Bạn không có quyền xem hoặc thao tác với bài nộp này.';
  if (status === 404) return 'Không tìm thấy kết quả chấm cho bài nộp này.';
  if (status === 409) return 'Bài nộp đang ở trạng thái không cho phép thao tác này.';
  if (status >= 500) return 'Máy chủ đang gặp lỗi. Vui lòng thử lại sau.';

  return error?.message || fallback;
}

export function toScoreNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function resolveFinalGradeDisplay(detail, appealScores = null, showScoreComparison = false) {
  const currentScore = toScoreNumber(detail?.totalScore);
  const originalScore = toScoreNumber(appealScores?.originalScore);
  const newScore = toScoreNumber(appealScores?.newScore);

  if (showScoreComparison && originalScore != null && newScore != null) {
    return {
      variant: 'comparison',
      originalScore,
      newScore,
      currentScore,
    };
  }

  return {
    variant: 'single',
    originalScore: null,
    newScore: null,
    currentScore: currentScore ?? newScore ?? originalScore,
  };
}
