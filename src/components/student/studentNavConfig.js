/**
 * Shared navigation config for all student pages.
 */
export const STUDENT_NAV_ITEMS = [
  { key: 'dashboard', icon: 'space_dashboard', label: 'Dashboard', to: '/student' },
  { key: 'submit', icon: 'upload_file', label: 'Nộp bài', to: '/student/submit' },
  { key: 'results', icon: 'grading', label: 'Kết quả', to: '/student/results' },
  { key: 'notifications', icon: 'notifications', label: 'Thông báo', to: '/student/notifications' },
  { key: 'wallet', icon: 'account_balance_wallet', label: 'Ví sinh viên', to: '/student/wallet' },
  { key: 'appeals', icon: 'rate_review', label: 'Phúc khảo', to: '/student/appeals' },
];
