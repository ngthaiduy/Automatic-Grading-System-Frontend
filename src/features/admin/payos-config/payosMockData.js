export const payOSInitialMerchantConfig = {
  clientId: "",
  apiKey: "",
  checksumKey: "",
};

export const payOSInitialFeeConfig = {
  appealFee: '200000',
  paymentExpiryMinutes: '15',
};

export const payOSTransactionStats = [
  {
    key: 'total-transactions',
    label: 'Tổng giao dịch',
    value: '1,284',
    meta: '+12%',
    metaVariant: 'positive',
  },
  {
    key: 'success-rate',
    label: 'Tỷ lệ thành công',
    value: '98.2%',
    progress: 98,
  },
  {
    key: 'total-refunds',
    label: 'Tổng hoàn tiền',
    value: '12.4M',
    meta: 'VND',
    metaVariant: 'neutral',
  },
];

export const payOSRecentTransactions = [
  {
    key: 'PAY-92104',
    studentName: 'Nguyễn Văn An',
    paymentCode: '#PAY-92104',
    amount: 200000,
    status: 'Success',
    executedAt: 'Hôm nay, 14:20',
  },
  {
    key: 'PAY-92098',
    studentName: 'Lê Thị Bình',
    paymentCode: '#PAY-92098',
    amount: 200000,
    status: 'Pending',
    executedAt: 'Hôm nay, 12:45',
  },
  {
    key: 'PAY-92085',
    studentName: 'Trần Hoàng Cường',
    paymentCode: '#PAY-92085',
    amount: 200000,
    status: 'Failed',
    executedAt: 'Hôm qua, 18:10',
  },
  {
    key: 'PAY-92077',
    studentName: 'Phạm Minh Đạo',
    paymentCode: '#PAY-92077',
    amount: 200000,
    status: 'Refunded',
    executedAt: 'Hôm qua, 09:30',
  },
];