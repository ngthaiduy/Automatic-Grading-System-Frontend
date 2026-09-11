import React from 'react';

const currencyFormatter = new Intl.NumberFormat('vi-VN');

function TransactionMetricCard({ label, value, meta, metaVariant, progress }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-all hover:shadow-md hover:scale-[1.01]">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <div className="flex items-end justify-between gap-3">
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>

        {typeof progress === 'number' ? (
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[#F37021]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-500">{progress}%</span>
          </div>
        ) : meta ? (
          <span
            className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold ${
              metaVariant === 'positive'
                ? 'bg-green-500/10 text-green-600'
                : metaVariant === 'negative'
                ? 'bg-red-500/10 text-red-600'
                : 'text-slate-400'
            }`}
          >
            {meta}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function TransactionStatusBadge({ status }) {
  const statusConfig = {
    SUCCESS:   { label: 'Thành công', clazz: 'bg-green-100 text-green-700 border border-green-200' },
    PENDING:   { label: 'Đang xử lý', clazz: 'bg-amber-100 text-amber-700 border border-amber-200' },
    FAILED:    { label: 'Thất bại',   clazz: 'bg-red-100 text-red-700 border border-red-200' },
    CANCELLED: { label: 'Đã hủy',    clazz: 'bg-red-100 text-red-700 border border-red-200' },
    REFUNDED:  { label: 'Hoàn tiền', clazz: 'bg-slate-100 text-slate-700 border border-slate-200' },
  };

  const config = statusConfig[status] ?? { label: status, clazz: 'bg-slate-100 text-slate-700 border border-slate-200' };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${config.clazz}`}>
      {config.label}
    </span>
  );
}

function TransactionPurposeBadge({ purpose }) {
  const purposeConfig = {
    WALLET_DEPOSIT: { label: 'Nạp ví',    clazz: 'bg-purple-50 text-purple-700 border border-purple-200' },
    APPEAL:         { label: 'Phúc khảo', clazz: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
  };

  const config = purposeConfig[purpose] ?? { label: 'Khác', clazz: 'bg-slate-50 text-slate-700 border border-slate-200' };

  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-semibold ${config.clazz}`}>
      {config.label}
    </span>
  );
}

export default function TransactionStatisticsSection({
  stats,
  transactions,
  loading = false,
  searchQuery,
  onSearchChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onExport,
  pagination = { totalElements: 0, totalPages: 0, first: true, last: true },
  currentPage = 0,
  onPageChange,
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#F37021]">monitoring</span>
          <h2 className="text-lg font-bold text-slate-900">Thống kê &amp; Lịch sử giao dịch</h2>
        </div>

        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-200 transition hover:bg-[#F37021] hover:text-white hover:border-[#F37021] active:scale-95"
        >
          <span className="material-symbols-outlined text-[16px]">download</span>
          <span>Xuất dữ liệu Excel</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <TransactionMetricCard
            key={item.key}
            label={item.label}
            value={item.value}
            meta={item.meta}
            metaVariant={item.metaVariant}
            progress={item.progress}
          />
        ))}
      </div>

      <div className="border-t border-slate-100 pt-6">
        {/* Filters */}
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <h3 className="text-sm font-bold text-slate-900">Chi tiết lịch sử dòng tiền</h3>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5">
              <span className="material-symbols-outlined text-[16px] text-slate-400">calendar_month</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="bg-transparent text-xs text-slate-700 outline-none cursor-pointer"
                title="Từ ngày"
              />
              <span className="text-[10px] font-bold text-slate-400 uppercase">đến</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="bg-transparent text-xs text-slate-700 outline-none cursor-pointer"
                title="Đến ngày"
              />
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => { onStartDateChange(''); onEndDateChange(''); }}
                  className="flex items-center justify-center p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                  title="Xóa bộ lọc ngày"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </div>

            {/* Search */}
            <div className="relative min-w-[200px]">
              <input
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs outline-none transition focus:border-[#F37021] focus:ring-1 focus:ring-[#F37021]/30"
                type="text"
                placeholder="Tìm Tên, MSSV, Mã đơn..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-slate-400">search</span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full min-w-[800px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Sinh viên</th>
                <th className="py-3 px-4">Mã đơn PayOS</th>
                <th className="py-3 px-4">Loại giao dịch</th>
                <th className="py-3 px-4 text-right">Số tiền</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thời gian</th>
              </tr>
            </thead>

            <tbody className="text-xs">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="py-3.5 px-4">
                        <div
                          className="h-3 rounded bg-slate-100 animate-pulse"
                          style={{ width: `${60 + (j * 7) % 30}%` }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <span className="material-symbols-outlined text-3xl block mb-1">inbox</span>
                    Không tìm thấy giao dịch nào phù hợp
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => {
                  const dateStr = transaction.createdAt
                    ? new Date(transaction.createdAt).toLocaleString('vi-VN', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })
                    : 'N/A';

                  return (
                    <tr
                      key={transaction.paymentId}
                      className="border-b border-slate-50 transition hover:bg-slate-50/50 last:border-b-0"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          {transaction.studentName || 'N/A'}
                          {transaction.studentMssv && (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1 rounded">
                              {transaction.studentMssv}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">{transaction.studentEmail || 'N/A'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                        {transaction.payosOrderId || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        <TransactionPurposeBadge purpose={transaction.paymentPurpose} />
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 text-sm">
                        {currencyFormatter.format(transaction.amount)}đ
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <TransactionStatusBadge status={transaction.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right text-[11px] text-slate-500 font-medium">
                        {dateStr}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-xs font-semibold text-slate-500">
            Trang {currentPage + 1} / {pagination.totalPages || 1}
            &nbsp;·&nbsp;
            Tổng <span className="text-slate-800">{pagination.totalElements ?? transactions.length}</span> giao dịch
          </p>

          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              {/* Prev */}
              <button
                type="button"
                disabled={pagination.first}
                onClick={() => onPageChange(currentPage - 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                Trước
              </button>

              {/* Page numbers (window of 5 around current) */}
              {Array.from({ length: pagination.totalPages }, (_, i) => i)
                .filter((p) => Math.abs(p - currentPage) <= 2)
                .map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onPageChange(p)}
                    className={`h-7 w-7 rounded-lg text-xs font-semibold transition ${
                      p === currentPage
                        ? 'bg-[#F37021] text-white border border-[#F37021]'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {p + 1}
                  </button>
                ))}

              {/* Next */}
              <button
                type="button"
                disabled={pagination.last}
                onClick={() => onPageChange(currentPage + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
              >
                Sau
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}