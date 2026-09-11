import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getAdminDashboardOverview,
  getAdminDashboardUserStats,
  getAdminDashboardRecentActivities,
  getAdminDashboardSystemHealth,
  getAdminDashboardSystemActivity,
} from '../services/adminApi';

const unwrapData = (res) => res?.data ?? null;

const useAdminDashboard = ({ activitiesLimit = 10 } = {}) => {
  const [overview, setOverview] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [systemActivity, setSystemActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [activityPeriod, setActivityPeriod] = useState('7d');
  const activityPeriodRef = useRef(activityPeriod);
  const skipPeriodEffect = useRef(false);

  useEffect(() => {
    activityPeriodRef.current = activityPeriod;
  }, [activityPeriod]);

  const loadSystemActivity = useCallback(async (period) => {
    setActivityLoading(true);
    try {
      const res = await getAdminDashboardSystemActivity({ period });
      setSystemActivity(unwrapData(res));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.systemActivity;
        return next;
      });
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        systemActivity:
          err?.response?.data?.message ?? 'Không tải được biểu đồ hoạt động.',
      }));
    } finally {
      setActivityLoading(false);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setErrors({});
    const period = activityPeriodRef.current;

    const results = await Promise.allSettled([
      getAdminDashboardOverview(),
      getAdminDashboardUserStats(),
      getAdminDashboardRecentActivities({ limit: activitiesLimit }),
      getAdminDashboardSystemHealth(),
      getAdminDashboardSystemActivity({ period }),
    ]);

    const [o, u, r, h, a] = results;
    const nextErrors = {};

    if (o.status === 'fulfilled') {
      setOverview(unwrapData(o.value));
    } else {
      nextErrors.overview = 'Không tải được thống kê tổng quan.';
    }

    if (u.status === 'fulfilled') {
      setUserStats(unwrapData(u.value));
    } else {
      nextErrors.userStats = 'Không tải được phân bố người dùng.';
    }

    if (r.status === 'fulfilled') {
      const raw = unwrapData(r.value);
      setRecentActivities(Array.isArray(raw) ? raw : []);
    } else {
      nextErrors.recentActivities = 'Không tải được nhật ký gần đây.';
      setRecentActivities([]);
    }

    if (h.status === 'fulfilled') {
      setSystemHealth(unwrapData(h.value));
    } else {
      nextErrors.systemHealth = 'Không tải được giám sát tài nguyên.';
    }

    if (a.status === 'fulfilled') {
      setSystemActivity(unwrapData(a.value));
    } else {
      nextErrors.systemActivity = 'Không tải được biểu đồ hoạt động.';
    }

    setErrors(nextErrors);
    setLoading(false);
  }, [activitiesLimit]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!skipPeriodEffect.current) {
      skipPeriodEffect.current = true;
      return;
    }
    loadSystemActivity(activityPeriod);
  }, [activityPeriod, loadSystemActivity]);

  const refetch = useCallback(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    overview,
    userStats,
    recentActivities,
    systemHealth,
    systemActivity,
    loading,
    activityLoading,
    errors,
    activityPeriod,
    setActivityPeriod,
    refetch,
  };
};

export default useAdminDashboard;
