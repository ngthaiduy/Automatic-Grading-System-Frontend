import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import viVN from 'antd/locale/vi_VN';
import MainLayout from '../../components/layouts/MainLayout';
import { STAFF_ICONS, STAFF_SIDEBAR_ITEMS } from '../../constants/sidebarItems';
import { ConfigProvider, DatePicker, Select, Empty, Table } from 'antd';
import CardContainer from '../../components/CardContainer';
import { useGetAuditLogs } from '../../hooks';
import { renderSiderIconsMaterialSymbol } from '../../components/utils/Utils.jsx';
import emptyImg from '../../assets/empty.png';

dayjs.locale('vi');

const { RangePicker } = DatePicker;

const AUDIT_ACTION_OPTIONS = [
  { value: 'CREATE', label: 'Tạo mới' },
  { value: 'UPDATE', label: 'Cập nhật' },
  { value: 'DELETE', label: 'Xóa' },
  { value: 'LOGIN', label: 'Đăng nhập' },
  { value: 'LOGOUT', label: 'Đăng xuất' },
  { value: 'SUBMIT', label: 'Nộp bài' },
  { value: 'GRADE', label: 'Chấm điểm' },
  { value: 'APPROVE', label: 'Phê duyệt' },
  { value: 'DENY', label: 'Từ chối' },
  { value: 'ASSIGN', label: 'Phân công' },
  { value: 'PAYMENT', label: 'Thanh toán' },
  { value: 'REFUND', label: 'Hoàn tiền' },
  { value: 'CONFIG_CHANGE', label: 'Thay đổi cấu hình' },
];

const formatDateTime = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
};

const AuditLogsPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(8);
  const [actionFilter, setActionFilter] = useState(undefined);
  const [dateRange, setDateRange] = useState(null);

  const { callGetAuditLogsEndpoint, data, loading } = useGetAuditLogs();

  const renderedSiderIcons = renderSiderIconsMaterialSymbol({
    icons: STAFF_ICONS,
  });

  useEffect(() => {
    const from =
      dateRange?.[0] != null
        ? dateRange[0].startOf('day').toISOString()
        : undefined;
    const to =
      dateRange?.[1] != null
        ? dateRange[1].endOf('day').toISOString()
        : undefined;

    callGetAuditLogsEndpoint({
      page,
      size,
      action: actionFilter,
      from,
      to,
    });
  }, [page, size, actionFilter, dateRange]);

  const pageData = data ?? {};
  const rows = pageData?.content ?? [];
  const totalElements = pageData?.totalElements ?? 0;

  const columns = useMemo(
    () => [
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold z-0">
            Thời gian
          </p>
        ),
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 180,
        render: (v) => (
          <span className="text-sm text-slate-800 whitespace-nowrap z-0">
            {formatDateTime(v)}
          </span>
        ),
      },
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold z-0">
            Người dùng
          </p>
        ),
        dataIndex: 'username',
        key: 'username',
        width: 130,
        render: (v) => (
          <span className="text-sm font-medium text-slate-800">{v ?? '—'}</span>
        ),
      },
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold z-0">Vai trò</p>
        ),
        dataIndex: 'role',
        key: 'role',
        width: 110,
        render: (v) => (
          <span className="text-sm text-slate-700">{v ?? '—'}</span>
        ),
      },
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold z-0">
            Hành động
          </p>
        ),
        dataIndex: 'action',
        key: 'action',
        width: 110,
        render: (v) => (
          <span className="text-xs font-semibold text-[#F37021] uppercase">
            {v ?? '—'}
          </span>
        ),
      },
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold z-0">
            Loại
          </p>
        ),
        dataIndex: 'entityType',
        key: 'entityType',
        width: 130,
        render: (v) => (
          <span className="text-sm text-slate-700">{v ?? '—'}</span>
        ),
      },
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold z-0">
            ID{' '}
          </p>
        ),
        dataIndex: 'entityId',
        key: 'entityId',
        width: 120,
        ellipsis: true,
        render: (v) => (
          <span
            className="text-xs font-mono text-slate-600"
            title={v ?? ''}
          >
            {v ?? '—'}
          </span>
        ),
      },
      //   {
      //     title: (
      //       <p className="text-xs uppercase tracking-wider font-bold">IP</p>
      //     ),
      //     dataIndex: 'ipAddress',
      //     key: 'ipAddress',
      //     width: 120,
      //     render: (v) => <span className="text-sm text-slate-600">{v ?? '—'}</span>,
      //   },
      //   {
      //     title: (
      //       <p className="text-xs uppercase tracking-wider font-bold">
      //         Giá trị cũ
      //       </p>
      //     ),
      //     dataIndex: 'oldValues',
      //     key: 'oldValues',
      //     ellipsis: true,
      //     render: (v) => (
      //       <span className="text-xs text-slate-600" title={v ?? ''}>
      //         {ellipsis(v, 64)}
      //       </span>
      //     ),
      //   },
      //   {
      //     title: (
      //       <p className="text-xs uppercase tracking-wider font-bold">
      //         Giá trị mới
      //       </p>
      //     ),
      //     dataIndex: 'newValues',
      //     key: 'newValues',
      //     ellipsis: true,
      //     render: (v) => (
      //       <span className="text-xs text-slate-600" title={v ?? ''}>
      //         {ellipsis(v, 64)}
      //       </span>
      //     ),
      //   },
      {
        title: (
          <p className="text-xs text-center uppercase tracking-wider font-bold -z-50">
            Thao tác
          </p>
        ),
        key: 'thaoTac',
        width: 140,
        fixed: 'right',
        render: (_, record) => (
          <div className="flex justify-center align-middle z-0">
            <button
              type="button"
              className="bg-white border border-slate-300 text-slate-700 hover:text-[#F37021] hover:border-[#F37021] px-3 py-2 rounded-md text-xs font-bold transition-all shadow-sm"
              onClick={() =>
                navigate(`/exam-staff/audits/${record.auditLogId}`)
              }
            >
              Xem chi tiết
            </button>
          </div>
        ),
      },
    ],
    [navigate],
  );

  return (
    <MainLayout
      siderIcons={renderedSiderIcons}
      siderItems={STAFF_SIDEBAR_ITEMS}
    >
      <ConfigProvider
        locale={viVN}
        theme={{
          components: {
            Button: { colorPrimary: '#F37021' },
            Table: {
              cellPaddingInline: 12,
              cellPaddingBlock: 6,
              headerBg: '#f8fafc',
              headerColor: '#45556c',
              headerSplitColor: 'transparent',
              rowHoverBg: 'rgb(243, 112, 33, 0.05)',
            },
            Pagination: {
              itemActiveBg: '#F37021',
              colorPrimary: '#F37021',
              itemActiveColor: '#ffffff',
              colorPrimaryHover: '#ffffff',
            },
          },
        }}
      >
        <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
          <CardContainer className="!p-0 overflow-hidden">
            <div className="px-4 py-3">
              <div className="flex gap-2 items-center mb-4">
                <span className="material-symbols-outlined text-[#F37021] text-2xl">
                  history
                </span>
                <h1 className="text-xl font-semibold">Nhật ký thao tác</h1>
              </div>

              <div className="px-0 py-3 max-w-7xl mx-auto w-full flex flex-wrap items-center gap-2 z-0 border-b border-slate-100 mb-4">
                <Select
                  className="flex-1 max-w-[200px]"
                  options={AUDIT_ACTION_OPTIONS}
                  size="large"
                  placeholder="Hành động"
                  allowClear
                  value={actionFilter}
                  onChange={(v) => {
                    setActionFilter(v);
                    setPage(0);
                  }}
                />
                <RangePicker
                  className="flex-1 min-w-[280px] max-w-md"
                  size="large"
                  value={dateRange}
                  onChange={(dates) => {
                    setDateRange(dates);
                    setPage(0);
                  }}
                  allowClear
                  format="DD/MM/YYYY"
                />
              </div>

              <Table
                className="-z-5"
                rowKey="auditLogId"
                columns={columns}
                dataSource={rows}
                loading={loading}
                // scroll={{ x: 1200 }}
                locale={{
                  emptyText: (
                    <div className="py-10">
                      <Empty
                        image={emptyImg}
                        imageStyle={{
                          height: 300,
                          objectFit: 'contain',
                          display: 'flex',
                          justifyContent: 'center',
                          opacity: 1,
                        }}
                        description={
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-slate-700 mb-0">
                              Không tìm thấy người dùng phù hợp
                            </p>
                            <p className="text-xs text-slate-400 mb-0">
                              Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc vai trò,
                              trạng thái.
                            </p>
                          </div>
                        }
                      />
                    </div>
                  ),
                }}
                pagination={{
                  current: page + 1,
                  pageSize: size,
                  total: totalElements,
                  showSizeChanger: false,
                  //showTotal: (t) => `${t} bản ghi`,
                  onChange: (p, ps) => {
                    setPage(p - 1);
                    setSize(ps);
                  },
                }}
              />
            </div>
          </CardContainer>
        </div>
      </ConfigProvider>
    </MainLayout>
  );
};

export default AuditLogsPage;
