export const LECTURER_NAV_ITEMS = [
  { key: 'dashboard', icon: 'space_dashboard', label: 'Dashboard', to: '/lecturer' },
  {
    key: 'notifications',
    icon: 'notifications',
    label: 'Thông báo',
    to: '/lecturer/notifications',
    matchPrefix: '/lecturer/notifications',
  },
  {
    key: 'appeals',
    icon: 'gavel',
    label: 'Phúc khảo',
    to: '/lecturer/appeals',
    matchPrefix: '/lecturer/appeals',
  },
];
