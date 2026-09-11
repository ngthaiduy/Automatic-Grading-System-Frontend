import React, { useCallback, useEffect, useState } from 'react';
import examPaperApi from '../../services/examPaperApi';
import gradingCriteriaApi from '../../services/gradingCriteriaApi';

// ─── Shared constants ──────────────────────────────────────────────────────────
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

const PARAM_SCHEMA = {
  CLASS_EXISTS:      [{ key: 'className',      label: 'Tên lớp',         placeholder: 'VD: Product',   required: true }],
  INTERFACE_EXISTS:  [{ key: 'className',      label: 'Tên interface',   placeholder: 'VD: Printable', required: true }],
  FIELD_CHECK: [
    { key: 'className',      label: 'Tên lớp',          placeholder: 'VD: Product', required: true },
    { key: 'fieldName',      label: 'Tên field',         placeholder: 'VD: price',   required: true },
    { key: 'fieldType',      label: 'Kiểu dữ liệu',     placeholder: 'VD: double',  required: false },
    { key: 'accessModifier', label: 'Phạm vi truy cập', placeholder: 'VD: private', required: false,
      type: 'select', options: ['', 'private', 'protected', 'public'] },
  ],
  CONSTRUCTOR_CHECK: [
    { key: 'className',  label: 'Tên lớp',    placeholder: 'VD: Product', required: true },
    { key: 'paramTypes', label: 'Kiểu tham số (phẩy)', placeholder: 'VD: String, double', required: false, type: 'csv' },
  ],
  METHOD_SIGNATURE: [
    { key: 'className',      label: 'Tên lớp',              placeholder: 'VD: Product',     required: true },
    { key: 'methodName',     label: 'Tên phương thức',      placeholder: 'VD: toString',    required: true },
    { key: 'returnType',     label: 'Kiểu trả về',          placeholder: 'VD: String',      required: false },
    { key: 'paramTypes',     label: 'Kiểu tham số (phẩy)',  placeholder: 'VD: String, int', required: false, type: 'csv' },
    { key: 'accessModifier', label: 'Phạm vi truy cập',     placeholder: 'VD: public',      required: false,
      type: 'select', options: ['', 'public', 'protected', 'private'] },
    { key: 'requireOverride', label: 'Yêu cầu annotation @Override', type: 'checkbox', defaultVal: false },
  ],
  GETTER_SETTER:     [{ key: 'className', label: 'Tên lớp', placeholder: 'VD: Product', required: true },
                      { key: 'fieldName', label: 'Tên field', placeholder: 'VD: price', required: true },
                      { key: 'accessModifier', label: 'Phạm vi truy cập (getter & setter)', placeholder: 'VD: public', required: false,
                        type: 'select', options: ['', 'public', 'protected', 'private'] }],
  EXTENDS_CHECK:     [{ key: 'className',   label: 'Lớp con', placeholder: 'VD: Car',     required: true },
                      { key: 'parentClass', label: 'Lớp cha', placeholder: 'VD: Vehicle', required: true }],
  IMPLEMENTS_CHECK:  [{ key: 'className',     label: 'Tên lớp',      placeholder: 'VD: Product',   required: true },
                      { key: 'interfaceName', label: 'Tên interface', placeholder: 'VD: Printable', required: true }],
  NAMING_CONVENTION: [
    { key: 'className',    label: 'Tên lớp',                    placeholder: 'VD: Product', required: true },
    { key: 'checkFields',  label: 'Kiểm tra tên thuộc tính',    type: 'checkbox', defaultVal: true },
    { key: 'checkMethods', label: 'Kiểm tra tên phương thức',   type: 'checkbox', defaultVal: false },
  ],
};

function buildParamsJson(criterionType, formValues) {
  const schema = PARAM_SCHEMA[criterionType] ?? [];
  const obj = {};
  for (const field of schema) {
    const val = formValues[field.key];
    if (field.type === 'csv') {
      obj[field.key] = val?.trim() ? val.split(',').map((s) => s.trim()).filter(Boolean) : [];
    } else if (field.type === 'checkbox') {
      obj[field.key] = val !== false && val !== 'false';
    } else if (val !== undefined && val !== '') {
      obj[field.key] = val;
    }
  }
  return JSON.stringify(obj);
}

function parseParamsJson(criterionType, jsonStr) {
  const schema = PARAM_SCHEMA[criterionType] ?? [];
  let parsed = {};
  try { if (jsonStr && jsonStr.trim() && jsonStr.trim() !== '{}') parsed = JSON.parse(jsonStr); } catch {
    // ignore invalid JSON
  }
  const out = {};
  for (const field of schema) {
    const raw = parsed[field.key];
    if (field.type === 'csv') out[field.key] = Array.isArray(raw) ? raw.join(', ') : (raw ?? '');
    else if (field.type === 'checkbox') out[field.key] = raw !== undefined ? raw : (field.defaultVal ?? true);
    else out[field.key] = raw ?? '';
  }
  return out;
}

function toPlainScoreString(value) {
  const raw = String(value ?? '').trim().replace(',', '.');
  if (!raw) return '0';
  const numberValue = Number(raw);
  if (!Number.isFinite(numberValue)) return '0';
  if (!/[eE]/.test(raw)) return raw;
  return numberValue.toLocaleString('en-US', {
    useGrouping: false,
    maximumFractionDigits: 20,
  });
}

function getScoreFractionLength(value) {
  const fraction = toPlainScoreString(value).split('.')[1] ?? '';
  return fraction.replace(/0+$/, '').length;
}

function scoreToScaledInteger(value, scale) {
  const raw = toPlainScoreString(value);
  const sign = raw.startsWith('-') ? -1n : 1n;
  const unsigned = raw.replace(/^[-+]/, '');
  const [wholeRaw = '0', fractionRaw = ''] = unsigned.split('.');
  const whole = wholeRaw.replace(/\D/g, '') || '0';
  const fraction = fractionRaw.replace(/\D/g, '').padEnd(scale, '0').slice(0, scale);
  return sign * BigInt(`${whole}${fraction}` || '0');
}

function formatScaledScore(amount, scale) {
  const sign = amount < 0n ? '-' : '';
  const absolute = (amount < 0n ? -amount : amount).toString().padStart(scale + 1, '0');
  if (scale === 0) return `${sign}${absolute}`;
  const whole = absolute.slice(0, -scale) || '0';
  const fraction = absolute.slice(-scale).replace(/0+$/, '');
  return `${sign}${whole}${fraction ? `.${fraction}` : ''}`;
}

function sumScoresWithoutRounding(values) {
  const scale = Math.max(0, ...values.map(getScoreFractionLength));
  const total = values.reduce((sum, value) => sum + scoreToScaledInteger(value, scale), 0n);
  return formatScaledScore(total, scale);
}

function scoresAreEqual(left, right) {
  const scale = Math.max(getScoreFractionLength(left), getScoreFractionLength(right));
  return scoreToScaledInteger(left, scale) === scoreToScaledInteger(right, scale);
}

// ─── ParamFields ───────────────────────────────────────────────────────────────
function ParamFields({ criterionType, formValues, onChange }) {
  const schema = PARAM_SCHEMA[criterionType] ?? [];
  if (schema.length === 0) return <p className="text-xs text-slate-400 italic">Loại này không cần tham số thêm.</p>;
  return (
    <div className="space-y-2">
      {schema.map((field) => (
        <div key={field.key}>
          <label className="block text-xs font-semibold text-slate-600 mb-0.5">
            {field.label}{field.required && <span className="ml-1 text-red-400">*</span>}
          </label>
          {field.type === 'checkbox' ? (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox"
                checked={formValues[field.key] !== false && formValues[field.key] !== 'false'}
                onChange={(e) => onChange(field.key, e.target.checked)}
                className="w-4 h-4 rounded accent-[#F37021]" />
              <span className="text-xs text-slate-600">Bật kiểm tra</span>
            </label>
          ) : field.type === 'select' ? (
            <select value={formValues[field.key] ?? ''} onChange={(e) => onChange(field.key, e.target.value)}
              className="w-full border border-[#EAECF0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#F37021]">
              {field.options.map((o) => <option key={o} value={o}>{o || '-- Không bắt buộc --'}</option>)}
            </select>
          ) : (
            <input type="text" value={formValues[field.key] ?? ''} placeholder={field.placeholder}
              onChange={(e) => onChange(field.key, e.target.value)}
              className="w-full border border-[#EAECF0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F37021]" />
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(15,23,42,0.58)' }}>
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
    </div>
  );
}


// ─── Main CriteriaPage ────────────────────────────────────────────────────────
export default function CriteriaPage({ examId, blockId, onBack }) {
  const [paper,       setPaper]      = useState(null);
  const [loadingPaper, setLoadingPaper] = useState(true);
  const [criteriaMap, setCriteriaMap] = useState({});    // { questionId: [...rows] }
  const [loadingCrit, setLoadingCrit] = useState(false);
  const [activeQ,     setActiveQ]    = useState(0);
  const [saving,      setSaving]     = useState(false);
  const [saveError,   setSaveError]  = useState('');
  const [saveOk,      setSaveOk]     = useState(false);
  const [editingRow,  setEditingRow] = useState(null);

  // ── 1. Load paper ──────────────────────────────────────────────────────────
  const loadPaper = useCallback(() => {
    if (!examId || !blockId) return;
    setLoadingPaper(true);
    examPaperApi.getByBlock(examId, blockId)
      .then((res) => setPaper(res?.data ?? res ?? null))
      .catch(() => setPaper(null))
      .finally(() => setLoadingPaper(false));
  }, [examId, blockId]);

  useEffect(() => { loadPaper(); }, [loadPaper]);

  // ── 2. Load criteria khi paper đã load xong ─────────────────────────────
  useEffect(() => {
    const questions = paper?.questions ?? [];
    if (questions.length === 0) return;

    setLoadingCrit(true);
    const fetchAll = async () => {
      try {
        const results = await Promise.all(
          questions.map((q) =>
            gradingCriteriaApi
              .listByQuestion(examId, q.questionId)
              .then((res) => ({ qId: q.questionId, data: res?.data ?? [] }))
              .catch(() => ({ qId: q.questionId, data: [] }))
          )
        );
        const map = {};
        for (const { qId, data } of results) {
          map[qId] = data.map((c) => ({
            criteriaCode:    c.criteriaCode    ?? '',
            criteriaGroup:   c.criteriaGroup   ?? 'STRUCTURAL',
            criterionType:   c.criterionType   ?? '',
            description:     c.description     ?? '',
            maxScore:        c.maxScore != null ? String(c.maxScore) : '',
            checkParamsJson: c.checkParamsJson  ?? '{}',
            displayOrder:    c.displayOrder     ?? 0,
          }));
        }
        setCriteriaMap(map);
      } finally {
        setLoadingCrit(false);
      }
    };
    fetchAll();
  }, [examId, paper]); // re-run only when paper changes

  const questions  = paper?.questions ?? [];
  const currentQ   = questions[activeQ];
  const getCriteria = (qId) => criteriaMap[qId] ?? [];
  const setCriteria = (qId, list) => setCriteriaMap((prev) => ({ ...prev, [qId]: list }));

  const addRow = () => {
    if (!currentQ) return;
    const rows = getCriteria(currentQ.questionId);
    setEditingRow({
      qId: currentQ.questionId,
      idx: rows.length,
      isNew: true,
      row: {
        criteriaCode: `Q${currentQ.questionNumber ?? activeQ + 1}.${rows.length + 1}`,
        criteriaGroup: 'STRUCTURAL', criterionType: '', description: '',
        maxScore: '', checkParamsJson: '{}', displayOrder: rows.length
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
      setCriteria(qId, (() => {
        const rows = [...(criteriaMap[qId] ?? [])];
        rows[idx] = savedRow;
        return rows;
      })());
    }
    setEditingRow(null);
  };

  const removeRow = (qId, idx) => setCriteria(qId, getCriteria(qId).filter((_, i) => i !== idx));
  const getSumDisplay = (qId) => sumScoresWithoutRounding(getCriteria(qId).map((r) => r.maxScore));
  
  const isMismatchScore = (q) => {
    if (!q) return false;
    return !scoresAreEqual(getSumDisplay(q.questionId), q.maxScore || 0);
  };

  const hasAnyError = questions.some(isMismatchScore);

  const handleSave = async () => {
    setSaveError(''); setSaveOk(false);
    for (const q of questions) {
      const rows = getCriteria(q.questionId);
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const lbl = `Câu ${q.questionNumber ?? '?'} – Tiêu chí #${i + 1}`;
        if (!r.criterionType)       { setSaveError(`${lbl}: Vui lòng chọn loại kiểm tra.`); return; }
        if (!r.criteriaCode?.trim()){ setSaveError(`${lbl}: Mã tiêu chí không được trống.`); return; }
        if (!r.description?.trim()) { setSaveError(`${lbl}: Mô tả không được trống.`); return; }
        if (r.maxScore === '' || parseFloat(r.maxScore) < 0) { setSaveError(`${lbl}: Điểm tối đa phải ≥ 0.`); return; }
      }
    }
    setSaving(true);
    try {
      for (const q of questions) {
        const rows = getCriteria(q.questionId);
        if (rows.length === 0) continue;
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
            criteriaCode:    r.criteriaCode.trim(),
            criteriaGroup:   r.criteriaGroup ?? 'STRUCTURAL',
            criterionType:   r.criterionType,
            description:     r.description.trim(),
            maxScore:        parseFloat(r.maxScore) || 0,
            checkParamsJson: trimmedParamsJson,
            displayOrder:    i,
          };
        });
        await gradingCriteriaApi.saveBatch(examId, q.questionId, payload);
      }
      setSaveOk(true);
      onBack?.();
    } catch (err) {
      setSaveError(err?.response?.data?.message ?? 'Lưu thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  // ── Render states ─────────────────────────────────────────────────────────
  // Auto-clear success message sau 3s nếu vì lý do nào đó không navigate được
  useEffect(() => {
    if (!saveOk) return;
    const t = setTimeout(() => setSaveOk(false), 3000);
    return () => clearTimeout(t);
  }, [saveOk]);

  if (loadingPaper) {
    return (
      <div className="bg-[#F5F7FA] min-h-screen p-6 sm:p-8">
        <div className="max-w-[900px] mx-auto space-y-4 animate-pulse">
          <div className="h-8 w-40 bg-slate-200 rounded-lg" />
          <div className="h-64 bg-white rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="bg-[#F5F7FA] min-h-screen p-6 sm:p-8">
        <div className="max-w-[900px] mx-auto space-y-6">
          <button type="button" onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-[#F37021] bg-white hover:bg-orange-50 rounded-full transition-all text-sm font-bold shadow-sm border border-slate-200 group w-fit">
            <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
            Quay lại Block
          </button>
          <div className="bg-white rounded-3xl p-16 text-center shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-[#F37120]" />
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-slate-100">
              <span className="material-symbols-outlined text-6xl text-slate-300">upload_file</span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-800 mb-2">Chưa có đề thi</h3>
            <p className="text-slate-500 text-sm max-w-sm">Vui lòng quay lại và upload file đề thi trước khi tiến hành cấu hình tiêu chí chấm điểm.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F5F7FA] min-h-screen p-6 sm:p-8">
      <div className="max-w-[900px] mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <button type="button" onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-[#F37021] bg-white hover:bg-orange-50 rounded-full transition-all text-sm font-bold shadow-sm border border-slate-200 group">
            <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
            Quay lại Block
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-200 text-xs text-slate-500 font-medium">
            <span className="material-symbols-outlined text-base text-[#F37021]">rule</span>
            {paper.totalQuestions} câu hỏi
            {paper.examCode && (
              <>
                <div className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">{paper.examCode}</span>
              </>
            )}
          </div>
        </div>

        {/* Title card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 p-8 relative overflow-hidden flex items-center justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-orange-100/50 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Cấu hình <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F37120] to-orange-400">Tiêu chí OOP</span></h2>
            <p className="text-slate-500 mt-2 text-sm font-medium">Thiết lập các quy tắc chấm điểm tự động cho từng câu hỏi trong đề thi.</p>
          </div>
          <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center shadow-inner border border-orange-100/50 relative z-10 hidden sm:flex">
            <span className="material-symbols-outlined text-3xl text-[#F37120]">fact_check</span>
          </div>
        </div>

        {/* Question tabs + criteria editor */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden flex flex-col">
          {/* Question tab bar */}
          <div className="flex gap-2 p-4 bg-slate-50/80 border-b border-slate-100 overflow-x-auto custom-scrollbar">
            {questions.map((q, i) => {
              const over = isMismatchScore(q);
              const cnt  = getCriteria(q.questionId).length;
              return (
                <button key={q.questionId ?? i} type="button" onClick={() => setActiveQ(i)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-300 border
                    ${activeQ === i
                      ? 'bg-gradient-to-r from-[#F37021] to-orange-500 text-white shadow-lg shadow-orange-500/30 border-transparent scale-105 transform origin-bottom'
                      : over
                        ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-orange-300 hover:text-orange-600 shadow-sm'}`}>
                  Câu {q.questionNumber ?? i + 1}
                  {cnt > 0 && (
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full
                      ${activeQ === i ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {cnt}
                    </span>
                  )}
                  {over && <span className={`material-symbols-outlined text-[16px] ${activeQ === i ? 'text-white' : 'text-red-500'}`}>warning</span>}
                </button>
              );
            })}
          </div>

          {/* Active question body */}
          {currentQ && (
            <div className="p-6 sm:p-8 space-y-6 bg-white">
              {/* Question meta */}
              <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl text-slate-400">code_blocks</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-800">{currentQ.title || `Câu ${currentQ.questionNumber ?? activeQ + 1}`}</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1.5">
                      Điểm tối đa: <span className="font-extrabold text-[#F37021] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">{currentQ.maxScore}đ</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tổng điểm tiêu chí</p>
                  <p className={`font-black text-xl flex items-center justify-end gap-1.5 ${isMismatchScore(currentQ) ? 'text-red-600' : 'text-emerald-600'}`}>
                    {getSumDisplay(currentQ.questionId)} <span className="text-sm font-bold text-slate-400">/ {currentQ.maxScore}</span>
                  </p>
                  {isMismatchScore(currentQ) && (
                    <p className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded inline-block mt-1">CHƯA KHỚP</p>
                  )}
                </div>
              </div>

              {/* Loading criteria */}
              {loadingCrit ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2].map((i) => <div key={i} className="h-24 bg-slate-50 rounded-xl border border-slate-100" />)}
                </div>
              ) : (
                <>
                  {getCriteria(currentQ.questionId).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                        <span className="material-symbols-outlined text-3xl text-slate-300">rule</span>
                      </div>
                      <h4 className="font-bold text-slate-700 mb-1">Chưa có tiêu chí nào</h4>
                      <p className="text-sm text-slate-500 max-w-xs">Nhấn nút bên dưới để bắt đầu thêm các quy tắc chấm điểm cho câu hỏi này.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 animate-fade-up">
                      {getCriteria(currentQ.questionId).map((row, idx) => (
                        <CriterionListItem
                          key={idx}
                          row={row}
                          index={idx}
                          onEdit={() => editRow(currentQ.questionId, idx)}
                          onRemove={() => removeRow(currentQ.questionId, idx)}
                        />
                      ))}
                    </div>
                  )}

                  <button type="button" onClick={addRow}
                    className="flex items-center gap-2 px-4 py-3.5 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50
                               text-slate-500 text-sm font-bold hover:border-[#F37021] hover:text-[#F37021] hover:bg-orange-50/30 transition-all w-full justify-center group">
                    <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">add_circle</span>
                    Thêm tiêu chí mới
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Save bar */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-6 z-20">
          <div className="flex-1 w-full">
            {hasAnyError ? (
              <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-medium w-full shadow-sm">
                <span className="material-symbols-outlined text-lg shrink-0">error</span>
                <span>
                  <strong>Câu {questions.filter(isMismatchScore).map(q => q.questionNumber ?? '?').join(', ')}</strong> có tổng điểm tiêu chí chưa khớp với điểm tối đa. Bạn cần phân bổ lại cho đủ điểm trước khi lưu.
                </span>
              </div>
            ) : saveError ? (
              <p className="text-sm font-bold text-red-600 flex items-center gap-2 px-4 py-2 bg-red-50 rounded-xl w-fit">
                <span className="material-symbols-outlined text-lg">error</span>{saveError}
              </p>
            ) : saveOk ? (
              <p className="text-sm font-bold text-emerald-600 flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl w-fit border border-emerald-100">
                <span className="material-symbols-outlined text-lg">check_circle</span>Đã lưu cấu hình thành công!
              </p>
            ) : (
              <p className="text-xs font-semibold text-slate-400 flex items-center gap-2 px-2">
                <span className="material-symbols-outlined text-base">info</span>
                Kiểm tra kỹ các tiêu chí trước khi hoàn tất.
              </p>
            )}
          </div>
          <div className="shrink-0 w-full sm:w-auto">
            <button type="button" onClick={handleSave} disabled={saving || hasAnyError}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-extrabold text-white text-sm
                         bg-gradient-to-r from-[#F37021] to-orange-500 hover:from-orange-600 hover:to-orange-600 
                         transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98]">
              <span className="material-symbols-outlined text-[18px]">{saving ? 'hourglass_empty' : 'task_alt'}</span>
              {saving ? 'Đang lưu...' : 'Hoàn tất & Lưu'}
            </button>
          </div>
        </div>

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
