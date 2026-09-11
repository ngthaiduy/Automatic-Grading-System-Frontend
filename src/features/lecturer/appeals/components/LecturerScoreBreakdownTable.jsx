import React from 'react';
import { formatScore } from '../../../../components/utils/Utils';

function ReadOnlyScoreTable({ rows, summaryRow, description }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-base font-black text-slate-900">Điểm theo câu</h2>
          {description ? (
            <p className="text-sm text-slate-500">{description}</p>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Câu hỏi</th>
              <th className="px-4 py-3 text-center font-semibold">Điểm cũ</th>
              <th className="px-4 py-3 text-center font-semibold">Điểm mới</th>
              <th className="px-4 py-3 text-right font-semibold">Thay đổi</th>
            </tr>
          </thead>

          <tbody>
            {rows?.length ? (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-100 transition-colors hover:bg-slate-50/70 last:border-b-0"
                  title={row.questionTitle || row.questionLabel}
                >
                  <td className="px-4 py-4 align-top">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {row.questionLabel}
                        {row.questionTitle ? `: ${row.questionTitle}` : ''}
                      </p>
                      {row.questionTitle ? null : row.questionKey ? (
                        <p className="mt-1 text-xs text-slate-400">{row.questionKey}</p>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center align-top text-sm text-slate-500">
                    {formatScore(row.originalScore)}
                  </td>
                  <td className="px-4 py-4 text-center align-top text-sm font-bold text-slate-900">
                    {formatScore(row.newScore)}
                  </td>
                  <td className="px-4 py-4 text-right align-top">
                    <span
                      className={`inline-flex rounded-md px-2 py-1 text-sm font-bold ${
                        row.isChanged
                          ? row.delta > 0
                            ? 'bg-emerald-50'
                            : 'bg-red-50'
                          : 'bg-transparent'
                      } ${row.deltaToneClassName}`}
                    >
                      {row.deltaLabel}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">
                  Chưa có dữ liệu breakdown theo câu.
                </td>
              </tr>
            )}
          </tbody>

          {summaryRow ? (
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50">
                <td className="px-4 py-4 text-sm font-black uppercase tracking-wide text-slate-900">
                  Tổng điểm cập nhật
                </td>
                <td className="px-4 py-4 text-center text-sm text-slate-500">
                  {formatScore(summaryRow.originalScore)}
                </td>
                <td className="px-4 py-4 text-center text-base font-black text-[#F37021]">
                  {formatScore(summaryRow.newScore)}
                </td>
                <td className="px-4 py-4 text-right text-sm font-black">
                  <span className={summaryRow.deltaToneClassName}>{summaryRow.deltaLabel}</span>
                </td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </section>
  );
}

export default function LecturerScoreBreakdownTable({
  rows,
  editable = false,
  onChange,
  onAddRow,
  onRemoveRow,
  summaryRow,
  description,
}) {
  if (!editable) {
    return (
      <ReadOnlyScoreTable
        rows={rows}
        summaryRow={summaryRow}
        description={description}
      />
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-base font-black text-slate-900">Điểm theo câu</h2>
          <p className="text-sm text-slate-500">
            Bạn có thể bổ sung breakdown theo từng câu khi backend chưa trả đầy đủ
            dữ liệu chi tiết.
          </p>
        </div>

        {editable && (
          <button
            type="button"
            onClick={onAddRow}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-[#F37021] hover:text-[#F37021]"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Thêm câu
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Mã câu</th>
              <th className="px-4 py-3 font-semibold">Điểm mới</th>
              {editable && (
                <th className="px-4 py-3 text-right font-semibold">Xóa</th>
              )}
            </tr>
          </thead>

          <tbody>
            {rows?.length ? (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-100 last:border-b-0"
                >
                  <td className="px-4 py-3 align-top">
                    {editable ? (
                      <input
                        type="text"
                        value={row.key}
                        onChange={(event) =>
                          onChange(row.id, 'key', event.target.value)
                        }
                        placeholder="Ví dụ: q1"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-[#F37021] focus:bg-white focus:ring-4 focus:ring-orange-100"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-slate-900">
                        {row.key}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 align-top">
                    {editable ? (
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.01"
                        value={row.score}
                        onChange={(event) =>
                          onChange(row.id, 'score', event.target.value)
                        }
                        placeholder="0.00"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-[#F37021] focus:bg-white focus:ring-4 focus:ring-orange-100"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-[#F37021]">
                        {formatScore(row.score)}
                      </span>
                    )}
                  </td>

                  {editable && (
                    <td className="px-4 py-3 text-right align-top">
                      <button
                        type="button"
                        onClick={() => onRemoveRow(row.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          delete
                        </span>
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={editable ? 3 : 2}
                  className="px-4 py-10 text-center text-sm text-slate-500"
                >
                  Chưa có dữ liệu breakdown theo câu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
