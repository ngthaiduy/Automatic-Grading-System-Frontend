import StatisticsSectionCard from './StatisticsSectionCard.jsx';
import { formatPercent, formatScore } from '../utils/statisticsHelpers';

export default function StatisticsBlocksComparisonTable({
  rows,
  loading,
  onOpenBlock,
}) {
  return (
    <StatisticsSectionCard title="So sánh hiệu suất theo block">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 font-bold">Tên block</th>
              <th className="px-4 py-3 font-bold">Đã nộp</th>
              <th className="px-4 py-3 font-bold">Đã chấm</th>
              <th className="px-4 py-3 font-bold">Tỷ lệ chấm</th>
              <th className="px-4 py-3 font-bold">Điểm TB</th>
              <th className="px-4 py-3 font-bold">Pass rate</th>
              <th className="px-4 py-3 font-bold">OOP TB</th>
              <th className="px-4 py-3 font-bold">Phúc khảo</th>
              <th className="px-4 py-3 font-bold text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading && !rows.length ? (
              <tr>
                <td colSpan="9" className="px-4 py-8 text-center text-slate-500">
                  Đang tải dữ liệu so sánh block...
                </td>
              </tr>
            ) : rows.length ? (
              rows.map((row) => (
                <tr key={row.blockId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-4 font-bold text-slate-800">{row.blockName}</td>
                  <td className="px-4 py-4">{row.totalSubmissions.toLocaleString('vi-VN')}</td>
                  <td className="px-4 py-4">{row.gradedSubmissions.toLocaleString('vi-VN')}</td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center rounded-lg bg-orange-50 text-orange-700 px-2.5 py-1 text-xs font-bold border border-orange-100">
                      {formatPercent(row.gradingRate)}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-900">{formatScore(row.averageScore)}</td>
                  <td className="px-4 py-4">{formatPercent(row.passRate)}</td>
                  <td className="px-4 py-4">{formatScore(row.avgOopScore)}</td>
                  <td className="px-4 py-4">{row.totalAppeals.toLocaleString('vi-VN')}</td>
                  <td className="px-4 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onOpenBlock(row.blockId)}
                      className="text-[#F37120] font-bold hover:underline"
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="px-4 py-8 text-center text-slate-500">
                  Chưa có dữ liệu so sánh block.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </StatisticsSectionCard>
  );
}