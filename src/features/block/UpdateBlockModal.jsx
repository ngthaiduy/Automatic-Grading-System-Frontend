import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import blockApi from '../../services/blockApi';

function sanitizeUiErrorMessage(message) {
  if (!message || typeof message !== 'string') return 'Có lỗi xảy ra. Vui lòng thử lại.';
  return message.replace(/\s*\([^)]*\)\.?\s*$/, '').trim();
}

/**
 * Modal cập nhật lịch thi của một block.
 *
 * Props:
 *   block   — { blockId, examId, name, examDate, startTime, endTime }
 *   onClose — callback đóng modal
 *   onSuccess — callback sau khi lưu thành công
 */
export default function UpdateBlockModal({ block, onClose, onSuccess }) {
  const [examDate,  setExamDate]  = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime,   setEndTime]   = useState('');
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  // Điền dữ liệu block vào form
  useEffect(() => {
    if (!block) return;
    if (block.examDate) {
      setExamDate(block.examDate); // 'YYYY-MM-DD'
    }
    if (block.startTime) {
      const st = new Date(block.startTime);
      setStartTime(st.toLocaleTimeString('en-GB', {
        hour: '2-digit', minute: '2-digit',
        timeZone: 'Asia/Ho_Chi_Minh',
      }));
    }
    if (block.endTime) {
      const et = new Date(block.endTime);
      setEndTime(et.toLocaleTimeString('en-GB', {
        hour: '2-digit', minute: '2-digit',
        timeZone: 'Asia/Ho_Chi_Minh',
      }));
    }
  }, [block]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!examDate || !startTime || !endTime) {
      setError('Vui lòng nhập đầy đủ Ngày thi, Giờ bắt đầu và Giờ kết thúc');
      return;
    }

    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const startDateTime = new Date(`${examDate}T${startTime}:00+07:00`);

    if (examDate < todayStr) {
      setError('Ngày thi không được nhỏ hơn ngày hiện tại');
      return;
    }

    if (examDate === todayStr && startDateTime <= now) {
      setError('Nếu chọn ngày hôm nay, giờ bắt đầu phải lớn hơn thời điểm hiện tại');
      return;
    }

    // Giờ kết thúc phải lớn hơn giờ bắt đầu
    if (endTime <= startTime) {
      setError('Giờ kết thúc phải lớn hơn giờ bắt đầu');
      return;
    }
    if (!block?.blockId || !block?.examId) {
      setError('Không xác định được block này. Vui lòng tải lại trang và thử lại.');
      return;
    }

    try {
      // Gửi đúng offset +07:00 (múi giờ Việt Nam)
      const startIso = `${examDate}T${startTime}:00+07:00`;
      const endIso   = `${examDate}T${endTime}:00+07:00`;

      setSaving(true);
      setError('');
      await blockApi.update(block.examId, block.blockId, {
        examDate,
        startTime: startIso,
        endTime: endIso,
      });
      onSuccess();
    } catch (err) {
      const rawMessage = err?.response?.data?.message
        || 'Cập nhật thất bại. Vui lòng kiểm tra lại thời gian.';
      setError(sanitizeUiErrorMessage(rawMessage));
    } finally {
      setSaving(false);
    }
  };

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200
                      shadow-[0_20px_50px_rgba(15,23,42,0.25)] flex flex-col overflow-hidden
                      animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-orange-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#F37120]">edit_calendar</span>
            <h3 className="font-bold text-slate-800">Cập nhật {block?.name}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2 text-red-700 text-sm">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <p>{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-slate-400">event</span>
              Ngày thi
            </label>
            <input
              type="date"
              value={examDate}
              min={new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50
                         focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20
                         outline-none transition-all text-sm font-medium text-slate-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-slate-400">schedule</span>
                Giờ bắt đầu
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50
                           focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20
                           outline-none transition-all text-sm font-medium text-slate-700"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-slate-400">timer_off</span>
                Giờ kết thúc
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50
                           focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20
                           outline-none transition-all text-sm font-medium text-slate-700"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-200
                         rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 flex items-center justify-center min-w-[120px] text-sm font-bold
                         text-white bg-gradient-to-r from-orange-500 to-[#F37120] rounded-xl shadow-md
                         hover:from-orange-600 hover:to-orange-700 transition-all
                         disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
