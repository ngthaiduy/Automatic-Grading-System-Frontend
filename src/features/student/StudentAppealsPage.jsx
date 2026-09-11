import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import StudentLayout from '../../components/layouts/student';
import appealApi from '../../services/appealApi';
import gradingApi from '../../services/gradingApi';
import AppealEmptyState from './appeals/components/AppealEmptyState';
import AppealListCard from './appeals/components/AppealListCard';
import AppealOverviewCards from './appeals/components/AppealOverviewCards';
import {
  buildAppealSearchIndex,
  extractAppealErrorMessage,
  matchesAppealStatusFilter,
  resolveAppealOverview,
  resolveAppealsList,
  unwrapApiData,
} from './appeals/helpers/appealHelpers';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'RECEIVED', label: 'Đã tiếp nhận' },
  { value: 'ASSIGNED', label: 'Đã phân công' },
  { value: 'DONE', label: 'Hoàn thành đơn' },
];
const PAGE_SIZE = 10;

function SuccessBanner({ createdAppeal, onClose }) {
  if (!createdAppeal) return null;

  return (
    <section className="rounded-3xl border border-emerald-200 bg-emerald-50 px-6 py-5 text-emerald-800 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <span className="material-symbols-outlined">verified</span>
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight">Đã gửi yêu cầu phúc khảo</h2>
            <p className="mt-1 text-sm leading-6">
              Yêu cầu của bạn đã được tạo thành công và đang chờ hệ thống xử lý.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 items-center justify-center rounded-2xl border border-current/15 bg-white/70 px-4 text-sm font-bold transition-colors hover:bg-white"
        >
          Đã hiểu
        </button>
      </div>
    </section>
  );
}

function PaginationControls({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  const pages = [];

  for (let page = startPage; page <= endPage; page += 1) {
    pages.push(page);
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition-colors hover:border-[#F37021] hover:text-[#F37021] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Trước
      </button>

      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          className={`inline-flex h-10 min-w-10 items-center justify-center rounded-2xl px-4 text-sm font-black transition-colors ${
            currentPage === page
              ? 'bg-[#F37021] text-white shadow-lg shadow-orange-500/20'
              : 'border border-slate-200 text-slate-700 hover:border-[#F37021] hover:text-[#F37021]'
          }`}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition-colors hover:border-[#F37021] hover:text-[#F37021] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Sau
      </button>
    </div>
  );
}

async function enrichAppealsWithGradingDetails(appeals = []) {
  if (!Array.isArray(appeals) || !appeals.length) return [];

  const gradingEntries = await Promise.all(
    appeals.map(async (appeal) => {
      const submissionId = appeal?.submissionId;

      if (!submissionId) {
        return [submissionId, null];
      }

      try {
        const gradingResponse = await gradingApi.getSubmissionResult(submissionId);
        return [submissionId, unwrapApiData(gradingResponse)];
      } catch {
        return [submissionId, null];
      }
    }),
  );

  const gradingMap = new Map(gradingEntries);

  return appeals.map((appeal) => ({
    ...appeal,
    gradingDetail: gradingMap.get(appeal?.submissionId) ?? null,
  }));
}

export default function StudentAppealsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [overview, setOverview] = useState(resolveAppealOverview(null));
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [createdAppeal, setCreatedAppeal] = useState(location.state?.createdAppeal ?? null);

  const loadAppeals = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const response = await appealApi.getMyAppeals();
      const payload = unwrapApiData(response);
      const appeals = resolveAppealsList(payload);
      const enrichedAppeals = await enrichAppealsWithGradingDetails(appeals);
      setOverview(resolveAppealOverview(enrichedAppeals));
    } catch (apiError) {
      setError(
        extractAppealErrorMessage(
          apiError,
          'Không thể tải danh sách phúc khảo lúc này. Vui lòng thử lại.',
        ),
      );
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadAppeals();
  }, [loadAppeals]);

  useEffect(() => {
    if (location.state?.createdAppeal) {
      message.success('Đã tạo yêu cầu phúc khảo thành công.');
    }
  }, [location.state]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword, statusFilter, overview.appeals]);

  const handleClearCreatedAppeal = useCallback(() => {
    setCreatedAppeal(null);
    navigate('/student/appeals', { replace: true, state: {} });
  }, [navigate]);

  const filteredAppeals = useMemo(() => {
    const normalizedKeyword = searchKeyword.trim().toLowerCase();

    return (overview.appeals || []).filter((item) => {
      const matchesStatus = matchesAppealStatusFilter(item?.status, statusFilter);
      const matchesKeyword = !normalizedKeyword
        || buildAppealSearchIndex(item).includes(normalizedKeyword);
      return matchesStatus && matchesKeyword;
    });
  }, [overview.appeals, searchKeyword, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAppeals.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStartIndex = filteredAppeals.length === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE;
  const pagedAppeals = filteredAppeals.slice(pageStartIndex, pageStartIndex + PAGE_SIZE);
  const visibleFrom = filteredAppeals.length === 0 ? 0 : pageStartIndex + 1;
  const visibleTo = Math.min(pageStartIndex + PAGE_SIZE, filteredAppeals.length);

  const headerActions = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => loadAppeals({ silent: true })}
        title="Làm mới danh sách phúc khảo"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-800"
      >
        <span className={`material-symbols-outlined text-[20px] ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
      </button>

      <Link
        to="/student/results"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:border-[#F37021]/30 hover:text-[#F37021]"
      >
        <span className="material-symbols-outlined text-[18px]">bar_chart</span>
        Chọn bài cần phúc khảo
      </Link>
    </div>
  );

  return (
    <StudentLayout
      activeNavKey="appeals"
      title="Phúc khảo của tôi"
      breadcrumbs={[
        { label: 'Trang chủ', to: '/student' },
        { label: 'Phúc khảo' },
      ]}
      headerActions={headerActions}
      bodyClassName="mx-auto max-w-7xl space-y-6 px-8 py-8"
    >
      <section className="rounded-3xl border border-slate-200 bg-white/95 px-6 py-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Theo dõi phúc khảo</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Theo dõi tất cả yêu cầu phúc khảo</h1>
          </div>

          <Link
            to="/student/wallet"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#F37021] px-5 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition-colors hover:bg-orange-500"
          >
            <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            Mở ví sinh viên
          </Link>
        </div>
      </section>

      <SuccessBanner createdAppeal={createdAppeal} onClose={handleClearCreatedAppeal} />

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-16 shadow-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-full border-4 border-[#F37021]/30 border-t-[#F37021] animate-spin" />
            <p className="text-sm font-medium text-slate-500">Đang tải danh sách phúc khảo...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-white p-12 shadow-sm">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="material-symbols-outlined text-[44px] text-rose-500">error</span>
            <h2 className="text-xl font-black text-slate-800">Không thể tải phúc khảo</h2>
            <p className="max-w-xl text-sm leading-6 text-slate-500">{error}</p>
            <button
              type="button"
              onClick={() => loadAppeals()}
              className="mt-1 inline-flex h-11 items-center justify-center rounded-2xl bg-[#F37021] px-5 text-sm font-black text-white transition-colors hover:bg-orange-500"
            >
              Thử lại
            </button>
          </div>
        </div>
      ) : (
        <>
          <AppealOverviewCards overview={overview} />

          <section className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(event) => setSearchKeyword(event.target.value)}
                    placeholder="Tìm theo mã yêu cầu, tên kỳ thi hoặc giảng viên..."
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-700 outline-none transition-all focus:border-[#F37021] focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-12 min-w-[220px] rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-[#F37021] focus:ring-4 focus:ring-orange-100"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="text-sm font-medium text-slate-500">
                Hiển thị <span className="font-bold text-slate-700">{visibleFrom}-{visibleTo}</span> / {filteredAppeals.length} yêu cầu
              </div>
            </div>
          </section>

          {filteredAppeals.length === 0 ? (
            <AppealEmptyState hasFilter={Boolean(searchKeyword || statusFilter !== 'ALL')} />
          ) : (
            <>
              <section className="space-y-3">
                {pagedAppeals.map((appeal) => (
                  <AppealListCard key={appeal.appealId || appeal.appealCode} appeal={appeal} />
                ))}
              </section>

              <PaginationControls
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(Math.min(Math.max(page, 1), totalPages))}
              />
            </>
          )}
        </>
      )}
    </StudentLayout>
  );
}
