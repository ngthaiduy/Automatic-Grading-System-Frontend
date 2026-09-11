import React from 'react';
import {
  PAGE_SIZE_OPTIONS,
  STAT_CARDS,
  STATUS_OPTIONS,
  canOpenSubmissionDetail,
  fmtDateTime,
  fmtSize,
  getResultBadge,
  getSubmissionStatusBadge,
} from './blockSubmissions.helpers.js';

export const PageBackdrop = React.memo(function PageBackdrop() {
  return (
    <>
      <div className="pointer-events-none absolute -z-10 top-10 -left-14 w-56 h-56 rounded-full bg-orange-100/55 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -z-10 top-1/4 -right-12 w-56 h-56 rounded-full bg-amber-100/40 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -z-10 bottom-10 left-1/3 w-48 h-48 rounded-full bg-amber-100/30 blur-3xl" aria-hidden="true" />
    </>
  );
});

export const BackSection = React.memo(function BackSection({ onBack }) {
  return (
    <div className="flex items-center gap-4 relative z-10 mb-8">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-slate-900/5 backdrop-blur-md border border-slate-900/10 text-slate-600 hover:text-slate-900 hover:bg-slate-900/10 hover:border-slate-900/20 transition-all shadow-sm hover:shadow active:scale-95 group font-medium"
      >
        <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-0.5 transition-transform">
          arrow_back
        </span>
      </button>
      <span className="text-[13px] font-bold text-slate-500 tracking-[0.1em] uppercase">
        Quay lại Block Details
      </span>
    </div>
  );
});

export const HeaderSection = React.memo(function HeaderSection({
  loading,
  total,
  examName,
  blockName,
  onExportCsv,
  onExportGradeSheet,
  onRefresh,
  exporting,
}) {
  const isAnyExporting = Object.values(exporting || {}).some(Boolean);

  return (
    <div className="relative z-10 p-1 flex flex-col xl:flex-row items-center justify-between gap-6 overflow-visible mb-6">
      <div className="relative w-full xl:w-auto text-center xl:text-left">
        <div className="inline-flex items-center justify-center xl:justify-start gap-2 px-3 py-1.5 rounded-full bg-orange-50 shadow-sm border border-orange-100 text-[#F37021] text-xs font-bold uppercase tracking-widest mb-4 mx-auto xl:mx-0">
          <span className="relative flex h-2.5 w-2.5 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500"></span>
          </span>
          <span>Management Module</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 mb-3 drop-shadow-sm flex items-center justify-center xl:justify-start gap-3">
          Quản lý bài nộp
          {!loading && (
            <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-2xl bg-slate-900 text-white text-xl font-bold shadow-lg shadow-slate-900/20 translate-y-[-2px]">
              {total}
            </span>
          )}
        </h1>

        <p className="text-sm font-semibold text-slate-500 flex items-center justify-center xl:justify-start gap-2.5">
          <span className="material-symbols-outlined text-[18px]">folder_copy</span>
          <span className="text-slate-700">{examName || '—'}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
          <span className="text-slate-700">{blockName || '—'}</span>
        </p>
      </div>

      <div className="flex sm:flex-row flex-col items-center gap-3 relative z-10 w-full xl:w-auto">
        <button
          type="button"
          onClick={onExportCsv}
          disabled={isAnyExporting}
          className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 bg-white rounded-2xl text-sm font-bold text-slate-600 shadow-sm border border-slate-200 hover:text-[#F37021] hover:border-orange-200 hover:bg-orange-50 hover:shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
        >
          <span className="material-symbols-outlined text-[20px] text-emerald-600">download</span>
          Xuất file Excel
        </button>

        <button
          type="button"
          onClick={onExportGradeSheet}
          disabled={isAnyExporting}
          className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 bg-white rounded-2xl text-sm font-bold text-slate-600 shadow-sm border border-slate-200 hover:text-[#F37021] hover:border-orange-200 hover:bg-orange-50 hover:shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
        >
          <span className="material-symbols-outlined text-[20px] text-violet-600">table_view</span>
          {exporting.gradeSheet ? 'Đang xuất bảng điểm...' : 'Xuất bảng điểm'}
        </button>

        <button
          type="button"
          onClick={onRefresh}
          className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 bg-white rounded-2xl text-sm font-bold text-slate-600 shadow-sm border border-slate-200 hover:text-[#F37021] hover:border-orange-200 hover:bg-orange-50 hover:shadow-md transition-all hover:-translate-y-0.5 group"
          title="Làm mới"
        >
          <span className="material-symbols-outlined text-[20px] text-blue-600 group-hover:rotate-180 transition-transform duration-700">
            refresh
          </span>
          Làm mới bộ nhớ
        </button>
      </div>
    </div>
  );
});

export const StatsGrid = React.memo(function StatsGrid({ stats }) {
  return (
    <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
      {STAT_CARDS.map((card) => (
        <div
          key={card.key}
          className="group relative overflow-hidden bg-white p-6 rounded-3xl shadow-lg shadow-slate-200/30 border border-slate-100 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-100 transition-all duration-500 min-h-[140px] isolate flex flex-col justify-between hover:-translate-y-1"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${card.bg} opacity-30 group-hover:opacity-50 transition-opacity duration-500 rounded-3xl`} />
          <div className={`absolute -right-8 -bottom-8 w-40 h-40 rounded-full ${card.blob} blur-3xl opacity-40 group-hover:scale-150 transition-transform duration-700 ease-out z-[-1]`} />

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-14 h-14 rounded-2xl ${card.iconBg} flex items-center justify-center shadow-inner border border-white/50 backdrop-blur-md`}>
                <span className="material-symbols-outlined text-[28px]">{card.icon}</span>
              </div>
              <div className="text-right">
                <h3 className="text-5xl font-black text-slate-900 tracking-tighter drop-shadow-sm">
                  {stats?.[card.key] ?? 0}
                </h3>
              </div>
            </div>
            <p className="text-slate-500 text-sm font-bold tracking-wide uppercase">{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
});

export const FilterBar = React.memo(function FilterBar({
  searchInput,
  onSearchInput,
  statusFilter,
  onStatusChange,
  size,
  onSizeChange,
  isGradingInProgress,
  isTriggering,
  loading,
  selectedCount,
  progressDoneDisplay,
  progressTotalDisplay,
  onTriggerGrading,
  onStopGrading,
  isStopping,
}) {
  return (
    <div className="relative z-10 bg-white p-3 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col md:flex-row gap-3">
      <div className="flex-1 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            value={searchInput}
            onChange={(e) => onSearchInput(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 hover:bg-white focus:bg-white rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all shadow-sm"
            placeholder="Nhập tên hoặc mã số sinh viên..."
            type="text"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="h-12 pl-4 pr-10 bg-slate-50 border border-slate-200 hover:bg-white focus:bg-white rounded-2xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all cursor-pointer min-w-[170px] shadow-sm"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={size}
            onChange={(e) => onSizeChange(e.target.value)}
            className="h-12 pl-4 pr-10 bg-slate-50 border border-slate-200 hover:bg-white focus:bg-white rounded-2xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all cursor-pointer min-w-[140px] shadow-sm"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} dòng / trang
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="shrink-0">
        {!isGradingInProgress ? (
          <button
            type="button"
            onClick={onTriggerGrading}
            disabled={isTriggering || loading}
            className="w-full h-12 inline-flex items-center justify-center gap-2 px-6 bg-gradient-to-r from-[#F37021] to-orange-500 hover:from-orange-600 hover:to-orange-600 text-white rounded-2xl text-sm font-extrabold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span className="material-symbols-outlined text-[20px]">play_circle</span>
            <span>
              {isTriggering
                ? 'Đang gửi...'
                : selectedCount > 0
                  ? `Chấm ${selectedCount} bài chọn`
                  : 'Chấm tất cả'}
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-3 h-12">
            <span className="flex items-center gap-2 px-4 h-full bg-amber-50 text-amber-700 border border-amber-200 rounded-2xl text-sm font-bold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              {progressDoneDisplay} / {progressTotalDisplay}
            </span>
            <button
              type="button"
              onClick={onStopGrading}
              disabled={isStopping}
              className="h-12 inline-flex items-center justify-center gap-2 px-6 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-2xl text-sm font-extrabold shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              <span className="material-symbols-outlined text-[20px]">stop_circle</span>
              <span>{isStopping ? 'Đang dừng...' : 'Dừng chấm'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export const LoadingState = React.memo(function LoadingState() {
  return (
    <div className="relative z-10 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 p-16 text-center text-slate-500 flex flex-col items-center justify-center min-h-[400px]">
      <div className="relative w-12 h-12 mb-4">
        <div className="absolute inset-0 rounded-full border-4 border-slate-100 mix-blend-multiply" />
        <div className="absolute inset-0 rounded-full border-4 border-[#F37120] border-t-transparent animate-spin" />
      </div>
      <p className="font-bold text-slate-700 text-lg mb-1">Đang tải dữ liệu...</p>
      <p className="text-sm">Vui lòng chờ trong giây lát</p>
    </div>
  );
});

export const ErrorState = React.memo(function ErrorState({ error }) {
  return (
    <div className="relative z-10 bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 flex items-start gap-3 shadow-sm">
      <span className="material-symbols-outlined text-red-500 mt-0.5">error</span>
      <div>
        <h4 className="font-bold">Đã xảy ra lỗi</h4>
        <p className="text-sm mt-1">{error}</p>
      </div>
    </div>
  );
});

const TableSectionHeader = React.memo(function TableSectionHeader({ pagination }) {
  return (
    <div className="px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between bg-white rounded-t-[32px]">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center text-[#F37120] shadow-sm ring-1 ring-orange-200/50">
          <span className="material-symbols-outlined text-[24px]">view_list</span>
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Danh sách bài nộp</h3>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            {pagination.totalElements > 0
              ? `Trang ${pagination.page + 1} của ${pagination.totalPages} — Tổng ${pagination.totalElements} mục`
              : 'Không tìm thấy mục nào'}
          </p>
        </div>
      </div>
    </div>
  );
});

const SubmissionTableRow = React.memo(function SubmissionTableRow({
  item,
  rowNum,
  checked,
  selectable,
  disabled,
  onToggleSelect,
  onRegrade,
  onOpenDetail,
}) {
  const statusBadge = getSubmissionStatusBadge(item?.submissionStatus);
  const resultBadge = getResultBadge(item?.gradingStatus);
  const hasScore = item?.totalScore != null;
  const canOpen = canOpenSubmissionDetail(item);

  return (
    <tr className="group bg-white hover:bg-slate-50/70 transition-all duration-300 rounded-2xl shadow-sm ring-1 ring-slate-200/50 hover:ring-orange-200 hover:shadow-lg hover:-translate-y-[2px] cursor-default">
      <td className="px-4 py-4 text-center rounded-l-2xl transition-colors">
        <input
          type="checkbox"
          checked={checked}
          disabled={!selectable || disabled}
          onChange={(e) => onToggleSelect(item?.submissionId, e.target.checked)}
          className="w-4.5 h-4.5 rounded border-slate-300 text-[#F37120] focus:ring-[#F37120] transition-colors cursor-pointer disabled:opacity-40"
        />
      </td>

      <td className="px-3 py-4 text-center text-[13px] font-black text-slate-400 transition-colors group-hover:text-[#F37120]">
        {rowNum}
      </td>

      <td className="px-3 py-4 transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center shrink-0 border border-orange-100 shadow-inner">
            <span className="text-sm font-black text-[#F37120]">
              {String(item?.studentName || '—').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[15px] font-black text-slate-800 truncate" title={item?.studentName ?? '—'}>
              {item?.studentName ?? '—'}
            </span>
            {item?.studentEmail && (
              <span className="text-xs font-semibold text-slate-500 truncate mt-0.5" title={item.studentEmail}>
                {item.studentEmail}
              </span>
            )}
          </div>
        </div>
      </td>

      <td className="px-3 py-4 transition-colors">
        <span className="inline-flex px-2.5 py-1.5 rounded-lg bg-slate-100/80 text-xs font-mono font-bold text-slate-600 shadow-sm border border-slate-200/50">
          {item?.studentCode ?? 'N/A'}
        </span>
      </td>

      <td className="px-3 py-4 transition-colors">
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 truncate bg-slate-50 px-2 py-1 rounded">
            <span className="material-symbols-outlined text-[15px] text-[#F37120] shrink-0">schedule</span>
            <span className="truncate">{fmtDateTime(item?.submittedAt)}</span>
          </span>
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 truncate bg-slate-50 px-2 py-1 rounded">
            <span className="material-symbols-outlined text-[15px] text-emerald-500 shrink-0">description</span>
            <span className="truncate">{fmtSize(item?.fileSizeBytes)}</span>
          </span>
        </div>
      </td>

      <td className="px-3 py-4 text-center transition-colors">
        <span className={`inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs font-bold ${statusBadge.cls}`}>
          {statusBadge.label}
        </span>
      </td>

      <td className="px-3 py-4 text-center transition-colors">
        {hasScore ? (
          <div className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-black text-sm">
            <span>{Number(item.totalScore).toFixed(2)}</span>
            <span className="text-slate-400 font-bold">/</span>
            <span className="text-slate-500">{Number(item.maxScore || 10).toFixed(0)}</span>
          </div>
        ) : (
          <span className="text-slate-400 font-bold">—</span>
        )}
      </td>

      <td className="px-3 py-4 text-center transition-colors">
        {resultBadge ? (
          <span className={`inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs ${resultBadge.cls}`}>
            {resultBadge.label}
          </span>
        ) : (
          <span className="text-slate-400 font-bold">—</span>
        )}
      </td>

      <td className="px-4 py-4 transition-colors rounded-r-2xl">
        <div className="flex items-center justify-center gap-2 opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition-opacity duration-300">
          <button
            type="button"
            title="Chấm lại bài này"
            disabled={disabled}
            onClick={() => onRegrade(item)}
            className="flex items-center justify-center w-10 h-10 text-slate-400 hover:text-orange-600 hover:bg-orange-100 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-slate-50 shadow-sm border border-slate-200 hover:shadow-orange-200/50 hover:scale-105 active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">sync</span>
          </button>

          <button
            type="button"
            title={canOpen ? 'Xem chi tiết' : 'Bài này chưa có kết quả chấm'}
            disabled={!canOpen}
            onClick={() => onOpenDetail(item)}
            className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all bg-slate-50 shadow-sm border border-slate-200 ${canOpen ? 'text-slate-400 hover:text-[#F37120] hover:bg-orange-100 hover:shadow-orange-200/50 hover:scale-105 active:scale-95' : 'text-slate-300 cursor-not-allowed opacity-50'}`}
          >
            <span className="material-symbols-outlined text-[20px]">visibility</span>
          </button>
        </div>
      </td>
    </tr>
  );
});

const EmptyTableState = React.memo(function EmptyTableState() {
  return (
    <tr>
      <td colSpan={9} className="px-6 py-14 text-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
            <span className="material-symbols-outlined text-[28px]">inbox</span>
          </div>
          <div>
            <p className="text-base font-bold text-slate-700">Không có bài nộp phù hợp</p>
            <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc làm mới dữ liệu.</p>
          </div>
        </div>
      </td>
    </tr>
  );
});

const PaginationBar = React.memo(function PaginationBar({
  totalElements,
  pageNumbers,
  currentPage,
  onPageChange,
}) {
  if (!totalElements || pageNumbers.length === 0) return null;

  return (
    <div className="px-6 pb-6 pt-2 flex flex-wrap items-center justify-center gap-2 border-t border-slate-100 bg-white">
      {pageNumbers.map((item, idx) => (
        item === '...'
          ? (
              <span key={`ellipsis-${idx}`} className="px-3 py-2 text-sm font-bold text-slate-400">
                ...
              </span>
            )
          : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                className={`min-w-[42px] h-[42px] px-3 rounded-xl text-sm font-bold transition-all border ${item === currentPage ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300 hover:text-orange-600 hover:-translate-y-0.5'}`}
              >
                {item + 1}
              </button>
            )
      ))}
    </div>
  );
});

export const SubmissionsTableCard = React.memo(function SubmissionsTableCard({
  tableSectionRef,
  pagination,
  allVisibleSelected,
  visibleSelectableIds,
  isGradingInProgress,
  toggleSelectAllVisible,
  renderedRows,
  disabled,
  onToggleSelect,
  onRegrade,
  onOpenDetail,
  pageNumbers,
  currentPage,
  onPageChange,
}) {
  return (
    <div
      ref={tableSectionRef}
      className="relative z-10 bg-white rounded-[32px] shadow-xl shadow-slate-200/40 border border-slate-100 mt-8 overflow-hidden flex flex-col"
    >
      <TableSectionHeader pagination={pagination} />

      <div className="overflow-x-auto p-6 pt-2">
        <table className="w-full text-left border-separate border-spacing-y-3 min-w-[1080px]">
          <thead>
            <tr>
              <th className="sticky top-0 z-10 px-4 py-4 text-center w-[40px] sm:w-[50px] rounded-l-2xl">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  disabled={visibleSelectableIds.length === 0 || isGradingInProgress}
                  onChange={(e) => toggleSelectAllVisible(e.target.checked)}
                  className="w-4.5 h-4.5 rounded border-slate-300 text-[#F37120] focus:ring-[#F37120] cursor-pointer disabled:opacity-50"
                />
              </th>
              <th className="sticky top-0 z-10 px-2 py-4 text-[11px] sm:text-[12px] font-extrabold text-slate-400 uppercase tracking-widest text-center">STT</th>
              <th className="sticky top-0 z-10 px-2 py-4 text-[11px] sm:text-[12px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Sinh viên</th>
              <th className="sticky top-0 z-10 px-2 py-4 text-[11px] sm:text-[12px] font-extrabold text-slate-400 uppercase tracking-widest text-center">MSSV</th>
              <th className="sticky top-0 z-10 px-2 py-4 text-[11px] sm:text-[12px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Chi tiết file</th>
              <th className="sticky top-0 z-10 px-2 py-4 text-[11px] sm:text-[12px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Tiến trình</th>
              <th className="sticky top-0 z-10 px-2 py-4 text-[11px] sm:text-[12px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Chấm điểm</th>
              <th className="sticky top-0 z-10 px-2 py-4 text-[11px] sm:text-[12px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Đánh giá</th>
              <th className="sticky top-0 z-10 px-3 py-4 text-[11px] sm:text-[12px] font-extrabold text-slate-400 uppercase tracking-widest text-center rounded-r-2xl">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {renderedRows.length > 0 ? (
              renderedRows.map(({ item, rowNum, selectable, checked }) => (
                <SubmissionTableRow
                  key={item?.submissionId || rowNum}
                  item={item}
                  rowNum={rowNum}
                  checked={checked}
                  selectable={selectable}
                  disabled={disabled}
                  onToggleSelect={onToggleSelect}
                  onRegrade={onRegrade}
                  onOpenDetail={onOpenDetail}
                />
              ))
            ) : (
              <EmptyTableState />
            )}
          </tbody>
        </table>
      </div>

      <PaginationBar
        totalElements={pagination.totalElements}
        pageNumbers={pageNumbers}
        currentPage={currentPage}
        onPageChange={onPageChange}
      />
    </div>
  );
});

