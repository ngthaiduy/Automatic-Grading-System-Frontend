import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import StatisticsSectionCard from './StatisticsSectionCard.jsx';
import { formatCurrency } from '../utils/statisticsHelpers';

export default function StatisticsAppealFinanceChart({ cards }) {
  const chartOption = useMemo(() => ({
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
        return [
          `<div style="font-weight:700;margin-bottom:4px;">${point.title}</div>`,
          `<div>Giá trị: <b>${formatCurrency(point.value)}</b></div>`,
        ].join('');
      },
    },
    grid: {
      left: 18,
      right: 12,
      top: 20,
      bottom: 42,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      axisTick: { show: false },
      axisLine: {
        lineStyle: {
          color: '#e2e8f0',
        },
      },
      axisLabel: {
        color: '#64748b',
        fontSize: 11,
        fontWeight: 700,
      },
      data: cards.map((item) => item.title),
    },
    yAxis: {
      type: 'value',
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
        formatter: (value) => `${Math.round(value / 1000)}k`,
      },
    },
    series: [
      {
        type: 'bar',
        barWidth: '42%',
        data: cards.map((item, index) => ({
          value: item.value,
          title: item.title,
          itemStyle: {
            color: ['#22c55e', '#f59e0b', '#0ea5e9'][index % 3],
            borderRadius: 0,
          },
        })),
      },
    ],
    animationDuration: 450,
  }), [cards]);

  return (
    <StatisticsSectionCard title="Tài chính phúc khảo">
      {!cards.length ? (
        <p className="text-sm text-slate-500">Chưa có dữ liệu tài chính phúc khảo.</p>
      ) : (
        <div className="space-y-4">
          <div className="h-[220px]">
            <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} notMerge />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {cards.map((card) => (
              <div
                key={card.key}
                className={`rounded-2xl border px-4 py-4 ${card.bg}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{card.title}</p>
                    <p className="text-xl font-black text-slate-900 mt-2">{formatCurrency(card.value)}</p>
                  </div>
                  <span className={`material-symbols-outlined text-[22px] ${card.accent}`}>
                    {card.icon}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </StatisticsSectionCard>
  );
}