import React, { useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import useLecturerDashboard from '../../../../hooks/useLecturerDashboard';
import { DASHBOARD_CARD_CONFIG } from '../helpers/lecturerDashboardHelpers';
import { getLecturerAppealDetailPath } from '../../appeals/helpers/appealHelpers';
import LecturerDashboardCard from '../components/LecturerDashboardCard';
import LecturerAssignedAppealsTable from '../components/LecturerAssignedAppealsTable';
import LecturerUpcomingDeadlines from '../components/LecturerUpcomingDeadlines';
import LecturerReviewStats from '../components/LecturerReviewStats';

export default function LecturerDashboardPage() {
  const navigate = useNavigate();
  const { setPageMeta } = useOutletContext();

  const {
    overview,
    assignedAppeals,
    upcomingDeadlines,
    reviewStats,
    loading,
  } = useLecturerDashboard();

  useEffect(() => {
    setPageMeta({
      title: 'Dashboard giảng viên',
      subtitle: 'Theo dõi các đơn phúc khảo được giao và deadline cần xử lý.',
      breadcrumbs: [{ label: 'Dashboard' }],
      headerActions: null,
    });
  }, [setPageMeta]);

  const handleOpenAppeal = (appealId, status) => {
    navigate(getLecturerAppealDetailPath(appealId, status));
  };

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {DASHBOARD_CARD_CONFIG.map((card) => (
          <LecturerDashboardCard
            key={card.key}
            title={card.title}
            value={overview?.[card.key] ?? 0}
            icon={card.icon}
            tone={card.tone}
            loading={loading}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <LecturerAssignedAppealsTable
          items={assignedAppeals}
          loading={loading}
          onOpenAppeal={handleOpenAppeal}
        />

        <div className="space-y-6">
          <LecturerUpcomingDeadlines
            items={upcomingDeadlines}
            loading={loading}
            onOpenAppeal={handleOpenAppeal}
          />

          <LecturerReviewStats
            stats={reviewStats}
            loading={loading}
          />
        </div>
      </section>
    </div>
  );
}