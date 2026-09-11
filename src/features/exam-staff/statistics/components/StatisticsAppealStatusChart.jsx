import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import StatisticsSectionCard from './StatisticsSectionCard.jsx';

export default function StatisticsAppealStatusChart({ items }) {
  const total = items.reduce((sum, item) => sum + Number(item?.count || 0), 0);

  const chartOption = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15, 23, 42, 0.94)',
      borderWidth: 0,
      textStyle: {
        color: '#f8fafc',
        fontFamily: 'Inter, sans-serif',
      },
      formatter: ({ data }) => {
        if (!data) return '';
        const percent = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0.0';
        return [
          `<div style="font-weight:700;margin-bottom:4px;">${data.name}</div>`,
          `<div>Số đơn: <b>${data.value.toLocaleString('vi-VN')}</b></div>`,
          `<div>Tỷ lệ: <b>${percent}%</b></div>`,
        ].join('');
      },
    },
    legend: {
      bottom: 0,
      icon: 'roundRect',
      textStyle: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: 600,
      },
    },
    series: [
      {
        type: 'pie',
        radius: ['48%', '72%'],
        center: ['50%', '44%'],
        label: { show: false },
        labelLine: { show: false },
        itemStyle: { borderRadius: 0, borderColor: '#fff', borderWidth: 3 },
        data: [
          { value: items[0]?.count ?? 0, name: items[0]?.label ?? 'Pending', itemStyle: { color: '#f59e0b' } },
          { value: items[1]?.count ?? 0, name: items[1]?.label ?? 'Processing', itemStyle: { color: '#3b82f6' } },
          { value: items[2]?.count ?? 0, name: items[2]?.label ?? 'Approved', itemStyle: { color: '#22c55e' } },
          { value: items[3]?.count ?? 0, name: items[3]?.label ?? 'Denied', itemStyle: { color: '#f43f5e' } },
        ],
      },
    ],
    animationDuration: 450,
  }), [items, total]);

  return (
    <StatisticsSectionCard title="Trạng thái phúc khảo">
      {!total ? (
        <p className="text-sm text-slate-500">Chưa có dữ liệu phúc khảo.</p>
      ) : (
        <div className="space-y-4">
          <div className="h-[300px]">
            <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} notMerge />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <div key={item.key} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{item.label}</p>
                <p className="text-xl font-black text-slate-900 mt-1">{item.count.toLocaleString('vi-VN')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </StatisticsSectionCard>
  );
}