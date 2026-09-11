import StatisticsSectionCard from './StatisticsSectionCard.jsx';
import { formatPercent } from '../utils/statisticsHelpers';

export default function StatisticsPassFailCard({ summary }) {
  const passRate = Math.max(0, Math.min(100, Number(summary?.passRate ?? 0)));
  const failRate = Math.max(0, Math.min(100, Number(summary?.failRate ?? 0)));

  return (
    <StatisticsSectionCard title="Tỷ lệ Pass / Fail" className="h-full">
      <div className="space-y-6">
        <div className="relative mx-auto size-52">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(#22c55e 0% ${passRate}%, #fda4af ${passRate}% 100%)`,
            }}
          />
          <div className="absolute inset-[20px] rounded-full bg-white flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-black text-slate-900">{Math.round(passRate)}%</span>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Pass rate
            </span>
            <span className="text-[11px] text-slate-400 mt-2">
              {summary.gradedSubmissions.toLocaleString('vi-VN')} bài đã chấm
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Pass</p>
            <p className="text-2xl font-black text-emerald-800 mt-1">{summary.passCount}</p>
            <p className="text-xs text-emerald-700 mt-1">{formatPercent(passRate)}</p>
          </div>

          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-rose-700">Fail</p>
            <p className="text-2xl font-black text-rose-800 mt-1">{summary.failCount}</p>
            <p className="text-xs text-rose-700 mt-1">{formatPercent(failRate)}</p>
          </div>
        </div>
      </div>
    </StatisticsSectionCard>
  );
}