import React, { useMemo, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import StudentLayout from '../../../components/layouts/student';
import walletApi from '../../../services/walletApi';
import {
  formatCurrency,
  formatDateTime,
  unwrapApiData,
} from './helpers/walletHelpers';

const STORAGE_KEY = 'student-wallet-pending-deposit';

function readStoredDeposit() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function calculateTimeRemaining(expiresAt) {
  if (!expiresAt) return null;
  const expireTime = new Date(expiresAt).getTime();
  const now = new Date().getTime();
  const remaining = expireTime - now;

  if (remaining <= 0) {
    return { expired: true, text: 'Đã hết hạn' };
  }

  const seconds = Math.floor((remaining / 1000) % 60);
  const minutes = Math.floor((remaining / (1000 * 60)) % 60);
  const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));

  if (days > 0) {
    return { expired: false, text: `${days}d ${hours}h ${minutes}m còn lại` };
  }
  if (hours > 0) {
    return { expired: false, text: `${hours}h ${minutes}m còn lại` };
  }
  return { expired: false, text: `${minutes}m ${seconds}s còn lại` };
}

function parseEmvTags(payload) {
  if (!payload || typeof payload !== 'string') return {};
  const result = {};
  let index = 0;

  while (index + 4 <= payload.length) {
    const tag = payload.slice(index, index + 2);
    const lengthText = payload.slice(index + 2, index + 4);
    const length = Number.parseInt(lengthText, 10);
    if (!Number.isFinite(length) || length <= 0) break;
    const valueStart = index + 4;
    const valueEnd = valueStart + length;
    if (valueEnd > payload.length) break;
    result[tag] = payload.slice(valueStart, valueEnd);
    index = valueEnd;
  }

  return result;
}

function parseVietQrDetails(payload) {
  const root = parseEmvTags(payload);
  const merchantInfo = parseEmvTags(root['38'] || '');
  const additionalInfo = parseEmvTags(root['62'] || '');

  let bankBin = merchantInfo['01'] || '';
  let accountNumber = merchantInfo['02'] || '';

  if (!accountNumber && bankBin && /^\d{10,}$/.test(bankBin)) {
    accountNumber = bankBin.slice(6);
    bankBin = bankBin.slice(0, 6);
  }

  const reference = additionalInfo['08'] || additionalInfo['07'] || '';

  const accountName = root['59'] || '';

  return {
    bankBin,
    accountNumber,
    reference,
    accountName,
  };
}

export default function StudentWalletDepositQrPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [qrImageError, setQrImageError] = useState(false);

  const deposit = useMemo(() => {
    // location.state.deposit is the raw deposit object passed from StudentWalletPage
    return location.state?.deposit || readStoredDeposit();
  }, [location.state]);

  useEffect(() => {
    if (!deposit?.expiresAt) return;

    setTimeRemaining(calculateTimeRemaining(deposit.expiresAt));
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(deposit.expiresAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [deposit?.expiresAt]);

  useEffect(() => {
    if (!deposit?.depositPaymentId) return;

    let isCancelled = false;

    const checkPaymentStatus = async () => {
      try {
        const response = await walletApi.getMyWallet();
        const wallet = unwrapApiData(response);
        const transactions = Array.isArray(wallet?.transactions) ? wallet.transactions : [];
        const paymentId = String(deposit.depositPaymentId).toLowerCase();
        const hasPaid = transactions.some((tx) => {
          const referenceId = String(tx?.referenceId || '').toLowerCase();
          const txType = String(tx?.type || '').toUpperCase();
          return referenceId === paymentId && txType === 'DEPOSIT';
        });

        if (hasPaid && !isCancelled) {
          navigate('/student/wallet/deposit/success', { replace: true, state: { deposit } });
        }
      } catch {
        // ignore polling errors
      }
    };

    checkPaymentStatus();
    const intervalId = setInterval(checkPaymentStatus, 5000);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, [deposit?.depositPaymentId, navigate]);

  useEffect(() => {
    // Debug logging to help identify QR URL issues
    if (deposit) {
      console.log('📦 Deposit loaded:', {
        qrCodeUrl: deposit.qrCodeUrl,
        checkoutUrl: deposit.checkoutUrl,
        payosOrderId: deposit.payosOrderId,
        amount: deposit.amount,
        currency: deposit.currency,
      });
    }
  }, [deposit]);

  const handleBackToWallet = () => {
    navigate('/student/wallet', { replace: true });
  };

  const handleCheckBalance = () => {
    navigate('/student/wallet/deposit/success', { replace: true, state: { deposit } });
  };

  if (!deposit) {
    return (
      <StudentLayout>
        <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4 py-10">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <span className="material-symbols-outlined text-[44px] text-slate-400">qr_code_2</span>
            <h1 className="mt-4 text-2xl font-black text-slate-900">Không tìm thấy lệnh nạp tiền</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Trang QR chỉ mở sau khi tạo lệnh nạp thành công.
            </p>
            <button
              type="button"
              onClick={handleBackToWallet}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-[#F37021] px-5 text-sm font-black text-white transition-colors hover:bg-orange-500"
            >
              Quay lại ví
            </button>
          </div>
        </div>
      </StudentLayout>
    );
  }

  const qrCodeUrl = deposit.qrCodeUrl || deposit.checkoutUrl || '';
  const paymentCode = deposit.payosOrderId || deposit.depositPaymentId || '—';
  
  // Detect if it's a raw QR data string or an image URL
  const isRawQrData = qrCodeUrl && !qrCodeUrl.startsWith('http') && !qrCodeUrl.startsWith('data:');
  const isImageUrl = qrCodeUrl && (qrCodeUrl.startsWith('http') || qrCodeUrl.startsWith('data:'));
  
  const qrDetails = useMemo(() => {
    if (!isRawQrData) return null;
    return parseVietQrDetails(qrCodeUrl);
  }, [isRawQrData, qrCodeUrl]);

  console.log('📊 QR Analysis:', {
    url: qrCodeUrl,
    isRawData: isRawQrData,
    isImage: isImageUrl,
  });

  return (
    <StudentLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBackToWallet}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:border-[#F37021]/30 hover:text-[#F37021]"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Quay lại ví
          </button>

          <Link
            to="/student/wallet"
            className="text-sm font-semibold text-slate-500 transition-colors hover:text-[#F37021]"
          >
            Trang ví sinh viên
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-br from-orange-50 to-white px-6 py-6">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F37021]/10 text-[#F37021]">
                  <span className="material-symbols-outlined text-[30px]">qr_code_2</span>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Thanh toán ví sinh viên</p>
                  <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Quét QR để hoàn tất nạp tiền</h1>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Mở app ngân hàng hoặc ví điện tử và quét mã QR bên dưới để chuyển đúng số tiền.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6 px-6 py-6">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="mx-auto flex max-w-md flex-col items-center gap-4">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    {isRawQrData ? (
                      <div className="flex items-center justify-center">
                        <QRCodeCanvas
                          value={qrCodeUrl}
                          size={288}
                          level="H"
                          includeMargin
                          className="rounded-2xl"
                        />
                      </div>
                    ) : isImageUrl && !qrImageError ? (
                      <img
                        src={qrCodeUrl}
                        alt="QR thanh toán"
                        className="h-72 w-72 rounded-2xl object-contain"
                        onError={(e) => {
                          console.error('❌ Failed to load QR image:', e);
                          setQrImageError(true);
                        }}
                        onLoad={() => {
                          console.log('✅ QR image loaded successfully');
                          setQrImageError(false);
                        }}
                      />
                    ) : (
                      <div className="flex h-72 w-72 flex-col items-center justify-center rounded-2xl bg-slate-100 text-center p-4">
                        <span className="material-symbols-outlined text-[44px] text-slate-400">image_not_supported</span>
                        <p className="mt-2 text-sm font-semibold text-slate-500">Không thể hiện mã QR</p>
                        <p className="mt-1 text-xs text-slate-400 break-all">
                          {qrCodeUrl ? `URL: ${qrCodeUrl.substring(0, 50)}...` : 'Không có URL'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-600">Số tiền cần thanh toán</p>
                    <p className="mt-1 text-3xl font-black text-[#F37021]">
                      {deposit.amount?.toLocaleString('vi-VN') || '0'} {deposit.currency || 'VND'}
                    </p>
                  </div>

                  <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                    <div className="grid grid-cols-[120px_1fr] gap-y-2">
                      <span className="font-semibold text-slate-500">Số TK:</span>
                      <span className="font-semibold text-slate-900">{qrDetails?.accountNumber || 'Theo mã QR'}</span>

                      <span className="font-semibold text-slate-500">Số tiền:</span>
                      <span className="font-semibold text-slate-900">
                        {deposit.amount?.toLocaleString('vi-VN') || '0'} {deposit.currency || 'VND'}
                      </span>

                      <span className="font-semibold text-slate-500">Nội dung CK:</span>
                      <span className="font-semibold text-slate-900">{qrDetails?.reference || paymentCode}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold text-slate-500">
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Mã lệnh: {paymentCode}</span>
                    <span className={`rounded-full border px-3 py-1 font-bold ${
                      timeRemaining?.expired 
                        ? 'border-red-200 bg-red-50 text-red-700' 
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}>
                      {timeRemaining?.text || 'Đang tính toán...'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 rounded-3xl border border-emerald-200 bg-emerald-50/60 p-5 text-sm text-emerald-900 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Trạng thái</p>
                  <p className="mt-1 font-semibold">Đã tạo lệnh nạp tiền</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Hướng dẫn</p>
                  <p className="mt-1 font-semibold">Quét mã rồi chuyển khoản đúng số tiền hiển thị.</p>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-900">Thông tin giao dịch</h2>
              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Mã lệnh</p>
                  <p className="mt-1 break-all font-semibold text-slate-800">{paymentCode}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Số tiền</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {deposit.amount?.toLocaleString('vi-VN') || '0'} {deposit.currency || 'VND'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Thời hạn</p>
                  <p className={`mt-1 font-semibold ${
                    timeRemaining?.expired 
                      ? 'text-red-600' 
                      : 'text-slate-800'
                  }`}>
                    {timeRemaining?.text || formatDateTime(deposit.expiresAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Ngân hàng nhận</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {qrDetails?.bankBin ? `BIN ${qrDetails.bankBin}` : 'Theo mã QR'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Số tài khoản</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {qrDetails?.accountNumber || 'Theo mã QR'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Nội dung giao dịch</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {qrDetails?.reference || paymentCode}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined mt-0.5 text-amber-600">info</span>
                <div>
                  <h3 className="text-sm font-black text-amber-900">Lưu ý</h3>
                  <p className="mt-2 text-sm leading-6 text-amber-900/80">
                    Không tải lại trang cho đến khi quét xong. Khi đã thanh toán, quay lại ví để hệ thống kiểm tra số dư.
                  </p>
                </div>
              </div>
            </section>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleCheckBalance}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#F37021] px-5 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition-colors hover:bg-orange-500"
              >
                <span className="material-symbols-outlined text-[20px]">sync</span>
                Tôi đã thanh toán xong
              </button>

              <button
                type="button"
                onClick={handleBackToWallet}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                Về lại ví
              </button>
            </div>
          </aside>
        </div>
      </div>
    </StudentLayout>
  );
}