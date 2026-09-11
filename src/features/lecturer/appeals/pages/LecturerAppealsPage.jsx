import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { message } from 'antd';
import useDebounce from '../../../../hooks/useDebounce';
import useLecturerAppeals from '../../../../hooks/useLecturerAppeals';
import { useAuth } from '../../../../app/context/authContext';
import LecturerAppealOverviewCards from '../components/LecturerAppealOverviewCards';
import LecturerAppealFilters from '../components/LecturerAppealFilters';
import LecturerAppealTable from '../components/LecturerAppealTable';
import { getLecturerAppealDetailPath } from '../helpers/appealHelpers';

const HIDDEN_STATUSES = new Set(['PENDING', 'PENDING_PAYMENT']);

const normalizeValue = (value) =>
  typeof value === 'string' ? value.trim().toLowerCase() : String(value ?? '').trim().toLowerCase();

export default function LecturerAppealsPage() {
  const navigate = useNavigate();
  const { setPageMeta } = useOutletContext();
  const { user } = useAuth();

  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const size = 10;

  const debouncedKeyword = useDebounce(keyword, 350);
  const params = useMemo(
    () => ({
      keyword: debouncedKeyword,
      status,
      page,
      size,
    }),
    [debouncedKeyword, status, page, size],
  );

  const { data, loading, error } = useLecturerAppeals(params);

  useEffect(() => {
    setPageMeta({
      title: 'Danh sách phúc khảo',
      subtitle: 'Theo dõi các đơn phúc khảo đã được phân công cho bạn.',
      breadcrumbs: [
        { label: 'Dashboard', to: '/lecturer' },
        { label: 'Phúc khảo' },
      ],
      headerActions: null,
    });
  }, [setPageMeta]);

  useEffect(() => {
    if (error) {
      message.error('Không tải được danh sách phúc khảo của giảng viên.');
    }
  }, [error]);

  const handleKeywordChange = (value) => {
    setKeyword(value);
    setPage(0);
  };

  const handleStatusChange = (value) => {
    setStatus(value);
    setPage(0);
  };

  const handleReset = () => {
    setKeyword('');
    setStatus('');
    setPage(0);
  };

  const currentLecturerId = normalizeValue(user?.userId);
  const currentLecturerEmail = normalizeValue(user?.email);
  const currentLecturerName = normalizeValue(user?.fullName ?? user?.fullname ?? user?.username);

  const filteredRows = useMemo(() => {
    const rows = Array.isArray(data?.appeals) ? data.appeals : [];

    return rows.filter((row) => {
      const normalizedStatus = String(row?.status || '').toUpperCase();
      if (HIDDEN_STATUSES.has(normalizedStatus)) {
        return false;
      }

      const assignedId = normalizeValue(row?.assignedLecturerId);
      const assignedEmail = normalizeValue(row?.assignedLecturerEmail);
      const assignedName = normalizeValue(row?.assignedLecturerName);
      const hasAssignmentIdentity = Boolean(assignedId || assignedEmail || assignedName);

      if (!hasAssignmentIdentity) {
        return true;
      }

      if (currentLecturerId && assignedId && currentLecturerId === assignedId) {
        return true;
      }

      if (currentLecturerEmail && assignedEmail && currentLecturerEmail === assignedEmail) {
        return true;
      }

      if (currentLecturerName && assignedName && currentLecturerName === assignedName) {
        return true;
      }

      return false;
    });
  }, [currentLecturerEmail, currentLecturerId, currentLecturerName, data?.appeals]);

  const totalElements = useMemo(() => {
    const serverTotal = Number(data?.totalElements ?? 0);
    const serverRows = Array.isArray(data?.appeals) ? data.appeals.length : 0;

    if (filteredRows.length === serverRows) {
      return serverTotal;
    }

    if (!page) {
      return filteredRows.length;
    }

    return serverTotal;
  }, [data?.appeals, data?.totalElements, filteredRows.length, page]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#F37021]">Lecturer Appeal Workspace</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Quản lý và chấm các đơn phúc khảo được giao</h2>
          </div>
        </div>
      </section>

      <LecturerAppealOverviewCards
        overview={data?.overview}
        loading={loading}
      />

      <LecturerAppealFilters
        keyword={keyword}
        onKeywordChange={handleKeywordChange}
        status={status}
        onStatusChange={handleStatusChange}
        onReset={handleReset}
      />

      <LecturerAppealTable
        rows={filteredRows}
        loading={loading}
        page={data?.currentPage ?? page}
        size={data?.pageSize ?? size}
        totalElements={totalElements}
        onPageChange={setPage}
        onOpenAppeal={(appealId, appealStatus) => navigate(getLecturerAppealDetailPath(appealId, appealStatus))}
      />
    </div>
  );
}
