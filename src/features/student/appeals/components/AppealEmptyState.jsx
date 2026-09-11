import React from 'react';
import { Link } from 'react-router-dom';

export default function AppealEmptyState({ hasFilter }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
        <span className="material-symbols-outlined text-[36px]">gavel</span>
      </div>

      <h2 className="mt-5 text-xl font-black text-slate-800">
        {hasFilter ? 'Không tìm thấy yêu cầu phù hợp' : 'Bạn chưa có đơn phúc khảo nào'}
      </h2>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
        {hasFilter
          ? 'Thử đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái để xem các yêu cầu khác.'
          : 'Khi cần phúc khảo, bạn hãy mở chi tiết bài nộp đã được chấm điểm rồi tạo yêu cầu mới từ đó.'}
      </p>

      {!hasFilter && (
        <Link
          to="/student/results"
          className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#F37021] px-5 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition-colors hover:bg-orange-500"
        >
          <span className="material-symbols-outlined text-[18px]">bar_chart</span>
          Chọn bài cần phúc khảo
        </Link>
      )}
    </div>
  );
}
