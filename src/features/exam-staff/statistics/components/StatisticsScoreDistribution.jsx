import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import StatisticsSectionCard from './StatisticsSectionCard.jsx';
import { formatPercent } from '../utils/statisticsHelpers';

export default function StatisticsScoreDistribution({ distribution }) {
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
          `<div style="font-weight:700;margin-bottom:4px;">Khoảng ${point.range}</div>`,
          `<div>Số bài: <b>${point.count.toLocaleString('vi-VN')}</b></div>`,
          `<div>Tỷ lệ: <b>${formatPercent(point.percentage)}</b></div>`,
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
      data: distribution.map((item) => item.range),
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
    },
    yAxis: {
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
    series: [
      {
        type: 'bar',
        data: distribution.map((item, index) => ({
          value: item.count,
          range: item.range,
          count: item.count,
          percentage: item.percentage,
          itemStyle: {
            color: [
              '#f87171', '#fb923c', '#fb923c', '#f59e0b', '#facc15',
              '#eab308', '#84cc16', '#22c55e', '#16a34a', '#15803d',
            ][index % 10],
            borderRadius: 0,
          },
        })),
        barWidth: '58%',
        emphasis: {
          focus: 'series',
        },
      },
    ],
    animationDuration: 450,
  }), [distribution]);

  return (
    <StatisticsSectionCard title="Phân bố điểm">
      {!distribution.length ? (
        <p className="text-sm text-slate-500">Chưa có dữ liệu phân bố điểm.</p>
      ) : (
        <div className="space-y-4">
          <div className="h-[320px]">
            <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} notMerge />
          </div>
          <p className="text-xs text-slate-400">
            Di chuột vào từng cột để xem số bài và tỷ lệ theo từng khoảng điểm.
          </p>
        </div>
      )}
    </StatisticsSectionCard>
  );
}
