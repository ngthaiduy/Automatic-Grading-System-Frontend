const examStatusConfig = {
  ONGOING: {
    label: 'Đang diễn ra',
    cls: 'bg-green-100 text-green-700 border-green-200',
  },
  UPCOMING: {
    label: 'Sắp diễn ra',
    cls: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  COMPLETED: {
    label: 'Đã kết thúc',
    cls: 'bg-slate-200 text-slate-700 border-slate-300',
  },
};

const appealStatusConfig = {
  PENDING_PAYMENT: {
    label: 'Chờ thanh toán',
    icon: 'payments',
    cls: 'bg-orange-100 text-orange-900 border-orange-200',
  },
  PENDING: {
    label: 'Chờ phân công',
    icon: 'schedule',
    cls: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  PROCESSING: {
    label: 'Đã phân công',
    icon: 'assignment_ind',
    cls: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  ASSIGNED: {
    label: 'Đã phân công',
    icon: 'assignment_ind',
    cls: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  COMPLETED: {
    label: 'Đã chấm lại',
    icon: 'fact_check',
    cls: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  APPROVED: {
    label: 'Đã duyệt',
    icon: 'task_alt',
    cls: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  DENIED: {
    label: 'Từ chối',
    icon: 'cancel',
    cls: 'bg-red-100 text-red-800 border-red-200',
  },
  CANCELLED: {
    label: 'Đã hủy',
    icon: 'block',
    cls: 'bg-slate-200 text-slate-700 border-slate-300',
  },
};

export { examStatusConfig, appealStatusConfig };
