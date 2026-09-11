import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import StatisticsSectionCard from './StatisticsSectionCard.jsx';
import { formatPercent } from '../utils/statisticsHelpers';

export default function StatisticsOopViolationChart({ items }) {
  const chartOption = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        backgroundColor: 'rgba(15, 23, 42, 0.94)',
        borderWidth: 0,
        textStyle: {
          color: '#f8fafc',
          fontFamily: 'Inter, sans-serif',
        },
        formatter: (params) => {
          const point = params?.[0]?.data;
          if (!point) return '';
          const extra = [];
          if (Number.isFinite(Number(point.sampleSize)) && Number(point.sampleSize) > 0) {
            extra.push(`<div>Mẫu đánh giá: <b>${Number(point.sampleSize).toLocaleString('vi-VN')}</b></div>`);
          }
          if (Number.isFinite(Number(point.avgScore))) {
            extra.push(`<div>Điểm TB tiêu chí: <b>${Number(point.avgScore).toFixed(2)}</b></div>`);
          }
          return [
            `<div style="font-weight:700;margin-bottom:4px;">${point.fullLabel}</div>`,
            `<div>Số bài vi phạm: <b>${point.count.toLocaleString('vi-VN')}</b></div>`,
            `<div>Tỷ lệ: <b>${formatPercent(point.rate)}</b></div>`,
            ...extra,
          ].join('');
        },
      },
      grid: {
        left: 96,
        right: 18,
        top: 20,
        bottom: 24,
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        minInterval: 1,
        splitLine: {
          lineStyle: {
            color: '#f1f5f9',
          },
        },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#94a3b8',
          fontSize: 11,
        },
      },
      yAxis: {
        type: 'category',
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: {
          color: '#475569',
          fontSize: 12,
          fontWeight: 700,
        },
        data: items.map((item) => item.label),
      },
      series: [
        {
          type: 'bar',
          barWidth: 18,
          data: items.map((item, index) => ({
            value: item.count,
            label: item.label,
            fullLabel: item.fullLabel || item.label,
            count: item.count,
            rate: item.rate,
            avgScore: item.avgScore,
            sampleSize: item.sampleSize,
            itemStyle: {
              color: ['#F37120', '#fb923c', '#fdba74', '#f59e0b', '#f97316'][index % 5],
              borderRadius: 0,
            },
          })),
          label: {
            show: true,
            position: 'right',
            color: '#64748b',
            fontWeight: 700,
            formatter: ({ data }) => formatPercent(data?.rate ?? 0),
          },
        },
      ],
      animationDuration: 450,
    }),
    [items],
  );

  return (
    <StatisticsSectionCard title="Thống kê sai OOP theo tiêu chí" className="h-full">
      {!items.length ? (
        <p className="text-sm text-slate-500">Chưa có dữ liệu AI OOP để phân tích.</p>
      ) : (
        <div className="space-y-4">
          <div className="h-[260px]">
            <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} notMerge />
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
            {items.map((item) => (
              <div key={item.key} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-black text-slate-900">
                  {item.count.toLocaleString('vi-VN')}
                </p>
                <p className="text-xs text-slate-400 mt-1">{formatPercent(item.rate)}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-400">
            Hover vào từng thanh để xem số bài vi phạm và tỷ lệ theo từng tiêu chí OOP.
          </p>
        </div>
      )}
    </StatisticsSectionCard>
  );
}
