import React from 'react';
import { formatCurrency } from '../helpers/walletHelpers';

function SummaryCard({ title, value, icon, accentClassName }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{title}</p>
          <p className="mt-3 text-2xl font-black tracking-tight text-slate-900">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accentClassName}`}>
          <span className="material-symbols-outlined text-[24px]">{icon}</span>
        </div>
      </div>
    </article>
  );
}

export default function WalletSummaryCards({ summary }) {
  const cards = [
    {
      key: 'balance',
      title: 'Số dư hiện tại',
      value: formatCurrency(summary?.balance),
      icon: 'account_balance_wallet',
      accentClassName: 'bg-orange-50 text-[#F37021]',
    },
    {
      key: 'withdrawable',
      title: 'Số dư có thể rút',
      value: formatCurrency(summary?.withdrawableBalance),
      icon: 'payments',
      accentClassName: 'bg-emerald-50 text-emerald-600',
    },
    {
      key: 'pendingWithdrawals',
      title: 'Rút tiền chờ duyệt',
      value: `${Number(summary?.pendingWithdrawalCount ?? 0).toLocaleString('vi-VN')} đơn`,
      icon: 'hourglass_top',
      accentClassName: 'bg-amber-50 text-amber-600',
    },
    {
      key: 'transactions',
      title: 'Tổng giao dịch',
      value: Number(summary?.totalTransactions ?? 0).toLocaleString('vi-VN'),
      icon: 'receipt_long',
      accentClassName: 'bg-sky-50 text-sky-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <SummaryCard key={card.key} {...card} />
      ))}
    </div>
  );
}
