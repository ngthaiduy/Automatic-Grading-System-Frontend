import React, { useEffect, useState, useCallback } from 'react';
import { message } from 'antd';
import examApi from '../../services/examApi';
import blockApi from '../../services/blockApi';
import gradingApi from '../../services/gradingApi';
import examPaperApi from '../../services/examPaperApi';
import gradingCriteriaApi from '../../services/gradingCriteriaApi';
import UpdateBlockModal from './UpdateBlockModal.jsx';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
}

function fmtTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString('vi-VN', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
}

function getBlockScheduleLockMessage(block) {
  const now = Date.now();

  if (block?.endTime) {
    const end = new Date(block.endTime);
    if (!Number.isNaN(end.getTime()) && now > end.getTime()) {
      return 'Kỳ thi đã qua không được chỉnh sửa thời gian ca thi';
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
  if (!block?.startTime || !block?.endTime) return null;
  const now = Date.now();
  const start = new Date(block.startTime).getTime();
  const end = new Date(block.endTime).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return null;

  if (now < start) {
    return { label: 'Chưa diễn ra / sắp bắt đầu', cls: 'bg-blue-100 text-blue-700' };
  }
  if (now >= start && now <= end) {
    return { label: 'Đang diễn ra', cls: 'bg-green-100 text-green-700' };
  }
  return { label: 'Đã kết thúc', cls: 'bg-slate-100 text-slate-600' };
}

// ─── Doc content renderer ────────────────────────────────────────────────────

/**
 * Tách các class member ghép liền nhau (từ Word-to-text):
 *   "-name:String-category:String" → ["-name:String", "-category:String"]
 *   "+get()+set(int x)" → ["+get()", "+set(int x)"]
 * Không tách bên trong dấu ngoặc.
 */
function splitClassMembers(text) {
  if (!text) return null;

  const normalized = String(text);
  if (normalized.includes('\n')) {
    const lines = normalized.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length > 1 && lines.every((line) => /^[+-]\s*[a-zA-Z_]/.test(line))) {
      return lines;
    }
    return null;
  }

  const parts = [];
  let cur = '';
  let depth = 0;
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    if (ch === '(' || ch === '[' || ch === '<') depth++;
    else if (ch === ')' || ch === ']' || ch === '>') depth--;

    const isStart = depth === 0 && i > 0
      && (ch === '-' || ch === '+')
      && /[a-zA-Z_]/.test(normalized[i + 1] || '');

    if (isStart) {
      if (cur.trim()) parts.push(cur.trim());
      cur = ch;
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts.length > 1 ? parts : null;   // null nếu không tách được
}

/** Render 1 cell — tự phát hiện class-member list hoặc plain text */
function renderCell(rawText, isFirstCol) {
  if (!rawText) return null;
  
  // Chuẩn hoá <br> thành \n từ backend
  const text = String(rawText)
    .replace(/\\r\\n|\\n|\\r/g, '\n')
    .replace(/<br>/gi, '\n');
  
  const members = splitClassMembers(text);

  if (members) {
    return (
      <ul className="space-y-0.5 text-xs leading-relaxed">
        {members.map((m, i) => {
          const isMethod = m.startsWith('+');
          const isField  = m.startsWith('-');
          return (
            <li key={i} className={`font-mono
              ${isMethod ? 'text-blue-700' : isField ? 'text-slate-700' : 'text-slate-600'}`}>
              {m}
            </li>
          );
        })}
      </ul>
    );
  }

  // Plain text: pass isFirstCol as option to renderTextBlock
  return renderTextBlock(text, 'cell', { isFirstCol });
}

/** Kiểm tra xem row có phải header không (tất cả cell ngắn, không có class member) */
function isLikelyHeader(cells) {
  return cells.every(c => c.length < 40 && !splitClassMembers(c));
}

/**
 * Regex nhận biết bullet: •, ·, *, - (ở đầu dòng, có khoảng trắng sau)
 * hoặc đánh số "1. ", "2) ", ...
 */
const BULLET_RE = /^(\s*)([\u2022\u00b7\u2023\u25e6\*\-]|\d+[.)]) /;

/**
 * Render một text block (đoạn văn + bullet list) từ Word-to-text.
 * - Dòng có bullet (• ‣ * - số.) → <li>
 * - Dòng tiếp theo không có bullet sau một bullet → continuation ở item trước
 * - Dòng kết thúc bằng ":" → section label
 * - Dòng còn lại → đoạn văn
 */
function renderTextBlock(rawText, keyPrefix, options = {}) {
  const { isFirstCol } = options;
  const normalizeDocText = (value) => {
    if (!value) return '';
    let text = String(value)
      .replace(/\\r\\n|\\n|\\r/g, '\n')
      .replace(/<br>/gi, '\n');

    text = text
      .replace(/Where:\s*/gi, 'Where:\n')
      .replace(/Note:\s*/gi, 'Note:\n');

    // If there are no line breaks, try to insert soft breaks for readability.
    if (!text.includes('\n') && text.length > 120) {
      text = text
        .replace(/\.(?=[A-Z])/g, '.\n')
        .replace(/(?<!\n)(If the category|For other categories|Override|Do not use|Do not format)/g, '\n$1');
    }

    return text;
  };

  const lines = normalizeDocText(rawText).split('\n');

  // Gom thành segments: { type: 'label'|'para'|'list', content/items }
  const segments = [];
  let listItems  = null;   // [{text}] hiện tại

  const flushList = () => {
    if (listItems) { segments.push({ type: 'list', items: listItems }); listItems = null; }
  };

  for (const raw of lines) {
    const line    = raw.trimEnd();
    const trimmed = line.trim();
    if (!trimmed) { flushList(); continue; }  // dòng trống kết thúc list

    const bulletMatch = BULLET_RE.exec(line);

    if (bulletMatch) {
      // Dòng bắt đầu item mới
      if (!listItems) listItems = [];
      const content = line.slice(bulletMatch[0].length).trim();
      listItems.push(content);
    } else if (listItems) {
      // Continuation line: gán vào item cuối cùng
      listItems[listItems.length - 1] += ' ' + trimmed;
    } else if (/:\s*$/.test(trimmed)) {
      // Label đầu mục (VD: "Where:", "Requirements:")
      flushList();
      segments.push({ type: 'label', content: trimmed });
    } else {
      flushList();
      segments.push({ type: 'para', content: trimmed });
    }
  }
  flushList();

  return (
    <div key={keyPrefix} className="space-y-2">
      {segments.map((seg, si) => {
        if (seg.type === 'label') {
          const labelClass = isFirstCol
            ? 'text-xs font-bold text-slate-500 tracking-wider mt-3 mb-1 whitespace-pre-line'
            : 'text-xs font-bold text-slate-500 uppercase tracking-wider mt-3 mb-1 whitespace-pre-line';
          return (
            <p key={si} className={labelClass}>
              {seg.content}
            </p>
          );
        }
        if (seg.type === 'list') {
          const itemClass = isFirstCol
            ? 'text-sm text-slate-700 leading-relaxed'
            : 'text-sm text-slate-700 leading-relaxed';
          return (
            <ul key={si} className="space-y-1.5 pl-1">
              {seg.items.map((item, ii) => (
                <li key={ii} className={`flex gap-2.5 ${itemClass} whitespace-pre-line`}>
                  <span className={`w-1.5 h-1.5 rounded-full mt-[0.45rem] shrink-0 ${isFirstCol ? 'bg-slate-800' : 'bg-slate-500'}`} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }
        // para
        return (
          <p key={si} className={isFirstCol 
            ? 'text-sm text-slate-700 leading-relaxed whitespace-pre-line'
            : 'text-sm text-slate-700 leading-relaxed whitespace-pre-line'}>
            {seg.content}
          </p>
        );
      })}
    </div>
  );
}


function renderDocContent(text) {
  if (!text) return null;

  const normalizedText = String(text).replace(/\\r\\n|\\n|\\r/g, '\n');
  const lines  = normalizedText.split('\n');
  const blocks = [];
  let cur      = null;

  for (const raw of lines) {
    const line    = raw.trimEnd();
    const isTable = line.includes('|');
    if (isTable) {
      if (cur?.type !== 'table') {
        cur = { type: 'table', lines: [] };
        blocks.push(cur);
      }
      cur.lines.push(line);
    } else {
      if (cur?.type !== 'text')  { cur = { type: 'text',  lines: [] }; blocks.push(cur); }
      cur.lines.push(line);
    }
  }

  return blocks.map((block, bi) => {
    /* ── Text block: render textbox thông minh với bullet parser ── */
    if (block.type === 'text') {
      const content = block.lines.join('\n').trim();
      if (!content) return null;
      return renderTextBlock(content, `tb-${bi}`);
    }

    /* ── Table block ── */
    const rows = block.lines
      .filter(l => l.trim())
      .map(l => {
        const clean = l.replace(/^\s*\|/, '').replace(/\|\s*$/, '');
        return clean.split('|').map(c => c.trim());
      })
      .filter(cells => !cells.every(c => /^[-:=]+$/.test(c)));   // bỏ separator

    if (rows.length === 0) return null;

    // Phát hiện header: row đầu có cell ngắn và không phải class member list
    const hasHeader = rows.length > 1 && isLikelyHeader(rows[0]);
    const header    = hasHeader ? rows[0] : null;
    const body      = hasHeader ? rows.slice(1) : rows;

    const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 1);
    const paddedRows = rows.map((row) =>
      row.length < columnCount
        ? [...row, ...Array(columnCount - row.length).fill('')]
        : row
    );

    return (
      <div key={bi} className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-sm border-collapse table-fixed">
          <colgroup>
            {Array.from({ length: columnCount }).map((_, idx) => (
              <col key={idx} style={{ width: `${100 / columnCount}%` }} />
            ))}
          </colgroup>
          {header && (
            <thead>
              <tr className="bg-gradient-to-r from-orange-50 to-amber-50 border-b-2 border-orange-200">
                {header.map((cell, ci) => (
                  <th key={ci}
                    className={`px-4 py-2.5 text-left text-xs font-bold text-orange-700 tracking-wider ${ci === 0 ? '' : 'uppercase'}`}>
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {(() => {
              const bodyRows = paddedRows.slice(hasHeader ? 1 : 0);
              const skipMap = bodyRows.map(() => Array(columnCount).fill(false));

              return bodyRows.map((row, ri) => (
                <tr key={ri}
                  className={`border-b border-slate-100 transition-colors hover:bg-orange-50/30
                    ${ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                  {row.map((cell, ci) => {
                    if (skipMap[ri][ci]) return null;

                    const isEmpty = cell == null || String(cell).trim() === '';
                    if (isEmpty) return null;

                    let rowSpan = 1;
                    for (let r = ri + 1; r < bodyRows.length; r += 1) {
                      const nextCell = bodyRows[r][ci];
                      if (nextCell != null && String(nextCell).trim() !== '') break;
                      rowSpan += 1;
                      skipMap[r][ci] = true;
                    }

                    return (
                      <td key={ci}
                        rowSpan={rowSpan}
                        className={`px-4 py-3 align-top text-left
                          ${ci === 0 && row.length > 1
                            ? 'bg-slate-50 border-r border-slate-200'
                            : ''}`}>
                        {renderCell(cell, ci === 0 && row.length > 1)}
                      </td>
                    );
                  })}
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>
    );
  });
}


// ─── QuestionAccordion ─────────────────────────────────────────────────────────
const TABS = [
  { key: 'content',   icon: 'description',      label: 'Đề thi'       },
  { key: 'criteria',  icon: 'rule',              label: 'Tiêu chí OOP' },
];

function QuestionAccordion({ q, index, examId }) {
  const [open, setOpen]       = useState(false);
  const [tab, setTab]         = useState('content');
  const [criteria, setCriteria] = useState(null);   // null = chưa load
  const [loadingC, setLoadingC] = useState(false);

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    // Load criteria lần đầu khi mở
    if (next && tab === 'criteria' && criteria === null) loadCriteria();
  };

  const handleTab = (t) => {
    setTab(t);
    if (t === 'criteria' && criteria === null && !loadingC) loadCriteria();
  };

  const loadCriteria = () => {
    if (!examId || !q.questionId) return;
    setLoadingC(true);
    gradingCriteriaApi
      .listByQuestion(examId, q.questionId)
      .then((res) => setCriteria(res?.data ?? []))
      .catch(() => setCriteria([]))
      .finally(() => setLoadingC(false));
  };

  const testCases = q.testCases ?? [];

  return (
    <div className={`rounded-xl border transition-all duration-200
      ${open ? 'border-[#F37120]/30 shadow-md shadow-orange-500/10' : 'border-slate-100 hover:border-orange-200'}`}>

      {/* Header row — click to toggle */}
      <button
        type="button"
        onClick={toggleOpen}
        className="w-full flex items-center gap-3 p-3.5 text-left group"
      >
        {/* Số */}
        <div className={`w-8 h-8 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0 transition-colors
          ${open ? 'bg-[#F37120] text-white' : 'bg-[#F37120]/10 text-[#F37120] group-hover:bg-[#F37120]/20'}`}>
          {q.questionNumber ?? index + 1}
        </div>
        {/* Title */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">
            {q.title || q.description || `Câu ${q.questionNumber ?? index + 1}`}
          </p>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">star</span>
              {q.maxScore ?? '?'} điểm
            </span>
            {testCases.length > 0 && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">code</span>
                {testCases.length} test case
              </span>
            )}
          </div>
        </div>
        {/* Badge + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-[#F37120] bg-orange-50 border border-orange-100 px-2 py-1 rounded-lg">
            {q.maxScore ?? 0}đ
          </span>
          <span className={`material-symbols-outlined text-slate-400 text-base transition-transform duration-200
            ${open ? 'rotate-180' : ''}`}>expand_more</span>
        </div>
      </button>

      {/* Expanded panel */}
      {open && (
        <div className="border-t border-slate-100">
          {/* Tab bar */}
          <div className="flex border-b border-slate-100 px-4 pt-2 gap-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => handleTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-lg transition-all
                  ${tab === t.key
                    ? 'text-[#F37120] border-b-2 border-[#F37120] -mb-px bg-orange-50/50'
                    : 'text-slate-400 hover:text-slate-600'}`}
              >
                <span className="material-symbols-outlined text-xs">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-4">

            {/* ─ Tab 1: Đề thi ─ */}
            {tab === 'content' && (
              <div className="space-y-2">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tiêu đề câu hỏi</p>
                  <p className="text-sm font-semibold text-slate-800">{q.title || '(Không có tiêu đề)'}</p>
                </div>
                {q.description && (
                  <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nội dung đề</p>
                    {renderDocContent(q.description)}
                  </div>
                )}
              </div>
            )}

            {/* ─ Tab 2: Tiêu chí OOP ─ */}
            {tab === 'criteria' && (
              <div className="space-y-2">
                {loadingC ? (
                  <div className="space-y-2 animate-pulse">
                    {[1,2].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl" />)}
                  </div>
                ) : !criteria || criteria.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-slate-300 gap-2">
                    <span className="material-symbols-outlined text-3xl">rule</span>
                    <p className="text-sm">Chưa có tiêu chí OOP cho câu hỏi này.</p>
                  </div>
                ) : criteria.map((c, ci) => (
                  <div key={c.criteriaId ?? ci}
                    className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-orange-100 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-500 text-[10px] font-extrabold
                                    flex items-center justify-center shrink-0">
                      {ci + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-700">{c.criteriaCode}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 border border-violet-100">
                          {c.criterionType}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{c.description}</p>
                    </div>
                    <span className="text-xs font-bold text-violet-600 bg-violet-50 border border-violet-100 px-2 py-1 rounded-lg shrink-0">
                      {c.maxScore}đ
                    </span>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BlockDetailPage({ examId, blockId, onBack, onOpenUploadPaper, onOpenCriteria, onOpenSubmissions, onOpenStatistics }) {
  const [exam,           setExam]           = useState(null);
  const [block,          setBlock]          = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [editingBlock,   setEditingBlock]   = useState(null);
  const [subStats,       setSubStats]       = useState(null);
  const [questions,      setQuestions]      = useState([]);     // câu hỏi từ exam paper
  const [loadingQ,       setLoadingQ]       = useState(false);
  const [paperMeta,      setPaperMeta]      = useState(null);

  const handleClickUpdateSchedule = () => {
    const lockMessage = getBlockScheduleLockMessage(block);
    if (lockMessage) {
      message.warning(lockMessage);
      return;
    }
    setEditingBlock(block);
  };

  const loadData = useCallback(async () => {
    if (!examId || !blockId) return;
    setLoading(true);
    setError('');
    try {
      const [examRes, blockRes] = await Promise.all([
        examApi.getById(examId),
        blockApi.getById(examId, blockId),
      ]);
      setExam(examRes?.data  ?? examRes  ?? null);
      setBlock(blockRes?.data ?? blockRes ?? null);

      // Fetch tiến độ nộp bài — dùng progress endpoint (có totalSubmissions kể cả chưa chấm)
      try {
        const pRes = await gradingApi.getProgress(examId, blockId);
        const prog = pRes?.data ?? pRes;
        setSubStats({
          total:   prog?.totalSubmissions ?? 0,
          graded:  prog?.gradedCount      ?? 0,
          grading: prog?.gradingCount     ?? 0,
          pending: prog?.pendingCount     ?? 0,
          failed:  prog?.failedCount      ?? 0,
          pct:     prog?.progressPercent  ?? 0,
        });
      } catch {
        // Chưa có grading session nào → giữ null
        setSubStats(null);
      }
    } catch {
      setError('Không thể tải thông tin block. Vui lòng thử lại.');
      setExam(null);
      setBlock(null);
    } finally {
      setLoading(false);
    }
  }, [examId, blockId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Load danh sách câu hỏi khi block đã có đề thi
  useEffect(() => {
    if (!block?.hasPaper || !examId || !blockId) {
      setQuestions([]);
      setPaperMeta(null);
      return;
    }
    setLoadingQ(true);
    examPaperApi.getByBlock(examId, blockId)
      .then((res) => {
        const paper = res?.data ?? res ?? null;
        setQuestions(paper?.questions ?? []);
        setPaperMeta(paper);
      })
      .catch(() => {
        setQuestions([]);
        setPaperMeta(null);
      })
      .finally(() => setLoadingQ(false));
  }, [block?.hasPaper, examId, blockId]);

  // ─── Skeleton ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8 animate-pulse space-y-4">
        <div className="h-8 w-52 bg-slate-200 rounded-lg" />
        <div className="h-52 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8 space-y-4">
        <button type="button" onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-[#F37120] transition-colors group">
          <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span>
          <span className="text-sm font-bold">Quay lại</span>
        </button>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 flex items-center gap-3">
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
          <button onClick={loadData} className="ml-auto text-sm underline hover:no-underline">Thử lại</button>
        </div>
      </div>
    );
  }

  const hasSchedule = !!block?.examDate;
  const scheduleStatus = getBlockScheduleStatus(block);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Edit modal — rendered above everything */}
      {editingBlock && (
        <UpdateBlockModal
          block={editingBlock}
          onClose={() => setEditingBlock(null)}
          onSuccess={() => {
            setEditingBlock(null);
            loadData(); // reload để hiển thị schedule mới
          }}
        />
      )}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6">
        <div className="pointer-events-none absolute -top-16 -left-16 w-72 h-72 rounded-full bg-orange-100/50 blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 -right-16 w-72 h-72 rounded-full bg-amber-100/40 blur-3xl" />

        {/* Back button */}
        <button type="button" onClick={onBack}
          className="relative z-10 flex items-center gap-2 text-slate-500 hover:text-[#F37120] transition-colors group font-semibold">
          <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span>
          <span className="text-sm font-bold">Quay lại chi tiết kỳ thi</span>
        </button>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">

          {/* ─── Left column ─── */}
          <div className="lg:col-span-3 space-y-6">

            {/* Block info card */}
            <div className="bg-white rounded-3xl shadow-[0_18px_45px_rgba(15,23,42,0.10)] border border-orange-100/70 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-[#F37120] via-amber-400 to-[#F37120]" />
              <div className="p-6 flex flex-col md:flex-row gap-6">

                {/* Icon */}
                <div className="w-full md:w-28 h-28 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-dashed border-orange-200
                                flex flex-col items-center justify-center shrink-0 shadow-inner">
                  <span className="material-symbols-outlined text-[#F37120] text-4xl mb-1">layers</span>
                  <span className="text-[10px] font-mono text-orange-400 uppercase">Block</span>
                </div>

                {/* Info */}
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {hasSchedule && scheduleStatus ? (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${scheduleStatus.cls}`}>
                          {scheduleStatus.label}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500">
                          Chưa có lịch
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                        ${block?.hasPaper ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                        {block?.hasPaper ? 'Đã có đề thi' : 'Chưa có đề'}
                      </span>
                      <span className="text-slate-400 text-xs">• {exam?.academicYear || '—'}</span>
                    </div>
                    <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      {block?.name || 'Block'} — {exam?.name || 'Kỳ thi'}
                    </h3>
                    {paperMeta?.examCode && (
                      <p className="text-sm text-emerald-700 font-semibold mt-1">
                        Mã đề: <span className="bg-emerald-100 px-2.5 py-1 rounded font-mono text-sm">{paperMeta.examCode}</span>
                      </p>
                    )}
                    {block?.description && (
                      <p className="text-sm text-slate-500 mt-1">{block.description}</p>
                    )}
                  </div>

                  {/* Schedule info */}
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">event</span>
                      <span className="font-medium text-slate-700">{fmtDate(block?.examDate)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">schedule</span>
                      <span>{fmtTime(block?.startTime)} — {fmtTime(block?.endTime)}</span>
                    </div>
                   
                  </div>

                  {/* ─── Action buttons — 4 nút cùng 1 hàng ─── */}
                  <div className="pt-2 grid grid-cols-2 md:grid-cols-4 gap-2">

                    {/* Upload đề thi */}
                    <button
                      type="button"
                      onClick={() => onOpenUploadPaper?.(blockId)}
                      className="w-full flex items-center justify-center gap-1.5 px-3.5 h-10 rounded-xl border border-[#F37120]
                                 text-[#F37120] text-sm font-bold hover:bg-orange-50 transition-all shadow-sm hover:shadow"
                    >
                      <span className="material-symbols-outlined text-base">upload_file</span>
                      <span className="whitespace-nowrap">{block?.hasPaper ? 'Upload lại đề' : 'Upload đề thi'}</span>
                    </button>

                    {/* Tiêu chí chấm */}
                    {block?.hasPaper && (
                      <button
                        type="button"
                        onClick={() => onOpenCriteria?.(blockId)}
                        className="w-full flex items-center justify-center gap-1.5 px-3.5 h-10 rounded-xl border border-violet-400
                                   text-violet-600 text-sm font-bold hover:bg-violet-50 transition-all shadow-sm hover:shadow"
                      >
                        <span className="material-symbols-outlined text-base">rule</span>
                        <span className="whitespace-nowrap">Tiêu chí chấm</span>
                      </button>
                    )}

                    {/* Chỉnh sửa lịch thi */}
                    <button
                      type="button"
                      onClick={handleClickUpdateSchedule}
                      className="w-full flex items-center justify-center gap-1.5 px-3.5 h-10 rounded-xl border border-slate-300
                                 text-slate-600 text-sm font-bold hover:bg-slate-50 hover:border-slate-400
                                 transition-all shadow-sm hover:shadow"
                    >
                      <span className="material-symbols-outlined text-base">edit_calendar</span>
                      <span className="whitespace-nowrap">Chỉnh sửa lịch</span>
                    </button>

                    {/* Xem thống kê */}
                    <button
                      type="button"
                      onClick={() => onOpenStatistics?.(blockId)}
                      className="w-full flex items-center justify-center gap-1.5 px-3.5 h-10 rounded-xl border border-slate-300 text-slate-600 text-sm font-bold hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm hover:shadow"
                    >
                      <span className="material-symbols-outlined text-base">bar_chart</span>
                      <span className="whitespace-nowrap">Thống kê</span>
                    </button>

                  </div>
                </div>
              </div>

            </div>

            {/* ─── Questions list card ─── */}
            <div className="bg-white rounded-3xl shadow-[0_18px_45px_rgba(15,23,42,0.08)] border border-orange-100/70 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-orange-100 via-[#F37120]/40 to-orange-100" />
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-[#F37120]">quiz</span>
                    Danh sách câu hỏi
                  </h4>
                  {questions.length > 0 && (
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                      {questions.length} câu
                    </span>
                  )}
                </div>

                {loadingQ ? (
                  <div className="space-y-2 animate-pulse">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-14 bg-slate-100 rounded-xl" />
                    ))}
                  </div>
                ) : !block?.hasPaper ? (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-300 gap-2">
                    <span className="material-symbols-outlined text-4xl">upload_file</span>
                    <p className="text-sm">Chưa có đề thi. Hãy upload đề thi trước.</p>
                  </div>
                ) : questions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-300 gap-2">
                    <span className="material-symbols-outlined text-4xl">help_outline</span>
                    <p className="text-sm">Không tìm thấy câu hỏi nào.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {questions.map((q, i) => (
                      <QuestionAccordion
                        key={q.questionId ?? i}
                        q={q}
                        index={i}
                        examId={examId}
                      />
                    ))}
                    {/* Tổng điểm */}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 px-1">
                      <span className="text-xs text-slate-400 font-medium">Tổng điểm</span>
                      <span className="text-sm font-extrabold text-slate-700">
                        {questions.reduce((s, q) => s + (parseFloat(q.maxScore) || 0), 0)} điểm
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ─── Right sidebar ─── */}
          <div className="space-y-6 lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-[0_16px_40px_rgba(15,23,42,0.10)] border border-orange-100/60 p-6 flex flex-col gap-6 sticky top-24">

              {/* Submission stats — real data from grading/results */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Tiến độ nộp bài</h4>
                {subStats === null ? (
                  // Chưa có dữ liệu
                  <div className="flex flex-col gap-2">
                    <div className="flex items-end justify-between">
                      <div className="flex flex-col">
                        <span className="text-4xl font-black text-slate-300 leading-none">—</span>
                        <span className="text-xs text-slate-400">Chưa có dữ liệu</span>
                      </div>
                      <span className="text-2xl font-extrabold text-slate-300">—%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-200 w-0 rounded-full" />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {/* Tổng bài nộp + % đã chấm */}
                    <div className="flex items-end justify-between">
                      <div className="flex flex-col">
                        <span className="text-4xl font-black text-slate-900 leading-none">{subStats.total}</span>
                        <span className="text-xs text-slate-500 mt-0.5">Bài đã nộp</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-2xl font-extrabold ${subStats.pct === 100 ? 'text-emerald-500' : subStats.pct > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                          {subStats.pct}%
                        </span>
                        <p className="text-[10px] text-slate-400">đã chấm xong</p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${subStats.pct === 100 ? 'bg-emerald-500' : 'bg-amber-400'}`}
                        style={{ width: `${subStats.pct}%` }}
                      />
                    </div>
                    {/* Chi tiết 3 trạng thái */}
                    <div className="flex flex-col gap-1 text-xs text-slate-500">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Đã chấm xong:
                        </span>
                        <span className="font-bold text-slate-700">{subStats.graded}</span>
                      </div>
                      {subStats.grading > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            Đang chấm:
                          </span>
                          <span className="font-bold text-slate-700">{subStats.grading}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-slate-200" />
                          Chờ chấm:
                        </span>
                        <span className="font-bold text-slate-700">{subStats.pending}</span>
                      </div>
                      {subStats.failed > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-red-400" />
                            <span className="text-red-500 font-semibold">Thất bại:</span>
                          </span>
                          <span className="font-bold text-red-500">{subStats.failed}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => onOpenSubmissions?.(blockId)}
                  className="w-full bg-gradient-to-r from-[#F37120] to-orange-500 hover:from-orange-600 hover:to-orange-600 text-white font-bold py-3
                                   rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/25 active:scale-95">
                  <span className="material-symbols-outlined">list_alt</span>
                  Xem danh sách bài nộp
                </button>
                <button
                  onClick={loadData}
                  className="w-full border-2 border-slate-100 hover:bg-slate-50 text-slate-600 font-bold py-3
                             rounded-xl flex items-center justify-center gap-2 transition-all">
                  <span className="material-symbols-outlined">refresh</span>
                  Làm mới dữ liệu
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
