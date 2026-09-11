import React from 'react';

function OverviewCard({ title, value, accentClassName, icon }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{title}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">{value}</p>
        </div>

        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accentClassName}`}>
          <span className="material-symbols-outlined text-[22px]">{icon}</span>
        </div>
      </div>
    </article>
  );
}

export default function AppealOverviewCards({ overview }) {
  const cards = [
    {
      key: 'total',
      title: 'Tổng số yêu cầu',
      value: Number(overview?.totalAppeals ?? 0).toLocaleString('vi-VN'),
      accentClassName: 'bg-slate-100 text-slate-700',
      icon: 'list_alt',
    },
    {
      key: 'received',
      title: 'Đã tiếp nhận',
      value: Number(overview?.receivedCount ?? 0).toLocaleString('vi-VN'),
      accentClassName: 'bg-sky-50 text-sky-600',
      icon: 'inventory_2',
    },
    {
      key: 'assigned',
      title: 'Đã phân công',
      value: Number(overview?.assignedCount ?? 0).toLocaleString('vi-VN'),
      accentClassName: 'bg-indigo-50 text-indigo-600',
      icon: 'assignment_ind',
    },
    {
      key: 'done',
      title: 'Hoàn thành đơn',
      value: Number(overview?.doneCount ?? 0).toLocaleString('vi-VN'),
      accentClassName: 'bg-emerald-50 text-emerald-600',
      icon: 'task_alt',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <OverviewCard key={card.key} {...card} />
      ))}
    </div>
  );
}
