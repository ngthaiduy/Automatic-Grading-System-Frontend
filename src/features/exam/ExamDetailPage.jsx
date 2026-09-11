import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { message } from 'antd';
import examApi from '../../services/examApi';
import blockApi from '../../services/blockApi';
import examPaperApi from '../../services/examPaperApi';
import gradingApi from '../../services/gradingApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_META = {
  ONGOING:   { label: 'Đang diễn ra', cls: 'bg-green-100 text-green-700' },
  UPCOMING:  { label: 'Sắp diễn ra',  cls: 'bg-blue-100 text-blue-700'  },
  COMPLETED: { label: 'Đã kết thúc',  cls: 'bg-slate-100 text-slate-600' },
};

function fmtDate(isoStr) {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
}

function fmtTime(isoStr) {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleTimeString('vi-VN', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
}

function sanitizeUiErrorMessage(message) {
  if (!message || typeof message !== 'string') return 'Có lỗi xảy ra. Vui lòng thử lại.';
  return message.replace(/\s*\([^)]*\)\.?\s*$/, '').trim();
}

function fmtConflictDateTime(isoStr) {
  if (!isoStr) return '—';
  const value = new Date(isoStr);
  if (Number.isNaN(value.getTime())) return '—';
  return value.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
}

function buildOverlapMessage(conflictingBlock) {
  const blockName = conflictingBlock?.name || conflictingBlock?.blockName || 'Không rõ tên';
  const examName = conflictingBlock?.examName || conflictingBlock?.exam?.name || 'Không rõ';
  return `Đã có block thi "${blockName}" diễn ra vào ${fmtConflictDateTime(conflictingBlock?.startTime)} đến ${fmtConflictDateTime(conflictingBlock?.endTime)}, ở kì ${examName} vui lòng chọn khoảng thời gian khác.`;
}

function findOverlappingBlock(blocks, candidateStartIso, candidateEndIso, excludeBlockId = null) {
  if (!Array.isArray(blocks) || !candidateStartIso || !candidateEndIso) return null;

  const candidateStart = new Date(candidateStartIso).getTime();
  const candidateEnd = new Date(candidateEndIso).getTime();
  if (!Number.isFinite(candidateStart) || !Number.isFinite(candidateEnd)) return null;

  return blocks.find((item) => {
    if (!item?.startTime || !item?.endTime) return false;
    if (excludeBlockId && item?.blockId === excludeBlockId) return false;

    const existingStart = new Date(item.startTime).getTime();
    const existingEnd = new Date(item.endTime).getTime();
    if (!Number.isFinite(existingStart) || !Number.isFinite(existingEnd)) return false;

    return candidateStart < existingEnd && candidateEnd > existingStart;
  }) || null;
}

function getBlockScheduleLockMessage(block) {
  const now = Date.now();

  if (block?.endTime) {
    const end = new Date(block.endTime);
    if (!Number.isNaN(end.getTime()) && now > end.getTime()) {
      return 'Kì thi đã qua không được chỉnh sửa thời gian ca thi';
    }
  }

  if (block?.startTime) {
    const start = new Date(block.startTime);
    if (!Number.isNaN(start.getTime())) {
      const lockAt = start.getTime() - (7 * 24 * 60 * 60 * 1000);
      if (now >= lockAt) {
        return 'Không thể chỉnh sửa lịch trong vòng 7 ngày trước khi ca thi bắt đầu.';
      }
    }
  }

  return '';
}

function getBlockScheduleStatus(block) {
  if (!block?.startTime || !block?.endTime) return 'Chưa có lịch';

  const now = Date.now();
  const start = new Date(block.startTime).getTime();
  const end = new Date(block.endTime).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end)) return 'Chưa có lịch';
  if (now < start) return 'Chưa diễn ra';
  if (now > end) return 'Đã kết thúc';
  return 'Đang diễn ra';
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function UpdateBlockModal({ block, allBlocks = [], onClose, onSuccess }) {
  const [examDate, setExamDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Điền dữ liệu block vào form
  useEffect(() => {
    if (!block) return;
    if (block.examDate) {
      setExamDate(block.examDate); // 'YYYY-MM-DD'
    }
    if (block.startTime) {
      const st = new Date(block.startTime);
      setStartTime(st.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    }
    if (block.endTime) {
      const et = new Date(block.endTime);
      setEndTime(et.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
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

    // Giờ kết thúc phải lớn hơn giờ bắt đầu (so sánh chuỗi HH:mm, cùng ngày)
    if (endTime <= startTime) {
      setError('Giờ kết thúc phải lớn hơn giờ bắt đầu');
      return;
    }
    if (!block?.blockId || !block?.examId) {
      setError('Không xác định được block này. Vui lòng tải lại trang và thử lại.');
      return;
    }

    try {
      // Gửi đúng offset +07:00 (múi giờ Việt Nam) thay vì với toISOString() có thể trừ 7 tiếng và lưu sai
      const startIso = `${examDate}T${startTime}:00+07:00`;
      const endIso   = `${examDate}T${endTime}:00+07:00`;
      const conflictingBlock = findOverlappingBlock(allBlocks, startIso, endIso, block.blockId);
      if (conflictingBlock) {
        setError(buildOverlapMessage(conflictingBlock));
        return;
      }

      setSaving(true);
      setError('');
      await blockApi.update(block.examId, block.blockId, {
        examDate,
        startTime: startIso,
        endTime: endIso
      });
      onSuccess();
    } catch (err) {
      const rawMessage = err?.response?.data?.message || 'Cập nhật thất bại. Vui lòng kiểm tra lại thời gian.';
      setError(sanitizeUiErrorMessage(rawMessage));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-[0_20px_50px_rgba(15,23,42,0.25)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-sm font-medium text-slate-700"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-sm font-medium text-slate-700"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-sm font-medium text-slate-700"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 flex items-center justify-center min-w-[120px] text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-[#F37120] rounded-xl shadow-md hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SemesterBadge({ semester }) {
  if (!semester) return <span className="text-slate-500">—</span>;
  const prefix = semester.substring(0, 2).toUpperCase();

  let config = {
    color: 'bg-slate-100 text-slate-700 border-slate-200 shadow-slate-500/10',
    icon: 'calendar_month',
  };

  if (prefix === 'SP') {
    config = { color: 'bg-emerald-100 text-emerald-800 border-emerald-200 shadow-emerald-500/20', icon: 'local_florist' };
  } else if (prefix === 'SU') {
    config = { color: 'bg-amber-100 text-amber-800 border-amber-200 shadow-amber-500/20', icon: 'light_mode' };
  } else if (prefix === 'FA') {
    config = { color: 'bg-indigo-100 text-indigo-800 border-indigo-200 shadow-indigo-500/20', icon: 'eco' };
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border shadow-sm ${config.color}`}>
      <span className="material-symbols-outlined text-[14px]">{config.icon}</span>
      {semester}
    </div>
  );
}

function InfoItem({ label, value, accent, icon }) {
  return (
    <div className="flex flex-col justify-center p-3 rounded-xl bg-slate-50/50 border border-slate-100/50 hover:bg-slate-50 transition-colors">
      <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1">
        {icon && <span className="material-symbols-outlined text-[14px]">{icon}</span>}
        {label}
      </p>
      <p className={`text-[15px] font-bold ${accent ? 'text-[#F37120]' : 'text-slate-800'}`}>
        {value || '—'}
      </p>
    </div>
  );
}

/** Card thông tin một Block */
function BlockCard({ block, loadingBlocks, onEdit, onOpenBlockDetail, onDelete }) {
  const displayName = block?.name || 'Block';
  if (loadingBlocks) {
    return (
      <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-[0_10px_28px_rgba(15,23,42,0.06)] flex flex-col animate-pulse">
        <div className="h-5 w-24 bg-slate-200 rounded mb-6" />
        <div className="space-y-3 flex-1">
          <div className="h-4 bg-slate-100 rounded w-3/4" />
          <div className="h-4 bg-slate-100 rounded w-1/2" />
          <div className="h-4 bg-slate-100 rounded w-2/3" />
        </div>
      </div>
    );
  }

  const scheduleStatus = getBlockScheduleStatus(block);
  const scheduleBadgeClass = scheduleStatus === 'Đang diễn ra'
    ? 'bg-green-50 text-green-700 border-green-200'
    : scheduleStatus === 'Chưa diễn ra'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : scheduleStatus === 'Đã kết thúc'
        ? 'bg-slate-50 text-slate-600 border-slate-200'
        : 'bg-slate-50 text-slate-500 border-slate-200';

  return (
    <div className="bg-white border border-orange-100 rounded-2xl shadow-[0_10px_28px_rgba(15,23,42,0.06)] hover:shadow-[0_14px_34px_rgba(249,115,22,0.14)] transition-all duration-300 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#F37120] text-[18px]">layers</span>
          </div>
          <h4 className="text-base font-extrabold text-slate-800">{displayName}</h4>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold border ${scheduleBadgeClass}`}>
            {scheduleStatus}
          </span>
          <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold border ${block?.hasPaper ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
            {block?.hasPaper ? 'Đã có đề thi' : 'Chưa có đề'}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 flex-1 space-y-4">
        {block?.description && (
          <p className="text-xs text-slate-500 leading-relaxed mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            {block.description}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <InfoItem icon="event" label="Ngày thi" value={block?.examDate ? fmtDate(block.examDate) : null} />
          <InfoItem icon="description" label="Đề thi" value={block?.hasPaper ? (block?.paperExamCode || block?.paperFileName || 'Đã tải lên') : 'Chưa tải lên'} />
          <InfoItem icon="schedule" label="Giờ bắt đầu" value={block?.startTime ? fmtTime(block.startTime) : null} />
          <InfoItem icon="timer_off" label="Giờ kết thúc" value={block?.endTime ? fmtTime(block.endTime) : null} />
          <InfoItem icon="upload_file" label="Số bài nộp" value={String(block?.submissionCount ?? 0)} />
          <InfoItem icon="fact_check" label="Số bài đã chấm" value={`${block?.gradedCount ?? 0}/${block?.submissionCount ?? 0}`} />
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 pb-5 flex gap-3">
        <button
          onClick={() => {
            const lockMessage = getBlockScheduleLockMessage(block);
            if (lockMessage) { message.warning(lockMessage); return; }
            onEdit?.(block);
          }}
          className="flex-1 py-2.5 px-4 text-xs font-bold border border-orange-200 text-orange-600 bg-orange-50 rounded-xl hover:bg-orange-100 hover:border-orange-300 hover:-translate-y-0.5 transition-all flex justify-center items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">edit</span>
          Cập nhật
        </button>
        <button
          type="button"
          onClick={() => block?.blockId && onOpenBlockDetail?.(block.blockId)}
          className="flex-1 py-2.5 px-4 text-xs font-bold border border-slate-200 text-slate-600 bg-white rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5 transition-all shadow-sm flex justify-center items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">visibility</span>
          Chi tiết
        </button>
        <button
          type="button"
          onClick={() => onDelete?.(block)}
          className="py-2.5 px-3 text-xs font-bold border border-red-200 text-red-500 bg-white rounded-xl hover:bg-red-50 hover:border-red-300 hover:-translate-y-0.5 transition-all flex justify-center items-center gap-1"
          title="Xóa đợt thi"
        >
          <span className="material-symbols-outlined text-[16px]">delete</span>
        </button>
      </div>
    </div>
  );
}

/** Modal tạo đợt thi mới — wizard 2 bước: Thông tin → Lịch thi (tuỳ chọn) */
function CreateBlockModal({ examId, allBlocks = [], onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  // Step 1
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  // Step 2 (optional scheduling)
  const [examDate, setExamDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [skipSchedule, setSkipSchedule] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });

  function goStep2() {
    if (!name.trim()) { setError('Tên đợt thi không được để trống'); return; }
    setError('');
    setStep(2);
  }

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!skipSchedule) {
      if (!examDate || !startTime || !endTime) {
        setError('Vui lòng nhập đầy đủ Ngày thi, Giờ bắt đầu và Giờ kết thúc hoặc chọn bỏ qua đặt lịch.');
        return;
      }

      const now = new Date();
      const startDateTime = new Date(`${examDate}T${startTime}:00+07:00`);
      if (examDate < todayStr) {
        setError('Ngày thi không được nhỏ hơn ngày hiện tại');
        return;
      }

      if (examDate === todayStr && startDateTime <= now) {
        setError('Nếu chọn ngày hôm nay, giờ bắt đầu phải lớn hơn thời điểm hiện tại');
        return;
      }

      if (endTime <= startTime) {
        setError('Giờ kết thúc phải lớn hơn giờ bắt đầu');
        return;
      }

      const startIso = `${examDate}T${startTime}:00+07:00`;
      const endIso = `${examDate}T${endTime}:00+07:00`;
      const conflictingBlock = findOverlappingBlock(allBlocks, startIso, endIso);
      if (conflictingBlock) {
        setError(buildOverlapMessage(conflictingBlock));
        return;
      }
    }

    setSaving(true); setError('');
    try {
      // Step 1: Create block
      const createRes = await blockApi.create(examId, {
        name: name.trim(),
        description: description.trim() || null,
      });
      const created = createRes?.data ?? createRes;
      const blockId = created?.blockId;

      // Step 2: Optionally set schedule
      if (!skipSchedule && examDate && startTime && endTime && blockId) {
        const startIso = `${examDate}T${startTime}:00+07:00`;
        const endIso = `${examDate}T${endTime}:00+07:00`;
        try {
          await blockApi.update(examId, blockId, {
            examDate,
            startTime: startIso,
            endTime: endIso,
          });
        } catch (scheduleErr) {
          try {
            await blockApi.delete(examId, blockId);
          } catch {
            // keep original schedule error for UI
          }
          const rawScheduleMessage = scheduleErr?.response?.data?.message || 'Đặt lịch đợt thi thất bại.';
          setError(sanitizeUiErrorMessage(rawScheduleMessage));
          return;
        }
      }
      onSuccess();
    } catch (err) {
      setError(sanitizeUiErrorMessage(err?.response?.data?.message || 'Tạo đợt thi thất bại.'));
    } finally { setSaving(false); }
  };

  const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-sm font-medium text-slate-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-[0_20px_50px_rgba(15,23,42,0.25)] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-orange-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#F37120]">add_circle</span>
            <h3 className="font-bold text-slate-800">Tạo đợt thi mới</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-4 flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all
            ${step >= 1 ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
            <span className="material-symbols-outlined text-[14px]">edit</span>
            Thông tin
          </div>
          <div className="w-6 h-px bg-slate-200" />
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all
            ${step >= 2 ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            Lịch thi
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); step === 1 ? goStep2() : handleSubmit(); }} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2 text-red-700 text-sm">
              <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
              <p>{error}</p>
            </div>
          )}

          {/* ── Step 1: Thông tin ── */}
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Tên đợt thi <span className="text-orange-500">*</span>
                </label>
                <input type="text" value={name}
                  onChange={(e) => { setName(e.target.value); setError(''); }}
                  placeholder="Ví dụ: Block 10, Block 3, Ca 1..."
                  className={inputCls} maxLength={50} autoFocus />
                <p className="text-xs text-slate-400 mt-1.5">Tên phải duy nhất trong cùng kỳ thi</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Mô tả (tùy chọn)</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả thêm về đợt thi..." rows={2}
                  className={`${inputCls} resize-none`} maxLength={2000} />
              </div>
            </>
          )}

          {/* ── Step 2: Lịch thi (tuỳ chọn) ── */}
          {step === 2 && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex gap-2 text-blue-700 text-sm">
                <span className="material-symbols-outlined text-[18px] shrink-0">info</span>
                <p className="font-medium">Bạn có thể đặt lịch ngay hoặc bỏ qua để đặt sau.</p>
              </div>

              {!skipSchedule && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-slate-400">event</span>
                      Ngày thi
                    </label>
                    <input type="date" value={examDate} min={todayStr}
                      onChange={(e) => setExamDate(e.target.value)} className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-slate-400">schedule</span>
                        Giờ bắt đầu
                      </label>
                      <input type="time" value={startTime}
                        onChange={(e) => setStartTime(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-slate-400">timer_off</span>
                        Giờ kết thúc
                      </label>
                      <input type="time" value={endTime}
                        onChange={(e) => setEndTime(e.target.value)} className={inputCls} />
                    </div>
                  </div>
                </>
              )}

              <label className="flex items-center gap-2 cursor-pointer group select-none">
                <input type="checkbox" checked={skipSchedule}
                  onChange={(e) => setSkipSchedule(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400/30" />
                <span className="text-sm text-slate-600 group-hover:text-slate-800 font-medium transition-colors">
                  Bỏ qua, đặt lịch sau
                </span>
              </label>
            </>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 mt-2">
            <div>
              {step === 2 && (
                <button type="button" onClick={() => { setStep(1); setError(''); }}
                  className="px-3 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  Quay lại
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={onClose} disabled={saving}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50">
                Hủy
              </button>
              {step === 1 ? (
                <button type="submit"
                  className="px-5 py-2 flex items-center gap-2 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-[#F37120] rounded-xl shadow-md hover:from-orange-600 hover:to-orange-700 transition-all">
                  Tiếp tục
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={saving}
                  className="px-5 py-2 flex items-center justify-center min-w-[140px] text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-[#F37120] rounded-xl shadow-md hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                  {saving ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang tạo...</>
                  ) : (
                    <><span className="material-symbols-outlined text-[16px]">check_circle</span> Tạo đợt thi</>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="max-w-6xl mx-auto px-8 py-6 space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-slate-200 rounded-xl" />
      <div className="h-56 bg-slate-100 rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-slate-100 rounded-2xl" />
        <div className="h-64 bg-slate-100 rounded-2xl" />
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function ExamDetailPage({ examId, onBack, onEdit, onOpenBlockDetail }) {
  const [exam, setExam]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  // Block state
  const [blocks, setBlocks]           = useState([]);
  const [allBlocks, setAllBlocks]      = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);

  // Fetch exam detail
  useEffect(() => {
    if (!examId) return;
    setLoading(true);
    setError('');
    examApi.getById(examId)
      .then((res) => {
        const payload = res?.data ?? res;
        setExam(payload);
      })
      .catch((err) => {
        setError(
          err?.response?.data?.message ||
          'Không thể tải thông tin kỳ thi. Vui lòng thử lại.'
        );
      })
      .finally(() => setLoading(false));
  }, [examId]);

  // Fetch blocks after exam loaded
  const loadBlocks = async () => {
    if (!examId) { console.warn('[Block] examId is empty, skip'); return; }
    console.log('[Block] GET blocks for examId:', examId);
    setLoadingBlocks(true);
    try {
      const res = await blockApi.getByExam(examId);
      console.log('[Block] raw res:', res, '| isArray:', Array.isArray(res));
      const list = Array.isArray(res) ? res
                 : Array.isArray(res?.data) ? res.data
                 : [];
      console.log('[Block] parsed list length:', list.length, list);

      const listWithPaperNameAndStats = await Promise.all(
        list.map(async (b) => {
          if (!b?.blockId) return b;

          let paperFileName = null;
          let paperExamCode = null;
          if (b?.hasPaper) {
            try {
              const paperRes = await examPaperApi.getByBlock(examId, b.blockId);
              const paper = paperRes?.data ?? paperRes;
              const rawFileName = typeof paper?.fileName === 'string' ? paper.fileName.trim() : '';
              const looksLikeFile = /\.[a-z0-9]{2,5}$/i.test(rawFileName);
              paperFileName = looksLikeFile ? rawFileName : null;
              paperExamCode = typeof paper?.examCode === 'string' ? paper.examCode.trim() : null;
            } catch {
              // keep null, do not fail whole list
            }
          }

          let submissionCount = 0;
          let gradedCount = 0;
          try {
            const progressRes = await gradingApi.getProgress(examId, b.blockId);
            const progress = progressRes?.data ?? progressRes;
            submissionCount = Number(progress?.totalSubmissions ?? 0);
            gradedCount = Number(progress?.gradedCount ?? 0);
          } catch {
            // keep default 0/0 when no grading progress yet
          }

          return {
            ...b,
            paperFileName,
            paperExamCode,
            submissionCount,
            gradedCount,
          };
        })
      );

      listWithPaperNameAndStats.sort((a, b) => {
        const numA = parseInt((a.name || '').replace(/\D/g, ''), 10) || 0;
        const numB = parseInt((b.name || '').replace(/\D/g, ''), 10) || 0;
        return numB - numA;
      });
      setBlocks(listWithPaperNameAndStats);
    } catch (err) {
      console.error('[Block] error:', err?.response?.status, err?.response?.data, err?.message);
      setBlocks([]);
    } finally {
      setLoadingBlocks(false);
    }
  };

  const loadAllBlocks = async () => {
    try {
      const res = await blockApi.getAllForStaff();
      const payload = res?.data ?? res;
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

      setAllBlocks(
        list.map((item) => ({
          blockId: item?.blockId,
          examId: item?.examId,
          name: item?.blockName || item?.name || '',
          examName: item?.examName || '',
          startTime: item?.startTime || null,
          endTime: item?.endTime || null,
        }))
      );
    } catch (err) {
      console.error('[Block] get all staff blocks error:', err?.response?.status, err?.response?.data, err?.message);
      setAllBlocks([]);
    }
  };

  useEffect(() => {
    loadBlocks();
    loadAllBlocks();
  }, [examId]);

  // Block modals
  const [editingBlock, setEditingBlock] = useState(null);
  const [showCreateBlock, setShowCreateBlock] = useState(false);
  const [deletingBlock, setDeletingBlock] = useState(null);
  const [blockDeleting, setBlockDeleting] = useState(false);
  const [blockDeleteError, setBlockDeleteError] = useState('');

  function openDeleteConfirm() {
    setDeleteError('');
    setConfirmOpen(true);
  }

  function closeDeleteConfirm() {
    if (deleting) return;
    setConfirmOpen(false);
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError('');
    try {
      await examApi.delete(examId);
      setConfirmOpen(false);
      onBack?.();
    } catch (err) {
      setDeleteError(err?.response?.data?.message || 'Xóa thất bại. Vui lòng thử lại.');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <Skeleton />;

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-8 py-16 flex flex-col items-center gap-4 text-center">
        <span className="material-symbols-outlined text-5xl text-red-400">error</span>
        <p className="text-slate-700 font-semibold">{error}</p>
        <button
          onClick={onBack}
          className="mt-2 px-6 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium"
        >
          Quay lại
        </button>
      </div>
    );
  }

  if (!exam) return null;

  const statusMeta = STATUS_META[exam.status] ?? STATUS_META.UPCOMING;

  async function handleDeleteBlock() {
    if (!deletingBlock) return;
    setBlockDeleting(true); setBlockDeleteError('');
    try {
      await blockApi.delete(examId, deletingBlock.blockId);
      message.success(`Đã xóa đợt thi "${deletingBlock.name}"`);
      setDeletingBlock(null);
      loadBlocks();
      loadAllBlocks();
    } catch (err) {
      setBlockDeleteError(err?.response?.data?.message || 'Xóa thất bại.');
    } finally { setBlockDeleting(false); }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-8 py-6 sm:py-8 space-y-6 sm:space-y-7">

      {/* ── Header actions ── */}
      <div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-gradient-to-r from-white to-orange-50/40 shadow-[0_8px_24px_rgba(249,115,22,0.08)] px-4 sm:px-5 py-3.5">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-[#F37120] transition-colors font-semibold"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Quay lại
        </button>
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={onEdit}
            className="px-4 py-2.5 border border-[#F37120] bg-white text-[#F37120] rounded-xl text-sm font-bold hover:bg-orange-50 transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            Chỉnh sửa
          </button>
          <button
            onClick={openDeleteConfirm}
            disabled={deleting}
            className="px-4 py-2.5 border border-red-300 bg-white text-red-500 rounded-xl text-sm font-bold hover:bg-red-50 transition-all flex items-center gap-2 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
            {deleting ? 'Đang xóa...' : 'Xóa'}
          </button>
        </div>
      </div>

      {/* ── Exam overview card ── */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-[0_14px_40px_rgba(15,23,42,0.08)] border border-orange-100/70 relative">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#F37120] via-amber-400 to-[#F37120]" />
        
        <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-start">
          {/* Icon Box */}
          <div className="w-full md:w-32 h-32 rounded-2xl bg-gradient-to-br from-[#F37120]/10 to-orange-50 border border-orange-100/50 flex flex-col items-center justify-center shrink-0 shadow-inner group transition-all hover:bg-orange-50/80">
            <span className="material-symbols-outlined text-[#F37120] text-5xl group-hover:scale-110 transition-transform duration-300 ease-out drop-shadow-sm">inventory_2</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider border flex items-center gap-1.5 shadow-sm uppercase ${statusMeta.cls} ${statusMeta.cls.includes('bg-green') ? 'border-green-200' : statusMeta.cls.includes('bg-blue') ? 'border-blue-200' : 'border-slate-200'}`}>
                {exam.status === 'ONGOING' && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                {statusMeta.label}
              </span>
              
              <SemesterBadge semester={exam.semester} />
            </div>

            <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-3 truncate">{exam.name}</h3>

            {exam.description && (
              <p className="text-[13px] text-slate-500 mb-6 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100/60 shadow-sm">{exam.description}</p>
            )}

            <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 ${!exam.description && 'mt-6'}`}>
              <InfoItem icon="school" label="Năm học" value={exam.academicYear} />
              <InfoItem icon="calendar_today" label="Ngày bắt đầu" value={fmtDate(exam.startTime)} />
              <InfoItem icon="event" label="Ngày kết thúc" value={fmtDate(exam.endTime)} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Block section ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#F37120]">layers</span>
            <h3 className="text-lg font-extrabold text-slate-800">Danh sách đợt thi</h3>
            {!loadingBlocks && (
              <span className="text-xs bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full font-bold">
                {blocks.length} đợt thi
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowCreateBlock(true)}
            className="px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#F37120] to-orange-500 rounded-xl shadow-md shadow-orange-500/25 hover:from-orange-600 hover:to-orange-600 transition-all hover:-translate-y-0.5 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Tạo đợt thi
          </button>
        </div>

        {!loadingBlocks && blocks.length === 0 && (
          <div className="bg-gradient-to-br from-orange-50/60 to-amber-50/40 border-2 border-dashed border-orange-200 rounded-2xl p-10 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-orange-100 border border-orange-200 flex items-center justify-center mb-4 shadow-inner">
              <span className="material-symbols-outlined text-3xl text-[#F37120]">calendar_add_on</span>
            </div>
            <p className="text-slate-700 font-bold text-base mb-1">Chưa có đợt thi nào</p>
            <p className="text-sm text-slate-500 mb-5 max-w-sm">Tạo đợt thi để lên lịch ca thi, tải đề và nhận bài nộp từ sinh viên.</p>
            <button
              type="button"
              onClick={() => setShowCreateBlock(true)}
              className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#F37120] to-orange-500 rounded-xl shadow-md shadow-orange-500/25 hover:from-orange-600 hover:to-orange-600 transition-all hover:-translate-y-0.5 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Tạo đợt thi đầu tiên
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(loadingBlocks ? [null, null] : blocks).map((block, idx) => (
            <BlockCard
              key={block?.blockId || idx}
              block={block}
              loadingBlocks={loadingBlocks}
              onEdit={setEditingBlock}
              onOpenBlockDetail={onOpenBlockDetail}
              onDelete={setDeletingBlock}
            />
          ))}
        </div>
      </div>

      {/* ── Update Block modal ── */}
      {editingBlock && createPortal(
        <UpdateBlockModal
          block={editingBlock}
          allBlocks={allBlocks}
          onClose={() => setEditingBlock(null)}
          onSuccess={() => {
            setEditingBlock(null);
            loadBlocks();
            loadAllBlocks();
          }}
        />,
        document.body
      )}

      {/* ── Create Block modal ── */}
      {showCreateBlock && createPortal(
        <CreateBlockModal
          examId={examId}
          allBlocks={allBlocks}
          onClose={() => setShowCreateBlock(false)}
          onSuccess={() => {
            setShowCreateBlock(false);
            loadBlocks();
            loadAllBlocks();
            message.success('Tạo đợt thi thành công!');
          }}
        />,
        document.body
      )}

      {/* ── Delete Block confirm modal ── */}
      {deletingBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" aria-label="Close" onClick={() => { if (!blockDeleting) { setDeletingBlock(null); setBlockDeleteError(''); } }}
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" />
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-[0_20px_50px_rgba(15,23,42,0.25)] p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">warning</span>
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Xác nhận xóa đợt thi</h4>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  Bạn có chắc muốn xóa đợt thi <span className="font-semibold">"{deletingBlock?.name}"</span>?<br />
                  Hành động này không thể hoàn tác.
                </p>
              </div>
            </div>
            {blockDeleteError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{blockDeleteError}</div>
            )}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button type="button" onClick={() => { setDeletingBlock(null); setBlockDeleteError(''); }} disabled={blockDeleting}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-semibold disabled:opacity-60">Hủy</button>
              <button type="button" onClick={handleDeleteBlock} disabled={blockDeleting}
                className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors text-sm font-semibold disabled:opacity-70 min-w-[120px] shadow-sm">
                {blockDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Exam confirm modal ── */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close confirm modal"
            onClick={closeDeleteConfirm}
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
          />
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-[0_20px_50px_rgba(15,23,42,0.25)] p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">warning</span>
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Xác nhận xóa kỳ thi</h4>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  Bạn có chắc muốn xóa kỳ thi <span className="font-semibold">"{exam?.name}"</span>?<br />
                  Hành động này không thể hoàn tác.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-semibold disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors text-sm font-semibold disabled:opacity-70 min-w-[120px] shadow-sm"
              >
                {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
