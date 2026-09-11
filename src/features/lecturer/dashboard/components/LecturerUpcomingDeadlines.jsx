import React from 'react';
import { getUrgencyClassName, formatDeadline } from '../helpers/lecturerDashboardHelpers';

function DeadlineItemSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="h-4 w-28 rounded bg-slate-100 animate-pulse" />
      <div className="mt-3 h-4 w-full rounded bg-slate-100 animate-pulse" />
      <div className="mt-2 h-4 w-36 rounded bg-slate-100 animate-pulse" />
    </div>
  );
}

export default function LecturerUpcomingDeadlines({ items, loading, onOpenAppeal }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-slate-900">Deadline sắp tới</h2>
          <p className="text-sm text-slate-500">Ưu tiên xử lý các đơn gần hạn hoặc đã quá hạn.</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => <DeadlineItemSkeleton key={index} />)
        ) : items?.length ? (
          items.map((item) => (
            <button
              key={item.appealId}
              type="button"
              onClick={() => onOpenAppeal(item.appealId, item.status)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-left hover:border-[#F37021]/50 hover:bg-orange-50/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">{item.examName || 'Phúc khảo'}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.studentName || '—'}</p>
                  <p className="mt-2 text-xs text-slate-500">Deadline: {formatDeadline(item.deadline)}</p>
                </div>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${getUrgencyClassName(item.urgencyLabel)}`}>
                  {item.urgencyLabel || 'SẮP TỚI'}
                </span>
              </div>
            </button>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            Không có deadline nào cần ưu tiên lúc này.
          </div>
        )}
      </div>
    </section>
  );
}
