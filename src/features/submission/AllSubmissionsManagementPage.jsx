import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import submissionApi from '../../services/submissionApi';
import gradingApi from '../../services/gradingApi';
import axiosClient from '../../services/axiosClient';
import {
  ErrorState,
  FilterBar,
  LoadingState,
  PageBackdrop,
  StatsGrid,
  SubmissionsTableCard,
} from './components/block-submissions/BlockSubmissionsPieces.jsx';
import {
  extractApiErrorMessage,
  fmtDateTime,
  fmtSize,
  getResultBadge,
  getSubmissionStatusBadge,
  isBrowserFileDownloadSupported,
  mapGradingResultsFallback,
  normalizeSubmissionsPayload,
  saveBlobFile,
  slugifyFilePart,
} from './components/block-submissions/blockSubmissions.helpers.js';

// ─── Block Picker ─────────────────────────────────────────────────────────────

function BlockPicker({ blocks, loadingBlocks, selectedKey, onChange }) {
  const grouped = useMemo(() => {
    const map = {};
    (blocks || []).forEach((b) => {
      const sem = b.semester || 'Khác';
      if (!map[sem]) map[sem] = [];
      map[sem].push(b);
    });
    return map;
  }, [blocks]);

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 group shadow-sm hover:shadow-md transition-shadow rounded-xl">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <span className="material-symbols-outlined text-orange-500 text-[20px] group-hover:scale-110 transition-transform duration-300">filter_alt</span>
        </div>
        <select
          id="block-picker"
          className="w-full appearance-none bg-white/80 backdrop-blur-md border border-slate-200 hover:border-orange-300 text-slate-800 text-sm font-semibold rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:ring-4 focus:ring-orange-500/15 focus:border-orange-500 transition-all cursor-pointer disabled:opacity-50"
          value={selectedKey}
          onChange={(e) => onChange(e.target.value)}
          disabled={loadingBlocks}
        >
          <option value="" className="text-slate-400">{loadingBlocks ? 'Đang tải dữ liệu...' : 'Lọc theo Block...'}</option>
          {Object.entries(grouped).map(([sem, semBlocks]) => (
            <optgroup key={sem} label={sem} className="font-bold text-slate-900 bg-slate-50">
              {semBlocks.map((b) => (
                <option key={`${b.examId}__${b.blockId}`} value={`${b.examId}__${b.blockId}`} className="font-medium text-slate-700 py-1">
                  {b.examName} • {b.blockName}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 group-hover:text-orange-400 transition-colors">
          <span className="material-symbols-outlined text-[18px]">unfold_more</span>
        </div>
      </div>
      {selectedKey && (
        <button
          onClick={() => onChange('')}
          className="flex items-center justify-center p-2.5 rounded-xl text-slate-400 bg-white border border-slate-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 shadow-sm transition-all"
          title="Xóa bộ lọc"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AllSubmissionsManagementPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Block picker state
  const [blocks, setBlocks] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(true);
  const [selectedKey, setSelectedKey] = useState(
    (location.state?.returnState?.selectedKey) || sessionStorage.getItem('allSubmissionsSelectedKey') || ''
  );

  const activeExamId = useMemo(() => selectedKey.split('__')[0] || null, [selectedKey]);
  const activeBlockId = useMemo(() => selectedKey.split('__')[1] || null, [selectedKey]);
  const selectedBlock = useMemo(
    () => blocks.find((b) => b.examId === activeExamId && b.blockId === activeBlockId) || null,
    [blocks, activeExamId, activeBlockId]
  );

  // Table state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ total: 0, submitted: 0, grading: 0, graded: 0 });
  const [pagination, setPagination] = useState({ page: 0, size: 20, totalElements: 0, totalPages: 0 });
  const [progress, setProgress] = useState(null);
  const [optimisticRun, setOptimisticRun] = useState(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [exporting, setExporting] = useState({ gradeSheet: false, zipBundle: false });
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState([]);
  const [page, setPage] = useState(() => {
    const saved = sessionStorage.getItem('allSubmissionsPage');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [size, setSize] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const tableSectionRef = useRef(null);
  const debounceRef = useRef(null);
  const wasGradingRef = useRef(false);

  const isGradingInProgress = useMemo(() => {
    const serverInProgress =
      String(progress?.status || '').toUpperCase() === 'IN_PROGRESS' ||
      Number(progress?.gradingCount || 0) > 0;
    return serverInProgress || (optimisticRun?.active ?? false);
  }, [optimisticRun, progress]);

  const progressTotalDisplay = useMemo(() => {
    if (optimisticRun?.active) return Number(optimisticRun?.total || 0);
    return Number(progress?.totalCount || 0);
  }, [optimisticRun, progress]);

  const progressDoneDisplay = useMemo(() => {
    const fromServer = Number(progress?.gradedCount ?? 0);
    if (optimisticRun?.active && optimisticRun?.scope === 'selected') {
      return Math.min(fromServer, Number(optimisticRun?.total || 0));
    }
    return fromServer;
  }, [optimisticRun, progress?.gradedCount]);

  // Sync selectedKey + page to sessionStorage for back navigation
  useEffect(() => {
    if (selectedKey) {
      sessionStorage.setItem('allSubmissionsSelectedKey', selectedKey);
    } else {
      sessionStorage.removeItem('allSubmissionsSelectedKey');
    }
  }, [selectedKey]);

  useEffect(() => {
    sessionStorage.setItem('allSubmissionsPage', page);
  }, [page]);

  // Load all blocks on mount
  useEffect(() => {
    let cancelled = false;
    setLoadingBlocks(true);
    submissionApi.getStaffBlocks()
      .then((res) => {
        if (cancelled) return;
        const data = res?.data?.data ?? res?.data ?? [];
        setBlocks(Array.isArray(data) ? data : []);
      })
      .catch(() => { if (!cancelled) setBlocks([]); })
      .finally(() => { if (!cancelled) setLoadingBlocks(false); });
    return () => { cancelled = true; };
  }, []);

  const loadProgress = useCallback(async () => {
    if (!activeExamId || !activeBlockId) return;
    try {
      const pRes = await gradingApi.getProgress(activeExamId, activeBlockId);
      const p = pRes?.data?.data ?? pRes?.data ?? pRes ?? null;
      setProgress(p);
      const serverInProgress =
        String(p?.status || '').toUpperCase() === 'IN_PROGRESS' ||
        Number(p?.gradingCount || 0) > 0;
      if (serverInProgress) return;
      setOptimisticRun((prev) => {
        if (!prev?.active) return prev;
        const elapsed = Date.now() - Number(prev?.startedAt || 0);
        if (elapsed < 12000) return prev;
        return { ...prev, active: false };
      });
    } catch { setProgress(null); }
  }, [activeBlockId, activeExamId]);

  const loadData = useCallback(async (opts = {}) => {
    if (!activeExamId || !activeBlockId) {
      setLoading(false);
      setRows([]);
      return;
    }
    setLoading(true);
    setError('');
    const p = opts.page ?? page;
    const s = opts.size ?? size;
    const q = opts.search ?? search;
    const st = opts.statusFilter ?? statusFilter;
    try {
      const params = { page: p, size: s };
      if (q) params.search = q;
      if (st) params.status = st;
      const subsRes = await submissionApi.getBlockSubmissions(activeExamId, activeBlockId, params);
      const { data: list, pagination: pag, stats: statData } = normalizeSubmissionsPayload(subsRes);
      setRows(Array.isArray(list) ? list : []);
      setPagination({
        page: pag?.page ?? p,
        size: pag?.size ?? s,
        totalElements: pag?.totalElements ?? list.length,
        totalPages: pag?.totalPages ?? 1,
      });
      setStats({
        total: statData?.total ?? list.length,
        submitted: statData?.submitted ?? 0,
        grading: statData?.grading ?? 0,
        graded: statData?.graded ?? 0,
      });
    } catch {
      setRows([]);
      setError('Không thể tải danh sách bài nộp. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [activeBlockId, activeExamId, page, size, search, statusFilter]);

  // Reload when block selection changes
  useEffect(() => {
    if (!activeExamId || !activeBlockId) {
      setRows([]);
      setStats({ total: 0, submitted: 0, grading: 0, graded: 0 });
      setProgress(null);
      setOptimisticRun(null);
      return;
    }
    setPage(0);
    setSearch('');
    setSearchInput('');
    setStatusFilter('');
    setSelectedSubmissionIds([]);
    loadData({ page: 0, search: '', statusFilter: '' });
    loadProgress();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeExamId, activeBlockId]);

  const handleRefresh = useCallback(() => {
    loadData();
    loadProgress();
  }, [loadData, loadProgress]);

  const handleSearchInput = useCallback((val) => {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      setPage(0);
      loadData({ page: 0, search: val, statusFilter });
    }, 400);
  }, [loadData, statusFilter]);

  const handleStatusChange = useCallback((val) => {
    setStatusFilter(val);
    setPage(0);
    loadData({ page: 0, search, statusFilter: val });
  }, [loadData, search]);

  const handleSizeChange = useCallback((val) => {
    setSize(val);
    setPage(0);
    loadData({ page: 0, size: val, search, statusFilter });
  }, [loadData, search, statusFilter]);

  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
    loadData({ page: newPage });
  }, [loadData]);

  // Grading in progress polling
  useEffect(() => {
    if (!isGradingInProgress || !activeExamId || !activeBlockId) return undefined;
    const id = setInterval(() => loadProgress(), 4000);
    return () => clearInterval(id);
  }, [activeBlockId, activeExamId, isGradingInProgress, loadProgress]);

  useEffect(() => {
    if (isGradingInProgress) { wasGradingRef.current = true; return; }
    if (wasGradingRef.current) { wasGradingRef.current = false; loadData(); }
  }, [isGradingInProgress, loadData]);

  // Row selection helpers
  const isRowSelectable = useCallback((item) => {
    const s = String(item?.submissionStatus || '').toUpperCase();
    return s === 'SUBMITTED' || s === 'GRADED';
  }, []);

  const visibleSelectableIds = useMemo(
    () => rows.filter(isRowSelectable).map((item) => item?.submissionId).filter(Boolean),
    [isRowSelectable, rows]
  );
  const selectedIdSet = useMemo(() => new Set(selectedSubmissionIds), [selectedSubmissionIds]);
  const visibleSelectedCount = useMemo(
    () => visibleSelectableIds.filter((id) => selectedIdSet.has(id)).length,
    [selectedIdSet, visibleSelectableIds]
  );
  const selectedCount = selectedSubmissionIds.length;
  const allVisibleSelected = visibleSelectableIds.length > 0 && visibleSelectedCount === visibleSelectableIds.length;

  const toggleSelectOne = useCallback((id, checked) => {
    if (!id) return;
    setSelectedSubmissionIds((prev) =>
      checked ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((x) => x !== id)
    );
  }, []);

  const toggleSelectAllVisible = useCallback((checked) => {
    setSelectedSubmissionIds((prev) => {
      if (checked) return Array.from(new Set([...prev, ...visibleSelectableIds]));
      return prev.filter((id) => !visibleSelectableIds.includes(id));
    });
  }, [visibleSelectableIds]);

  // Trigger / Stop grading
  const handleTriggerGrading = useCallback(async () => {
    if (!activeExamId || !activeBlockId || isTriggering || isGradingInProgress) return;
    try {
      setIsTriggering(true);
      const body = {
        blockId: activeBlockId,
        submissionIds: selectedCount > 0 ? selectedSubmissionIds : null,
      };
      await gradingApi.triggerGrading(activeExamId, activeBlockId, body);
      setOptimisticRun({ active: true, total: selectedCount || stats.submitted + stats.graded, scope: selectedCount > 0 ? 'selected' : 'all', startedAt: Date.now() });
      message.success(selectedCount > 0 ? `Đã bắt đầu chấm ${selectedCount} bài.` : 'Đã bắt đầu chấm tất cả bài nộp.');
      setSelectedSubmissionIds([]);
      loadProgress();
    } catch (err) {
      message.error(extractApiErrorMessage(err, 'Không thể bắt đầu chấm bài.'));
    } finally {
      setIsTriggering(false);
    }
  }, [activeBlockId, activeExamId, isGradingInProgress, isTriggering, loadProgress, selectedCount, selectedSubmissionIds, stats]);

  const handleStopGrading = useCallback(async () => {
    if (!activeExamId || !activeBlockId || isStopping || !isGradingInProgress) return;
    try {
      setIsStopping(true);
      setOptimisticRun((prev) => (prev ? { ...prev, active: false } : prev));
      await gradingApi.stopGrading(activeExamId, activeBlockId);
      message.success('Đã gửi yêu cầu dừng chấm.');
      await Promise.all([loadData(), loadProgress()]);
    } catch (err) {
      message.error(extractApiErrorMessage(err, 'Không thể dừng chấm bài.'));
    } finally {
      setIsStopping(false);
    }
  }, [activeBlockId, activeExamId, isGradingInProgress, isStopping, loadData, loadProgress]);

  // Regrade one
  const handleRegradeOne = useCallback(async (item) => {
    if (!item?.submissionId || isGradingInProgress || isTriggering) return;
    try {
      setIsTriggering(true);
      await gradingApi.triggerSingleGrading(activeExamId, activeBlockId, item.submissionId);
      setRows((prev) => prev.map((row) => row?.submissionId === item.submissionId ? { ...row, submissionStatus: 'GRADING' } : row));
      setOptimisticRun({ active: true, total: 1, scope: 'selected', startedAt: Date.now() });
      message.success(`Đã bắt đầu chấm lại bài của ${item?.studentName ?? 'sinh viên'}.`);
      loadProgress();
    } catch (err) {
      message.error(extractApiErrorMessage(err, 'Không thể chấm lại bài này.'));
    } finally {
      setIsTriggering(false);
    }
  }, [activeBlockId, activeExamId, isGradingInProgress, isTriggering, loadProgress]);

  // Open submission detail
  const handleOpenSubmissionDetail = useCallback((item) => {
    const submissionId = item?.submissionId;
    if (!submissionId || !activeExamId || !activeBlockId) {
      message.warning('Không tìm thấy thông tin bài nộp.'); return;
    }
    const canOpen = Boolean(item?.gradingResultId) || String(item?.submissionStatus || '').toUpperCase() === 'GRADED';
    if (!canOpen) { message.info('Bài này chưa có kết quả chấm.'); return; }
    navigate(
      `/exam-staff/exams/${activeExamId}/blocks/${activeBlockId}/submissions/${submissionId}`,
      { 
        state: { 
          fromAllSubmissions: true,
          returnState: { selectedKey, page, size },
          prefill: { 
            submissionId, 
            studentName: item?.studentName ?? null, 
            studentCode: item?.studentCode ?? null, 
            studentEmail: item?.studentEmail ?? null, 
            submissionStatus: item?.submissionStatus ?? null, 
            status: item?.gradingStatus ?? null, 
            gradingResultId: item?.gradingResultId ?? null, 
            totalScore: item?.totalScore ?? null, 
            maxScore: item?.maxScore ?? null, 
            gradedAt: item?.gradedAt ?? null 
          } 
        } 
      }
    );
  }, [activeBlockId, activeExamId, navigate, selectedKey, page, size]);

  // Export CSV
  const downloadProtectedFile = useCallback(async (endpoint, defaultFileName, unsupportedMsg) => {
    if (!isBrowserFileDownloadSupported()) { message.warning(unsupportedMsg); return false; }
    try {
      const response = await axiosClient.get(endpoint, { responseType: 'blob' });
      const blob = response instanceof Blob ? response : response?.data instanceof Blob ? response.data : new Blob([response], { type: 'application/octet-stream' });
      const ok = saveBlobFile(blob, defaultFileName);
      if (!ok) { message.warning(unsupportedMsg); return false; }
      return true;
    } catch (err) {
      const status = Number(err?.response?.status || 0);
      if ([404, 405, 501].includes(status)) { message.warning(unsupportedMsg); return false; }
      throw err;
    }
  }, []);

  const handleExportCsv = useCallback(() => {
    if (!rows.length) { message.info('Hiện chưa có dữ liệu để xuất CSV.'); return; }
    if (!isBrowserFileDownloadSupported()) { message.warning('Web chưa hỗ trợ xuất file CSV ở màn này.'); return; }
    const headers = ['STT', 'Sinh viên', 'Mã SV', 'Email', 'Thời gian nộp', 'Dung lượng', 'Trạng thái', 'Điểm số', 'Kết quả'];
    const csvRows = rows.map((item, idx) => {
      const statusBadge = getSubmissionStatusBadge(item.submissionStatus);
      const resultBadge = getResultBadge(item.gradingStatus);
      const score = item.totalScore != null ? `${Number(item.totalScore).toFixed(2)}/${Number(item.maxScore || 10).toFixed(0)}` : '—';
      return [pagination.page * pagination.size + idx + 1, item.studentName ?? '', item.studentCode ?? '', item.studentEmail ?? '', fmtDateTime(item.submittedAt), fmtSize(item.fileSizeBytes), statusBadge.label, score, resultBadge ? resultBadge.label : '—'];
    });
    const escapeCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [headers, ...csvRows].map((row) => row.map(escapeCell).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const fileName = `bai-nop-${slugifyFilePart(selectedBlock?.blockName || activeBlockId, 'block')}.csv`;
    if (!saveBlobFile(blob, fileName)) { message.warning('Web chưa hỗ trợ xuất file CSV ở màn này.'); return; }
    message.success('Đã bắt đầu tải file CSV.');
  }, [activeBlockId, pagination, rows, selectedBlock?.blockName]);

  const handleExportGradeSheet = useCallback(async () => {
    if (!activeExamId || !activeBlockId) { message.warning('Vui lòng chọn Block trước.'); return; }
    setExporting((prev) => ({ ...prev, gradeSheet: true }));
    try {
      const ok = await downloadProtectedFile(`/exams/${activeExamId}/blocks/${activeBlockId}/export/grade-sheet`, `bang-diem-${slugifyFilePart(selectedBlock?.blockName || '', 'block')}.xlsx`, 'Web chưa hỗ trợ xuất bảng điểm.');
      if (ok) message.success('Đã bắt đầu tải bảng điểm.');
    } catch (err) {
      message.error(extractApiErrorMessage(err, 'Không thể xuất bảng điểm.'));
    } finally {
      setExporting((prev) => ({ ...prev, gradeSheet: false }));
    }
  }, [activeBlockId, activeExamId, downloadProtectedFile, selectedBlock?.blockName]);

  const handleExportZipBundle = useCallback(async () => {
    if (!activeExamId || !activeBlockId) { message.warning('Vui lòng chọn Block trước.'); return; }
    setExporting((prev) => ({ ...prev, zipBundle: true }));
    try {
      const ok = await downloadProtectedFile(`/exams/${activeExamId}/blocks/${activeBlockId}/export/submission-bundle`, `${slugifyFilePart(selectedBlock?.examName || 'exam', 'exam')}-${slugifyFilePart(selectedBlock?.blockName || '', 'block')}-submissions.zip`, 'Web chưa hỗ trợ xuất file ZIP.');
      if (ok) message.success('Đã bắt đầu tải file ZIP.');
    } catch (err) {
      message.error(extractApiErrorMessage(err, 'Không thể xuất file ZIP.'));
    } finally {
      setExporting((prev) => ({ ...prev, zipBundle: false }));
    }
  }, [activeBlockId, activeExamId, downloadProtectedFile, selectedBlock]);

  // Pagination
  const totalPages = pagination.totalPages;
  const currentPage = pagination.page;
  const pageNumbers = useMemo(() => {
    if (totalPages <= 1) return [];
    const delta = 2;
    const range = [];
    const start = Math.max(0, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);
    if (start > 0) range.push(0);
    if (start > 1) range.push('...');
    for (let i = start; i <= end; i++) range.push(i);
    if (end < totalPages - 2) range.push('...');
    if (end < totalPages - 1) range.push(totalPages - 1);
    return range;
  }, [currentPage, totalPages]);

  const renderedRows = useMemo(
    () => rows.map((item, idx) => ({
      item,
      rowNum: pagination.page * pagination.size + idx + 1,
      selectable: isRowSelectable(item),
      checked: !!item?.submissionId && selectedIdSet.has(item.submissionId),
    })),
    [isRowSelectable, pagination.page, pagination.size, rows, selectedIdSet]
  );

  return (
    <div className="max-w-7xl mx-auto w-full p-6 sm:p-8 pt-20 sm:pt-24 space-y-6">
      <PageBackdrop />

      {/* Header & Toolbar Integrated */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-5 border-b border-slate-200/60 relative">
        <div className="flex-1 relative z-10">
          <div className="flex items-center gap-2 text-orange-600 mb-1">
            <span className="material-symbols-outlined text-[22px]">auto_awesome_mosaic</span>
            <span className="text-sm font-bold uppercase tracking-widest text-orange-500">Hệ thống quản lý</span>
          </div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 tracking-tight">
            Bài nộp sinh viên
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">
            Theo dõi, quản lý và đánh giá bài nộp của sinh viên theo từng block cụ thể.
          </p>
        </div>

        {/* Inline Filter */}
        <div className="w-full md:w-auto md:min-w-[320px] relative z-10">
          <BlockPicker
            blocks={blocks}
            loadingBlocks={loadingBlocks}
            selectedKey={selectedKey}
            onChange={(key) => {
              setSelectedKey(key);
              setSelectedSubmissionIds([]);
              setPage(0);
            }}
          />
        </div>
      </div>

      {/* Active Filter Badges */}
      {selectedBlock && (
        <div className="flex flex-wrap items-center gap-2 text-sm bg-gradient-to-r from-orange-50 to-amber-50/30 border border-orange-100/60 rounded-xl py-2 px-4 inline-flex shadow-sm animate-fade-in-up">
          <div className="flex items-center gap-1.5 mr-2">
             <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
             </span>
             <span className="text-orange-700 font-bold uppercase tracking-wide text-[11px]">Đang xem</span>
          </div>
          <span className="font-bold text-slate-800">{selectedBlock.semester}</span>
          <span className="text-slate-300 mx-1">/</span>
          <span className="font-semibold text-slate-700">{selectedBlock.examName}</span>
          <span className="text-slate-300 mx-1">/</span>
          <span className="font-semibold text-slate-700">{selectedBlock.blockName}</span>
        </div>
      )}

      {/* Empty state when no block selected */}
      {!selectedKey && !loadingBlocks && (
        <div className="flex flex-col items-center justify-center mt-12 py-24 px-4 text-center relative group animate-fade-in">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-200/30 rounded-full blur-3xl -z-10 group-hover:bg-orange-300/30 transition-colors duration-700"></div>
          
          <div className="relative w-28 h-28 mb-8">
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-200 to-amber-100 rounded-full animate-pulse opacity-40"></div>
            <div className="relative w-full h-full bg-white/80 backdrop-blur-sm border border-orange-100 shadow-[0_8px_30px_rgb(249,115,22,0.1)] rounded-full flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
               <span className="material-symbols-outlined text-[56px] text-transparent bg-clip-text bg-gradient-to-br from-orange-500 to-amber-600">
                 snippet_folder
               </span>
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">
            Sẵn sàng để bắt đầu
          </h3>
          <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
            Vui lòng chọn <strong className="font-semibold text-orange-600">Học kỳ</strong> và <strong className="font-semibold text-orange-600">Block</strong> ở menu góc phải phía trên để xem và chấm điểm các bài nộp của sinh viên.
          </p>
        </div>
      )}

      {/* Content */}
      {selectedKey && (
        <>
          {!loading && !error && <StatsGrid stats={stats} />}

          <FilterBar
            searchInput={searchInput}
            onSearchInput={handleSearchInput}
            statusFilter={statusFilter}
            onStatusChange={handleStatusChange}
            size={size}
            onSizeChange={handleSizeChange}
            isGradingInProgress={isGradingInProgress}
            isTriggering={isTriggering}
            loading={loading}
            selectedCount={selectedCount}
            progressDoneDisplay={progressDoneDisplay}
            progressTotalDisplay={progressTotalDisplay}
            onTriggerGrading={handleTriggerGrading}
            onStopGrading={handleStopGrading}
            isStopping={isStopping}
            onRefresh={handleRefresh}
          />

          {loading && <LoadingState />}
          {!loading && !!error && <ErrorState error={error} />}

          {!loading && !error && (
            <SubmissionsTableCard
              tableSectionRef={tableSectionRef}
              pagination={pagination}
              allVisibleSelected={allVisibleSelected}
              visibleSelectableIds={visibleSelectableIds}
              isGradingInProgress={isGradingInProgress}
              toggleSelectAllVisible={toggleSelectAllVisible}
              renderedRows={renderedRows}
              disabled={isGradingInProgress || isTriggering}
              onToggleSelect={toggleSelectOne}
              onRegrade={handleRegradeOne}
              onOpenDetail={handleOpenSubmissionDetail}
              pageNumbers={pageNumbers}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
}
