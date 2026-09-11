import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import StudentLayout from '../../../components/layouts/student';
import { formatCurrency, formatDateTime } from './helpers/walletHelpers';

const STORAGE_KEY = 'student-wallet-pending-deposit';
const REDIRECT_SECONDS = 4;

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

export default function StudentWalletDepositSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  const deposit = useMemo(() => {
    return location.state?.deposit || readStoredDeposit();
  }, [location.state]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCountdown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    const timeoutId = setTimeout(() => {
      navigate('/student/wallet?depositStatus=success', { replace: true });
    }, REDIRECT_SECONDS * 1000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [navigate]);

  const handleGoToWallet = () => {
    navigate('/student/wallet?depositStatus=success', { replace: true });
  };

  return (
    <StudentLayout>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white">
              <span className="material-symbols-outlined text-[34px]">check_circle</span>
            </div>
            <h1 className="mt-4 text-2xl font-black text-emerald-900">Thanh toán thành công</h1>
            <p className="mt-2 text-sm text-emerald-800">
              Hệ thống đã ghi nhận giao dịch. Tự động quay lại ví sau {countdown}s.
            </p>

            <div className="mt-6 w-full max-w-lg rounded-2xl border border-emerald-200 bg-white/90 p-5 text-left text-sm text-slate-700">
              <div className="grid grid-cols-[130px_1fr] gap-y-2">
                <span className="font-semibold text-slate-500">Mã lệnh:</span>
                <span className="font-semibold text-slate-900">{deposit?.payosOrderId || deposit?.depositPaymentId || '—'}</span>

                <span className="font-semibold text-slate-500">Số tiền:</span>
                <span className="font-semibold text-slate-900">
                  {deposit?.amount?.toLocaleString('vi-VN') || formatCurrency(deposit?.amount)} {deposit?.currency || 'VND'}
                </span>

                <span className="font-semibold text-slate-500">Thời gian:</span>
                <span className="font-semibold text-slate-900">
                  {formatDateTime(deposit?.expiresAt)}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleGoToWallet}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-500"
              >
                Về lại ví ngay
              </button>
              <Link
                to="/student/wallet"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-emerald-200 bg-white px-5 text-sm font-bold text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50"
              >
                Xem ví sinh viên
              </Link>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
