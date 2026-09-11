const testDashboardCardData = [
  {
    id: '1',
    title: 'Tổng người dùng',
    value: 1240,
    trend: '5.2%',
  },
  {
    id: '2',
    title: 'Số kì thi đang diễn ra',
    value: 48,
    trend: '0%',
  },
  {
    id: '3',
    title: 'Số bài nộp',
    value: 3,
    trend: '12.1%',
  },
  {
    id: '4',
    title: 'Bài cần phúc khảo',
    value: 18,
    trend: '!',
  },
];

const submissionsDay24H = {
  xAxis: ['07:00-08:30', '12:00-13:30', '15:00-16:30'],
  data: [60, 57, 60],
};

const submissionsBlock5 = {
  xAxis: ['09:00-10:30', '13:30-15:00', '15:30-17:00'],
  data: [50, 67, 70],
};

const submissionsBlock10 = {
  xAxis: ['09:00-10:30', '13:30-15:00', '15:30-17:00'],
  data: [53, 62, 50],
};

const userData = [
  { name: 'Sinh viên', value: 500 },
  { name: 'Giảng viên', value: 90 },
  { name: 'Cán bộ/Quản trị viên', value: 10 },
];

const auditLogs = [
  {
    id: 1,
    user: {
      initials: 'NV',
      initialsColor: 'bg-blue-100 text-blue-600',
      name: 'Nguyễn Văn A',
    },
    event: {
      label: 'Cập nhật prompt AI',
      icon: 'edit',
      cls: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    time: '2 phút trước',
    ip: '192.168.1.1',
  },
  {
    id: 2,
    user: {
      initials: 'LT',
      initialsColor: 'bg-purple-100 text-purple-600',
      name: 'Lê Thị B',
    },
    event: {
      label: 'Tạo kỳ thi mới',
      icon: 'add_circle',
      cls: 'bg-green-50 text-green-700 border-green-200',
    },
    time: '15 phút trước',
    ip: '172.16.254.1',
  },
  {
    id: 3,
    user: {
      initials: 'SA',
      initialsColor: 'bg-slate-800 text-white',
      name: 'Quản trị hệ thống',
    },
    event: {
      label: 'Thay đổi phân quyền',
      icon: 'admin_panel_settings',
      cls: 'bg-orange-50 text-orange-700 border-orange-200',
    },
    time: '1 giờ trước',
    ip: '10.0.0.42',
  },
  {
    id: 4,
    user: {
      initials: 'TV',
      initialsColor: 'bg-blue-100 text-blue-600',
      name: 'Trần Văn C',
    },
    event: {
      label: 'Duyệt phúc khảo #104',
      icon: 'done_all',
      cls: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    time: '3 giờ trước',
    ip: '192.168.1.15',
  },
  {
    id: 5,
    user: {
      initials: 'NT',
      initialsColor: 'bg-blue-100 text-blue-600',
      name: 'Nguyễn Thị D',
    },
    event: {
      label: 'Cập nhật cấu hình PayOS',
      icon: 'settings',
      cls: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    time: '5 giờ trước',
    ip: '127.0.0.1',
  },
];

const allRoles = [
  { value: 'Sinh viên', label: 'Sinh viên' },
  { value: 'Giảng viên', label: 'Giảng viên' },
  { value: 'Cán bộ khảo thí', label: 'Cán bộ khảo thí' },
  { value: 'Quản trị viên', label: 'Quản trị viên' },
];

const allStatus = [
  { value: 'Đang hoạt động', label: 'Đang hoạt động' },
  { value: 'Tạm khóa', label: 'Tạm khóa' },
];

const userSeedData = [
  {
    key: 1,
    user: {
      initials: 'NA',
      initialsColor: 'bg-blue-100 text-blue-600',
      name: 'Nguyễn An',
    },
    id: { email: 'an.nguyen1@fpt.edu.vn', mssv: 'SE170001' },
    role: 'Sinh viên',
    status: 'Đang hoạt động',
  },
  {
    key: 2,
    user: {
      initials: 'TB',
      initialsColor: 'bg-purple-100 text-purple-600',
      name: 'Trần Bình',
    },
    id: { email: 'binh.tran2@fpt.edu.vn', mssv: 'SE170002' },
    role: 'Sinh viên',
    status: 'Tạm khóa',
  },
  {
    key: 3,
    user: {
      initials: 'LC',
      initialsColor: 'bg-emerald-100 text-emerald-700',
      name: 'Lê Châu',
    },
    id: { email: 'chau.le3@fpt.edu.vn', mssv: 'SE170003' },
    role: 'Sinh viên',
    status: 'Đang hoạt động',
  },
  {
    key: 4,
    user: {
      initials: 'PD',
      initialsColor: 'bg-amber-100 text-amber-700',
      name: 'Phạm Dũng',
    },
    id: { email: 'dung.pham4@fpt.edu.vn', mssv: 'SE170004' },
    role: 'Sinh viên',
    status: 'Đang hoạt động',
  },
  {
    key: 5,
    user: {
      initials: 'HG',
      initialsColor: 'bg-slate-800 text-white',
      name: 'Hoàng Giang',
    },
    id: { email: 'giang.hoang5@fpt.edu.vn', mssv: 'SE170005' },
    role: 'Sinh viên',
    status: 'Tạm khóa',
  },
  {
    key: 6,
    user: {
      initials: 'BH',
      initialsColor: 'bg-blue-100 text-blue-600',
      name: 'Bùi Hà',
    },
    id: { email: 'ha.bui6@fpt.edu.vn', mssv: 'SE170006' },
    role: 'Sinh viên',
    status: 'Đang hoạt động',
  },
  {
    key: 7,
    user: {
      initials: 'ĐK',
      initialsColor: 'bg-purple-100 text-purple-600',
      name: 'Đặng Khánh',
    },
    id: { email: 'khanh.dang7@fpt.edu.vn', mssv: 'SE170007' },
    role: 'Sinh viên',
    status: 'Đang hoạt động',
  },
  {
    key: 8,
    user: {
      initials: 'VL',
      initialsColor: 'bg-emerald-100 text-emerald-700',
      name: 'Võ Linh',
    },
    id: { email: 'linh.vo8@fpt.edu.vn', mssv: 'SE170008' },
    role: 'Sinh viên',
    status: 'Tạm khóa',
  },
  {
    key: 9,
    user: {
      initials: 'ĐM',
      initialsColor: 'bg-amber-100 text-amber-700',
      name: 'Đỗ Minh',
    },
    id: { email: 'minh.do9@fpt.edu.vn', mssv: 'SE170009' },
    role: 'Sinh viên',
    status: 'Đang hoạt động',
  },
  {
    key: 10,
    user: {
      initials: 'HN',
      initialsColor: 'bg-slate-800 text-white',
      name: 'Huỳnh Ngọc',
    },
    id: { email: 'ngoc.huynh10@fpt.edu.vn', mssv: 'SE170010' },
    role: 'Sinh viên',
    status: 'Đang hoạt động',
  },
  {
    key: 11,
    user: {
      initials: 'NP',
      initialsColor: 'bg-blue-100 text-blue-600',
      name: 'Nguyễn Phúc',
    },
    id: { email: 'phuc.nguyen11@fpt.edu.vn', mssv: 'SE170011' },
    role: 'Sinh viên',
    status: 'Tạm khóa',
  },
  {
    key: 12,
    user: {
      initials: 'TQ',
      initialsColor: 'bg-purple-100 text-purple-600',
      name: 'Trần Quân',
    },
    id: { email: 'quan.tran12@fpt.edu.vn', mssv: 'SE170012' },
    role: 'Sinh viên',
    status: 'Đang hoạt động',
  },
  {
    key: 13,
    user: {
      initials: 'LT',
      initialsColor: 'bg-emerald-100 text-emerald-700',
      name: 'Lê Trang',
    },
    id: { email: 'trang.le13@fpt.edu.vn', mssv: 'SE170013' },
    role: 'Sinh viên',
    status: 'Đang hoạt động',
  },
  {
    key: 14,
    user: {
      initials: 'PV',
      initialsColor: 'bg-amber-100 text-amber-700',
      name: 'Phạm Vy',
    },
    id: { email: 'vy.pham14@fpt.edu.vn', mssv: 'SE170014' },
    role: 'Sinh viên',
    status: 'Tạm khóa',
  },
  {
    key: 15,
    user: {
      initials: 'HA',
      initialsColor: 'bg-slate-800 text-white',
      name: 'Hoàng An',
    },
    id: { email: 'an.hoang15@fpt.edu.vn', mssv: 'SE170015' },
    role: 'Sinh viên',
    status: 'Đang hoạt động',
  },
  {
    key: 16,
    user: {
      initials: 'TB',
      initialsColor: 'bg-blue-100 text-blue-600',
      name: 'Trần Bình',
    },
    id: { email: 'binh.tran16@fpt.edu.vn', mssv: 'SE170016' },
    role: 'Sinh viên',
    status: 'Đang hoạt động',
  },
  {
    key: 17,
    user: {
      initials: 'LC',
      initialsColor: 'bg-purple-100 text-purple-600',
      name: 'Lê Châu',
    },
    id: { email: 'chau.le17@fpt.edu.vn', mssv: 'SE170017' },
    role: 'Sinh viên',
    status: 'Tạm khóa',
  },
  {
    key: 18,
    user: {
      initials: 'PD',
      initialsColor: 'bg-emerald-100 text-emerald-700',
      name: 'Phạm Dũng',
    },
    id: { email: 'dung.pham18@fpt.edu.vn', mssv: 'SE170018' },
    role: 'Sinh viên',
    status: 'Đang hoạt động',
  },
  {
    key: 19,
    user: {
      initials: 'HG',
      initialsColor: 'bg-amber-100 text-amber-700',
      name: 'Hoàng Giang',
    },
    id: { email: 'giang.hoang19@fpt.edu.vn', mssv: 'SE170019' },
    role: 'Sinh viên',
    status: 'Đang hoạt động',
  },
  {
    key: 20,
    user: {
      initials: 'BH',
      initialsColor: 'bg-slate-800 text-white',
      name: 'Bùi Hà',
    },
    id: { email: 'ha.bui20@fpt.edu.vn', mssv: 'SE170020' },
    role: 'Sinh viên',
    status: 'Tạm khóa',
  },
  {
    key: 21,
    user: {
      initials: 'ĐK',
      initialsColor: 'bg-blue-100 text-blue-600',
      name: 'Đặng Khánh',
    },
    id: { email: 'khanh.dang21@fpt.edu.vn', mssv: 'SE170021' },
    role: 'Sinh viên',
    status: 'Đang hoạt động',
  },
  {
    key: 22,
    user: {
      initials: 'VL',
      initialsColor: 'bg-purple-100 text-purple-600',
      name: 'Võ Linh',
    },
    id: { email: 'linh.vo22@fpt.edu.vn', mssv: 'SE170022' },
    role: 'Sinh viên',
    status: 'Đang hoạt động',
  },
  {
    key: 23,
    user: {
      initials: 'ĐM',
      initialsColor: 'bg-emerald-100 text-emerald-700',
      name: 'Đỗ Minh',
    },
    id: { email: 'minh.do23@fpt.edu.vn', mssv: 'SE170023' },
    role: 'Sinh viên',
    status: 'Tạm khóa',
  },
  {
    key: 24,
    user: {
      initials: 'HN',
      initialsColor: 'bg-amber-100 text-amber-700',
      name: 'Huỳnh Ngọc',
    },
    id: { email: 'ngoc.huynh24@fpt.edu.vn', mssv: 'SE170024' },
    role: 'Sinh viên',
    status: 'Đang hoạt động',
  },
  {
    key: 25,
    user: {
      initials: 'NP',
      initialsColor: 'bg-slate-800 text-white',
      name: 'Nguyễn Phúc',
    },
    id: { email: 'phuc.nguyen25@fpt.edu.vn', mssv: 'SE170025' },
    role: 'Sinh viên',
    status: 'Đang hoạt động',
  },
  {
    key: 26,
    user: {
      initials: 'TQ',
      initialsColor: 'bg-blue-100 text-blue-600',
      name: 'Trần Quân',
    },
    id: { email: 'quan.tran26@fpt.edu.vn', mssv: 'SE170026' },
    role: 'Sinh viên',
    status: 'Tạm khóa',
  },
  {
    key: 27,
    user: {
      initials: 'LT',
      initialsColor: 'bg-purple-100 text-purple-600',
      name: 'Lê Trang',
    },
    id: { email: 'trang.le27@fpt.edu.vn', mssv: 'SE170027' },
    role: 'Sinh viên',
    status: 'Đang hoạt động',
  },
  {
    key: 28,
    user: {
      initials: 'PV',
      initialsColor: 'bg-emerald-100 text-emerald-700',
      name: 'Phạm Vy',
    },
    id: { email: 'vy.pham28@fpt.edu.vn', mssv: 'SE170028' },
    role: 'Sinh viên',
    status: 'Đang hoạt động',
  },
  {
    key: 29,
    user: {
      initials: 'NA',
      initialsColor: 'bg-amber-100 text-amber-700',
      name: 'Nguyễn An',
    },
    id: { email: 'an.nguyen29@fpt.edu.vn', mssv: 'SE170029' },
    role: 'Sinh viên',
    status: 'Tạm khóa',
  },
  {
    key: 30,
    user: {
      initials: 'TB',
      initialsColor: 'bg-slate-800 text-white',
      name: 'Trần Bình',
    },
    id: { email: 'binh.tran30@fpt.edu.vn', mssv: 'SE170030' },
    role: 'Sinh viên',
    status: 'Đang hoạt động',
  },
  // Lecturers
  {
    key: 31,
    user: {
      initials: 'HM',
      initialsColor: 'bg-emerald-100 text-emerald-700',
      name: 'Hoàng Minh',
    },
    id: { email: 'minh.hoang31@fpt.edu.vn', mssv: 'GV00031' },
    role: 'Giảng viên',
    status: 'Đang hoạt động',
  },
  {
    key: 32,
    user: {
      initials: 'LH',
      initialsColor: 'bg-blue-100 text-blue-600',
      name: 'Lê Hà',
    },
    id: { email: 'ha.le32@fpt.edu.vn', mssv: 'GV00032' },
    role: 'Giảng viên',
    status: 'Đang hoạt động',
  },
  {
    key: 33,
    user: {
      initials: 'TK',
      initialsColor: 'bg-purple-100 text-purple-600',
      name: 'Trần Khánh',
    },
    id: { email: 'khanh.tran33@fpt.edu.vn', mssv: 'GV00033' },
    role: 'Giảng viên',
    status: 'Tạm khóa',
  },
  {
    key: 34,
    user: {
      initials: 'PN',
      initialsColor: 'bg-amber-100 text-amber-700',
      name: 'Phạm Ngọc',
    },
    id: { email: 'ngoc.pham34@fpt.edu.vn', mssv: 'GV00034' },
    role: 'Giảng viên',
    status: 'Đang hoạt động',
  },
  {
    key: 35,
    user: {
      initials: 'BV',
      initialsColor: 'bg-slate-800 text-white',
      name: 'Bùi Vy',
    },
    id: { email: 'vy.bui35@fpt.edu.vn', mssv: 'GV00035' },
    role: 'Giảng viên',
    status: 'Đang hoạt động',
  },
  // Exam staff
  {
    key: 36,
    user: {
      initials: 'PL',
      initialsColor: 'bg-amber-100 text-amber-700',
      name: 'Phạm Linh',
    },
    id: { email: 'linh.pham36@fpt.edu.vn', mssv: 'CB00036' },
    role: 'Cán bộ khảo thí',
    status: 'Đang hoạt động',
  },
  {
    key: 37,
    user: {
      initials: 'ĐQ',
      initialsColor: 'bg-blue-100 text-blue-600',
      name: 'Đặng Quân',
    },
    id: { email: 'quan.dang37@fpt.edu.vn', mssv: 'CB00037' },
    role: 'Cán bộ khảo thí',
    status: 'Đang hoạt động',
  },
  {
    key: 38,
    user: {
      initials: 'VL',
      initialsColor: 'bg-purple-100 text-purple-600',
      name: 'Võ Linh',
    },
    id: { email: 'linh.vo38@fpt.edu.vn', mssv: 'CB00038' },
    role: 'Cán bộ khảo thí',
    status: 'Tạm khóa',
  },
  {
    key: 39,
    user: {
      initials: 'ĐD',
      initialsColor: 'bg-emerald-100 text-emerald-700',
      name: 'Đỗ Dũng',
    },
    id: { email: 'dung.do39@fpt.edu.vn', mssv: 'CB00039' },
    role: 'Cán bộ khảo thí',
    status: 'Đang hoạt động',
  },
  {
    key: 40,
    user: {
      initials: 'HN',
      initialsColor: 'bg-slate-800 text-white',
      name: 'Huỳnh Ngọc',
    },
    id: { email: 'ngoc.huynh40@fpt.edu.vn', mssv: 'CB00040' },
    role: 'Cán bộ khảo thí',
    status: 'Đang hoạt động',
  },
  // Admins
  {
    key: 41,
    user: {
      initials: 'QT',
      initialsColor: 'bg-slate-800 text-white',
      name: 'Quản trị hệ thống',
    },
    id: { email: 'admin41@fpt.edu.vn', mssv: 'AD00041' },
    role: 'Quản trị viên',
    status: 'Đang hoạt động',
  },
  {
    key: 42,
    user: {
      initials: 'NA',
      initialsColor: 'bg-blue-100 text-blue-600',
      name: 'Nguyễn An',
    },
    id: { email: 'an.nguyen42@fpt.edu.vn', mssv: 'AD00042' },
    role: 'Quản trị viên',
    status: 'Đang hoạt động',
  },
  {
    key: 43,
    user: {
      initials: 'TB',
      initialsColor: 'bg-purple-100 text-purple-600',
      name: 'Trần Bình',
    },
    id: { email: 'binh.tran43@fpt.edu.vn', mssv: 'AD00043' },
    role: 'Quản trị viên',
    status: 'Tạm khóa',
  },
  {
    key: 44,
    user: {
      initials: 'LC',
      initialsColor: 'bg-emerald-100 text-emerald-700',
      name: 'Lê Châu',
    },
    id: { email: 'chau.le44@fpt.edu.vn', mssv: 'AD00044' },
    role: 'Quản trị viên',
    status: 'Đang hoạt động',
  },
  {
    key: 45,
    user: {
      initials: 'PD',
      initialsColor: 'bg-amber-100 text-amber-700',
      name: 'Phạm Dũng',
    },
    id: { email: 'dung.pham45@fpt.edu.vn', mssv: 'AD00045' },
    role: 'Quản trị viên',
    status: 'Đang hoạt động',
  },
  // More mixed
  {
    key: 46,
    user: {
      initials: 'HG',
      initialsColor: 'bg-slate-800 text-white',
      name: 'Hoàng Giang',
    },
    id: { email: 'giang.hoang46@fpt.edu.vn', mssv: 'SE170046' },
    role: 'Sinh viên',
    status: 'Đang hoạt động',
  },
  {
    key: 47,
    user: {
      initials: 'BH',
      initialsColor: 'bg-blue-100 text-blue-600',
      name: 'Bùi Hà',
    },
    id: { email: 'ha.bui47@fpt.edu.vn', mssv: 'SE170047' },
    role: 'Sinh viên',
    status: 'Tạm khóa',
  },
  {
    key: 48,
    user: {
      initials: 'ĐK',
      initialsColor: 'bg-purple-100 text-purple-600',
      name: 'Đặng Khánh',
    },
    id: { email: 'khanh.dang48@fpt.edu.vn', mssv: 'SE170048' },
    role: 'Sinh viên',
    status: 'Đang hoạt động',
  },
  {
    key: 49,
    user: {
      initials: 'VL',
      initialsColor: 'bg-emerald-100 text-emerald-700',
      name: 'Võ Linh',
    },
    id: { email: 'linh.vo49@fpt.edu.vn', mssv: 'SE170049' },
    role: 'Sinh viên',
    status: 'Đang hoạt động',
  },
  {
    key: 50,
    user: {
      initials: 'ĐM',
      initialsColor: 'bg-amber-100 text-amber-700',
      name: 'Đỗ Minh',
    },
    id: { email: 'minh.do50@fpt.edu.vn', mssv: 'SE170050' },
    role: 'Sinh viên',
    status: 'Tạm khóa',
  },
  {
    key: 51,
    user: {
      initials: 'HN',
      initialsColor: 'bg-slate-800 text-white',
      name: 'Huỳnh Ngọc',
    },
    id: { email: 'ngoc.huynh51@fpt.edu.vn', mssv: 'SE170051' },
    role: 'Sinh viên',
    status: 'Đang hoạt động',
  },
  {
    key: 52,
    user: {
      initials: 'NP',
      initialsColor: 'bg-blue-100 text-blue-600',
      name: 'Nguyễn Phúc',
    },
    id: { email: 'phuc.nguyen52@fpt.edu.vn', mssv: 'SE170052' },
    role: 'Sinh viên',
    status: 'Đang hoạt động',
  },
  {
    key: 53,
    user: {
      initials: 'TQ',
      initialsColor: 'bg-purple-100 text-purple-600',
      name: 'Trần Quân',
    },
    id: { email: 'quan.tran53@fpt.edu.vn', mssv: 'SE170053' },
    role: 'Sinh viên',
    status: 'Tạm khóa',
  },
  {
    key: 54,
    user: {
      initials: 'LT',
      initialsColor: 'bg-emerald-100 text-emerald-700',
      name: 'Lê Trang',
    },
    id: { email: 'trang.le54@fpt.edu.vn', mssv: 'SE170054' },
    role: 'Sinh viên',
    status: 'Đang hoạt động',
  },
  {
    key: 55,
    user: {
      initials: 'PV',
      initialsColor: 'bg-amber-100 text-amber-700',
      name: 'Phạm Vy',
    },
    id: { email: 'vy.pham55@fpt.edu.vn', mssv: 'SE170055' },
    role: 'Sinh viên',
    status: 'Đang hoạt động',
  },
];

export {
  testDashboardCardData,
  submissionsDay24H,
  submissionsBlock5,
  submissionsBlock10,
  userData,
  auditLogs,
  allRoles,
  allStatus,
  userSeedData,
};
