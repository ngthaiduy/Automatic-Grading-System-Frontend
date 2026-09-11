import React from 'react';
import {
  formatCurrency,
  formatDateTime,
  getTransactionTypeMeta,
} from '../helpers/walletHelpers';

export default function WalletTransactionTable({ transactions }) {
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-lg font-black tracking-tight text-slate-900">Lịch sử giao dịch ví</h2>
      </div>

      {safeTransactions.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
            <span className="material-symbols-outlined text-[34px]">receipt_long</span>
          </div>
          <h3 className="mt-4 text-lg font-black text-slate-800">Chưa có giao dịch nào</h3>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                <th className="px-6 py-3.5">Loại</th>
                <th className="px-6 py-3.5">Số tiền</th>
                <th className="px-6 py-3.5">Số dư trước</th>
                <th className="px-6 py-3.5">Số dư sau</th>
                <th className="px-6 py-3.5">Mô tả</th>
                <th className="px-6 py-3.5">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {safeTransactions.map((transaction) => {
                const typeMeta = getTransactionTypeMeta(transaction?.type);
                return (
                  <tr key={transaction?.transactionId || `${transaction?.createdAt}-${transaction?.referenceId || 'tx'}`} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-6 py-4 align-top">
                      <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${typeMeta.className}`}>
                        <span className="material-symbols-outlined text-[15px]">{typeMeta.icon}</span>
                        {typeMeta.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-top font-bold text-slate-900">{formatCurrency(transaction?.amount)}</td>
                    <td className="px-6 py-4 align-top text-slate-600">{formatCurrency(transaction?.balanceBefore)}</td>
                    <td className="px-6 py-4 align-top text-slate-600">{formatCurrency(transaction?.balanceAfter)}</td>
                    <td className="px-6 py-4 align-top text-slate-600">
                      <p className="max-w-[320px] whitespace-pre-line leading-6">{transaction?.description || '—'}</p>
                    </td>
                    <td className="px-6 py-4 align-top text-slate-600">{formatDateTime(transaction?.createdAt)}</td>
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
