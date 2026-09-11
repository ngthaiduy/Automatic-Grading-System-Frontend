import React, { useState, useCallback, useEffect, useMemo } from 'react';
import examApi from '../../services/examApi';

// ──────────────────────────────────────────────
// Debounce hook
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ──────────────────────────────────────────────
// Helpers
const ACADEMIC_YEARS = ['', '2026', '2025', '2024', '2023'];
const SEMESTERS      = ['', 'SP', 'SU', 'FA'];
const PAGE_SIZE      = 9; // 9 card + 1 card "Tạo mới" = 1 hàng đẹp

/** Format OffsetDateTime → dd/MM/yyyy HH:mm */
function fmt(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Status badge config dựa vào giá trị status từ backend */
function StatusBadge({ status }) {
  if (status === 'ONGOING') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-500/20">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        Đang diễn ra
      </span>
    );
  }
  if (status === 'UPCOMING') {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-500/20">
        <span className="material-symbols-outlined text-[12px]">schedule</span>
        Sắp diễn ra
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-500/20">
      <span className="material-symbols-outlined text-[12px]">done_all</span>
      Đã kết thúc
    </span>
  );
}

/** Card style config theo status */
function cardCls(status) {
  if (status === 'ONGOING')
    return 'border-2 border-orange-500 shadow-[0_12px_30px_-6px_rgba(249,115,22,0.4)] ring-2 ring-orange-500/20 hover:shadow-[0_20px_45px_-8px_rgba(249,115,22,0.6)] hover:-translate-y-2';
  if (status === 'UPCOMING')
    return 'border-2 border-orange-400/80 shadow-[0_8px_25px_-6px_rgba(249,115,22,0.25)] hover:shadow-[0_16px_35px_-8px_rgba(249,115,22,0.4)] hover:border-orange-500 hover:-translate-y-1.5';
  return 'border border-orange-300/80 shadow-[0_4px_16px_-4px_rgba(249,115,22,0.15)] hover:shadow-[0_12px_28px_-6px_rgba(249,115,22,0.3)] hover:border-orange-400 hover:-translate-y-1';
}

/** Một card kỳ thi */
function ExamCard({ exam, onOpenExamDetail }) {
  return (
    <div className={`group bg-gradient-to-br from-white to-orange-50/40 dark:from-slate-800/90 dark:to-slate-800/70 rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-300 flex flex-col relative ${cardCls(exam.status)}`}>
      {exam.status === 'ONGOING' && (
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600" />
      )}
      {exam.status === 'UPCOMING' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-300 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}
      
      <div className="p-6 flex-grow">
        <div className="flex justify-between items-start mb-4">
          <StatusBadge status={exam.status} />
          {exam.status === 'ONGOING' && (
             <span className="flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-orange-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
             </span>
          )}
        </div>
        
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 line-clamp-2 leading-tight group-hover:text-orange-600 dark:group-hover:text-amber-400 transition-colors">
          {exam.name}
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Học kỳ */}
            <div className="flex items-center gap-3 bg-slate-50/50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100/50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                <span className="material-symbols-outlined text-[18px]">calendar_today</span>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Học kỳ</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{exam.semester}</p>
              </div>
            </div>
            {/* Năm học */}
            <div className="flex items-center gap-3 bg-slate-50/50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100/50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                <span className="material-symbols-outlined text-[18px]">menu_book</span>
              </div>
                <div className="min-w-0 min-h-[34px] flex flex-col justify-center">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider whitespace-nowrap">Năm học</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap leading-tight">{exam.academicYear}</p>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent my-2" />

          {/* Thời gian */}
          <div className="space-y-3 pl-1">
            <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300 relative">
              <div className="absolute left-[11px] top-[24px] bottom-[-16px] w-[2px] bg-slate-200 dark:bg-slate-700 rounded-full" />
              <div className="relative z-10 flex items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-500" />
              </div>
              <div className="mt-0.5">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Bắt đầu</p>
                <p className="text-sm font-semibold">{fmt(exam.startTime)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300 relative">
               <div className="relative z-10 flex items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-500" />
              </div>
              <div className="mt-0.5">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Kết thúc</p>
                <p className="text-sm font-semibold">{fmt(exam.endTime)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-orange-100/40 dark:bg-slate-900/40 border-t border-orange-200/50 dark:border-slate-700/50 mt-auto">
        {exam.status === 'ONGOING' ? (
          <button
            onClick={() => onOpenExamDetail?.(exam.examId)}
            className="w-full relative overflow-hidden group/btn flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/40"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full duration-700 ease-in-out"></div>
            <span className="material-symbols-outlined text-[18px]">visibility</span> Xem chi tiết
          </button>
        ) : exam.status === 'UPCOMING' ? (
          <button
            onClick={() => onOpenExamDetail?.(exam.examId)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30"
          >
            <span className="material-symbols-outlined text-[18px]">visibility</span> Xem chi tiết
          </button>
        ) : (
          <button
            onClick={() => onOpenExamDetail?.(exam.examId)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white dark:bg-slate-800 border border-orange-200 dark:border-slate-600 hover:border-orange-400 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl text-sm font-bold transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">visibility</span> Xem chi tiết
          </button>
        )}
      </div>
    </div>
  );
}

/** Loading skeleton card */
function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 animate-pulse space-y-4">
      <div className="h-5 w-3/4 bg-slate-100 dark:bg-slate-700 rounded-lg" />
      <div className="h-4 w-1/3 bg-slate-100 dark:bg-slate-700 rounded-full" />
      <div className="space-y-3 mt-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2 w-16 bg-slate-100 dark:bg-slate-700 rounded" />
              <div className="h-3 w-24 bg-slate-100 dark:bg-slate-700 rounded" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-9 bg-slate-100 dark:bg-slate-700 rounded-xl mt-4" />
    </div>
  );
}

// ──────────────────────────────────────────────
// ExamManagementPage
// ──────────────────────────────────────────────
export default function ExamManagementPage({ onCreateExam, onOpenExamDetail }) {
  // ── Filter state ──
  const [searchInput,      setSearchInput]      = useState('');
  const [semesterFilter,   setSemesterFilter]   = useState('');
  const [academicYearFilter, setAcademicYearFilter] = useState('');

  // ── Pagination state ──
  const [currentPage, setCurrentPage] = useState(0);

  // ── API response state ──
  const [exams,      setExams]      = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  const debouncedSearch = useDebounce(searchInput, 400);

  const hasActiveFilter = debouncedSearch || semesterFilter || academicYearFilter;

  // Reset về trang 0 khi filter thay đổi
  useEffect(() => { setCurrentPage(0); }, [debouncedSearch, semesterFilter, academicYearFilter]);

  // ── Fetch API ──
  useEffect(() => {
    let cancelled = false;
    async function fetchExams() {
      setLoading(true);
      setError(null);
      try {
        const params = {
          page: currentPage,
          size: PAGE_SIZE,
          sort: 'createdAt,desc',
        };
        if (debouncedSearch)    params.name         = debouncedSearch;
        if (semesterFilter)     params.semester     = semesterFilter;
        if (academicYearFilter) params.academicYear = academicYearFilter;

        const res = await examApi.getAll(params);
        if (cancelled) return;

        // res = { success, message, data: { content, currentPage, totalItems, totalPages, ... } }
        const pageData = res?.data;
        setExams(pageData?.content      ?? []);
        setTotalItems(pageData?.totalItems  ?? 0);
        setTotalPages(pageData?.totalPages  ?? 0);
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message ?? 'Không thể tải danh sách kỳ thi.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchExams();
    return () => { cancelled = true; };
  }, [debouncedSearch, semesterFilter, academicYearFilter, currentPage]);

  const clearFilters = useCallback(() => {
    setSearchInput('');
    setSemesterFilter('');
    setAcademicYearFilter('');
  }, []);

  // Tính range hiển thị (e.g. "1-9 trên 25")
  const rangeStart = totalItems === 0 ? 0 : currentPage * PAGE_SIZE + 1;
  const rangeEnd   = Math.min(currentPage * PAGE_SIZE + exams.length, totalItems);

  // Danh sách page buttons (hiển thị tối đa 5 trang xung quanh trang hiện tại)
  const pageNumbers = useMemo(() => {
    const delta = 2;
    const pages = [];
    for (let i = Math.max(0, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="bg-white dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 min-h-screen pb-12 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-orange-100/40 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-amber-100/30 blur-[100px] pointer-events-none" />

      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-orange-100 dark:border-slate-800/60 shadow-[0_4px_20px_rgba(249,115,22,0.05)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-[0_8px_16px_rgba(249,115,22,0.25)] ring-1 ring-orange-400/50">
                <span className="material-symbols-outlined text-2xl font-light">assignment</span>
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 leading-tight">Quản lý Kỳ Thi</h1>
                <p className="text-orange-600/80 dark:text-orange-400/80 text-sm mt-0.5 font-bold">Theo dõi, điều hành và đánh giá tiến độ thi</p>
              </div>
            </div>
            <button
              onClick={onCreateExam}
              className="group relative flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 text-white hover:from-orange-600 hover:to-orange-700 rounded-xl font-bold transition-all duration-300 shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/40 hover:-translate-y-0.5"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 ease-in-out rounded-xl"></div>
              <span className="material-symbols-outlined transition-transform duration-300 group-hover:rotate-90">add</span>
              <span>Tạo Kỳ Thi</span>
            </button>
          </header>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">

        {/* Search & Filter Bar - Glassmorphism */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-3 rounded-2xl shadow-[0_8px_30px_rgba(249,115,22,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-orange-100/60 dark:border-slate-700/50">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search by name */}
            <div className="relative flex-grow group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors z-10">search</span>
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full pl-12 pr-10 py-3.5 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 rounded-xl text-sm placeholder:text-slate-400 font-medium transition-all outline-none shadow-sm shadow-slate-200/20 dark:shadow-none"
                placeholder="Tìm kiếm kỳ thi theo tên, mã môn..."
                type="text"
              />
              {searchInput && (
                <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-800 dark:hover:text-slate-200 transition-colors z-10">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            <div className="flex gap-2 w-full lg:w-auto">
              {/* Filter by Semester */}
              <div className="relative flex-1 lg:min-w-[160px]">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">calendar_today</span>
                <select
                  value={semesterFilter}
                  onChange={e => setSemesterFilter(e.target.value)}
                  className={`w-full appearance-none pl-11 pr-10 py-3.5 border rounded-xl text-sm font-bold cursor-pointer transition-all outline-none shadow-sm shadow-slate-200/20 dark:shadow-none
                    ${semesterFilter
                      ? 'bg-orange-50/80 border-orange-200 text-orange-700 dark:bg-orange-500/10 dark:border-orange-500/30 dark:text-orange-400'
                      : 'bg-white/80 dark:bg-slate-800/80 border-transparent text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800'
                    }`}
                >
                  <option value="">Tất cả học kỳ</option>
                  {SEMESTERS.filter(s => s !== '').map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-[15px] font-bold leading-none">▾</span>
              </div>

              {/* Filter by Academic Year */}
              <div className="relative flex-none w-full lg:w-[190px]">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-[17px]">date_range</span>
                <select
                  value={academicYearFilter}
                  onChange={e => setAcademicYearFilter(e.target.value)}
                  className={`w-full appearance-none pl-10 pr-7 py-3.5 border rounded-xl text-[15px] font-extrabold cursor-pointer transition-all outline-none shadow-sm shadow-slate-200/20 dark:shadow-none
                    ${academicYearFilter
                      ? 'bg-orange-50/80 border-orange-200 text-orange-700 dark:bg-orange-500/10 dark:border-orange-500/30 dark:text-orange-400'
                      : 'bg-orange-50/90 dark:bg-slate-800/80 border-orange-200/80 dark:border-slate-600 text-slate-900 dark:text-slate-100 hover:bg-orange-100/90 dark:hover:bg-slate-800'
                    }`}
                  title="Tất cả năm học"
                >
                  <option value="">Tất cả năm học</option>
                  {ACADEMIC_YEARS.filter(y => y !== '').map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-[15px] font-bold leading-none">▾</span>
              </div>
            </div>

            {/* Clear filters Button */}
            {hasActiveFilter && (
              <button
                onClick={clearFilters}
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-orange-100 dark:bg-orange-900/50 hover:bg-orange-200 dark:hover:bg-orange-800/80 text-orange-700 dark:text-orange-300 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md whitespace-nowrap border border-orange-200 dark:border-orange-800"
              >
                Xóa lọc
              </button>
            )}
          </div>

          {/* Active filter tags */}
          {hasActiveFilter && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1 mr-1">
                <span className="material-symbols-outlined text-[14px]">filter_alt</span>
                Đang lọc:
              </span>
              {debouncedSearch && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-xs font-semibold border border-orange-200 dark:border-orange-800">
                  <span className="material-symbols-outlined text-[12px]">search</span>
                  Tên: "{debouncedSearch}"
                  <button onClick={() => setSearchInput('')} className="hover:text-orange-900 ml-1">
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </span>
              )}
              {semesterFilter && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-xs font-semibold border border-orange-200 dark:border-orange-800">
                  <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                  Học kỳ: {semesterFilter}
                  <button onClick={() => setSemesterFilter('')} className="hover:text-orange-900 ml-1">
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </span>
              )}
              {academicYearFilter && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-xs font-semibold border border-orange-200 dark:border-orange-800">
                  <span className="material-symbols-outlined text-[12px]">date_range</span>
                  Năm: {academicYearFilter}
                  <button onClick={() => setAcademicYearFilter('')} className="hover:text-orange-900 ml-1">
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Section Title */}
        <div className="flex items-end justify-between mt-10 mb-2">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
              Danh sách Kỳ thi
              {hasActiveFilter && (
                <span className="px-2.5 py-1 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 text-xs font-bold rounded-md border border-orange-200 dark:border-orange-800/50">
                  Kết quả tìm kiếm
                </span>
              )}
              {loading && (
                <span className="inline-flex items-center gap-2 px-2.5 py-1 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold rounded-md">
                  <span className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin inline-block" />
                  Đang tải...
                </span>
              )}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Tổng cộng có {totalItems} kỳ thi được lưu trữ trên hệ thống</p>
          </div>
        </div>

        {/* Error banner */}
        {error && !loading && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
            <span className="material-symbols-outlined">error</span>
            <span className="text-sm font-medium">{error}</span>
            <button
              onClick={() => setCurrentPage(p => p)} // retrigger effect
              className="ml-auto text-sm font-semibold underline hover:no-underline"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Exam Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : exams.map(exam => (
                <ExamCard key={exam.examId} exam={exam} onOpenExamDetail={onOpenExamDetail} />
              ))
          }

          {/* Empty state */}
          {!loading && !error && exams.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
              <span className="material-symbols-outlined text-6xl text-orange-200 mb-4">search_off</span>
              <p className="text-slate-500 font-semibold text-lg">Không tìm thấy kỳ thi nào</p>
              <p className="text-slate-400 text-sm mt-1">
                {hasActiveFilter ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm' : 'Chưa có kỳ thi nào được tạo'}
              </p>
              {hasActiveFilter && (
                <button onClick={clearFilters} className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors">
                  Xóa bộ lọc
                </button>
              )}
            </div>
          )}

          {/* Create New Card — chỉ hiện khi không phải loading */}
          {!loading && (
            <div
              onClick={onCreateExam}
              className="group relative rounded-2xl md:min-h-[360px] cursor-pointer transition-all duration-500 flex flex-col items-center justify-center text-center p-8 overflow-hidden bg-white dark:bg-orange-900/10 border border-orange-200 dark:border-orange-500/20 hover:bg-orange-50/50 dark:hover:bg-orange-900/30 hover:shadow-[0_12px_40px_rgba(249,115,22,0.15)] hover:border-orange-400 dark:hover:border-orange-500/40 hover:-translate-y-2"
            >
              {/* Animated Dashed Border Effect */}
              <div className="absolute inset-[2px] rounded-[14px] border-2 border-dashed border-orange-200 dark:border-orange-500/40 group-hover:border-orange-400 dark:group-hover:border-orange-400/80 transition-colors duration-500"></div>
              
              <div className="relative mb-6 z-10">
                <div className="absolute inset-0 bg-orange-500 blur-2xl opacity-10 group-hover:opacity-30 transition-opacity duration-500 rounded-full" />
                <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-800/50 group-hover:bg-gradient-to-br group-hover:from-orange-500 group-hover:to-orange-600 group-hover:text-white text-orange-500 transition-all duration-500 group-hover:scale-110 shadow-sm shadow-orange-500/20 group-hover:shadow-[0_0_30px_rgba(249,115,22,0.4)]">
                  <span className="material-symbols-outlined text-4xl">add</span>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 group-hover:text-orange-600 dark:group-hover:text-amber-400 transition-colors z-10">Tạo Kỳ thi Mới</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 font-medium max-w-[85%] z-10 group-hover:text-orange-700/70 dark:group-hover:text-orange-200/60 transition-colors">Thiết lập tham số, ngân hàng câu hỏi và phòng thi.</p>
              
              <div className="mt-8 px-6 py-2.5 rounded-full bg-white dark:bg-slate-800 border-orange-200 dark:border-orange-700/50 text-orange-600 dark:text-orange-400 text-sm font-bold opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 shadow-md shadow-orange-500/10 border transition-all duration-500 z-10">
                Bắt đầu ngay
              </div>
            </div>
          )}
        </div>

        {/* Pagination - Redesigned */}
        {totalPages > 1 && !loading && (
          <div className="flex flex-col sm:flex-row items-center justify-between pt-8 pb-4">
            <p className="text-sm text-slate-500 font-medium">
              Hiển thị <span className="font-bold text-slate-900 dark:text-white mx-1">{rangeStart}-{rangeEnd}</span> trên tổng số <span className="font-bold text-slate-900 dark:text-white mx-1">{totalItems}</span>
            </p>
            
            <div className="flex items-center gap-1.5 mt-4 sm:mt-0">
              <button
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 hover:shadow-sm disabled:opacity-40 disabled:hover:shadow-none transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              
              <div className="flex gap-1.5 mx-2">
                {pageNumbers.map(p => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`flex items-center justify-center w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                      p === currentPage
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                        : 'bg-white dark:bg-slate-800 border border-transparent text-slate-600 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600'
                    }`}
                  >
                    {p + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 hover:shadow-sm disabled:opacity-40 disabled:hover:shadow-none transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
