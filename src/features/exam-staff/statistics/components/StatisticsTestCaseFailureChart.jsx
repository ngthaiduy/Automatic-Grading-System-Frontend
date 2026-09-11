import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import StatisticsSectionCard from './StatisticsSectionCard.jsx';
import { formatPercent, toNumber } from '../utils/statisticsHelpers';

/**
 * Biểu đồ kết hợp cột chồng (Stacked Bar) và đường (Line) hiển thị Thống kê Test Case
 * - Cột chồng (Stacked Bar): Lượt đạt (Emerald) và Lượt lỗi (Rose), tổng chiều cao là tổng lượt chạy
 * - Đường (Line): Tỷ lệ thành công (%) (Cyan/Blue)
 */
export default function StatisticsTestCaseFailureChart({ items }) {
  const chartOption = useMemo(() => {
    // Sắp xếp các test case theo tỷ lệ thành công giảm dần (từ dễ nhất đến khó nhất)
    const sorted = [...(items ?? [])].map((tc) => {
      const sampleSize = toNumber(tc.sampleSize);
      const failureCount = toNumber(tc.failureCount);
      const failureRate = toNumber(tc.failureRate);
      const successCount = Math.max(0, sampleSize - failureCount);
      const successRate = Math.max(0, 100 - failureRate);

      return {
        ...tc,
        successCount,
        successRate,
      };
    }).sort((a, b) => b.successRate - a.successRate);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          crossStyle: {
            color: '#94a3b8',
          },
        },
        backgroundColor: 'rgba(15, 23, 42, 0.94)',
        borderWidth: 0,
        textStyle: {
          color: '#f8fafc',
          fontFamily: 'Inter, sans-serif',
        },
        formatter: (params) => {
          if (!params || params.length === 0) return '';
          const data = params[0].data;
          return `
            <div style="font-weight:700;margin-bottom:6px;font-size:13px;">${data.name}</div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;font-size:12px;margin-bottom:3px;">
              <span style="color:#10b981;display:flex;align-items:center;gap:4px;">● Lượt đạt:</span>
              <span style="font-weight:700;color:#10b981;">${data.successCount.toLocaleString('vi-VN')}</span>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;font-size:12px;margin-bottom:3px;">
              <span style="color:#f43f5e;display:flex;align-items:center;gap:4px;">● Lượt lỗi:</span>
              <span style="font-weight:700;color:#f43f5e;">${data.failureCount.toLocaleString('vi-VN')}</span>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;font-size:12px;margin-bottom:6px;border-bottom:1px solid #334155;padding-bottom:4px;">
              <span style="color:#94a3b8;">Tổng số lượt chạy:</span>
              <span style="font-weight:700;color:#f8fafc;">${data.sampleSize.toLocaleString('vi-VN')}</span>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;font-size:12px;margin-bottom:2px;">
              <span style="color:#06b6d4;font-weight:600;">Tỷ lệ thành công:</span>
              <span style="font-weight:800;color:#06b6d4;font-size:13px;">${formatPercent(data.successRate)}</span>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;font-size:12px;">
              <span style="color:#f97316;">Tỷ lệ lỗi:</span>
              <span style="font-weight:700;color:#f97316;">${formatPercent(data.failureRate)}</span>
            </div>
          `;
        },
      },
      legend: {
        data: ['Lượt đạt', 'Lượt lỗi', 'Tỷ lệ thành công (%)'],
        textStyle: {
          color: '#64748b',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 600,
        },
        bottom: 0,
      },
      grid: {
        left: 48,
        right: 48,
        top: 36,
        bottom: 48,
        containLabel: true,
      },
      xAxis: [
        {
          type: 'category',
          data: sorted.map((tc) => tc.name),
          axisPointer: {
            type: 'shadow',
          },
          axisLabel: {
            color: '#475569',
            fontSize: 11,
            fontWeight: 600,
            interval: 0,
            rotate: sorted.length > 5 ? 20 : 0,
          },
          axisLine: {
            lineStyle: {
              color: '#cbd5e1',
            },
          },
          axisTick: { show: false },
        },
      ],
      yAxis: [
        {
          type: 'value',
          name: 'Số lượt chạy',
          minInterval: 1,
          nameTextStyle: {
            color: '#64748b',
            fontWeight: 600,
            fontSize: 11,
          },
          axisLabel: {
            color: '#94a3b8',
          },
          splitLine: {
            lineStyle: {
              color: '#f1f5f9',
            },
          },
        },
        {
          type: 'value',
          name: 'Tỷ lệ (%)',
          min: 0,
          max: 100,
          interval: 20,
          nameTextStyle: {
            color: '#64748b',
            fontWeight: 600,
            fontSize: 11,
          },
          axisLabel: {
            formatter: '{value}%',
            color: '#94a3b8',
          },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: 'Lượt đạt',
          type: 'bar',
          stack: 'testcase',
          barWidth: 24,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#10b981' }, // emerald-500
                { offset: 1, color: '#a7f3d0' }, // emerald-200
              ],
            },
          },
          data: sorted.map((tc) => ({
            value: tc.successCount,
            name: tc.name,
            successCount: tc.successCount,
            failureCount: tc.failureCount,
            successRate: tc.successRate,
            failureRate: tc.failureRate,
            sampleSize: tc.sampleSize,
          })),
        },
        {
          name: 'Lượt lỗi',
          type: 'bar',
          stack: 'testcase',
          barWidth: 24,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#f43f5e' }, // rose-500
                { offset: 1, color: '#fecdd3' }, // rose-200
              ],
            },
          },
          data: sorted.map((tc) => ({
            value: tc.failureCount,
            name: tc.name,
            successCount: tc.successCount,
            failureCount: tc.failureCount,
            successRate: tc.successRate,
            failureRate: tc.failureRate,
            sampleSize: tc.sampleSize,
          })),
        },
        {
          name: 'Tỷ lệ thành công (%)',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          showSymbol: true,
          symbolSize: 8,
          lineStyle: {
            color: '#06b6d4', // cyan-500
            width: 3.5,
            shadowColor: 'rgba(6, 182, 212, 0.4)',
            shadowBlur: 8,
          },
          itemStyle: {
            color: '#0891b2',
          },
          data: sorted.map((tc) => ({
            value: tc.successRate,
            name: tc.name,
            successCount: tc.successCount,
            failureCount: tc.failureCount,
            successRate: tc.successRate,
            failureRate: tc.failureRate,
            sampleSize: tc.sampleSize,
          })),
        },
      ],
    };
  }, [items]);

  return (
    <StatisticsSectionCard title="Phân tích Tổng quan Đạt/Lỗi & Tỷ lệ Thành công Test Case" className="h-full">
      {!items || !items.length ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-300 gap-2">
          <span className="material-symbols-outlined text-4xl">analytics</span>
          <p className="text-sm text-slate-400">Không có dữ liệu Test Case để hiển thị.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="h-[320px]">
            <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} notMerge />
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-slate-400 mt-2">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded" />
              Lượt đạt (Pass)
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 bg-rose-500 rounded" />
              Lượt lỗi (Fail)
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-0.5 bg-cyan-500" />
              Tỷ lệ thành công (%)
            </span>
            <span className="ml-auto italic">
              * Được sắp xếp tự động từ Test Case dễ nhất (tỷ lệ thành công cao nhất) đến khó nhất.
            </span>
          </div>
        </div>
      )}
    </StatisticsSectionCard>
  );
}
