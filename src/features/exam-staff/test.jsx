export const testDashboardCardData = [
  {
    id: '1',
    title: 'Kỳ thi đang diễn ra',
    value: 3,
    iconKey: 'exam',
    iconBackground: '#FFF4EE',
  },
  {
    id: '2',
    title: 'Số bài nộp',
    value: 48,
    iconKey: 'submission',
    iconBackground: '#E0F2FE',
  },
  {
    id: '3',
    title: 'Số bài đã chấm',
    value: 3,
    iconKey: 'appeal',
    iconBackground: '#FEF3C7',
  },
  {
    id: '4',
    title: 'Bài cần phúc khảo',
    value: 156,
    iconKey: 'audit',
    iconBackground: '#E0E7FF',
  },
];

export const testRecentExamData = [
  { id: '1', name: 'Kỳ thi OOP - Đợt 1', date: '2025-03-01', status: 'Đã kết thúc' },
  { id: '2', name: 'Kỳ thi OOP - Đợt 2', date: '2025-03-15', status: 'Đang mở' },
];

export const testAppealData = [
  { id: '1', examName: 'OOP Đợt 1', studentName: 'Nguyễn Văn A', status: 'Chờ xử lý' },
];

export const testChartData = [
  { label: 'Tuần 1', submissions: 120 },
  { label: 'Tuần 2', submissions: 98 },
  { label: 'Tuần 3', submissions: 145 },
];

/** Full dashboard payload returned by getDashboardData() */
export const testDashboardData = {
  card: testDashboardCardData,
  recentExam: testRecentExamData,
  appeal: testAppealData,
  chart: testChartData,
};
