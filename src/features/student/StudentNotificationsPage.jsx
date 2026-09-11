import React from 'react';
import StudentLayout from '../../components/layouts/student';
import NotificationCenterPage from '../../components/notifications/NotificationCenterPage';

export default function StudentNotificationsPage() {
  return (
    <StudentLayout
      activeNavKey="notifications"
      title="Thông báo"
      subtitle="Theo dõi toàn bộ thông báo học tập và chấm bài mới nhất."
      bodyClassName="px-8 py-8"
      useBodyContainer={true}
    >
      <NotificationCenterPage role="STUDENT" />
    </StudentLayout>
  );
}
