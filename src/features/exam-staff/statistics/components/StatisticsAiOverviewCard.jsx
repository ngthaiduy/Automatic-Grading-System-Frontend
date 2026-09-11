import StatisticsSectionCard from './StatisticsSectionCard.jsx';
import { formatPercent, formatScore } from '../utils/statisticsHelpers';

export default function StatisticsAiOverviewCard({ summary }) {
  const hardCodeCount = Number(summary?.hardCodeCount ?? 0);
  const hardCodeRate  = Number(summary?.hardCodeRate  ?? 0);

  const items = [
    {
      key: 'avgOopScore',
      title: 'Điểm OOP trung bình',
      value: formatScore(summary?.avgOopScore),
      helper: 'Tỷ lệ điểm OOP đạt được / tổng điểm OOP (thang 10)',
      accent: 'text-violet-600',
      bg: 'bg-violet-50 border-violet-200',
      icon: 'account_tree',
    },
    {
      key: 'oopViolatedRate',
      title: 'Tỷ lệ vi phạm OOP',
      value: formatPercent(summary?.oopViolatedRate),
      helper: `${summary?.oopViolatedCount ?? 0} câu trả lời có ít nhất 1 tiêu chí sai`,
      accent: 'text-rose-600',
      bg: 'bg-rose-50 border-rose-200',
      icon: 'warning',
    },
    ...(hardCodeCount > 0 || hardCodeRate > 0 ? [{
      key: 'hardCodeRate',
      title: 'Tỷ lệ hard-code',
      value: formatPercent(hardCodeRate),
      helper: `${hardCodeCount} lượt phát hiện`,
      accent: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-200',
      icon: 'code',
    }] : []),
  ];

  return (
    <StatisticsSectionCard title="Tổng quan phân tích OOP" className="h-full">
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.key}
            className={`rounded-2xl border px-4 py-4 ${item.bg}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{item.title}</p>
                <p className="text-2xl font-black text-slate-900 mt-2">{item.value}</p>
                <p className="text-xs text-slate-500 mt-2">{item.helper}</p>
              </div>
              <span className={`material-symbols-outlined text-[24px] ${item.accent}`}>
                {item.icon}
              </span>
            </div>
          </div>
        ))}

        {/* Nguồn dữ liệu */}
        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">info</span>
          Dữ liệu từ phân tích tĩnh (JavaParser) — không dùng AI
        </p>
      </div>
    </StatisticsSectionCard>
  );
}