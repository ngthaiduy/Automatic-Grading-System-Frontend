import React, { useCallback, useEffect, useMemo, useState } from 'react';
import viVN from 'antd/locale/vi_VN';
import {
  ConfigProvider,
  Table,
  Select,
  Button,
  Modal,
  Form,
  Input,
  Tag,
  message,
  Empty,
} from 'antd';
import MainLayout from '../../components/layouts/MainLayout';
import { STAFF_ICONS, STAFF_SIDEBAR_ITEMS } from '../../constants/sidebarItems';
import { renderSiderIconsMaterialSymbol } from '../../components/utils/Utils.jsx';
import { formatDateTime } from '../../components/utils/Utils';
import { getStaffWithdrawals, processStaffWithdrawal } from '../../services/staffApi';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Chờ xử lý' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Đã từ chối' },
  { value: 'COMPLETED', label: 'Hoàn tất' },
];

const STATUS_META = {
  PENDING: { label: 'Chờ xử lý', color: 'gold' },
  APPROVED: { label: 'Đã duyệt', color: 'green' },
  REJECTED: { label: 'Đã từ chối', color: 'red' },
  COMPLETED: { label: 'Hoàn tất', color: 'blue' },
};

const currency = new Intl.NumberFormat('vi-VN');

const formatCurrency = (value) => `${currency.format(Number(value ?? 0))} ₫`;

const maskAccountNumber = (value) => {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return '—';
  if (digits.length <= 4) return digits;
  return `${'*'.repeat(Math.max(digits.length - 4, 0))}${digits.slice(-4)}`;
};

export default function WithdrawalManagementPage() {
  const [rows, setRows] = useState([]);
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [decision, setDecision] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const renderedSiderIcons = renderSiderIconsMaterialSymbol({
    icons: STAFF_ICONS,
  });

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStaffWithdrawals({ status: statusFilter });
      const data = Array.isArray(res?.data) ? res.data : [];
      setRows(data);
    } catch (error) {
      messageApi.error(error?.response?.data?.message || 'Không tải được danh sách yêu cầu rút tiền.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const overview = useMemo(() => {
    const safeRows = Array.isArray(rows) ? rows : [];
    return {
      total: safeRows.length,
      pending: safeRows.filter((item) => item?.status === 'PENDING').length,
      approved: safeRows.filter((item) => item?.status === 'APPROVED').length,
      rejected: safeRows.filter((item) => item?.status === 'REJECTED').length,
    };
  }, [rows]);

  const openDecisionModal = (row, nextDecision) => {
    setSelectedRow(row);
    setDecision(nextDecision);
    form.setFieldsValue({
      adminNote: nextDecision === 'reject' ? '' : row?.adminNote || '',
    });
    setModalOpen(true);
  };

  const closeDecisionModal = () => {
    setModalOpen(false);
    setSelectedRow(null);
    setDecision(null);
    form.resetFields();
  };

  const handleProcess = async () => {
    try {
      const values = await form.validateFields();
      if (!selectedRow) return;

      setActionLoading(true);
      const payload = {
        isApproved: decision === 'approve',
        adminNote: String(values?.adminNote || '').trim(),
      };

      const res = await processStaffWithdrawal(selectedRow.withdrawalId, payload);
      messageApi.success(
        res?.message ||
          (decision === 'approve'
            ? 'Đã duyệt yêu cầu rút tiền.'
            : 'Đã từ chối yêu cầu rút tiền.'),
      );
      closeDecisionModal();
      await loadRows();
    } catch (error) {
      if (error?.errorFields) return;
      messageApi.error(error?.response?.data?.message || 'Không thể xử lý yêu cầu rút tiền.');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      title: 'Sinh viên',
      key: 'student',
      render: (_, row) => (
        <div>
          <p className="font-semibold text-slate-800">{row?.studentName || '—'}</p>
          <p className="text-xs text-slate-500">{row?.studentMssv || row?.studentEmail || '—'}</p>
        </div>
      ),
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (value) => <span className="font-bold text-slate-900">{formatCurrency(value)}</span>,
    },
    {
      title: 'Tài khoản nhận',
      key: 'banking',
      render: (_, row) => (
        <div>
          <p className="font-semibold text-slate-800">{row?.bankName || '—'}</p>
          <p className="text-xs text-slate-500">{row?.accountHolder || '—'}</p>
          <p className="text-xs text-slate-400">{maskAccountNumber(row?.accountNumber)}</p>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (value) => {
        const meta = STATUS_META[String(value || '').toUpperCase()] || {
          label: value || '—',
          color: 'default',
        };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: 'Ngày gửi',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value) => formatDateTime(value),
    },
    {
      title: 'Ghi chú',
      dataIndex: 'adminNote',
      key: 'adminNote',
      render: (value) => (
        <span className="text-slate-600">{value?.trim() ? value : '—'}</span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 220,
      render: (_, row) =>
        row?.status === 'PENDING' ? (
          <div className="flex items-center gap-2">
            <Button
              type="primary"
              onClick={() => openDecisionModal(row, 'approve')}
              className="bg-[#F37021]"
            >
              Duyệt
            </Button>
            <Button danger onClick={() => openDecisionModal(row, 'reject')}>
              Từ chối
            </Button>
          </div>
        ) : (
          <span className="text-slate-400">Đã xử lý</span>
        ),
    },
  ];

  return (
    <MainLayout siderIcons={renderedSiderIcons} siderItems={STAFF_SIDEBAR_ITEMS}>
      <ConfigProvider
        locale={viVN}
        theme={{
          components: {
            Button: { colorPrimary: '#F37021' },
          },
        }}
      >
        {contextHolder}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
          <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 py-8 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  Quản lý yêu cầu rút tiền
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Kiểm tra và xử lý các yêu cầu rút tiền từ ví sinh viên.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Select
                  allowClear
                  value={statusFilter}
                  onChange={setStatusFilter}
                  placeholder="Lọc theo trạng thái"
                  style={{ minWidth: 180 }}
                  options={STATUS_OPTIONS}
                />
                <Button onClick={loadRows}>Làm mới</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { title: 'Tổng yêu cầu', value: overview.total },
                { title: 'Chờ xử lý', value: overview.pending },
                { title: 'Đã duyệt', value: overview.approved },
                { title: 'Đã từ chối', value: overview.rejected },
              ].map((card) => (
                <div
                  key={card.title}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                    {card.title}
                  </p>
                  <p className="mt-3 text-3xl font-black text-slate-900">
                    {card.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <Table
                rowKey={(row) => row?.withdrawalId}
                loading={loading}
                columns={columns}
                dataSource={rows}
                locale={{
                  emptyText: (
                    <Empty description="Chưa có yêu cầu rút tiền nào." />
                  ),
                }}
                pagination={{
                  pageSize: 10,
                  hideOnSinglePage: true,
                }}
              />
            </div>
          </div>
        </div>

        <Modal
          open={modalOpen}
          onCancel={closeDecisionModal}
          onOk={handleProcess}
          okText={decision === 'approve' ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
          cancelText="Hủy"
          confirmLoading={actionLoading}
          title={decision === 'approve' ? 'Duyệt yêu cầu rút tiền' : 'Từ chối yêu cầu rút tiền'}
          okButtonProps={decision === 'approve' ? { className: 'bg-[#F37021]' } : { danger: true }}
        >
          <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-600">
              Sinh viên: <span className="font-semibold text-slate-900">{selectedRow?.studentName || '—'}</span>
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Số tiền: <span className="font-semibold text-slate-900">{formatCurrency(selectedRow?.amount)}</span>
            </p>
          </div>

          <Form form={form} layout="vertical">
            <Form.Item
              name="adminNote"
              label="Ghi chú"
              rules={
                decision === 'reject'
                  ? [
                      {
                        required: true,
                        message: 'Vui lòng nhập lý do từ chối.',
                      },
                    ]
                  : []
              }
            >
              <Input.TextArea
                rows={4}
                maxLength={500}
                placeholder={
                  decision === 'approve'
                    ? 'Thêm ghi chú nếu cần.'
                    : 'Nhập lý do từ chối yêu cầu rút tiền.'
                }
              />
            </Form.Item>
          </Form>
        </Modal>
      </ConfigProvider>
    </MainLayout>
  );
}
