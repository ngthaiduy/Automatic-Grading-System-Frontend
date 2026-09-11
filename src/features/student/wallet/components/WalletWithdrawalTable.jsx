import React from 'react';
import {
  formatCurrency,
  formatDateTime,
  getWithdrawalStatusMeta,
  maskAccountNumber,
} from '../helpers/walletHelpers';

export default function WalletWithdrawalTable({ withdrawals }) {
  const safeWithdrawals = Array.isArray(withdrawals) ? withdrawals : [];

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-lg font-black tracking-tight text-slate-900">Lịch sử yêu cầu rút tiền</h2>
      </div>

      {safeWithdrawals.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
            <span className="material-symbols-outlined text-[34px]">payments</span>
          </div>
          <h3 className="mt-4 text-lg font-black text-slate-800">Chưa có yêu cầu rút tiền</h3>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                <th className="px-6 py-3.5">Trạng thái</th>
                <th className="px-6 py-3.5">Số tiền</th>
                <th className="px-6 py-3.5">Ngân hàng</th>
                <th className="px-6 py-3.5">Tài khoản nhận</th>
                <th className="px-6 py-3.5">Ghi chú admin</th>
                <th className="px-6 py-3.5">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {safeWithdrawals.map((withdrawal) => {
                const statusMeta = getWithdrawalStatusMeta(withdrawal?.status);
                return (
                  <tr key={withdrawal?.withdrawalId || `${withdrawal?.createdAt}-${withdrawal?.amount || 0}`} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-6 py-4 align-top">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${statusMeta.className}`}>
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-top font-bold text-slate-900">{formatCurrency(withdrawal?.amount)}</td>
                    <td className="px-6 py-4 align-top text-slate-600">
                      <p className="font-semibold text-slate-800">{withdrawal?.bankName || '—'}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-400">{withdrawal?.accountHolder || '—'}</p>
                    </td>
                    <td className="px-6 py-4 align-top text-slate-600">{maskAccountNumber(withdrawal?.accountNumber)}</td>
                    <td className="px-6 py-4 align-top text-slate-600">
                      <p className="max-w-[320px] whitespace-pre-line leading-6">{withdrawal?.adminNote || 'Chưa có ghi chú'}</p>
                      {withdrawal?.processedByName && (
                        <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                          Xử lý bởi {withdrawal.processedByName}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 align-top text-slate-600">
                      <p>{formatDateTime(withdrawal?.createdAt)}</p>
                      {withdrawal?.processedAt && (
                        <p className="mt-1 text-xs text-slate-400">Xử lý: {formatDateTime(withdrawal.processedAt)}</p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
