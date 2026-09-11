const MIN_AMOUNT = 10000;
const currencyFormatter = new Intl.NumberFormat('vi-VN');

export const DEPOSIT_PRESET_AMOUNTS = [50000, 100000, 200000, 500000];

export function unwrapApiData(response) {
  return response?.data ?? response ?? null;
}

export function formatCurrency(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '0 ₫';
  return `${currencyFormatter.format(number)} ₫`;
}

export function formatDateTime(value) {
  if (!value) return '—';

  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh',
  });
}

export function sanitizeAmountInput(value) {
  return String(value ?? '')
    .replace(/[^\d]/g, '')
    .replace(/^0+(?=\d)/, '')
    .slice(0, 12);
}

export function parseAmount(value) {
  const number = Number(sanitizeAmountInput(value));
  return Number.isFinite(number) ? number : 0;
}

export function normalizeFreeText(value, maxLength = 255) {
  return String(value ?? '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function normalizeAccountNumber(value) {
  return String(value ?? '')
    .replace(/[^0-9]/g, '')
    .slice(0, 30);
}

export function normalizeAccountHolder(value) {
  return String(value ?? '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

export function maskAccountNumber(value) {
  const digits = normalizeAccountNumber(value);
  if (!digits) return '—';
  if (digits.length <= 4) return digits;
  return `${'*'.repeat(Math.max(digits.length - 4, 0))}${digits.slice(-4)}`;
}

export function isSafeExternalUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function buildWalletRedirectUrl(type = 'success') {
  if (typeof window === 'undefined') return '';

  const safeType = type === 'cancel' ? 'cancel' : 'success';
  const url = new URL('/student/wallet', window.location.origin);
  url.searchParams.set('depositStatus', safeType);
  return url.toString();
}

export function getWalletSummary(wallet, withdrawals) {
  const safeWallet = wallet ?? {};
  const safeWithdrawals = Array.isArray(withdrawals) ? withdrawals : [];

  const balance = Number(safeWallet?.balance ?? 0);
  const pendingWithdrawals = safeWithdrawals.filter(
    (item) => String(item?.status || '').toUpperCase() === 'PENDING',
  );
  const pendingAmount = pendingWithdrawals.reduce(
    (sum, item) => sum + Number(item?.amount ?? 0),
    0,
  );

  return {
    balance,
    pendingWithdrawalCount: pendingWithdrawals.length,
    pendingWithdrawalAmount: pendingAmount,
    withdrawableBalance: Math.max(balance - pendingAmount, 0),
    totalTransactions: Array.isArray(safeWallet?.transactions)
      ? safeWallet.transactions.length
      : 0,
  };
}

export function validateDepositAmount(amountValue) {
  const amount = parseAmount(amountValue);
  if (!amount) {
    return 'Vui lòng nhập số tiền muốn nạp.';
  }
  if (amount < MIN_AMOUNT) {
    return 'Số tiền nạp tối thiểu là 10.000 ₫.';
  }
  return '';
}

export function validateWithdrawalForm(values, withdrawableBalance) {
  const errors = {};
  const amount = parseAmount(values?.amount);
  const bankName = normalizeFreeText(values?.bankName, 100);
  const accountNumber = normalizeAccountNumber(values?.accountNumber);
  const accountHolder = normalizeAccountHolder(values?.accountHolder);

  if (!amount) {
    errors.amount = 'Vui lòng nhập số tiền muốn rút.';
  } else if (amount < MIN_AMOUNT) {
    errors.amount = 'Số tiền rút tối thiểu là 10.000 ₫.';
  } else if (amount > Number(withdrawableBalance ?? 0)) {
    errors.amount = 'Số tiền rút vượt quá số dư có thể rút hiện tại.';
  }

  if (bankName.length < 2) {
    errors.bankName = 'Vui lòng nhập tên ngân hàng hợp lệ.';
  }

  if (accountNumber.length < 6) {
    errors.accountNumber = 'Số tài khoản phải có ít nhất 6 chữ số.';
  }

  if (accountHolder.length < 2) {
    errors.accountHolder = 'Vui lòng nhập tên chủ tài khoản hợp lệ.';
  }

  return {
    amount,
    normalized: {
      bankName,
      accountNumber,
      accountHolder,
    },
    errors,
  };
}

export function getTransactionTypeMeta(type) {
  const normalized = String(type || '').toUpperCase();

  if (normalized === 'DEPOSIT') {
    return {
      label: 'Nạp tiền',
      icon: 'south_west',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }

  if (normalized === 'APPEAL_PAYMENT') {
    return {
      label: 'Thanh toán phúc khảo',
      icon: 'gavel',
      className: 'bg-orange-50 text-orange-700 border-orange-200',
    };
  }

  if (normalized === 'APPEAL_REFUND') {
    return {
      label: 'Hoàn tiền phúc khảo',
      icon: 'replay',
      className: 'bg-sky-50 text-sky-700 border-sky-200',
    };
  }

  if (normalized === 'WITHDRAWAL') {
    return {
      label: 'Rút tiền',
      icon: 'north_east',
      className: 'bg-rose-50 text-rose-700 border-rose-200',
    };
  }

  return {
    label: normalized || 'Giao dịch',
    icon: 'receipt_long',
    className: 'bg-slate-50 text-slate-700 border-slate-200',
  };
}

export function getWithdrawalStatusMeta(status) {
  const normalized = String(status || '').toUpperCase();

  if (normalized === 'PENDING') {
    return {
      label: 'Chờ xử lý',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  }

  if (normalized === 'APPROVED') {
    return {
      label: 'Đã duyệt',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }

  if (normalized === 'REJECTED') {
    return {
      label: 'Đã từ chối',
      className: 'bg-rose-50 text-rose-700 border-rose-200',
    };
  }

  if (normalized === 'COMPLETED') {
    return {
      label: 'Hoàn tất',
      className: 'bg-sky-50 text-sky-700 border-sky-200',
    };
  }

  return {
    label: normalized || '—',
    className: 'bg-slate-50 text-slate-700 border-slate-200',
  };
}

export function extractWalletErrorMessage(error, fallback = 'Đã xảy ra lỗi. Vui lòng thử lại.') {
  const status = Number(error?.response?.status || error?.status || 0);
  const serverMessage = String(error?.response?.data?.message || '').trim();

  if (serverMessage) return serverMessage;

  if (!error?.response) {
    return 'Không thể kết nối lúc này. Vui lòng kiểm tra mạng và thử lại.';
  }

  if (status === 400) return 'Dữ liệu gửi lên chưa hợp lệ. Vui lòng kiểm tra lại.';
  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  if (status === 403) return 'Bạn không có quyền truy cập tính năng ví.';
  if (status === 404) return 'Không tìm thấy dữ liệu ví hoặc giao dịch cần thiết.';
  if (status === 409) return 'Yêu cầu hiện tại xung đột với trạng thái giao dịch trước đó.';
  if (status >= 500) return 'Máy chủ đang gặp lỗi. Vui lòng thử lại sau ít phút.';

  return fallback;
}
