import { useMemo, useState } from 'react';
import StatisticsSectionCard from './StatisticsSectionCard.jsx';
import { formatPercent, formatScore, toNumber } from '../utils/statisticsHelpers.js';

/**
 * Hiển thị bảng chi tiết từng Test Case của Block
 *
 * Props:
 *   items – mảng object { name, avgScore, failureCount, failureRate, sampleSize, severity, severityLabel }
 */
export default function StatisticsTestCaseDetailTable({ items }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const sorted = useMemo(
    () => [...(items ?? [])].sort((a, b) => toNumber(b.failureCount) - toNumber(a.failureCount)),
    [items],
  );

  const visibleItems = useMemo(
    () => (isExpanded ? sorted : sorted.slice(0, 5)),
    [sorted, isExpanded],
  );

  const maxFailure = useMemo(
    () => sorted.reduce((m, item) => Math.max(m, toNumber(item.failureCount)), 0),
    [sorted],
  );

  if (!sorted.length) {
    return (
      <StatisticsSectionCard title="Phân tích Chi tiết Tỷ lệ Lỗi & Hiệu năng Test Case">
        <div className="flex flex-col items-center justify-center py-10 text-slate-300 gap-2">
          <span className="material-symbols-outlined text-4xl">rule_folder</span>
          <p className="text-sm text-slate-400">Chưa có dữ liệu thống kê Test Case.</p>
          <p className="text-xs text-slate-400">Vui lòng chấm bài để cập nhật thống kê chi tiết.</p>
        </div>
      </StatisticsSectionCard>
    );
  }

  return (
    <StatisticsSectionCard title="Phân tích Chi tiết Tỷ lệ Lỗi & Hiệu năng Test Case">
      <div className="overflow-x-auto rounded-2xl border border-slate-100">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100">
              <th className="px-4 py-3 text-left text-xs font-bold text-red-700 tracking-wider w-8">#</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-red-700 tracking-wider">Test Case</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-red-700 tracking-wider whitespace-nowrap">Điểm TB</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-red-700 tracking-wider whitespace-nowrap">Số lượt lỗi</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-red-700 tracking-wider whitespace-nowrap">Tỷ lệ lỗi</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-red-700 tracking-wider whitespace-nowrap">Tỷ lệ đạt</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-red-700 tracking-wider">Mức độ lỗi</th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((item, idx) => {
              const failureCount = toNumber(item.failureCount);
              const failureRate  = toNumber(item.failureRate);
              const successRate  = Math.max(0, 100 - failureRate);
              const avgScore     = toNumber(item.avgScore);
              const sampleSize   = toNumber(item.sampleSize);
              const barWidth     = maxFailure > 0 ? (failureCount / maxFailure) * 100 : 0;

              const severityConfig = {
                error:   { bar: 'bg-rose-500',   badge: 'bg-rose-50 text-rose-600 border-rose-200',   label: 'Nghiêm trọng' },
                warning: { bar: 'bg-amber-500',  badge: 'bg-amber-50 text-amber-600 border-amber-200', label: 'Trung bình' },
                info:    { bar: 'bg-sky-500',    badge: 'bg-sky-50 text-sky-600 border-sky-200',     label: 'Nhẹ' },
                success: { bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-600 border-emerald-200', label: 'Thấp' },
              }[item.severity || 'success'];

              return (
                <tr
                  key={`${item.name}-${idx}`}
                  className={`border-b border-slate-100 transition-colors hover:bg-red-50/20
                    ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                >
                  {/* # */}
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono">{idx + 1}</td>

                  {/* Tên Test Case */}
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">
                      {item.name || '—'}
                    </p>
                    {sampleSize > 0 && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {sampleSize.toLocaleString('vi-VN')} lượt thực thi
                      </p>
                    )}
                  </td>

                  {/* Điểm TB */}
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-bold text-violet-600">{formatScore(avgScore)}</span>
                  </td>

                  {/* Số lượt lỗi */}
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-bold text-slate-800">
                      {failureCount.toLocaleString('vi-VN')}
                    </span>
                  </td>

                  {/* Tỷ lệ lỗi */}
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-black ${
                      item.severity === 'error' ? 'text-rose-600' :
                      item.severity === 'warning' ? 'text-amber-600' :
                      item.severity === 'info' ? 'text-sky-600' : 'text-emerald-600'
                    }`}>
                      {formatPercent(failureRate)}
                    </span>
                  </td>

                  {/* Tỷ lệ đạt */}
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-black text-emerald-600">
                      {formatPercent(successRate)}
                    </span>
                  </td>

                  {/* Bar + badge */}
                  <td className="px-4 py-3 min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${severityConfig.bar}`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${severityConfig.badge}`}>
                        {severityConfig.label}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sorted.length > 5 && (
        <div className="flex justify-center mt-4">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-full border border-red-200/50 shadow-sm transition-all duration-200"
          >
            <span>{isExpanded ? 'Thu gọn bớt' : `Xem tất cả (${sorted.length} test case)`}</span>
            <span className="material-symbols-outlined text-[16px]">
              {isExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
            </span>
          </button>
        </div>
      )}

      <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1">
        <span className="material-symbols-outlined text-[14px]">info</span>
        Sắp xếp theo số lượt lỗi giảm dần để nhanh chóng nhận biết các Test Case hay gặp lỗi nhất.
      </p>
    </StatisticsSectionCard>
  );
}
