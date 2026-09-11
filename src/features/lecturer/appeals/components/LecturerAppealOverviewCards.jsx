import React from 'react';
import { formatCount } from '../../../../components/utils/Utils';

const CARD_CONFIG = [
  {
    key: 'totalAssigned',
    title: 'Tổng đơn được giao',
    subtitle: 'Toàn bộ đơn lecturer có quyền xử lý',
    icon: 'assignment',
    accent: 'from-slate-900 to-slate-700',
  },
  {
    key: 'inReview',
    title: 'Đang xử lý',
    subtitle: 'Trạng thái PROCESSING',
    icon: 'pending_actions',
    accent: 'from-blue-600 to-sky-500',
  },
  {
    key: 'completed',
    title: 'Đã hoàn thành',
    subtitle: 'COMPLETED / APPROVED / DENIED',
    icon: 'check_circle',
    accent: 'from-emerald-600 to-green-500',
  },
  {
    key: 'overdue',
    title: 'Quá hạn',
    subtitle: 'Deadline đã trễ nhưng chưa review xong',
    icon: 'priority_high',
    accent: 'from-red-600 to-orange-500',
  },
];

export default function LecturerAppealOverviewCards({ overview, loading }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {CARD_CONFIG.map((card) => (
        <div key={card.key} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className={`h-1.5 w-full bg-gradient-to-r ${card.accent}`} />
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">{card.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{card.subtitle}</p>
                {loading ? (
                  <div className="mt-4 h-8 w-20 rounded-xl bg-slate-100 animate-pulse" />
                ) : (
                  <p className="mt-4 text-3xl font-black text-slate-900">{formatCount(overview?.[card.key] ?? 0)}</p>
                )}
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm ${card.accent}`}>
                <span className="material-symbols-outlined text-[22px]">{card.icon}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
