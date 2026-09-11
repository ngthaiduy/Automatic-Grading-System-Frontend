import React from 'react';
import {
  DEPOSIT_PRESET_AMOUNTS,
  formatCurrency,
  formatDateTime,
} from '../helpers/walletHelpers';

export default function WalletDepositPanel({
  depositAmount,
  depositAmountError,
  submitting,
  lastDeposit,
  onDepositAmountChange,
  onPresetAmountClick,
  onSubmit,
  onOpenQrPage,
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Nạp tiền vào ví</p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900">Tạo lệnh nạp tiền</h2>
          </div>
          <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-[#F37021]/10 text-[#F37021] md:flex">
            <span className="material-symbols-outlined">qr_code_2</span>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-6 py-6">
        <div>
          <label htmlFor="wallet-deposit-amount" className="mb-2 block text-sm font-bold text-slate-700">
            Số tiền muốn nạp
          </label>
          <div className="relative">
            <input
              id="wallet-deposit-amount"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              value={depositAmount}
              onChange={(event) => onDepositAmountChange(event.target.value)}
              placeholder="Ví dụ: 100000"
              className={`w-full rounded-2xl border bg-white px-4 py-3.5 pr-14 text-base font-bold text-slate-900 outline-none transition-all ${
                depositAmountError
                  ? 'border-rose-300 ring-4 ring-rose-100'
                  : 'border-slate-200 focus:border-[#F37021] focus:ring-4 focus:ring-orange-100'
              }`}
            />
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-bold text-slate-400">
              VND
            </span>
          </div>
          {depositAmountError ? (
            <p className="mt-2 text-sm font-medium text-rose-600">{depositAmountError}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {DEPOSIT_PRESET_AMOUNTS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => onPresetAmountClick(amount)}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:border-[#F37021]/40 hover:bg-orange-50 hover:text-[#F37021]"
            >
              {formatCurrency(amount)}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#F37021] px-5 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-500 disabled:cursor-not-allowed disabled:bg-orange-300"
        >
          <span className={`material-symbols-outlined text-[20px] ${submitting ? 'animate-spin' : ''}`}>
            {submitting ? 'progress_activity' : 'account_balance_wallet'}
          </span>
          {submitting ? 'Đang tạo lệnh nạp...' : 'Tạo lệnh nạp tiền'}
        </button>

        {lastDeposit && (
          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                Lệnh nạp đã được tạo
              </div>

              <div className="grid grid-cols-1 gap-3 text-sm text-slate-600 md:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Mã lệnh</p>
                  <p className="mt-1 font-semibold text-slate-900">{lastDeposit?.payosOrderId || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Số tiền</p>
                  <p className="mt-1 font-semibold text-slate-900">{formatCurrency(lastDeposit?.amount)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Hết hạn</p>
                  <p className="mt-1 font-semibold text-slate-900">{formatDateTime(lastDeposit?.expiresAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Tiền tệ</p>
                  <p className="mt-1 font-semibold text-slate-900">{lastDeposit?.currency || 'VND'}</p>
                </div>
              </div>

              {lastDeposit?.qrCodeUrl && onOpenQrPage && (
                <button
                  type="button"
                  onClick={() => onOpenQrPage(lastDeposit)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#F37021]/20 bg-[#F37021]/10 px-4 text-sm font-black text-[#F37021] transition-colors hover:bg-[#F37021]/15"
                >
                  <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
                  Mở trang quét QR thanh toán
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
