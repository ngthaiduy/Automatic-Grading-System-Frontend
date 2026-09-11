import React from 'react';
import { formatCurrency } from '../helpers/walletHelpers';

export default function WalletWithdrawPanel({
  values,
  errors,
  submitting,
  withdrawableBalance,
  pendingWithdrawalAmount,
  bankOptions,
  banksLoading,
  onFieldChange,
  onSubmit,
}) {
  const hasBankOptions = Array.isArray(bankOptions) && bankOptions.length > 0;

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Yêu cầu rút tiền</p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900">Gửi yêu cầu rút về tài khoản</h2>
          </div>
          <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 md:flex">
            <span className="material-symbols-outlined">payments</span>
          </div>
        </div>
      </div>

      <div className="space-y-5 px-6 py-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Có thể rút ngay</p>
            <p className="mt-2 text-xl font-black text-slate-900">{formatCurrency(withdrawableBalance)}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Đang chờ admin xử lý</p>
            <p className="mt-2 text-xl font-black text-amber-800">{formatCurrency(pendingWithdrawalAmount)}</p>
          </div>
        </div>

        <div>
          <label htmlFor="wallet-withdraw-amount" className="mb-2 block text-sm font-bold text-slate-700">
            Số tiền muốn rút
          </label>
          <div className="relative">
            <input
              id="wallet-withdraw-amount"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={values?.amount || ''}
              onChange={(event) => onFieldChange('amount', event.target.value)}
              placeholder="Ví dụ: 100000"
              className={`w-full rounded-2xl border bg-white px-4 py-3.5 pr-14 text-base font-bold text-slate-900 outline-none transition-all ${
                errors?.amount
                  ? 'border-rose-300 ring-4 ring-rose-100'
                  : 'border-slate-200 focus:border-[#F37021] focus:ring-4 focus:ring-orange-100'
              }`}
            />
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-bold text-slate-400">
              VND
            </span>
          </div>
          {errors?.amount && <p className="mt-2 text-sm font-medium text-rose-600">{errors.amount}</p>}
        </div>

        <div>
          <label htmlFor="wallet-bank-name" className="mb-2 block text-sm font-bold text-slate-700">
            Tên ngân hàng
          </label>

          {hasBankOptions ? (
            <select
              id="wallet-bank-name"
              value={values?.bankName || ''}
              onChange={(event) => onFieldChange('bankName', event.target.value)}
              disabled={banksLoading}
              title="Bạn có thể gõ chữ cái đầu để nhảy nhanh tới ngân hàng tương ứng."
              className={`w-full rounded-2xl border bg-white px-4 py-3.5 text-sm font-semibold text-slate-900 outline-none transition-all ${
                errors?.bankName
                  ? 'border-rose-300 ring-4 ring-rose-100'
                  : 'border-slate-200 focus:border-[#F37021] focus:ring-4 focus:ring-orange-100'
              } ${banksLoading ? 'cursor-wait opacity-70' : ''}`}
            >
              <option value="">{banksLoading ? 'Đang tải danh sách ngân hàng...' : 'Chọn ngân hàng'}</option>
              {bankOptions.map((bank) => {
                const optionValue = bank?.value || bank?.shortName || bank?.code || bank?.name || '';
                const optionLabel = bank?.label || [bank?.shortName, bank?.name].filter(Boolean).join(' - ') || optionValue;

                return (
                  <option key={`${bank?.bin || optionValue}-${bank?.code || ''}`} value={optionValue}>
                    {optionLabel}
                  </option>
                );
              })}
            </select>
          ) : (
            <input
              id="wallet-bank-name"
              type="text"
              autoComplete="organization"
              value={values?.bankName || ''}
              onChange={(event) => onFieldChange('bankName', event.target.value)}
              placeholder={banksLoading ? 'Đang tải danh sách ngân hàng...' : 'Ví dụ: Vietcombank'}
              className={`w-full rounded-2xl border bg-white px-4 py-3.5 text-sm font-semibold text-slate-900 outline-none transition-all ${
                errors?.bankName
                  ? 'border-rose-300 ring-4 ring-rose-100'
                  : 'border-slate-200 focus:border-[#F37021] focus:ring-4 focus:ring-orange-100'
              }`}
            />
          )}

          {hasBankOptions ? (
            <p className="mt-2 text-xs font-medium text-slate-500">
              Gợi ý: sau khi mở danh sách, bạn có thể gõ chữ cái đầu như V, B, M, T... để nhảy nhanh tới ngân hàng cần chọn.
            </p>
          ) : (
            <p className="mt-2 text-xs font-medium text-slate-500">
              {banksLoading
                ? 'Đang tải danh sách ngân hàng Việt Nam...'
                : 'Không tải được danh sách ngân hàng, bạn vẫn có thể nhập tay.'}
            </p>
          )}

          {errors?.bankName && <p className="mt-2 text-sm font-medium text-rose-600">{errors.bankName}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="wallet-account-number" className="mb-2 block text-sm font-bold text-slate-700">
              Số tài khoản
            </label>
            <input
              id="wallet-account-number"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={values?.accountNumber || ''}
              onChange={(event) => onFieldChange('accountNumber', event.target.value)}
              placeholder="Chỉ nhập chữ số"
              className={`w-full rounded-2xl border bg-white px-4 py-3.5 text-sm font-semibold text-slate-900 outline-none transition-all ${
                errors?.accountNumber
                  ? 'border-rose-300 ring-4 ring-rose-100'
                  : 'border-slate-200 focus:border-[#F37021] focus:ring-4 focus:ring-orange-100'
              }`}
            />
            {errors?.accountNumber && <p className="mt-2 text-sm font-medium text-rose-600">{errors.accountNumber}</p>}
          </div>

          <div>
            <label htmlFor="wallet-account-holder" className="mb-2 block text-sm font-bold text-slate-700">
              Tên chủ tài khoản
            </label>
            <input
              id="wallet-account-holder"
              type="text"
              autoComplete="name"
              value={values?.accountHolder || ''}
              onChange={(event) => onFieldChange('accountHolder', event.target.value)}
              placeholder="Ví dụ: NGUYEN VAN A"
              className={`w-full rounded-2xl border bg-white px-4 py-3.5 text-sm font-semibold text-slate-900 outline-none transition-all ${
                errors?.accountHolder
                  ? 'border-rose-300 ring-4 ring-rose-100'
                  : 'border-slate-200 focus:border-[#F37021] focus:ring-4 focus:ring-orange-100'
              }`}
            />
            {errors?.accountHolder && <p className="mt-2 text-sm font-medium text-rose-600">{errors.accountHolder}</p>}
          </div>
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-black text-white shadow-lg shadow-slate-900/10 transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          <span className={`material-symbols-outlined text-[20px] ${submitting ? 'animate-spin' : ''}`}>
            {submitting ? 'progress_activity' : 'send'}
          </span>
          {submitting ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu rút tiền'}
        </button>
      </div>
    </section>
  );
}
