import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import examPaperApi from '../../services/examPaperApi';
import gradingCriteriaApi from '../../services/gradingCriteriaApi';

function fmtSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh',
  });
}

function normalizeErrorValue(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) {
    return value.map(normalizeErrorValue).filter(Boolean).join('\n');
  }
  if (typeof value === 'object') {
    return Object.values(value).map(normalizeErrorValue).filter(Boolean).join('\n');
  }
  return String(value).trim();
}

function getApiErrorMessage(err, fallback) {
  const body = err?.response?.data ?? err?.data ?? err;
  return normalizeErrorValue(body?.message)
      || normalizeErrorValue(body?.errors)
      || normalizeErrorValue(body?.error)
      || normalizeErrorValue(body?.detail)
      || normalizeErrorValue(err?.message)
      || fallback;
}

const CRITERION_TYPES = [
  { value: 'CLASS_EXISTS',       label: 'Lớp tồn tại (CLASS_EXISTS)' },
  { value: 'INTERFACE_EXISTS',   label: 'Interface tồn tại (INTERFACE_EXISTS)' },
  { value: 'FIELD_CHECK',        label: 'Kiểm tra field (FIELD_CHECK)' },
  { value: 'CONSTRUCTOR_CHECK',  label: 'Kiểm tra constructor (CONSTRUCTOR_CHECK)' },
  { value: 'METHOD_SIGNATURE',   label: 'Chữ ký method (METHOD_SIGNATURE)' },
  { value: 'GETTER_SETTER',      label: 'Getter / Setter (GETTER_SETTER)' },
  { value: 'EXTENDS_CHECK',      label: 'Kế thừa (EXTENDS_CHECK)' },
  { value: 'IMPLEMENTS_CHECK',   label: 'Triển khai interface (IMPLEMENTS_CHECK)' },
  { value: 'NAMING_CONVENTION',  label: 'Quy tắc đặt tên (NAMING_CONVENTION)' },
];

function StepBar({ step }) {
  return (
    <div className="flex items-center mb-10 w-full max-w-md mx-auto">
      {[1, 2].map((s) => (
        <React.Fragment key={s}>
          <div className="flex flex-col items-center relative z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-sm
              ${step === s ? 'bg-gradient-to-br from-[#F37120] to-orange-500 text-white ring-4 ring-orange-50 scale-110 shadow-orange-500/30' :
                step > s ? 'bg-green-100 text-green-600 ring-2 ring-green-50' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
              {step > s ? <span className="material-symbols-outlined text-base">check</span> : <span>{s}</span>}
            </div>
            <span className={`absolute top-12 whitespace-nowrap text-xs font-bold transition-colors duration-300
              ${step === s ? 'text-[#F37120]' : step > s ? 'text-green-600' : 'text-slate-400'}`}>
              {s === 1 ? 'Upload đề thi' : 'Tiêu chí OOP'}
            </span>
          </div>
          {s < 2 && (
            <div className="flex-1 mx-2 relative top-[-10px]">
              <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-500 rounded-full
                  ${step > s ? 'bg-green-400 w-full' : 'bg-[#F37120] w-0'}`} />
              </div>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Step 1: Upload ───────────────────────────────────────────────────────────
function Step1Upload({ examId, blockId, paper, loadingGet, onUploaded }) {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [examCode, setExamCode] = useState('');
  const [examCodeError, setExamCodeError] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const validateFile = (file) => {
    if (!file) return 'Vui lòng chọn file.';
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!['.zip', '.rar'].includes(ext)) return 'Chỉ chấp nhận file .zip hoặc .rar';
    if (file.size > 20 * 1024 * 1024) return 'File vượt quá giới hạn 20 MB';
    return null;
  };

  const handleFileSelect = (file) => {
    setUploadError('');
    const err = validateFile(file);
    if (err) { setUploadError(err); return; }
    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    if (!examCode.trim()) {
      setExamCodeError(true);
      return;
    }
    setExamCodeError(false);
    // If re-uploading, show custom confirm modal; otherwise upload directly
    if (displayPaper) {
      setShowConfirmModal(true);
    } else {
      doUpload();
    }
  };

  const doUpload = async () => {
    setShowConfirmModal(false);
    setUploading(true); setProgress(0); setUploadError('');
    try {
      const res = await examPaperApi.upload(examId, blockId, selectedFile, setProgress, examCode);
      const data = res?.data?.data ?? res?.data ?? res;
      onUploaded(data);
    } catch (err) {
      setUploadError(getApiErrorMessage(err, 'Upload thất bại. Vui lòng thử lại.'));
    } finally {
      setUploading(false);
    }
  };

  const displayPaper = paper;

  return (
    <>
      <div className="space-y-5">

      {!loadingGet && displayPaper && (
        <div className="bg-gradient-to-br from-emerald-50 to-green-50/30 border border-emerald-100 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0 border border-emerald-200/50 shadow-sm text-emerald-600">
              <span className="material-symbols-outlined text-2xl">task_alt</span>
            </div>
            <div className="flex-1">
              <h3 className="font-extrabold text-emerald-900 text-base flex items-center gap-2">
                {displayPaper.fileName}
                <span className="bg-emerald-200/50 text-emerald-700 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold">Current</span>
              </h3>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-medium text-emerald-700/80">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">sd_storage</span> {fmtSize(displayPaper.fileSizeBytes)}</span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">format_list_numbered</span> {displayPaper.totalQuestions} câu hỏi</span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">bug_report</span> {displayPaper.totalTestCases} test cases</span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span> {fmtDate(displayPaper.uploadedAt)}</span>
              </div>
              {displayPaper.examCode && (
                <div className="mt-3 inline-flex items-center gap-1.5 bg-white/60 border border-emerald-200/50 px-2.5 py-1 rounded-lg">
                  <span className="text-xs text-emerald-600 font-semibold">Mã đề:</span>
                  <span className="text-xs font-mono font-bold text-emerald-800">{displayPaper.examCode}</span>
                </div>
              )}
            </div>
          </div>

          {/* Questions preview */}
          {Array.isArray(displayPaper.questions) && displayPaper.questions.length > 0 && (
            <div className="mt-5 border border-emerald-100 rounded-xl p-4 bg-white/70 backdrop-blur-sm shadow-sm relative z-10">
              <p className="text-xs font-bold text-emerald-600/70 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">account_tree</span>
                Cấu trúc đề thi
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {displayPaper.questions.map((q, i) => (
                  <div key={q.questionId ?? i}
                    className="flex items-center justify-between bg-white border border-slate-100 rounded-lg px-3 py-2.5 hover:border-emerald-200 transition-colors shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-extrabold border border-emerald-100">
                        {q.questionNumber ?? i + 1}
                      </div>
                      <span className="text-sm font-semibold text-slate-700 line-clamp-1">
                        {q.title || `Câu ${q.questionNumber ?? i + 1}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold">
                      <span className="text-orange-500 bg-orange-50 px-2 py-0.5 rounded">{q.maxScore ?? '?'}đ</span>
                      {Array.isArray(q.testCases) && (
                        <span className="text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{q.testCases.length} TC</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Exam code input */}
      <div className={`bg-white rounded-2xl p-5 border shadow-sm relative overflow-hidden group transition-all
        ${examCodeError ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-100 focus-within:border-orange-200 focus-within:ring-4 focus-within:ring-orange-50'}`}>
        <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b transition-opacity
          ${examCodeError ? 'from-red-500 to-red-300 opacity-100' : 'from-[#F37120] to-amber-300 opacity-0 group-focus-within:opacity-100'}`} />
        <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
          <span className={`material-symbols-outlined text-lg ${examCodeError ? 'text-red-500' : 'text-[#F37120]'}`}>tag</span>
          Mã đề thi
          <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={examCode}
          onChange={(e) => { setExamCode(e.target.value); if (e.target.value.trim()) setExamCodeError(false); }}
          maxLength={50}
          placeholder="VD: PRO192_PE_FA25"
          disabled={uploading}
          className={`w-full bg-slate-50/50 border rounded-xl px-4 py-3 text-sm font-mono font-bold text-slate-800
                     focus:outline-none focus:bg-white transition-all shadow-inner
                     disabled:bg-slate-100 disabled:text-slate-400
                     ${examCodeError
                       ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-50'
                       : 'border-slate-200 focus:border-[#F37120] focus:ring-4 focus:ring-orange-50'}`}
        />
        {examCodeError ? (
          <p className="mt-2 text-[11px] text-red-600 flex items-center gap-1.5 font-semibold">
            <span className="material-symbols-outlined text-[14px]">error</span>
            Mã đề thi không được để trống. Vui lòng nhập trước khi upload.
          </p>
        ) : (
          <p className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
            <span className="material-symbols-outlined text-[14px]">info</span>
            Mã đề thi dùng để lưu trữ và truy xuất, ví dụ: PRO192_PE_FA25.
          </p>
        )}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFileSelect(e.dataTransfer.files?.[0]); }}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center
                    cursor-pointer transition-all duration-300 group overflow-hidden
                    ${dragging ? 'border-[#F37120] bg-orange-50/80 shadow-[0_0_40px_rgba(243,113,32,0.15)]' : 'border-slate-300 bg-slate-50/50 hover:bg-orange-50/30 hover:border-orange-300'}`}
      >
        <div className={`absolute inset-0 bg-gradient-to-b from-transparent to-[#F37120]/5 pointer-events-none transition-opacity duration-300 ${dragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
        
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-all duration-300 relative z-10
          ${dragging ? 'bg-[#F37120] text-white scale-110 shadow-lg shadow-orange-500/30' : 'bg-white text-slate-400 shadow-sm border border-slate-100 group-hover:text-[#F37120] group-hover:border-orange-200'}`}>
          <span className="material-symbols-outlined text-4xl">
            {dragging ? 'file_download' : 'cloud_upload'}
          </span>
        </div>
        
        <p className={`font-extrabold text-lg mb-1.5 transition-colors relative z-10 ${dragging ? 'text-[#F37120]' : 'text-slate-700'}`}>
          {dragging ? 'Thả file ngay!' : 'Click hoặc kéo thả file'}
        </p>
        <p className="text-slate-500 text-sm font-medium relative z-10 bg-white/60 px-3 py-1 rounded-full border border-slate-100">
          Chỉ nhận file <span className="font-bold text-slate-700">.zip</span> hoặc <span className="font-bold text-slate-700">.rar</span> (tối đa 20 MB)
        </p>
        <input ref={fileInputRef} type="file" accept=".zip,.rar" className="hidden"
          onChange={(e) => handleFileSelect(e.target.files?.[0])} />
      </div>

      {/* Selected file */}
      {selectedFile && (
        <div className="flex items-center justify-between bg-white rounded-xl p-4 border-2 border-[#F37120]/20 shadow-sm shadow-orange-500/5 animate-fade-in-up">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-[#F37120] border border-orange-100">
              <span className="material-symbols-outlined">folder_zip</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{selectedFile.name}</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">{fmtSize(selectedFile.size)}</p>
            </div>
          </div>
          <button onClick={() => setSelectedFile(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

      {/* Progress */}
      {uploading && (
        <div className="space-y-2 bg-white border border-orange-100 rounded-xl p-4 shadow-sm">
          <div className="flex justify-between text-xs text-[#F37120] font-bold">
            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm animate-spin">sync</span>Đang tải lên hệ thống...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 bg-orange-50 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#F37120] to-amber-400 rounded-full transition-all duration-300 relative"
              style={{ width: `${progress}%` }}>
               <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {uploadError && (
        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-start gap-2 text-sm animate-fade-up">
          <span className="material-symbols-outlined text-base mt-0.5">error</span>
          <span className="whitespace-pre-line">{uploadError}</span>
        </div>
      )}

      {/* Warning */}
      <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-4 shadow-sm flex gap-3 animate-fade-up">
        <span className="material-symbols-outlined text-amber-500 mt-0.5">info</span>
        <div>
          <p className="text-sm font-bold text-amber-800">Lưu ý quan trọng</p>
          <p className="text-xs font-medium text-amber-700/80 mt-1 leading-relaxed">
            Tải lên tệp mới sẽ <strong className="text-amber-800">ghi đè toàn bộ dữ liệu đề thi hiện có</strong> (câu hỏi, test cases) và <strong className="text-amber-800">  xóa đi hết tất cả tiêu chí chấm</strong>.
            Tính năng xóa bị vô hiệu hóa nếu đã có sinh viên nộp bài.
          </p>
        </div>
      </div>

      {/* Action */}
      <div className="pt-2 space-y-3 animate-fade-up">
        <button type="button" onClick={handleUpload} disabled={!selectedFile || uploading}
          className="w-full bg-gradient-to-r from-[#F37120] to-orange-500 hover:from-orange-600 hover:to-orange-600 text-white font-extrabold py-3.5 px-6
                     rounded-xl transition-all shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2
                     disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transform active:scale-[0.98]">
          <span className="material-symbols-outlined">cloud_upload</span>
          {uploading ? `Đang xử lý… ${progress}%` : (displayPaper ? 'Xác nhận upload lại đề thi' : 'Tiến hành upload')}
        </button>

        {displayPaper && (
          <button type="button" onClick={() => onUploaded(displayPaper)}
            className="w-full bg-white text-slate-700 hover:text-[#F37120] hover:bg-orange-50 font-bold py-3.5 px-6
                       rounded-xl border border-slate-200 hover:border-orange-200 transition-all shadow-sm flex items-center justify-center gap-2 group">
            <span className="font-semibold">Bỏ qua — Tiếp tục sang Bước 2</span>
            <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
          </button>
        )}
      </div>
    </div>

    {/* ── Custom Confirm Modal ────────────────────────────────── */}
    {showConfirmModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
        style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(15,23,42,0.5)' }}
        onMouseDown={(event) => { if (event.target === event.currentTarget) setShowConfirmModal(false); }}>
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-pop-in">

          {/* Header */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 px-6 pt-6 pb-4 flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center shrink-0 border border-red-200">
              <span className="material-symbols-outlined text-red-500 text-2xl">warning</span>
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Xác nhận tải lại đề thi</h3>
              <p className="text-sm text-slate-500 mt-0.5">Hành động này không thể hoàn tác</p>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-4 space-y-3">
            <p className="text-sm text-slate-700 leading-relaxed">Tải lên tệp mới sẽ:</p>
            <ul className="space-y-2">
              {[
                { icon: 'delete_sweep', text: 'Xóa toàn bộ câu hỏi và test cases hiện có' },
                { icon: 'rule_settings', text: 'Xóa hết tất cả tiêu chí chấm điểm OOP đã cấu hình' },
                { icon: 'file_upload', text: `Thay thế bằng nội dung từ "${selectedFile?.name}"` },
              ].map(({ icon, text }) => (
                <li key={icon} className="flex items-center gap-3 text-sm">
                  <span className="w-7 h-7 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-red-500 text-sm">{icon}</span>
                  </span>
                  <span className="text-slate-700 font-medium">{text}</span>
                </li>
              ))}
            </ul>
          
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex gap-3">
            <button onClick={() => setShowConfirmModal(false)}
              className="flex-1 py-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">
              Hủy bỏ
            </button>
            <button onClick={doUpload}
              className="flex-[2] py-3 rounded-xl font-extrabold text-white
                         bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700
                         shadow-lg shadow-red-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-lg">cloud_upload</span>
              Xác nhận tải lại
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

// ─── Param schema per criterion type ────────────────────────────────────────
const PARAM_SCHEMA = {
  CLASS_EXISTS: [
    { key: 'className', label: 'Tên lớp', placeholder: 'VD: Product', required: true },
  ],
  INTERFACE_EXISTS: [
    { key: 'className', label: 'Tên interface', placeholder: 'VD: Printable', required: true },
  ],
  FIELD_CHECK: [
    { key: 'className',      label: 'Tên lớp',         placeholder: 'VD: Product',  required: true },
    { key: 'fieldName',      label: 'Tên field',        placeholder: 'VD: price',    required: true },
    { key: 'fieldType',      label: 'Kiểu dữ liệu',    placeholder: 'VD: double',   required: false },
    { key: 'accessModifier', label: 'Phạm vi truy cập', placeholder: 'VD: private',  required: false,
      type: 'select', options: ['', 'private', 'protected', 'public'] },
  ],
  CONSTRUCTOR_CHECK: [
    { key: 'className',  label: 'Tên lớp',            placeholder: 'VD: Product',           required: true },
    { key: 'paramTypes', label: 'Kiểu tham số (cách nhau bởi dấu phẩy)', placeholder: 'VD: String, String, double  (để trống = constructor mặc định)',
      required: false, type: 'csv' },
  ],
  METHOD_SIGNATURE: [
    { key: 'className',      label: 'Tên lớp',              placeholder: 'VD: Product',     required: true },
    { key: 'methodName',     label: 'Tên phương thức',      placeholder: 'VD: getDiscount', required: true },
    { key: 'returnType',     label: 'Kiểu trả về',          placeholder: 'VD: double',      required: false },
    { key: 'paramTypes',     label: 'Kiểu tham số (cách nhau bởi dấu phẩy)', placeholder: 'VD: String, int  (để trống = không có tham số)',
      required: false, type: 'csv' },
    { key: 'accessModifier', label: 'Phạm vi truy cập',     placeholder: 'VD: public',      required: false,
      type: 'select', options: ['', 'public', 'protected', 'private'] },
    { key: 'requireOverride', label: 'Yêu cầu annotation @Override', type: 'checkbox', defaultVal: false },
  ],
  GETTER_SETTER: [
    { key: 'className',      label: 'Tên lớp',   placeholder: 'VD: Product', required: true },
    { key: 'fieldName',      label: 'Tên field', placeholder: 'VD: price',   required: true },
    { key: 'accessModifier', label: 'Phạm vi truy cập (getter & setter)', placeholder: 'VD: public', required: false,
      type: 'select', options: ['', 'public', 'protected', 'private'] },
  ],
  EXTENDS_CHECK: [
    { key: 'className',   label: 'Tên lớp con',  placeholder: 'VD: Car',     required: true },
    { key: 'parentClass', label: 'Tên lớp cha',  placeholder: 'VD: Vehicle', required: true },
  ],
  IMPLEMENTS_CHECK: [
    { key: 'className',     label: 'Tên lớp',      placeholder: 'VD: Product',   required: true },
    { key: 'interfaceName', label: 'Tên interface', placeholder: 'VD: Printable', required: true },
  ],
  NAMING_CONVENTION: [
    { key: 'className',   label: 'Tên lớp',              placeholder: 'VD: Product', required: true },
    { key: 'checkFields', label: 'Kiểm tra tên field',   type: 'checkbox', defaultVal: true },
  ],
};

/** Chuyển giá trị form fields → JSON string để gửi lên backend */
function buildParamsJson(criterionType, formValues) {
  const schema = PARAM_SCHEMA[criterionType] ?? [];
  const obj = {};
  for (const field of schema) {
    const val = formValues[field.key];
    if (field.type === 'csv') {
      if (val && val.trim()) {
        obj[field.key] = val.split(',').map((s) => s.trim()).filter(Boolean);
      } else {
        obj[field.key] = [];
      }
    } else if (field.type === 'checkbox') {
      obj[field.key] = val !== false && val !== 'false';
    } else if (val !== undefined && val !== '') {
      obj[field.key] = val;
    }
  }
  return JSON.stringify(obj);
}

/** Chuyển JSON string → form field values */
function parseParamsJson(criterionType, jsonStr) {
  const schema = PARAM_SCHEMA[criterionType] ?? [];
  let parsed = {};
  try { if (jsonStr && jsonStr.trim() && jsonStr.trim() !== '{}') parsed = JSON.parse(jsonStr); } catch {
    // ignore invalid JSON
  }
  const out = {};
  for (const field of schema) {
    const raw = parsed[field.key];
    if (field.type === 'csv') {
      out[field.key] = Array.isArray(raw) ? raw.join(', ') : (raw ?? '');
    } else if (field.type === 'checkbox') {
      out[field.key] = raw !== undefined ? raw : (field.defaultVal ?? true);
    } else {
      out[field.key] = raw ?? '';
    }
  }
  return out;
}

// ─── Param form fields component ─────────────────────────────────────────────
function ParamFields({ criterionType, formValues, onChange }) {
  const schema = PARAM_SCHEMA[criterionType] ?? [];
  if (schema.length === 0) {
    return (
      <p className="text-xs text-slate-400 italic">Loại này không cần tham số thêm.</p>
    );
  }
  return (
    <div className="space-y-2">
      {schema.map((field) => (
        <div key={field.key}>
          <label className="block text-xs font-semibold text-slate-600 mb-0.5">
            {field.label}
            {field.required && <span className="ml-1 text-red-400">*</span>}
          </label>

          {field.type === 'checkbox' ? (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formValues[field.key] !== false && formValues[field.key] !== 'false'}
                onChange={(e) => onChange(field.key, e.target.checked)}
                className="w-4 h-4 rounded accent-[#F37021]"
              />
              <span className="text-xs text-slate-600">Bật kiểm tra</span>
            </label>
          ) : field.type === 'select' ? (
            <select
              value={formValues[field.key] ?? ''}
              onChange={(e) => onChange(field.key, e.target.value)}
              className="w-full border border-[#EAECF0] rounded-lg px-3 py-2 text-sm bg-white
                         focus:outline-none focus:border-[#F37021] focus:ring-1 focus:ring-[#F37021]/30">
              {field.options.map((o) => (
                <option key={o} value={o}>{o || '-- Không bắt buộc --'}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={formValues[field.key] ?? ''}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full border border-[#EAECF0] rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:border-[#F37021] focus:ring-1 focus:ring-[#F37021]/30"
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Criterion list item ──────────────────────────────────────────────────────────────
function CriterionListItem({ row, index, onEdit, onRemove }) {
  const typeLabel = CRITERION_TYPES.find(t => t.value === row.criterionType)?.label || row.criterionType || 'Chưa chọn';
  return (
    <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-orange-300 hover:shadow-md transition-all group animate-fade-up hover-lift-soft" style={{ "--enter-delay": `${Math.min(index, 6) * 55}ms` }}>
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-extrabold text-sm border border-slate-200 shrink-0">
          {index + 1}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-extrabold text-slate-800">{row.criteriaCode || '(Chưa có mã)'}</span>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">{row.maxScore || '0'}đ</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{typeLabel}</span>
          </div>
          <p className="text-sm text-slate-600 font-medium line-clamp-1">{row.description || '(Chưa có mô tả)'}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={onEdit} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-[#F37120] transition-all duration-200 hover:scale-105">
          <span className="material-symbols-outlined text-lg">edit</span>
        </button>
        <button onClick={onRemove} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all duration-200 hover:scale-105">
          <span className="material-symbols-outlined text-lg">delete</span>
        </button>
      </div>
    </div>
  );
}

// ─── Criterion modal ──────────────────────────────────────────────────────────
function CriterionModal({ initialRow, index, onClose, onSave }) {
  const [row, setRow] = useState(() => ({ ...initialRow }));
  const [formValues, setFormValues] = useState(() => parseParamsJson(row.criterionType, row.checkParamsJson));
  const [error, setError] = useState('');

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const onChange = (updates) => setRow(r => ({ ...r, ...updates }));

  const handleTypeChange = (newType) => {
    const defaults = parseParamsJson(newType, '{}');
    setFormValues(defaults);
    setRow(r => ({ ...r, criterionType: newType, checkParamsJson: buildParamsJson(newType, defaults) }));
  };

  const handleParamChange = (key, val) => {
    const updated = { ...formValues, [key]: val };
    setFormValues(updated);
    setRow(r => ({ ...r, checkParamsJson: buildParamsJson(row.criterionType, updated) }));
  };

  const handleSave = () => {
    if (!row.criteriaCode?.trim()) return setError('Mã tiêu chí không được để trống');
    if (!row.criterionType) return setError('Vui lòng chọn loại kiểm tra');
    if (!row.description?.trim()) return setError('Mô tả không được để trống');
    if (row.maxScore === '' || parseFloat(row.maxScore) < 0) return setError('Điểm tối đa phải hợp lệ');
    
    onSave(row);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in" style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(15,23,42,0.58)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-pop-in">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#F37120]">edit_document</span>
            {index != null ? `Chỉnh sửa Tiêu chí #${index + 1}` : 'Thêm Tiêu chí mới'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm font-semibold rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span> {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mã tiêu chí <span className="text-red-500">*</span></label>
              <input value={row.criteriaCode} onChange={(e) => { onChange({ criteriaCode: e.target.value }); setError(''); }} placeholder="VD: Q1.1" maxLength={20} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#F37021] focus:ring-2 focus:ring-orange-50 font-bold" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Điểm tối đa <span className="text-red-500">*</span></label>
              <input type="number" min="0" step="0.5" value={row.maxScore} onChange={(e) => { onChange({ maxScore: e.target.value }); setError(''); }} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#F37021] focus:ring-2 focus:ring-orange-50 font-bold" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Loại kiểm tra <span className="text-red-500">*</span></label>
              <select value={row.criterionType} onChange={(e) => { handleTypeChange(e.target.value); setError(''); }} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#F37021] focus:ring-2 focus:ring-orange-50 font-bold text-slate-700 bg-white">
                <option value="">-- Chọn loại --</option>
                {CRITERION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mô tả chi tiết <span className="text-red-500">*</span></label>
              <input value={row.description} onChange={(e) => { onChange({ description: e.target.value }); setError(''); }} placeholder="VD: Phải có thuộc tính private name" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#F37021] focus:ring-2 focus:ring-orange-50 font-medium" />
            </div>
          </div>

          {row.criterionType && (
            <div className="border border-orange-100/60 rounded-xl p-4 bg-orange-50/30 mt-4 relative animate-fade-up">
              <p className="absolute -top-3 left-4 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100/50 text-[10px] font-bold text-[#F37120] uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">tune</span> Tham số bổ sung
              </p>
              <div className="mt-2">
                <ParamFields criterionType={row.criterionType} formValues={formValues} onChange={handleParamChange} />
              </div>
              <details className="mt-4 group/details">
                <summary className="text-[11px] font-semibold text-slate-400 cursor-pointer hover:text-slate-600 flex items-center gap-0.5 w-fit select-none">
                  <span className="material-symbols-outlined text-[16px] transition-transform group-open/details:rotate-90">arrow_right</span> Xem JSON
                </summary>
                <pre className="mt-2 text-[11px] bg-slate-800 text-green-400 rounded-lg p-3 overflow-x-auto font-mono">{JSON.stringify(JSON.parse(row.checkParamsJson || '{}'), null, 2)}</pre>
              </details>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex gap-3 justify-end bg-slate-50/50">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors">Hủy bỏ</button>
          <button onClick={handleSave} className="px-6 py-2.5 rounded-xl font-extrabold text-white bg-gradient-to-r from-[#F37120] to-orange-500 hover:from-orange-600 hover:to-orange-600 shadow-lg shadow-orange-500/30 transition-all active:scale-[0.98] flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">save</span> Lưu tiêu chí
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}


// ─── Step 2: Criteria ─────────────────────────────────────────────────────────
function Step2Criteria({ examId, paper, onBack, onDone }) {
  const questions = paper?.questions ?? [];
  const [activeQ, setActiveQ] = useState(0);
  // criteriaMap[questionId] = [...rows]
  const [criteriaMap, setCriteriaMap] = useState({});
  const [loading, setLoading] = useState(true);   // loading existing criteria
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveOk, setSaveOk] = useState(false);
  const [editingRow, setEditingRow] = useState(null); // { qId, idx, isNew, row }

  const currentQ = questions[activeQ];

  // ── Load criteria đã lưu từ backend khi component mount ──────────────────
  useEffect(() => {
    if (!examId || questions.length === 0) { setLoading(false); return; }

    const fetchAll = async () => {
      setLoading(true);
      try {
        const results = await Promise.all(
          questions.map((q) =>
            gradingCriteriaApi
              .listByQuestion(examId, q.questionId)
              // axiosClient interceptor đã unwrap res.data → response là { success, data, message }
              .then((res) => ({ qId: q.questionId, data: res?.data ?? [] }))
              .catch(() => ({ qId: q.questionId, data: [] }))
          )
        );

        const map = {};
        for (const { qId, data } of results) {
          map[qId] = data.map((c) => ({
            criteriaCode:    c.criteriaCode   ?? '',
            criteriaGroup:   c.criteriaGroup  ?? 'STRUCTURAL',
            criterionType:   c.criterionType  ?? '',
            description:     c.description    ?? '',
            maxScore:        c.maxScore != null ? String(c.maxScore) : '',
            checkParamsJson: c.checkParamsJson ?? '{}',
            displayOrder:    c.displayOrder   ?? 0,
          }));
        }
        setCriteriaMap(map);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  const getCriteria = (qId) => criteriaMap[qId] ?? [];

  const setCriteria = (qId, list) =>
    setCriteriaMap((prev) => ({ ...prev, [qId]: list }));

  const addRow = () => {
    if (!currentQ) return;
    const rows = getCriteria(currentQ.questionId);
    setEditingRow({
      qId: currentQ.questionId,
      idx: rows.length,
      isNew: true,
      row: {
        criteriaCode: `Q${currentQ.questionNumber ?? activeQ + 1}.${rows.length + 1}`,
        criterionType: '', description: '', maxScore: '', checkParamsJson: '{}', displayOrder: rows.length
      }
    });
  };

  const editRow = (qId, idx) => {
    const row = getCriteria(qId)[idx];
    setEditingRow({
      qId,
      idx,
      isNew: false,
      row
    });
  };

  const handleSaveModal = (savedRow) => {
    const { qId, idx, isNew } = editingRow;
    if (isNew) {
      setCriteria(qId, [...getCriteria(qId), savedRow]);
    } else {
      setCriteria(qId, (prev => {
        const rows = [...(prev ?? [])];
        rows[idx] = savedRow;
        return rows;
      })(criteriaMap[qId] ?? []));
    }
    setEditingRow(null);
  };

  const removeRow = (qId, idx) => {
    const rows = getCriteria(qId).filter((_, i) => i !== idx);
    setCriteria(qId, rows);
  };

  // Validate: sum of maxScore of current question <= question.maxScore
  const getSum = (qId) =>
    getCriteria(qId).reduce((s, r) => s + (parseFloat(r.maxScore) || 0), 0);

  const isMismatchScore = (q) => {
    if (!q) return false;
    const sum = getSum(q.questionId);
    const max = parseFloat(q.maxScore || 0);
    return Math.abs(sum - max) > 0.001;
  };

  const hasAnyError = questions.some((q) => isMismatchScore(q));

  const handleSave = async () => {
    setSaveError(''); setSaveOk(false);

    // ── Validate trước khi gửi ──────────────────────────────────────
    for (const q of questions) {
      const rows = getCriteria(q.questionId);
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const label = `Câu ${q.questionNumber ?? '?'} – Tiêu chí #${i + 1}`;
        if (!r.criterionType) {
          setSaveError(`${label}: Vui lòng chọn "Loại kiểm tra".`); return;
        }
        if (!r.criteriaCode?.trim()) {
          setSaveError(`${label}: "Mã tiêu chí" không được để trống.`); return;
        }
        if (!r.description?.trim()) {
          setSaveError(`${label}: "Mô tả" không được để trống.`); return;
        }
        if (r.maxScore === '' || r.maxScore === null || r.maxScore === undefined ||
            parseFloat(r.maxScore) < 0) {
          setSaveError(`${label}: "Điểm tối đa" phải ≥ 0.`); return;
        }
      }
    }

    setSaving(true);
    try {
      for (const q of questions) {
        const rows = getCriteria(q.questionId);
        if (rows.length === 0) continue;

        // Gửi chỉ đúng các field mà DTO GradingCriteriaRequest cần
        const payload = rows.map((r, i) => {
          let trimmedParamsJson = r.checkParamsJson || '{}';
          try {
            const parsed = JSON.parse(trimmedParamsJson);
            for (const key in parsed) {
              if (typeof parsed[key] === 'string') {
                parsed[key] = parsed[key].trim();
              }
            }
            trimmedParamsJson = JSON.stringify(parsed);
          } catch {
            // ignore invalid JSON
          }

          return {
            criteriaCode:  r.criteriaCode.trim(),
            criteriaGroup: r.criteriaGroup ?? 'STRUCTURAL',
            criterionType: r.criterionType,          // enum string, e.g. "CLASS_EXISTS"
            description:   r.description.trim(),
            maxScore:      parseFloat(r.maxScore) || 0,
            checkParamsJson: trimmedParamsJson,
            displayOrder:  i,
          };
        });

        await gradingCriteriaApi.saveBatch(examId, q.questionId, payload);
      }
      setSaveOk(true);
      setTimeout(() => onDone?.(), 1500);
    } catch (err) {
      setSaveError(getApiErrorMessage(err, 'Lưu thất bại. Vui lòng thử lại.'));
    } finally {
      setSaving(false);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <span className="material-symbols-outlined text-5xl mb-3">quiz</span>
        <p className="text-sm">Không tìm thấy câu hỏi nào trong đề thi.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
        <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
        <p className="text-sm">Đang tải tiêu chí đã lưu…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Question tabs */}
      <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-100 animate-fade-up">
        {questions.map((q, i) => {
          const over = isMismatchScore(q);
          return (
            <button key={q.questionId ?? i} onClick={() => setActiveQ(i)}
              className={`px-4 py-2 rounded-full text-sm font-bold border transition-all duration-300 flex items-center gap-1.5
                ${activeQ === i
                  ? 'bg-[#F37120] text-white border-[#F37120] shadow-md shadow-orange-500/20'
                  : over
                    ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-orange-300 hover:bg-orange-50/50'}`}>
              Câu {q.questionNumber ?? i + 1}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeQ === i ? 'bg-white/20' : 'bg-white/60 shadow-sm border border-slate-100'}`}>
                {q.maxScore ?? '?'}đ
              </span>
              {over && <span className="material-symbols-outlined text-sm ml-1">warning</span>}
            </button>
          );
        })}
      </div>

      {/* Current question header */}
      {currentQ && (
        <div className="bg-gradient-to-r from-orange-50/50 to-white border border-orange-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-fade-up hover-lift-soft stagger-1">
          <div>
            <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#F37120]">quiz</span>
              Câu {currentQ.questionNumber ?? activeQ + 1}: {currentQ.title || '(Không có tiêu đề)'}
            </h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
              <p className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                Điểm câu hỏi: <span className="font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-md">{currentQ.maxScore ?? '?'}</span>
              </p>
              <div className="w-1 h-1 rounded-full bg-slate-300" />
              <p className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                Tổng tiêu chí hiện tại: 
                <span className={`font-bold px-2 py-0.5 rounded-md ${isMismatchScore(currentQ) ? 'text-red-600 bg-red-100' : 'text-emerald-600 bg-emerald-100'}`}>
                  {getSum(currentQ.questionId).toFixed(2)}
                </span>
              </p>
            </div>
          </div>
          <button onClick={addRow}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-bold shadow-md transition-all active:scale-95">
            <span className="material-symbols-outlined text-base">add_circle</span>
            Thêm tiêu chí
          </button>
        </div>
      )}

      {/* Over-limit warning */}
      {currentQ && isMismatchScore(currentQ) && (
        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-2 text-sm animate-fade-up">
          <span className="material-symbols-outlined text-base">error</span>
          Tổng điểm các tiêu chí ({getSum(currentQ.questionId).toFixed(2)}) chưa khớp với điểm tối đa của câu hỏi ({currentQ.maxScore}).
        </div>
      )}

      {/* Criteria rows */}
      {currentQ && getCriteria(currentQ.questionId).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-3xl text-slate-400 animate-fade-up">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 mb-4">
            <span className="material-symbols-outlined text-4xl text-slate-300">rule</span>
          </div>
          <p className="text-slate-600 font-semibold">Chưa có tiêu chí nào cho câu này</p>
          <p className="text-sm mt-1 mb-4">Nhấn "Thêm tiêu chí" để cấu hình tự động chấm điểm.</p>
          <button onClick={addRow} className="text-[#F37120] font-bold text-sm hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">add</span> Thêm ngay
          </button>
        </div>
      ) : (
        <div className="space-y-3 animate-fade-up">
          {currentQ && getCriteria(currentQ.questionId).map((row, idx) => (
            <CriterionListItem key={idx} row={row} index={idx}
              onEdit={() => editRow(currentQ.questionId, idx)}
              onRemove={() => removeRow(currentQ.questionId, idx)} />
          ))}
        </div>
      )}

      {/* Save / error */}
      {saveError && (
        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-2 text-sm animate-fade-up">
          <span className="material-symbols-outlined text-base">error</span>{saveError}
        </div>
      )}
      {saveOk && (
        <div className="p-3 bg-green-50 text-green-700 border border-green-200 rounded-lg flex items-center gap-2 text-sm animate-fade-up">
          <span className="material-symbols-outlined text-base">check_circle</span>
          Lưu tiêu chí thành công! Đang quay về…
        </div>
      )}

      <div className="flex gap-4 pt-6 mt-6 border-t border-slate-100 animate-fade-up">
        <button onClick={onBack}
          className="flex-1 bg-white text-slate-700 border-2 border-slate-200 font-bold py-3.5 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2 group">
          <span className="material-symbols-outlined text-lg transition-transform group-hover:-translate-x-1">arrow_back</span>
          Quay lại Bước 1
        </button>
        <button onClick={handleSave} disabled={saving || hasAnyError}
          className="flex-[2] bg-gradient-to-r from-[#F37120] to-orange-500 hover:from-orange-600 hover:to-orange-600 text-white font-extrabold py-3.5 rounded-xl
                     transition-all shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2
                     disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed active:scale-[0.98]">
          <span className="material-symbols-outlined text-lg">{saving ? 'sync' : 'save_as'}</span>
          {saving ? 'Đang lưu cấu hình…' : 'Hoàn tất & Lưu tiêu chí'}
        </button>
      </div>

      {editingRow && (
        <CriterionModal
          initialRow={editingRow.row}
          index={editingRow.isNew ? null : editingRow.idx}
          onClose={() => setEditingRow(null)}
          onSave={handleSaveModal}
        />
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function UploadExamPaperPage({ examId, blockId, onBack, initialStep = 1 }) {
  const [step, setStep] = useState(initialStep);
  const [paper, setPaper] = useState(null);
  const [loadingGet, setLoadingGet] = useState(true);

  const loadPaper = useCallback(() => {
    if (!examId || !blockId) return;
    setLoadingGet(true);
    examPaperApi.getByBlock(examId, blockId)
      .then((res) => setPaper(res?.data ?? res ?? null))
      .catch(() => setPaper(null))
      .finally(() => setLoadingGet(false));
  }, [examId, blockId]);

  useEffect(() => {
    const run = () => {
      loadPaper();
    };

    const timer = window.setTimeout(run, 0);
    return () => window.clearTimeout(timer);
  }, [loadPaper]);

  const handleUploaded = (data) => {
    setPaper(data);
    setStep(2);
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen p-6 sm:p-8 relative overflow-hidden">
      {/* Decorative background blurs */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-orange-200/30 blur-[100px]" />
      <div className="pointer-events-none absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-amber-200/20 blur-[100px]" />
      
      <div className="max-w-[820px] mx-auto space-y-6 relative z-10">

        {/* Back */}
        <button type="button" onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-[#F37120] transition-all duration-200 hover:-translate-x-1 text-sm font-bold group bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-slate-100 w-fit animate-fade-up">
          <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
          Quay lại chi tiết Block
        </button>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white p-6 sm:p-10 relative overflow-hidden animate-fade-up stagger-1">
          {/* Subtle top border gradient */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-200 via-[#F37120] to-amber-300 opacity-80" />
          
          <div className="mb-10 text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-50 to-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-100 shadow-sm">
              <span className="material-symbols-outlined text-3xl text-[#F37120]">settings_suggest</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Cấu hình Đề thi</h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
              Tải lên cấu trúc đề thi và thiết lập chi tiết các tiêu chí chấm OOP cho từng câu hỏi trong hệ thống.
            </p>
          </div>

          <StepBar step={step} />

          <div className="mt-8 transition-all duration-500 animate-fade-up stagger-2">
            {step === 1 && (
              <Step1Upload
                examId={examId} blockId={blockId}
                paper={paper} loadingGet={loadingGet}
                onUploaded={handleUploaded} />
            )}

            {step === 2 && (
              <Step2Criteria
                examId={examId} paper={paper}
                onBack={() => setStep(1)}
                onDone={onBack} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
