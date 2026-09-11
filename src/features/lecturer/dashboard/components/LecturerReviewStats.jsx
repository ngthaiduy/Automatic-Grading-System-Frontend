import React from 'react';
import { formatCount } from '../../../../components/utils/Utils';

function toPercentage(value) {
  if (value == null || value === '') {
    return null;
  }

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return null;
  }

  return Math.max(0, Math.min(100, numericValue));
}

function formatMetricValue(value) {
  return value == null ? '—' : formatCount(value);
}

function StatRow({ label, value, tone }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={`font-bold ${tone}`}>{formatMetricValue(value)}</span>
    </div>
  );
}

export default function LecturerReviewStats({ stats, loading }) {
  const approvedPercentage = toPercentage(stats?.approvedPercentage);
  const deniedPercentage = toPercentage(stats?.deniedPercentage);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-black text-slate-900">Thống kê review</h2>
      <p className="mt-1 text-sm text-slate-500">Tỷ lệ đơn được duyệt hoặc giữ nguyên sau khi staff xác nhận.</p>

      {loading ? (
        <div className="mt-5 space-y-3">
          <div className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
          <div className="h-4 rounded bg-slate-100 animate-pulse" />
          <div className="h-4 rounded bg-slate-100 animate-pulse" />
        </div>
      ) : (
        <>
          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-500">Tổng số review đã hoàn thành</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{formatCount(stats?.totalReviews ?? 0)}</p>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Được staff duyệt</span>
                <span>{approvedPercentage == null ? '—' : `${approvedPercentage.toFixed(1)}%`}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${approvedPercentage ?? 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Giữ nguyên / từ chối</span>
                <span>{deniedPercentage == null ? '—' : `${deniedPercentage.toFixed(1)}%`}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-red-500"
                  style={{ width: `${deniedPercentage ?? 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <StatRow label="Số đơn được duyệt" value={stats?.approvedCount} tone="text-emerald-600" />
            <StatRow label="Số đơn bị từ chối" value={stats?.deniedCount} tone="text-red-600" />
          </div>

          {stats?.isPartial ? (
            <p className="mt-4 text-xs leading-5 text-slate-400">
              Phần tỷ lệ duyệt hoặc từ chối đang dùng dữ liệu dự phòng từ danh sách phúc khảo.
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
