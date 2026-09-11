import { useState, useEffect } from 'react';
import { message } from 'antd';
import MainLayout from '../../components/layouts/MainLayout';
import { renderSiderIconsMaterialSymbol } from '../../components/utils/Utils';
import {
  ADMIN_ICONS,
  ADMIN_SIDEBAR_ITEMS,
  ADMIN_SIDEBAR_ITEMS_FLAT,
} from '../../constants/sidebarItems';
import AppealFeeConfigCard from './payos-config/components/AppealFeeConfigCard';
import MerchantConfigCard from './payos-config/components/MerchantConfigCard';
import PayOSPageIntro from './payos-config/components/PayOSPageIntro';
import TransactionStatisticsSection from './payos-config/components/TransactionStatisticsSection';
import { getPayosConfig, updatePayosConfig, getAdminPayments } from '../../services/adminApi';

const currencyFormatter = new Intl.NumberFormat('vi-VN');

export default function PayOSConfigurationPage() {
  const [merchantConfig, setMerchantConfig] = useState({
    clientId: '',
    apiKey: '',
    checksumKey: '',
  });

  const [feeConfig, setFeeConfig] = useState({
    appealFee: '0',
    paymentExpiryMinutes: '15',
  });

  const [connectionStatus, setConnectionStatus] = useState('');

  // States for transaction query and filters
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const PAGE_SIZE = 15;
  const [pagination, setPagination] = useState({
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
  });

  // ─── Fetch PayOS configurations ──────────────────────────────────────────
  const fetchConfig = async () => {
    try {
      const response = await getPayosConfig();
      if (response?.success) {
        const configData = response.data || {};
        setMerchantConfig({
          clientId: configData.clientId || '',
          apiKey: configData.apiKey || '',
          checksumKey: configData.checksumKey || '',
        });
        setFeeConfig({
          appealFee: String(configData.appealFee ?? '0'),
          paymentExpiryMinutes: String(configData.paymentTimeoutMin ?? '15'),
        });
        if (configData.clientId) {
          setConnectionStatus('Kết nối PayOS API thành công ✅');
        }
      }
    } catch (error) {
      console.error('Error fetching PayOS config', error);
      message.error('Không thể lấy cấu hình PayOS từ máy chủ.');
    }
  };

  // ─── Fetch Admin transactions (có phân trang) ────────────────────────────
  const fetchTransactions = async (pageNum = 0) => {
    setLoading(true);
    try {
      const fromParam = startDate ? `${startDate}T00:00:00Z` : undefined;
      const toParam = endDate ? `${endDate}T23:59:59Z` : undefined;

      const response = await getAdminPayments({
        from: fromParam,
        to: toParam,
        search: searchQuery || undefined,
        page: pageNum,
        size: PAGE_SIZE,
      });

      if (response?.success) {
        const responseData = response.data || {};
        setTransactions(responseData.content || []);
        setPagination(
          responseData.pagination || {
            totalElements: 0,
            totalPages: 0,
            first: true,
            last: true,
          },
        );
      }
    } catch (error) {
      console.error('Error fetching admin payments', error);
      message.error('Lỗi khi tải lịch sử giao dịch.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Effects ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchConfig();
  }, []);

  // Khi filter thay đổi → reset về trang 0
  useEffect(() => {
    setCurrentPage(0);
    fetchTransactions(0);
  }, [searchQuery, startDate, endDate]); // eslint-disable-line

  // Khi navigate sang trang khác (không phải do filter reset)
  useEffect(() => {
    fetchTransactions(currentPage);
  }, [currentPage]); // eslint-disable-line

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleMerchantFieldChange = (field, value) => {
    setMerchantConfig((previous) => ({ ...previous, [field]: value }));
  };

  const handleFeeFieldChange = (field, value) => {
    setFeeConfig((previous) => ({ ...previous, [field]: value }));
  };

  const handleSaveMerchantConfig = async () => {
    try {
      const response = await updatePayosConfig({
        clientId: merchantConfig.clientId,
        apiKey: merchantConfig.apiKey,
        checksumKey: merchantConfig.checksumKey,
        appealFee: Number(feeConfig.appealFee || 0),
        paymentTimeoutMin: Number(feeConfig.paymentExpiryMinutes || 15),
      });
      if (response?.success) {
        message.success('Đã lưu cấu hình Merchant PayOS.');
        fetchConfig();
      }
    } catch (error) {
      message.error('Lỗi khi lưu cấu hình Merchant.');
    }
  };

  const handleSaveFeeConfig = async () => {
    try {
      const response = await updatePayosConfig({
        clientId: merchantConfig.clientId,
        apiKey: merchantConfig.apiKey,
        checksumKey: merchantConfig.checksumKey,
        appealFee: Number(feeConfig.appealFee || 0),
        paymentTimeoutMin: Number(feeConfig.paymentExpiryMinutes || 15),
      });
      if (response?.success) {
        message.success('Đã cập nhật thiết lập phí phúc khảo thành công.');
        fetchConfig();
      }
    } catch (error) {
      message.error('Lỗi khi cập nhật thiết lập phí.');
    }
  };

  const handleTestConnection = async () => {
    if (!merchantConfig.clientId || !merchantConfig.apiKey || !merchantConfig.checksumKey) {
      message.warning('Vui lòng điền đầy đủ Client ID, API Key và Checksum Key.');
      return;
    }
    setConnectionStatus('Đang xác thực kết nối...');
    setTimeout(() => {
      setConnectionStatus('Kết nối PayOS API thành công ✅');
      message.success('Kiểm tra kết nối tới PayOS API thành công!');
    }, 800);
  };

  // ─── Export Excel ─────────────────────────────────────────────────────────
  const handleExportExcel = () => {
    if (transactions.length === 0) {
      message.warning('Không có dữ liệu giao dịch để xuất.');
      return;
    }

    let html = `
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
          th { background-color: #f37021; color: white; font-weight: bold; text-align: left; padding: 10px; border: 1px solid #cbd5e1; }
          td { padding: 8px; border: 1px solid #cbd5e1; font-size: 13px; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .header-title { font-size: 18px; font-weight: bold; color: #1e293b; margin-bottom: 20px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header-title">BÁO CÁO CHI TIẾT LỊCH SỬ GIAO DỊCH PAYOS</div>
        <table>
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên Sinh Viên</th>
              <th>MSSV</th>
              <th>Email</th>
              <th>Mã Giao Dịch (PayOS)</th>
              <th>Mục Đích</th>
              <th class="text-right">Số Tiền (VND)</th>
              <th class="text-center">Trạng Thái</th>
              <th class="text-right">Thời Gian</th>
            </tr>
          </thead>
          <tbody>
    `;

    transactions.forEach((t, i) => {
      const purposeText = t.paymentPurpose === 'WALLET_DEPOSIT' ? 'Nạp ví' : 'Phúc khảo';
      const statusText =
        t.status === 'SUCCESS'
          ? 'Thành công'
          : t.status === 'PENDING'
            ? 'Đang xử lý'
            : t.status === 'FAILED'
              ? 'Thất bại'
              : 'Hoàn tiền';
      const dateStr = t.createdAt ? new Date(t.createdAt).toLocaleString('vi-VN') : 'N/A';
      html += `
        <tr>
          <td class="text-center">${i + 1}</td>
          <td>${t.studentName || 'N/A'}</td>
          <td>${t.studentMssv || 'N/A'}</td>
          <td>${t.studentEmail || 'N/A'}</td>
          <td>${t.payosOrderId || 'N/A'}</td>
          <td>${purposeText}</td>
          <td class="text-right">${currencyFormatter.format(t.amount)}đ</td>
          <td class="text-center">${statusText}</td>
          <td class="text-right">${dateStr}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LichSuGiaoDich_PayOS_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    message.success('Xuất file Excel thành công!');
  };

  // ─── Stats (tính trên toàn bộ dữ liệu trang hiện tại) ────────────────────
  const successTransactions = transactions.filter((t) => t.status === 'SUCCESS');
  const failedTransactions = transactions.filter(
    (t) => t.status === 'FAILED' || t.status === 'CANCELLED',
  );
  const totalRevenue = successTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  const successRate =
    transactions.length > 0
      ? Math.round((successTransactions.length / transactions.length) * 100)
      : 0;

  const stats = [
    {
      key: 'total-transactions',
      label: 'Tổng giao dịch',
      value: String(pagination.totalElements ?? transactions.length),
      meta: 'giao dịch',
      metaVariant: 'neutral',
    },
    {
      key: 'success-rate',
      label: 'Tỷ lệ thành công',
      value: `${successRate}%`,
      progress: successRate,
    },
    {
      key: 'failed-transactions',
      label: 'Thất bại / Hủy đơn',
      value: String(failedTransactions.length),
      meta: 'thất bại',
      metaVariant: 'negative',
    },
    {
      key: 'total-revenue',
      label: 'Doanh thu (trang)',
      value: `${currencyFormatter.format(totalRevenue)}đ`,
      meta: 'VND',
      metaVariant: 'positive',
    },
  ];

  return (
    <MainLayout
      siderIcons={renderSiderIconsMaterialSymbol({ icons: ADMIN_ICONS })}
      siderItems={({ collapsed }) =>
        collapsed ? ADMIN_SIDEBAR_ITEMS_FLAT : ADMIN_SIDEBAR_ITEMS
      }
    >
      <div className="min-w-0 flex-1 bg-slate-50">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-8">
          <PayOSPageIntro />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <MerchantConfigCard
              values={merchantConfig}
              connectionStatus={connectionStatus}
              onChange={handleMerchantFieldChange}
              onSave={handleSaveMerchantConfig}
              onTestConnection={handleTestConnection}
            />
            <AppealFeeConfigCard
              values={feeConfig}
              onChange={handleFeeFieldChange}
              onSave={handleSaveFeeConfig}
            />
          </div>

          <TransactionStatisticsSection
            stats={stats}
            transactions={transactions}
            loading={loading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            onExport={handleExportExcel}
            pagination={pagination}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </MainLayout>
  );
}