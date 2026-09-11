import { useCallback, useEffect, useState } from 'react';
import {
  getLecturerAppeals,
  getLecturerDashboardAssignedAppeals,
  getLecturerDashboardOverview,
  getLecturerDashboardReviewStats,
  getLecturerDashboardUpcomingDeadlines,
} from '../services/lecturerApi';
import {
  buildAssignedAppealsFallback,
  buildReviewStatsFallback,
  buildUpcomingDeadlinesFallback,
  mapAppealsOverviewToDashboardOverview,
  pickPreferredArray,
} from '../features/lecturer/dashboard/helpers/lecturerDashboardHelpers';

function getFulfilledData(result) {
  if (result?.status !== 'fulfilled') {
    return null;
  }

  return result.value?.data ?? null;
}

function getFirstRejectedError(results) {
  const rejectedResult = results.find((result) => result?.status === 'rejected');
  return rejectedResult?.reason ?? null;
}

export default function useLecturerDashboard() {
  const [data, setData] = useState({
    overview: null,
    assignedAppeals: [],
    upcomingDeadlines: [],
    reviewStats: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    const results = await Promise.allSettled([
      getLecturerDashboardOverview(),
      getLecturerDashboardAssignedAppeals({ limit: 5 }),
      getLecturerDashboardUpcomingDeadlines({ limit: 5 }),
      getLecturerDashboardReviewStats(),
      getLecturerAppeals({ page: 0, size: 5 }),
    ]);

    const [overviewResult, assignedResult, upcomingResult, reviewStatsResult, appealsResult] = results;

    const lecturerAppealsPage = getFulfilledData(appealsResult);
    const fallbackOverview = mapAppealsOverviewToDashboardOverview(lecturerAppealsPage?.overview);
    const fallbackAssignedAppeals = buildAssignedAppealsFallback(lecturerAppealsPage?.appeals, 5);
    const fallbackUpcomingDeadlines = buildUpcomingDeadlinesFallback(lecturerAppealsPage?.appeals, 5);

    const overview = getFulfilledData(overviewResult) ?? fallbackOverview;
    const assignedAppeals = pickPreferredArray(
      getFulfilledData(assignedResult),
      fallbackAssignedAppeals,
    );
    const upcomingDeadlines = pickPreferredArray(
      getFulfilledData(upcomingResult),
      fallbackUpcomingDeadlines,
    );
    const reviewStats =
      getFulfilledData(reviewStatsResult)
      ?? buildReviewStatsFallback(lecturerAppealsPage?.overview);

    const hasAnySuccessfulRequest = results.some((result) => result?.status === 'fulfilled');

    if (!hasAnySuccessfulRequest) {
      setError(getFirstRejectedError(results) ?? new Error('Không tải được dữ liệu dashboard giảng viên.'));
      setData({
        overview: null,
        assignedAppeals: [],
        upcomingDeadlines: [],
        reviewStats: null,
      });
      setLoading(false);
      return;
    }

    setData({
      overview,
      assignedAppeals,
      upcomingDeadlines,
      reviewStats,
    });

    const criticalSectionsMissing =
      !getFulfilledData(overviewResult)
      || !getFulfilledData(assignedResult)
      || !getFulfilledData(upcomingResult);

    setError(criticalSectionsMissing ? getFirstRejectedError(results) : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    ...data,
    loading,
    error,
    refresh: fetchDashboard,
  };
}
