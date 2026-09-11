import React, { useEffect, useState, useMemo } from 'react';
import examApi from '../../services/examApi';

// Danh sách mã học kỳ theo chuẩn FPT — generated dynamically
const SEMESTER_OPTIONS = ['SP', 'SU', 'FA'];

/**
 * Tính số ngày giữa 2 chuỗi ngày "YYYY-MM-DD".
 * Trả về null nếu không hợp lệ.
 */
function calcDuration(startDate, endDate) {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end - start;
  if (diffMs <= 0) return null;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/** Hiển thị số ngày thành chuỗi "N tháng M ngày" */
function formatDuration(days) {
  if (!days || days <= 0) return '—';
  const months = Math.floor(days / 30);
  const remainDays = days % 30;
  if (months === 0) return `${remainDays} ngày`;
  if (remainDays === 0) return `${months} tháng`;
  return `${months} tháng ${remainDays} ngày`;
}

/**
 * Chuyển "YYYY-MM-DD" → ISO 8601 OffsetDateTime bắt đầu ngày (00:00:00+07:00)
 * hoặc kết thúc ngày (23:59:59+07:00).
 */
function toOffsetDateTime(dateStr, endOfDay = false) {
  if (!dateStr) return null;
  const time = endOfDay ? '23:59:59' : '00:00:00';
  return `${dateStr}T${time}+07:00`;
}

/**
 * Tính năm học hiện tại theo đúng logic backend (ExamServiceImpl.calculateAcademicYear):
 * - Tháng 1–8  (SP, SU): academicYear = (năm - 1)–năm, ví dụ "2025-2026"
 * - Tháng 9–12 (FA):     academicYear = năm–(năm + 1), ví dụ "2026-2027"
 * Giá trị này khớp chính xác với gì backend sẽ lưu vào DB.
 */
function getCurrentAcademicYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-indexed
  return month >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

const CURRENT_ACADEMIC_YEAR = getCurrentAcademicYear();

/**
 * Năm dương lịch hiện tại (dùng để sinh mã học kỳ).
 */
const CURRENT_YEAR = new Date().getFullYear();

/**
 * Sinh mã học kỳ theo chuẩn FPT: SP|SU|FA + 2 chữ số năm.
 * Ví dụ: 'SP' + 2026 → 'SP26'
 */
function buildSemesterCode(prefix, year) {
  return `${prefix}${String(year).slice(-2)}`;
}

// ─── Field components ─────────────────────────────────────────────────────────



function Field({ label, required, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="text-orange-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
          <span className="material-symbols-outlined text-[14px]">error</span>
          {error}
        </p>
      )}
    </div>
  );
}

const inputCls = (hasError) =>
  `w-full rounded-xl border text-sm shadow-sm transition-all outline-none px-3.5 py-2.5 placeholder:text-slate-400/90
   ${hasError
     ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-500/10'
     : 'border-slate-200 bg-white/80 hover:bg-white hover:border-slate-300 focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-400/15'
   }`;

// ─── Field name translation ────────────────────────────────────────────────────

/** Map tên kỹ thuật → tên hiển thị tiếng Việt (dùng để làm đẹp lỗi từ API) */
const FIELD_LABEL_MAP = {
  name:           'Tên kỳ thi',
  semester:       'Mã học kỳ',
  startTime:      'Ngày bắt đầu',
  endTime:        'Ngày kết thúc',
  description:    'Mô tả',
  academicYear:   'Năm học',
  gradingMode:    'Chế độ chấm',
  validTimeRange: 'Khoảng thời gian',
};

/** Thay thế tên kỹ thuật trong chuỗi bằng tên tiếng Việt. */
function translateFieldNames(msg) {
  return Object.entries(FIELD_LABEL_MAP).reduce(
    (acc, [key, label]) => acc.replace(new RegExp(`\\b${key}\\b`, 'g'), label),
    msg
  );
}

/**
 * Chuyển đổi lỗi từ API:
 * - Nếu backend trả mảng errors (field validation) → join thành chuỗi.
 * - Nếu trả message đơn → dịch tên kỹ thuật sang tiếng Việt.
 */
function parseApiError(err) {
  const errorsArr = err?.response?.data?.errors;
  if (Array.isArray(errorsArr) && errorsArr.length > 0) {
    return errorsArr
      .map((e) => {
        if (typeof e === 'string') return translateFieldNames(e);
        const label = FIELD_LABEL_MAP[e.field] || e.field || '';
        return label ? `${label}: ${e.message}` : e.message;
      })
      .join(' | ');
  }
  const msg = err?.response?.data?.message || '';
  if (msg) return translateFieldNames(msg);
  return 'Có lỗi xảy ra. Vui lòng thử lại.';
}

// ─── Main component ────────────────────────────────────────────────────────────


export default function CreateExamPage({
  examIdToEdit,
  onGoDashboard,
  onGoExamManagement,
  onGoExamDetail,
  onGoCreatedExamDetail,
  onCancel,
}) {
  const isEdit = !!examIdToEdit;
  
  const [form, setForm] = useState({
    name: '',
    semesterPrefix: 'SP',                         // chỉ lưu prefix (SP/SU/FA)
    startDate: '',
    endDate: '',
    description: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);

  const durationDays = useMemo(
    () => calcDuration(form.startDate, form.endDate),
    [form.startDate, form.endDate]
  );

  useEffect(() => {
    if (!isEdit) return;
    setFetching(true);
    setApiError('');
    examApi.getById(examIdToEdit)
      .then(res => {
        const data = res?.data ?? res;
        setForm({
          name: data.name || '',
          semesterPrefix: data.semester ? data.semester.substring(0, 2).toUpperCase() : 'SP',
          startDate: data.startTime ? data.startTime.substring(0, 10) : '',
          endDate: data.endTime ? data.endTime.substring(0, 10) : '',
          description: data.description || '',
        });
      })
      .catch(err => {
        setApiError('Không thể tải dữ liệu kỳ thi để cập nhật.');
      })
      .finally(() => setFetching(false));
  }, [examIdToEdit, isEdit]);

  // ── handlers ──
  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setApiError('');
  };

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Tên kỳ thi không được để trống.';
    if (!form.startDate) errs.startDate = 'Vui lòng chọn ngày bắt đầu.';
    if (!form.endDate) errs.endDate = 'Vui lòng chọn ngày kết thúc.';

    // endDate phải ở tương lai
    if (form.endDate) {
      const endMs = new Date(form.endDate).setHours(23, 59, 59, 999);
      if (endMs <= Date.now())
        errs.endDate = 'Ngày kết thúc phải ở tương lai.';
    }

    // end phải sau start + không vượt 135 ngày
    if (form.startDate && form.endDate && !errs.endDate) {
      const days = calcDuration(form.startDate, form.endDate);
      if (days === null || days <= 0) errs.endDate = 'Ngày kết thúc phải sau ngày bắt đầu.';
      else if (days > 135)
        errs.endDate = `Thời gian kỳ thi không được vượt quá 135 ngày (hiện tại: ${days} ngày).`;
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setApiError('');

    // Ghép mã học kỳ: prefix + 2 chữ số cuối năm hiện tại → SP26, SU26, FA26
    const semesterCode = buildSemesterCode(form.semesterPrefix, CURRENT_YEAR);

    const payload = {
      name: form.name.trim(),
      semester: semesterCode,
      startTime: toOffsetDateTime(form.startDate, false),
      endTime: toOffsetDateTime(form.endDate, true),
      description: form.description.trim() || null,
    };

    try {
      if (isEdit) {
        await examApi.update(examIdToEdit, payload);
        (onGoExamDetail ?? onGoExamManagement)?.();
        return;
      } else {
        const createdRes = await examApi.create(payload);
        const createdPayload = createdRes?.data ?? createdRes;
        const createdExamId =
          createdPayload?.examId ??
          createdPayload?.id ??
          createdPayload?.data?.examId ??
          createdPayload?.data?.id;

        if (createdExamId && onGoCreatedExamDetail) {
          onGoCreatedExamDetail(createdExamId);
          return;
        }
      }
      setSuccess(true);
    } catch (err) {
      setApiError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }

  // ── Success screen ──
  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center shadow-lg shadow-green-500/20">
              <span className="material-symbols-outlined text-5xl text-green-500">check_circle</span>
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 mb-2">
            {isEdit ? 'Cập nhật kỳ thi thành công!' : 'Tạo kỳ thi thành công!'}
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            Kỳ thi <strong>"{form.name}"</strong> đã được {isEdit ? 'cập nhật' : 'khởi tạo'}.
            {!isEdit && ' Bạn có thể tạo các đợt thi trong trang chi tiết kỳ thi.'}
          </p>
          <button
            onClick={isEdit ? (onGoExamDetail ?? onGoExamManagement) : onGoExamManagement}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold shadow-md shadow-orange-500/30 hover:from-orange-600 hover:to-orange-700 transition-all"
          >
            {isEdit ? 'Quay về chi tiết kỳ thi' : 'Quay lại danh sách kỳ thi'}
          </button>
        </div>
      </div>
    );
  }

  // ── Form ──
  if (fetching) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center pb-24">
        <div className="flex flex-col items-center gap-3 text-orange-500">
           <span className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin" />
           <p className="font-semibold text-sm">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white p-6 sm:p-8 flex justify-center pb-24 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-orange-200/40 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-amber-200/35 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-orange-100/30 blur-3xl" />

      <form className="w-full max-w-[980px] space-y-6 relative z-10" onSubmit={handleSubmit} noValidate>

        {/* Breadcrumb */}
        <div className="rounded-3xl border border-orange-200/70 bg-gradient-to-r from-white via-orange-50/40 to-amber-50/40 backdrop-blur-sm shadow-[0_16px_40px_rgba(249,115,22,0.14)] p-5 sm:p-6 relative overflow-hidden">
          <div className="pointer-events-none absolute -right-10 -top-10 w-40 h-40 rounded-full bg-orange-200/30 blur-2xl" />
          <button
            type="button"
            onClick={isEdit ? (onGoExamDetail ?? onGoExamManagement) : onGoExamManagement}
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-[#F37021] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            {isEdit ? 'Quay lại chi tiết kỳ thi' : 'Quay lại quản lí kỳ thi'}
          </button>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-3xl sm:text-[34px] font-black tracking-tight text-slate-800">
                {isEdit ? 'Cập nhật kỳ thi' : 'Tạo kỳ thi mới'}
              </h2>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                {isEdit ? 'Chỉnh sửa thông tin và thời gian kỳ thi một cách chính xác.' : 'Thiết lập đầy đủ thông tin để khởi tạo kỳ thi nhanh chóng.'}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-200 bg-white text-orange-600 text-xs font-extrabold shadow-sm">
              <span className="material-symbols-outlined text-[15px]">workspace_premium</span>
              Exam Staff
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1.5">
            <button type="button" className="hover:text-[#F37021] transition-colors" onClick={onGoDashboard}>Dashboard</button>
            <span>/</span>
            <button type="button" className="hover:text-[#F37021] transition-colors" onClick={onGoExamManagement}>Quản lý Kỳ thi</button>
            <span>/</span>
            <span className="text-slate-600">{isEdit ? 'Cập nhật' : 'Tạo mới'}</span>
          </div>
        </div>

        {/* ── Card: Thông tin kỳ thi ── */}
        <div className="bg-white rounded-3xl shadow-[0_18px_44px_rgba(15,23,42,0.1)] border border-orange-100/80 overflow-hidden">
          <div className="px-6 py-4 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-white border border-orange-200 shadow-sm flex items-center justify-center">
                <span className="material-symbols-outlined text-[#F37021] text-[18px]">info</span>
              </span>
              Thông tin kỳ thi
            </h3>
            <span className="text-[11px] text-orange-700 bg-orange-100 border border-orange-200 rounded-full px-2.5 py-1 font-bold uppercase tracking-wide">Step 1</span>
          </div>
          <div className="p-6 space-y-5">

            {/* Tên kỳ thi */}
            <Field label="Tên kỳ thi" required error={errors.name}>
              <input
                className={inputCls(!!errors.name)}
                placeholder="Ví dụ: Final Exam OOP Spring 2025"
                type="text"
                value={form.name}
                onChange={set('name')}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Học kỳ */}
              <Field label="Học kỳ" required error={errors.semester}>
                <select
                  className={inputCls(!!errors.semester)}
                  value={form.semesterPrefix}
                  onChange={(e) => {
                    setForm(prev => ({ ...prev, semesterPrefix: e.target.value }));
                    setErrors(prev => ({ ...prev, semester: '' }));
                  }}
                >
                  {SEMESTER_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}{String(CURRENT_YEAR).slice(-2)} &nbsp;({s === 'SP' ? 'Spring' : s === 'SU' ? 'Summer' : 'Fall'})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Mã kỳ thi sẽ là: <strong className="text-orange-600">{form.semesterPrefix}{String(CURRENT_YEAR).slice(-2)}</strong>
                </p>
              </Field>

              {/* Academic Year */}
              <Field label="Năm học">
                <input
                  className={`${inputCls(false)} cursor-not-allowed text-slate-700 font-semibold`}
                  value={CURRENT_YEAR}
                  readOnly
                  tabIndex={-1}
                />
              </Field>
            </div>

            {/* Mô tả (tuỳ chọn) */}
            <Field label="Mô tả (tuỳ chọn)">
              <textarea
                className={`${inputCls(false)} resize-none`}
                rows={3}
                placeholder="Mô tả thêm về kỳ thi (không bắt buộc)..."
                value={form.description}
                onChange={set('description')}
              />
            </Field>
          </div>
        </div>

        {/* ── Card: Thời gian ── */}
        <div className="bg-white rounded-3xl shadow-[0_18px_44px_rgba(15,23,42,0.1)] border border-orange-100/80 overflow-hidden">
          <div className="px-6 py-4 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-white border border-orange-200 shadow-sm flex items-center justify-center">
                <span className="material-symbols-outlined text-[#F37021] text-[18px]">schedule</span>
              </span>
              Thời gian của kỳ thi
            </h3>
            <span className="text-[11px] text-orange-700 bg-orange-100 border border-orange-200 rounded-full px-2.5 py-1 font-bold uppercase tracking-wide">Step 2</span>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="space-y-4">

                {/* Ngày bắt đầu */}
                <Field label="Ngày bắt đầu" required error={errors.startDate}>
                  <div className="relative">
                    <input
                      className={`${inputCls(!!errors.startDate)} pl-10`}
                      type="date"
                      value={form.startDate}
                      onChange={set('startDate')}
                    />
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
                      event
                    </span>
                  </div>
                  {form.startDate && (
                    <p className="text-xs text-slate-500 mt-1">
                      Hệ thống sẽ nhận từ <strong>00:00:00 GMT+7</strong> ngày này.
                    </p>
                  )}
                </Field>

                {/* Ngày kết thúc */}
                <Field label="Ngày kết thúc" required error={errors.endDate}>
                  <div className="relative">
                    <input
                      className={`${inputCls(!!errors.endDate)} pl-10`}
                      type="date"
                      value={form.endDate}
                      min={form.startDate || undefined}
                      onChange={set('endDate')}
                    />
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
                      event_upcoming
                    </span>
                  </div>
                  {form.endDate && (
                    <p className="text-xs text-slate-500 mt-1">
                      Hệ thống sẽ nhận đến <strong>23:59:59 GMT+7</strong> ngày này.
                    </p>
                  )}
                </Field>
              </div>

              {/* Duration box */}
              <div className={`bg-gradient-to-br p-6 rounded-2xl border flex flex-col items-center justify-center text-center shadow-inner transition-all
                ${durationDays && durationDays > 0
                  ? durationDays > 135
                    ? 'from-red-50 to-red-100 border-red-300'
                    : 'from-[#FFF4EE] to-orange-50 border-[#F37021]/20 shadow-[0_14px_30px_rgba(249,115,22,0.18)]'
                  : 'from-slate-50 to-slate-100 border-slate-200'
                }`}
              >
                <p className={`text-xs uppercase tracking-widest font-bold mb-2
                  ${durationDays && durationDays > 135 ? 'text-red-600' : 'text-[#F37021]'}`}
                >
                  Khoảng thời gian
                </p>
                <p className={`text-3xl font-black
                  ${durationDays && durationDays > 135
                    ? 'text-red-600'
                    : durationDays && durationDays > 0
                    ? 'text-[#F37021]'
                    : 'text-slate-400'
                  }`}
                >
                  {durationDays && durationDays > 0 ? formatDuration(durationDays) : '—'}
                </p>
                <p className="text-[10px] text-slate-500 mt-2">
                  {durationDays && durationDays > 135
                    ? '⚠️ Vượt quá giới hạn 135 ngày'
                    : 'Tối đa 135 ngày (4 tháng 15 ngày)'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notice */}
        {!isEdit && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200/90 flex gap-4 shadow-[0_14px_30px_rgba(59,130,246,0.16)]">
            <span className="material-symbols-outlined text-blue-500 shrink-0 w-9 h-9 rounded-full bg-white border border-blue-200 flex items-center justify-center">info</span>
            <p className="text-sm text-blue-800 leading-relaxed font-medium">
              Sau khi tạo kỳ thi, bạn có thể tạo các{' '}
              <span className="font-bold underline">đợt thi</span>{' '}
              (ví dụ: Block 10, Block 3) trong trang chi tiết kỳ thi.
              Mỗi đợt thi sẽ có tên riêng do bạn tự đặt.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-2 sticky bottom-4">
          {/* Lỗi từ API — hiển thị ngay trước nút */}
          {apiError && (
            <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm shadow-sm">
              <span className="material-symbols-outlined shrink-0 text-[20px]">error</span>
              <p className="font-medium">{apiError}</p>
            </div>
          )}
          <div className="flex items-center justify-end gap-4 bg-white/95 backdrop-blur-sm border border-slate-200/70 shadow-[0_14px_32px_rgba(15,23,42,0.1)] rounded-2xl p-3.5">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-8 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-all shadow-sm hover:shadow disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="relative px-10 py-2.5 rounded-xl bg-gradient-to-r from-[#F37021] to-orange-500 text-white font-bold shadow-md shadow-orange-500/25 hover:from-orange-600 hover:to-orange-600 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center gap-2 min-w-[140px] justify-center"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isEdit ? 'Đang cập nhật...' : 'Đang tạo...'}
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">
                    {isEdit ? 'save' : 'add_circle'}
                  </span>
                  {isEdit ? 'Cập nhật kỳ thi' : 'Tạo kỳ thi'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
