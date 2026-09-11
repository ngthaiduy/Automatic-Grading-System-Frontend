import React from 'react';
import { formatCount } from '../../../../components/utils/Utils';

const TONE_CLASS = {
  blue: {
    border: 'border-blue-200',
    badge: 'bg-blue-50 text-blue-600',
  },
  green: {
    border: 'border-emerald-200',
    badge: 'bg-emerald-50 text-emerald-600',
  },
  red: {
    border: 'border-red-200',
    badge: 'bg-red-50 text-red-600',
  },
};

export default function LecturerDashboardCard({
  title,
  value,
  icon,
  tone = 'blue',
  loading = false,
}) {
  const toneClass = TONE_CLASS[tone] ?? TONE_CLASS.blue;

  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm ${toneClass.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          {loading ? (
            <div className="mt-3 h-8 w-20 rounded-xl bg-slate-100 animate-pulse" />
          ) : (
            <p className="mt-3 text-3xl font-black text-slate-900">{formatCount(value ?? 0)}</p>
          )}
        </div>

        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClass.badge}`}>
          <span className="material-symbols-outlined text-[22px]">{icon}</span>
        </div>
      </div>
    </div>
  );
}
