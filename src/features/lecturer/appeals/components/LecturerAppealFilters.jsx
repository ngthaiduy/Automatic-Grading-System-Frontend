import React from 'react';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'PROCESSING', label: 'Được phân công' },
  { value: 'COMPLETED', label: 'Đã hoàn thành' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'DENIED', label: 'Từ chối' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

export default function LecturerAppealFilters({
  keyword,
  onKeywordChange,
  status,
  onStatusChange,
  onReset,
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
          <label className="relative block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
              search
            </span>
            <input
              type="text"
              value={keyword}
              onChange={(event) => onKeywordChange(event.target.value)}
              placeholder="Tìm theo sinh viên, MSSV, mã đơn hoặc kỳ thi..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm outline-none transition focus:border-[#F37021] focus:bg-white focus:ring-4 focus:ring-orange-100"
            />
          </label>

          <select
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#F37021] focus:bg-white focus:ring-4 focus:ring-orange-100"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#F37021] hover:text-[#F37021]"
        >
          <span className="material-symbols-outlined text-[18px]">
            restart_alt
          </span>
          Xóa bộ lọc
        </button>
      </div>
    </section>
  );
}