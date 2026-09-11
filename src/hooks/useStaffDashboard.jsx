import { useState, useEffect, useCallback } from 'react';
import {
  getStaffDashboardOverview,
  getStaffDashboardRecentExams,
  getStaffDashboardGradeDistribution,
  getStaffDashboardPendingAppeals,
} from '../services/staffApi';

const unwrapData = (res) => res?.data ?? null;

const useStaffDashboard = ({
  recentExamsLimit = 5,
  pendingAppealsLimit = 10,
} = {}) => {
  const [overview, setOverview] = useState(null);
  const [recentExams, setRecentExams] = useState([]);
  const [gradeDistribution, setGradeDistribution] = useState(null);
  const [pendingAppeals, setPendingAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setErrors({});

    const results = await Promise.allSettled([
      getStaffDashboardOverview(),
      getStaffDashboardRecentExams({ limit: recentExamsLimit }),
      getStaffDashboardGradeDistribution(),
      getStaffDashboardPendingAppeals({ limit: pendingAppealsLimit }),
    ]);

    const [ov, re, gd, pa] = results;
    const nextErrors = {};

    if (ov.status === 'fulfilled') {
      setOverview(unwrapData(ov.value));
    } else {
      nextErrors.overview = 'Không tải được thống kê tổng quan.';
    }

    if (re.status === 'fulfilled') {
      const raw = unwrapData(re.value);
      setRecentExams(Array.isArray(raw) ? raw : []);
    } else {
      nextErrors.recentExams = 'Không tải được danh sách kỳ thi.';
      setRecentExams([]);
    }

    if (gd.status === 'fulfilled') {
      setGradeDistribution(unwrapData(gd.value));
    } else {
      nextErrors.gradeDistribution = 'Không tải được phân bố điểm.';
      setGradeDistribution(null);
    }

    if (pa.status === 'fulfilled') {
      const raw = unwrapData(pa.value);
      setPendingAppeals(Array.isArray(raw) ? raw : []);
    } else {
      nextErrors.pendingAppeals = 'Không tải được đơn phúc khảo.';
      setPendingAppeals([]);
    }

    setErrors(nextErrors);
    setLoading(false);
  }, [recentExamsLimit, pendingAppealsLimit]);

  useEffect(() => {
    // Initial load: fetchAll updates multiple state slices from API responses.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional mount fetch
    void fetchAll();
  }, [fetchAll]);

  return {
    overview,
    recentExams,
    gradeDistribution,
    pendingAppeals,
    loading,
    errors,
    refetch: fetchAll,
  };
};

export default useStaffDashboard;
