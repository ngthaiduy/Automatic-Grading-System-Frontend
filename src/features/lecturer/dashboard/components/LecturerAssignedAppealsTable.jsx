import React from 'react';
import { formatDateTime } from '../../../../components/utils/Utils';
import LecturerAppealStatusBadge from '../../appeals/components/LecturerAppealStatusBadge';
import { getLecturerAppealActionLabel } from '../../appeals/helpers/appealHelpers';

function TableSkeletonRow() {
  return (
    <tr className="border-b border-slate-100">
      {Array.from({ length: 6 }).map((_, index) => (
        <td key={index} className="px-4 py-4">
          <div className="h-4 animate-pulse rounded bg-slate-100" />
        </td>
      ))}
    </tr>
  );
}

export default function LecturerAssignedAppealsTable({
  items,
  loading,
  onOpenAppeal,
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-base font-black text-slate-900">
            Đơn phúc khảo được giao
          </h2>
          <p className="text-sm text-slate-500">
            Danh sách đơn gần đây cần giảng viên theo dõi.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Sinh viên</th>
              <th className="px-4 py-3 font-semibold">Kỳ thi</th>
              <th className="px-4 py-3 font-semibold">Ngày giao</th>
              <th className="px-4 py-3 font-semibold">Deadline</th>
              <th className="px-4 py-3 font-semibold">Trạng thái</th>
              <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <TableSkeletonRow key={index} />
              ))
            ) : items?.length ? (
              items.map((item) => (
                <tr
                  key={item.appealId}
                  className="border-b border-slate-100 transition-colors hover:bg-slate-50/70 last:border-b-0"
                >
                  <td className="px-4 py-4 align-top">
                    <p className="text-sm font-semibold text-slate-900">
                      {item.studentName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.studentMssv || '—'}
                    </p>
                  </td>

                  <td className="px-4 py-4 align-top">
                    <p className="text-sm font-medium text-slate-900">
                      {item.examName || '—'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.blockName || '—'}
                    </p>
                  </td>

                  <td className="px-4 py-4 align-top text-sm text-slate-600">
                    {formatDateTime(item.assignedDate)}
                  </td>

                  <td className="px-4 py-4 align-top text-sm text-slate-600">
                    {formatDateTime(item.deadline)}
                  </td>

                  <td className="px-4 py-4 align-top">
                    <LecturerAppealStatusBadge status={item.status} />
                  </td>

                  <td className="px-4 py-4 align-top text-right">
                    <button
                      type="button"
                      onClick={() => onOpenAppeal(item.appealId, item.status)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-[#F37021] hover:text-[#F37021]"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        open_in_new
                      </span>
                      {getLecturerAppealActionLabel(item.status)}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-slate-500"
                >
                  Hiện chưa có đơn nào được giao cho bạn.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
