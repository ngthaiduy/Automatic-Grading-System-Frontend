import React, { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import NotificationCenterPage from '../../../../components/notifications/NotificationCenterPage';

export default function LecturerNotificationsPage() {
  const { setPageMeta } = useOutletContext();

  useEffect(() => {
    setPageMeta({
      title: 'Thông báo',
      subtitle: 'Theo dõi và xử lý thông báo cho giảng viên.',
      breadcrumbs: [
        { label: 'Dashboard', to: '/lecturer' },
        { label: 'Thông báo' },
      ],
      headerActions: null,
    });
  }, [setPageMeta]);

  return <NotificationCenterPage role="LECTURER" />;
}
