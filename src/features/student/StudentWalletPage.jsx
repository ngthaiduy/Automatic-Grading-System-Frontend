import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { message } from 'antd';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import StudentLayout from '../../components/layouts/student';
import walletApi from '../../services/walletApi';
import { getVietnamBanks } from '../../services/bankApi';
import WalletSummaryCards from './wallet/components/WalletSummaryCards';
import WalletDepositPanel from './wallet/components/WalletDepositPanel';
import WalletWithdrawPanel from './wallet/components/WalletWithdrawPanel';
import WalletTransactionTable from './wallet/components/WalletTransactionTable';
import WalletWithdrawalTable from './wallet/components/WalletWithdrawalTable';
import {
  buildWalletRedirectUrl,
  extractWalletErrorMessage,
  getWalletSummary,
  normalizeAccountHolder,
  normalizeAccountNumber,
  normalizeFreeText,
  parseAmount,
  sanitizeAmountInput,
  unwrapApiData,
  validateDepositAmount,
  validateWithdrawalForm,
} from './wallet/helpers/walletHelpers';

const INITIAL_WITHDRAW_FORM = {
  amount: '',
  bankName: '',
  accountNumber: '',
  accountHolder: '',
};

const DEPOSIT_POLL_INTERVAL_MS = 4000;
const DEPOSIT_POLL_MAX_ROUNDS = 6;

function normalizeBankOptions(items) {
  if (!Array.isArray(items)) return [];

  const seen = new Set();

  return items
    .map((bank) => {
      const code = normalizeFreeText(bank?.code, 20);
      const shortName = normalizeFreeText(bank?.shortName || bank?.short_name, 80);
      const name = normalizeFreeText(bank?.name, 180);
      const bin = normalizeFreeText(bank?.bin, 20);
      const logo = typeof bank?.logo === 'string' ? bank.logo : '';

      const optionValue = shortName || code || name;
      if (!optionValue) return null;

      const optionKey = [bin || code || shortName || name, code, shortName].join('|').toLowerCase();
      if (seen.has(optionKey)) return null;
      seen.add(optionKey);

      return {
        code,
        shortName,
        name,
        bin,
        logo,
        label: [shortName, name].filter(Boolean).join(' - ') || optionValue,
        value: optionValue,
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.label.localeCompare(right.label, 'vi'));
}

function QueryStatusBanner({ type, onClear }) {
  if (!type) return null;

  const isSuccess = type === 'success';

  return (
    <section
      className={`rounded-3xl border px-6 py-5 shadow-sm ${
        isSuccess
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-amber-200 bg-amber-50 text-amber-900'
      }`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3">
          <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${isSuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            <span className="material-symbols-outlined">{isSuccess ? 'verified' : 'info'}</span>
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight">
              {isSuccess ? 'Đang kiểm tra lại số dư ví' : 'Bạn đã hủy phiên thanh toán'}
            </h2>
            <p className="mt-1 text-sm leading-6">
              {isSuccess
                ? 'Hệ thống sẽ tự làm mới số dư ví trong ít giây tới.'
                : 'Không có khoản tiền nào được cộng vào ví. Bạn có thể tạo lệnh nạp mới khi cần.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-10 items-center justify-center rounded-2xl border border-current/15 bg-white/70 px-4 text-sm font-bold transition-colors hover:bg-white"
        >
          Đã hiểu
        </button>
      </div>
    </section>
  );
}

export default function StudentWalletPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const depositPollTimeoutRef = useRef(null);
  const depositPollRoundRef = useRef(0);

  const [wallet, setWallet] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [depositAmount, setDepositAmount] = useState('');
  const [depositAmountError, setDepositAmountError] = useState('');
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  const [lastDeposit, setLastDeposit] = useState(null);

  const [withdrawForm, setWithdrawForm] = useState(INITIAL_WITHDRAW_FORM);
  const [withdrawErrors, setWithdrawErrors] = useState({});
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [bankOptions, setBankOptions] = useState([]);
  const [banksLoading, setBanksLoading] = useState(false);

  const depositStatus = searchParams.get('depositStatus');

  const clearDepositPolling = useCallback(() => {
    if (depositPollTimeoutRef.current) {
      clearTimeout(depositPollTimeoutRef.current);
      depositPollTimeoutRef.current = null;
    }
    depositPollRoundRef.current = 0;
  }, []);

  const loadWalletData = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const [walletResponse, withdrawalsResponse] = await Promise.all([
        walletApi.getMyWallet(),
        walletApi.getMyWithdrawals(),
      ]);

      const walletData = unwrapApiData(walletResponse);
      const withdrawalsData = unwrapApiData(withdrawalsResponse);

      setWallet(walletData);
      setWithdrawals(Array.isArray(withdrawalsData) ? withdrawalsData : []);

      return {
        wallet: walletData,
        withdrawals: Array.isArray(withdrawalsData) ? withdrawalsData : [],
      };
    } catch (apiError) {
      const nextError = extractWalletErrorMessage(
        apiError,
        'Không thể tải dữ liệu ví lúc này. Vui lòng thử lại.',
      );
      setError(nextError);
      throw apiError;
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  const loadBankOptions = useCallback(async () => {
    setBanksLoading(true);

    try {
      const response = await walletApi.getBanks();
      const payload = normalizeBankOptions(unwrapApiData(response));

      if (payload.length > 0) {
        setBankOptions(payload);
        return;
      }

      const fallbackBanks = normalizeBankOptions(await getVietnamBanks());
      setBankOptions(fallbackBanks);
    } catch {
      try {
        const fallbackBanks = normalizeBankOptions(await getVietnamBanks());
        setBankOptions(fallbackBanks);
      } catch {
        setBankOptions([]);
      }
    } finally {
      setBanksLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWalletData().catch(() => {});
    loadBankOptions().catch(() => {});
  }, [loadBankOptions, loadWalletData]);

  useEffect(() => () => clearDepositPolling(), [clearDepositPolling]);

  const summary = useMemo(
    () => getWalletSummary(wallet, withdrawals),
    [wallet, withdrawals],
  );

  const runDepositPolling = useCallback(async () => {
    try {
      await loadWalletData({ silent: true });
    } catch {
      // ignore one-off polling errors
    }

    depositPollRoundRef.current += 1;

    if (depositPollRoundRef.current < DEPOSIT_POLL_MAX_ROUNDS) {
      depositPollTimeoutRef.current = setTimeout(runDepositPolling, DEPOSIT_POLL_INTERVAL_MS);
    }
  }, [loadWalletData]);

  useEffect(() => {
    clearDepositPolling();

    if (depositStatus === 'success') {
      message.success('Đã quay lại từ cổng thanh toán. Hệ thống đang kiểm tra lại ví.');
      runDepositPolling();
      return;
    }

    if (depositStatus === 'cancel') {
      message.info('Bạn đã hủy giao dịch nạp tiền.');
    }
  }, [clearDepositPolling, depositStatus, runDepositPolling]);

  const clearDepositStatus = useCallback(() => {
    clearDepositPolling();
    const next = new URLSearchParams(searchParams);
    next.delete('depositStatus');
    setSearchParams(next, { replace: true });
  }, [clearDepositPolling, searchParams, setSearchParams]);

  const handleRefresh = useCallback(() => {
    loadWalletData({ silent: true }).catch(() => {});
    loadBankOptions().catch(() => {});
  }, [loadBankOptions, loadWalletData]);

  const handleDepositAmountChange = useCallback((value) => {
    setDepositAmount(sanitizeAmountInput(value));
    setDepositAmountError('');
  }, []);

  const handlePresetAmountClick = useCallback((value) => {
    setDepositAmount(String(value));
    setDepositAmountError('');
  }, []);

  const handleDepositSubmit = useCallback(async () => {
    const validationError = validateDepositAmount(depositAmount);
    if (validationError) {
      setDepositAmountError(validationError);
      return;
    }

    setDepositSubmitting(true);
    setDepositAmountError('');

    try {
      const amount = parseAmount(depositAmount);
      const response = await walletApi.createDeposit({
        amount,
        returnUrl: buildWalletRedirectUrl('success'),
        cancelUrl: buildWalletRedirectUrl('cancel'),
      });

      // response is already unwrapped by axiosClient (returns res.data)
      const payload = response?.data || response;
      sessionStorage.setItem('student-wallet-pending-deposit', JSON.stringify({
        ...payload,
        createdAt: new Date().toISOString(),
      }));
      setLastDeposit(payload);
      message.success(response?.message || 'Đã tạo lệnh nạp tiền thành công.');
      navigate('/student/wallet/deposit/qr', {
        state: { deposit: payload },
        replace: true,
      });
    } catch (apiError) {
      setLastDeposit(null);
      message.error(
        extractWalletErrorMessage(apiError, 'Không thể tạo lệnh nạp tiền lúc này.'),
      );
    } finally {
      setDepositSubmitting(false);
    }
  }, [depositAmount, navigate]);

  const handleWithdrawFieldChange = useCallback((field, value) => {
    setWithdrawErrors((prev) => ({ ...prev, [field]: '' }));

    if (field === 'amount') {
      setWithdrawForm((prev) => ({ ...prev, amount: sanitizeAmountInput(value) }));
      return;
    }

    if (field === 'accountNumber') {
      setWithdrawForm((prev) => ({ ...prev, accountNumber: normalizeAccountNumber(value) }));
      return;
    }

    if (field === 'bankName') {
      setWithdrawForm((prev) => ({ ...prev, bankName: normalizeFreeText(value, 100) }));
      return;
    }

    if (field === 'accountHolder') {
      setWithdrawForm((prev) => ({ ...prev, accountHolder: normalizeAccountHolder(value) }));
      return;
    }

    setWithdrawForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleWithdrawSubmit = useCallback(async () => {
    const { amount, normalized, errors } = validateWithdrawalForm(
      withdrawForm,
      summary.withdrawableBalance,
    );

    if (Object.keys(errors).length > 0) {
      setWithdrawErrors(errors);
      return;
    }

    setWithdrawSubmitting(true);
    setWithdrawErrors({});

    try {
      const response = await walletApi.createWithdrawal({
        amount,
        bankName: normalized.bankName,
        accountNumber: normalized.accountNumber,
        accountHolder: normalized.accountHolder,
      });

      message.success(response?.message || 'Đã gửi yêu cầu rút tiền thành công.');
      setWithdrawForm(INITIAL_WITHDRAW_FORM);
      await loadWalletData({ silent: true });
    } catch (apiError) {
      message.error(
        extractWalletErrorMessage(apiError, 'Không thể gửi yêu cầu rút tiền lúc này.'),
      );
    } finally {
      setWithdrawSubmitting(false);
    }
  }, [loadWalletData, summary.withdrawableBalance, withdrawForm]);

  const headerActions = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleRefresh}
        title="Làm mới dữ liệu ví"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-800"
      >
        <span className={`material-symbols-outlined text-[20px] ${refreshing || banksLoading ? 'animate-spin' : ''}`}>refresh</span>
      </button>

      <button
        type="button"
        onClick={() => navigate('/student/results')}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:border-[#F37021]/30 hover:text-[#F37021]"
      >
        <span className="material-symbols-outlined text-[18px]">bar_chart</span>
        Xem kết quả
      </button>
    </div>
  );

  return (
    <StudentLayout
      activeNavKey="wallet"
      title="Ví sinh viên"
      breadcrumbs={[
        { label: 'Trang chủ', to: '/student' },
        { label: 'Ví sinh viên' },
      ]}
      headerActions={headerActions}
      bodyClassName="mx-auto max-w-7xl space-y-6 px-8 py-8"
    >
      <section className="rounded-3xl border border-slate-200 bg-white/95 px-6 py-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Ví sinh viên</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Quản lý ví, nạp tiền và rút tiền</h1>
          </div>

          <Link
            to="/student/appeals"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#F37021] px-5 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition-colors hover:bg-orange-500"
          >
            <span className="material-symbols-outlined text-[18px]">gavel</span>
            Đi tới phúc khảo
          </Link>
        </div>
      </section>

      <QueryStatusBanner type={depositStatus} onClear={clearDepositStatus} />

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-16 shadow-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-full border-4 border-[#F37021]/30 border-t-[#F37021] animate-spin" />
            <p className="text-sm font-medium text-slate-500">Đang tải dữ liệu ví sinh viên...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-white p-12 shadow-sm">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="material-symbols-outlined text-[44px] text-rose-500">error</span>
            <h2 className="text-xl font-black text-slate-800">Không thể tải ví</h2>
            <p className="max-w-xl text-sm leading-6 text-slate-500">{error}</p>
            <button
              type="button"
              onClick={() => loadWalletData().catch(() => {})}
              className="mt-1 inline-flex h-11 items-center justify-center rounded-2xl bg-[#F37021] px-5 text-sm font-black text-white transition-colors hover:bg-orange-500"
            >
              Thử lại
            </button>
          </div>
        </div>
      ) : (
        <>
          <WalletSummaryCards summary={summary} />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <WalletDepositPanel
              depositAmount={depositAmount}
              depositAmountError={depositAmountError}
              submitting={depositSubmitting}
              lastDeposit={lastDeposit}
              onDepositAmountChange={handleDepositAmountChange}
              onPresetAmountClick={handlePresetAmountClick}
              onSubmit={handleDepositSubmit}
                onOpenQrPage={(deposit = lastDeposit) => {
                  if (!deposit) return;
                  sessionStorage.setItem('student-wallet-pending-deposit', JSON.stringify({
                    ...deposit,
                    createdAt: deposit.createdAt || new Date().toISOString(),
                  }));
                  navigate('/student/wallet/deposit/qr', {
                    state: { deposit },
                  });
                }}
            />

            <WalletWithdrawPanel
              values={withdrawForm}
              errors={withdrawErrors}
              submitting={withdrawSubmitting}
              withdrawableBalance={summary.withdrawableBalance}
              pendingWithdrawalAmount={summary.pendingWithdrawalAmount}
              bankOptions={bankOptions}
              banksLoading={banksLoading}
              onFieldChange={handleWithdrawFieldChange}
              onSubmit={handleWithdrawSubmit}
            />
          </div>

          <WalletTransactionTable transactions={wallet?.transactions} />
          <WalletWithdrawalTable withdrawals={withdrawals} />
        </>
      )}
    </StudentLayout>
  );
}
