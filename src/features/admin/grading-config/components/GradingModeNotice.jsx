import React from 'react';

const GradingModeNotice = () => {
  return (
    <div className="bg-[#EFF6FF] border border-blue-100 rounded-lg p-5 flex gap-4">
      <span className="material-symbols-outlined text-blue-600 mt-0.5">lightbulb</span>
      <div className="flex-1">
        <p className="text-sm font-bold text-blue-900 mb-1">Lưu ý về thay đổi cấu hình</p>
        <p className="text-sm text-blue-800 leading-relaxed">
          Việc thay đổi chế độ chấm điểm mặc định sẽ chỉ ảnh hưởng đến các bài làm được nộp
          sau thời điểm thay đổi. Các bài làm cũ vẫn giữ nguyên kết quả chấm theo cấu hình cũ.
        </p>
      </div>
    </div>
  );
};

export default GradingModeNotice;
