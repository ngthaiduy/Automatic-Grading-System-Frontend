export const STAFF_SIDEBAR_ITEMS = [
  {
    key: '1',
    label: 'Bảng điều khiển',
    to: '/exam-staff',
  },
  {
    key: '2',
    label: 'Quản lí kỳ thi',
    to: '/exam-staff/exams',
  },
  {
    key: '6',
    label: 'Quản lí bài nộp',
    to: '/exam-staff/submissions',
  },
  {
    key: '3',
    label: 'Đơn phúc khảo',
    to: '/exam-staff/appeals',
  },
  {
    key: '4',
    label: 'Yêu cầu rút tiền',
    to: '/exam-staff/withdrawals',
  },
  {
    key: '5',
    label: 'Thông báo',
    to: '/exam-staff/notifications',
  },
];

export const STAFF_ICONS = [
  'dashboard',
  'event_note',
  'assignment',
  'gavel',
  'payments',
  'notifications',
];

export const ADMIN_ICONS = [
  'dashboard',
  'group',
  'rule',
  'payments',
  'settings',
  'history',
];

export const ADMIN_SIDEBAR_ITEMS_FLAT = [
  { key: '1', label: 'Bảng điều khiển', to: '/admin' },
  { key: '3', label: 'Người dùng & Roles', to: '/admin/student-management' },
  { key: '4', label: 'Chế độ chấm', to: '/admin/grading-config' },
  { key: '5', label: 'Cấu hình PayOS', to: '/admin/payos-configuration' },
  {
    key: '7',
    label: 'Hệ thống',
    to: '/admin/system-config',
  },
  {
    key: '8',
    label: 'Nhật ký thao tác',
    to: '/admin/audits',
  },
];

export const ADMIN_SIDEBAR_ITEMS = [
  {
    key: 'g1',
    label: 'Giám sát',
    type: 'group',
    children: [
      { key: '1', label: 'Bảng điều khiển', to: '/admin' },
    ],
  },
  {
    key: 'g2',
    label: 'Quản lí',
    type: 'group',
    children: [
      {
        key: '3',
        label: 'Người dùng & Roles',
        to: '/admin/student-management',
      },
    ],
  },
  {
    key: 'g3',
    label: 'Cấu hình',
    type: 'group',
    children: [
      { key: '4', label: 'Chế độ chấm', to: '/admin/grading-config' },
      { key: '5', label: 'Cấu hình PayOS', to: '/admin/payos-configuration' },
      {
        key: '7',
        label: 'Hệ thống',
        to: '/admin/system-config',
      },
      {
        key: '8',
        label: 'Nhật ký thao tác',
        to: '/admin/audits',
      },
    ],
  },
];
