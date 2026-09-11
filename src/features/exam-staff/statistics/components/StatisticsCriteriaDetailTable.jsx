import { useMemo, useState } from 'react';
import StatisticsSectionCard from './StatisticsSectionCard.jsx';
import { formatPercent, formatScore, toNumber } from '../utils/statisticsHelpers.js';

/**
 * Hiển thị bảng chi tiết từng tiêu chí OOP (criteriaStats[])
 * từ kết quả phân tích tĩnh JavaParser / DeterministicOopScorer.
 *
 * Props:
 *   items – mảng object { name, avgScore, violationCount, violationRate, sampleSize }
 */
export default function StatisticsCriteriaDetailTable({ items }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const sorted = useMemo(
    () => [...(items ?? [])].sort((a, b) => toNumber(b.violationCount) - toNumber(a.violationCount)),
    [items],
  );

  const visibleItems = useMemo(
    () => (isExpanded ? sorted : sorted.slice(0, 5)),
    [sorted, isExpanded],
  );

  const maxViolation = useMemo(
    () => sorted.reduce((m, item) => Math.max(m, toNumber(item.violationCount)), 0),
    [sorted],
  );

  if (!sorted.length) {
    return (
      <StatisticsSectionCard title="Chi tiết tiêu chí OOP">
        <div className="flex flex-col items-center justify-center py-10 text-slate-300 gap-2">
          <span className="material-symbols-outlined text-4xl">rule</span>
          <p className="text-sm text-slate-400">Chưa có dữ liệu tiêu chí OOP.</p>
          <p className="text-xs text-slate-400">Hãy chấm bài trước để có thống kê.</p>
        </div>
      </StatisticsSectionCard>
    );
  }

  return (
    <StatisticsSectionCard title="Chi tiết tiêu chí OOP">
      <div className="overflow-x-auto rounded-2xl border border-slate-100">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
              <th className="px-4 py-3 text-left text-xs font-bold text-orange-700 tracking-wider w-8">#</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-orange-700 tracking-wider">Tiêu chí</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-orange-700 tracking-wider whitespace-nowrap">Điểm TB</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-orange-700 tracking-wider whitespace-nowrap">Vi phạm</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-orange-700 tracking-wider whitespace-nowrap">Tỷ lệ</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-orange-700 tracking-wider">Mức độ</th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((item, idx) => {
              const violationCount = toNumber(item.violationCount);
              const violationRate  = toNumber(item.violationRate);
              const avgScore       = toNumber(item.avgScore);
              const sampleSize     = toNumber(item.sampleSize);
              const barWidth       = maxViolation > 0 ? (violationCount / maxViolation) * 100 : 0;

              // severity: high >=50%, medium >=20%, low <20%
              const severity =
                violationRate >= 50 ? 'high' :
                violationRate >= 20 ? 'medium' : 'low';

              const severityConfig = {
                high:   { bar: 'bg-rose-400',   badge: 'bg-rose-50 text-rose-600 border-rose-200',   label: 'Cao' },
                medium: { bar: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-600 border-amber-200', label: 'Trung bình' },
                low:    { bar: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-600 border-emerald-200', label: 'Thấp' },
              }[severity];

              return (
                <tr
                  key={`${item.name}-${idx}`}
                  className={`border-b border-slate-100 transition-colors hover:bg-orange-50/30
                    ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                >
                  {/* # */}
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono">{idx + 1}</td>

                  {/* Tên tiêu chí */}
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">
                      {item.name || '—'}
                    </p>
                    {sampleSize > 0 && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {sampleSize.toLocaleString('vi-VN')} lượt đánh giá
                      </p>
                    )}
                  </td>

                  {/* Điểm TB */}
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-bold text-violet-600">{formatScore(avgScore)}</span>
                  </td>

                  {/* Số vi phạm */}
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-bold text-slate-800">
                      {violationCount.toLocaleString('vi-VN')}
                    </span>
                  </td>

                  {/* Tỷ lệ */}
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-black ${
                      severity === 'high' ? 'text-rose-600' :
                      severity === 'medium' ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {formatPercent(violationRate)}
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
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-full border border-orange-200/50 shadow-sm transition-all duration-200"
          >
            <span>{isExpanded ? 'Thu gọn bớt' : `Xem tất cả (${sorted.length} tiêu chí)`}</span>
            <span className="material-symbols-outlined text-[16px]">
              {isExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
            </span>
          </button>
        </div>
      )}

      <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1">
        <span className="material-symbols-outlined text-[14px]">info</span>
        Sắp xếp theo số lượt vi phạm giảm dần. Dữ liệu từ CriteriaResult (JavaParser).
      </p>
    </StatisticsSectionCard>
  );
}
