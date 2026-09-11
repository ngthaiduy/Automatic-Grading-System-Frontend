import React from 'react';
import LecturerAppealStatusBadge from './LecturerAppealStatusBadge';
import {
  formatAppealDate,
  getLecturerAppealActionLabel,
  getOverdueLabel,
} from '../helpers/appealHelpers';

function TableSkeletonRows() {
  return Array.from({ length: 5 }).map((_, index) => (
    <tr key={index} className="border-b border-slate-100">
      {Array.from({ length: 9 }).map((__, cellIndex) => (
        <td key={cellIndex} className="px-4 py-4">
          <div className="h-4 rounded bg-slate-100 animate-pulse" />
        </td>
      ))}
    </tr>
  ));
}

export default function LecturerAppealTable({
  rows,
  loading,
  page,
  size,
  totalElements,
  onOpenAppeal,
  onPageChange,
}) {
  const currentPage = page + 1;
  const totalPages = Math.max(1, Math.ceil((totalElements || 0) / size));
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900">
            Danh sách đơn phúc khảo
          </h2>
        </div>

        <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
          Tổng <span className="font-bold text-slate-900">{totalElements ?? 0}</span> đơn
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 font-semibold">Exam Name</th>
                <th className="px-4 py-3 font-semibold">Block</th>
                <th className="px-4 py-3 font-semibold">Semester</th>
                <th className="px-4 py-3 font-semibold">Reason</th>
                <th className="px-4 py-3 font-semibold">Assigned Date</th>
                <th className="px-4 py-3 font-semibold">Deadline</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <TableSkeletonRows />
              ) : rows?.length ? (
                rows.map((row, index) => (
                  <tr
                    key={row.appealId}
                    className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-4 py-4 text-sm font-medium text-slate-400">
                      {(page * size) + index + 1}
                    </td>

                    <td className="px-4 py-4 align-top">
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {row.studentName || '—'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {row.studentMssv || '—'}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-700">
                      {row.examName || '—'}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-700">
                      {row.blockName || '—'}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-700">
                      {row.semester || '—'}
                    </td>

                    <td className="px-4 py-4">
                      <p
                        className="max-w-[220px] truncate text-xs text-slate-500"
                        title={row.reason || ''}
                      >
                        {row.reason || '—'}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600">
                      {formatAppealDate(row.assignedAt || row.createdAt)}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-600">
                          {formatAppealDate(row.deadlineAt)}
                        </span>
                        {row.isOverdue ? (
                          <span className="text-[10px] font-bold uppercase text-red-600">
                            {getOverdueLabel(true)}
                          </span>
                        ) : null}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <LecturerAppealStatusBadge status={row.status} />
                    </td>

                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => onOpenAppeal(row.appealId, row.status)}
                        className="rounded-lg bg-[#F37021] px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-[#de611d]"
                      >
                        {getLecturerAppealActionLabel(row.status)}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    Không tìm thấy đơn phúc khảo phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Trang <span className="font-semibold text-slate-900">{currentPage}</span> / {totalPages}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!canGoPrev}
              onClick={() => onPageChange(page - 1)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#F37021] hover:text-[#F37021] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              Trước
            </button>

            <button
              type="button"
              disabled={!canGoNext}
              onClick={() => onPageChange(page + 1)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#F37021] hover:text-[#F37021] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sau
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}