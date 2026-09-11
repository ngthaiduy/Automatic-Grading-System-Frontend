import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../app/context/authContext';
import {
  DashboardIcon,
  AIConfigurationIcon,
  AdvanceSettingsIcon,
  ExamManagementIcon,
  GradingSettingIcon,
  PayOSConfigIcon,
  RoleManagementIcon,
  UserManagementIcon,
} from '../../components/icons/SidebarIcons.jsx';
import {
  DownloadOutlined,
  PlusOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import {
  message,
  ConfigProvider,
  Table,
  Button,
  Input,
  Select,
  Upload,
  Empty,
  Tabs,
  Form,
} from 'antd';
import {
  renderSiderIconsMaterialSymbol,
  renderRolePill,
  renderStatusPill,
} from '../../components/utils/Utils';
import MainLayout from '../../components/layouts/MainLayout';
import {
  ADMIN_SIDEBAR_ITEMS,
  ADMIN_ICONS,
  ADMIN_SIDEBAR_ITEMS_FLAT,
} from '../../constants/sidebarItems';
import { allRoles, allStatus } from './test.jsx';
import Modal from '../../components/Modal.jsx';
import {
  useImportExcel,
  useGetUsers,
  useDebounce,
  useCreateUser,
} from '../../hooks';
import emptyImg from '../../assets/empty.png';
import { getAllUsers } from '../../services/adminApi';
import { exportToExcel } from '../../components/utils/exportExcel.js';

const rolesMap = new Map([
  ['STUDENT', 'Sinh viên'],
  ['LECTURER', 'Giảng viên'],
  ['EXAM_STAFF', 'Cán bộ khảo thí'],
  ['SYSTEM_ADMIN', 'Quản trị viên'],
]);

const UserManagement = () => {
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState(1);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);
  const [form] = Form.useForm();
  const [validationError, setValidationError] = useState(true);

  const [roleFilter, setRoleFilter] = useState();
  const debouncedFilter = useDebounce(roleFilter, 500);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportingUsers, setIsExportingUsers] = useState(false);
  const [selectedPageSize, setSelectedPageSize] = useState(8);

  const {
    fetchUsers,
    loading: usersLoading,
    error: usersError,
    users,
    currentPage,
    isLast,
    pageSize,
    totalItems,
    totalPages,
  } = useGetUsers();

  const {
    callImportExcelEndpoint,
    importExcelData,
    loading: importLoading,
    error: importError,
  } = useImportExcel();

  const {
    callCreateUserEndpoint,
    loading: createUserLoading,
    error: createUserError,
  } = useCreateUser();

  const createUserRoleOptions = Array.from(rolesMap.entries()).map(
    ([value, label]) => {
      return {
        value,
        label,
      };
    },
  );

  useEffect(() => {
    fetchUsers({
      page: 0,
      size: selectedPageSize,
      search: debouncedQuery,
      roleName: debouncedFilter,
    });
  }, [debouncedQuery, debouncedFilter, selectedPageSize]);

  const USER_COLUMNS = useMemo(
    () => [
      {
        title: <p className="text-xs uppercase tracking-wider font-bold text-center">STT</p>,
        key: 'stt',
        width: 72,
        align: 'center',
        render: (_, __, index) => {
          const safePage = Math.max(Number(currentPage || 1), 1);
          const safePageSize = Math.max(Number(pageSize || 8), 1);
          return (
            <span className="text-[13px] font-bold text-slate-500">
              {(safePage - 1) * safePageSize + index + 1}
            </span>
          );
        },
      },
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold">
            Người dùng
          </p>
        ),
        dataIndex: 'user',
        key: 'user',
        render: (user) => (
          <div className="flex items-center gap-3">
            <div
              className={`size-8 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${user.initialsColor}`}
            >
              {user.initials}
            </div>
            <span className="font-semibold text-slate-800 text-[16px]">
              {user.name}
            </span>
          </div>
        ),
      },
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold">
            Email/MSSV
          </p>
        ),
        dataIndex: 'id',
        key: 'id',
        render: (id) => (
          <span className={`flex flex-col gap-1.5 px-2.5 py-1 `}>
            <span className="text-[16px]">{id.email}</span>
            <span className="text-[13px] text-slate-400">{id.mssv}</span>
          </span>
        ),
      },
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold">Vai trò</p>
        ),
        dataIndex: 'role',
        key: 'role',
        render: (role) => renderRolePill({ role }),
      },
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold">
            Trạng thái
          </p>
        ),
        dataIndex: 'status',
        key: 'status',
        render: (status) => renderStatusPill({ status }),
      },
      {
        title: (
          <p className="text-xs text-center uppercase tracking-wider font-bold">
            Thao tác
          </p>
        ),
        dataIndex: 'action',
        key: 'action',
        render: (_, record) => (
          <div className="flex justify-center align-middle">
            <button
              className="bg-white border border-slate-300 text-slate-700 hover:text-[#F37021] hover:border-[#F37021] px-3 py-2 rounded-md text-xs font-bold transition-all shadow-sm"
              onClick={() =>
                navigate(`/admin/student-management/${record.userId}`)
              }
            >
              Xem chi tiết
            </button>
          </div>
        ),
      },
    ],
    [currentPage, navigate, pageSize],
  );

  const pageStatusStats = useMemo(() => {
    const safeUsers = Array.isArray(users) ? users : [];
    return safeUsers.reduce(
      (acc, item) => {
        const status = item?.status;
        if (status === 'đang hoạt động') acc.active += 1;
        else if (status === 'đã bị khóa') acc.locked += 1;
        else if (status === 'chưa kích hoạt') acc.pending += 1;
        return acc;
      },
      { active: 0, locked: 0, pending: 0 },
    );
  }, [users]);

  const handleUpload = async ({ file, onSuccess, onError }) => {
    try {
      await callImportExcelEndpoint(file);
      onSuccess(null, file);
      message.success(`${file.name} uploaded thành công!.`);
    } catch (err) {
      onError(err);
      if (err.response) {
        message.error(`${err.response.data.message}`);
      } else {
        message.error(`Lỗi mạng: ${err.message}`);
      }
    }
  };

  const handleCreateUser = async () => {
    const payload = Object.fromEntries(
      Object.entries(form.getFieldsValue()).map(([key, value]) => [
        key,
        value.trim(),
      ]),
    );

    if (Object.values(payload).some((value) => value === '')) {
      message.warning('Vui lòng nhập đầy đủ thông tin người dùng.');
      return;
    }

    try {
      await callCreateUserEndpoint(payload);
      message.success('Tạo người dùng thành công.');
      setIsModalOpen(false);

      fetchUsers({
        search: debouncedQuery,
        roleName: debouncedFilter,
        page: 0,
        size: selectedPageSize,
      });
    } catch (err) {
      if (err?.response?.data?.message) {
        message.error(err.response.data.message);
      } else {
        message.error('Tạo người dùng thất bại.');
      }
    }
  };

  const handleExportUsers = async () => {
    if (isExportingUsers) return;
    setIsExportingUsers(true);
    try {
      const batchSize = 1000;
      const collected = [];

      const res = await getAllUsers({
        page: 0,
        size: batchSize,
        search: debouncedQuery || undefined,
        roleName: debouncedFilter || undefined,
      });
      const pageData = res?.data ?? {};
      console.log(pageData);
      const list = pageData?.content ?? [];
      collected.push(...list);

      if (!collected.length) {
        message.warning('Không có dữ liệu để xuất.');
        return;
      }

      const roleLabel = (roleName) =>
        rolesMap.get(roleName) ?? String(roleName ?? '—');

      const columns = [
        { header: 'MSSV', key: 'mssv', width: 18 },
        { header: 'Họ và tên', key: 'fullName', width: 30 },
        { header: 'Email', key: 'email', width: 36 },
        { header: 'Vai trò', key: 'roleName', width: 22 },
        { header: 'Trạng thái', key: 'status', width: 18 },
        { header: 'Ngày tạo', key: 'createdAt', width: 24 },
      ];

      const rowsForExport = collected.map((u) => ({
        mssv: String(u.mssv ?? ''),
        fullName: String(u.fullName ?? ''),
        email: String(u.email ?? ''),
        roleName: roleLabel(u.roleName),
        status: u.isLocked
          ? 'Đã bị khóa'
          : u.isActive
            ? 'Đang hoạt động'
            : 'Chưa kích hoạt',
        createdAt: u.createdAt
          ? new Date(u.createdAt).toLocaleString('vi-VN')
          : '—',
      }));

      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = String(now.getFullYear());
      const fileName = `user_report-${dd}-${mm}-${yyyy}.xlsx`;

      await exportToExcel({
        fileName,
        sheetName: 'Users',
        columns,
        rows: rowsForExport,
      });

      message.success('Xuất Excel thành công.');
    } catch (err) {
      if (err?.response?.data?.message) {
        message.error(err.response.data.message);
      } else {
        message.error('Xuất Excel thất bại.');
      }
    } finally {
      setIsExportingUsers(false);
    }
  };

  const handleDownloadImportTemplate = async () => {
    try {
      const columns = [
        { header: 'Email', key: 'email', width: 36 },
        { header: 'FullName', key: 'fullName', width: 30 },
        { header: 'MSSV', key: 'mssv', width: 16 },
      ];

      await exportToExcel({
        fileName: 'user_import_template.xlsx',
        sheetName: 'users',
        columns,
        rows: [],
      });

      message.success('Tải template Excel thành công.');
    } catch (err) {
      message.error('Tải template Excel thất bại.');
    }
  };

  return (
    <MainLayout
      siderIcons={renderSiderIconsMaterialSymbol({ icons: ADMIN_ICONS })}
      siderItems={({ collapsed }) => {
        if (collapsed) {
          return ADMIN_SIDEBAR_ITEMS_FLAT;
        } else {
          return ADMIN_SIDEBAR_ITEMS;
        }
      }}
      currentSelectedItem={(item) => setSelectedIndex(Number(item.key))}
    >
      <ConfigProvider
        theme={{
          components: {
            Table: {
              cellPaddingInline: 12,
              cellPaddingBlock: 6,
              headerBg: '#f8fafc',
              headerColor: '#45556c',
              headerSplitColor: 'transparent',
              rowHoverBg: 'rgb(243, 112, 33, 0.05)',
            },
            Button: { colorPrimary: '#F37021' },
            Pagination: {
              itemActiveBg: '#F37021',
              colorPrimary: '#F37021',
              itemActiveColor: '#ffffff',
              colorPrimaryHover: '#ffffff',
            },
            Tabs: {
              inkBarColor: '#F37021',
              itemHoverColor: '#F37021',
              itemSelectedColor: '#F37021',
            },
          },
        }}
      >
        <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-[#FFF7F2] via-[#FFFDFB] to-white">
          <div className="px-4 pt-5 pb-3 max-w-7xl mx-auto w-full">
            <div className="rounded-2xl border border-orange-100 bg-white/95 backdrop-blur px-6 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wider font-black text-[#F37021]">
                    Admin Panel
                  </p>
                  <h1 className="mt-1 text-2xl font-black text-slate-900">
                    Quản lý người dùng
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Quản trị danh sách tài khoản, phân quyền và trạng thái hoạt động người dùng.
                  </p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 min-w-[120px]">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400 font-bold">
                      Tổng
                    </p>
                    <p className="text-lg font-black text-slate-800">
                      {Number(totalItems || 0).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 min-w-[120px]">
                    <p className="text-[11px] uppercase tracking-wide text-emerald-600 font-bold">
                      Đang hoạt động
                    </p>
                    <p className="text-lg font-black text-emerald-700">
                      {pageStatusStats.active}
                    </p>
                  </div>
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 min-w-[120px]">
                    <p className="text-[11px] uppercase tracking-wide text-rose-600 font-bold">
                      Bị khóa
                    </p>
                    <p className="text-lg font-black text-rose-700">
                      {pageStatusStats.locked}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 min-w-[120px]">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500 font-bold">
                      Chưa kích hoạt
                    </p>
                    <p className="text-lg font-black text-slate-700">
                      {pageStatusStats.pending}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 pb-5 max-w-7xl mx-auto w-full">
            <div className="rounded-2xl border border-slate-200 bg-white/95 backdrop-blur px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <div className="flex flex-col xl:flex-row xl:items-center gap-3 z-0">
                <Input
                  className="xl:flex-[2] min-w-[300px]"
                  enterButton={false}
                  size="large"
                  placeholder="Tìm kiếm theo tên, email, MSSV"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                  }}
                  allowClear
                />
                <Select
                  className="xl:flex-1 min-w-[200px]"
                  options={createUserRoleOptions}
                  size="large"
                  placeholder="Vai trò"
                  allowClear
                  value={roleFilter}
                  onChange={(v) => {
                    setRoleFilter(v);
                  }}
                />
                <Button
                  className="xl:flex-1 min-w-[150px]"
                  size="large"
                  icon={<DownloadOutlined />}
                  variant="outlined"
                  loading={isExportingUsers}
                  onClick={handleExportUsers}
                >
                  Xuất Excel
                </Button>
                <Button
                  size="large"
                  icon={<PlusOutlined />}
                  type="primary"
                  onClick={() => setIsModalOpen(true)}
                >
                  Thêm người dùng
                </Button>
              </div>
            </div>
          </div>

          <div className="px-4 max-w-7xl mx-auto w-full">
            <div className="bg-white rounded-2xl mb-8 shadow-[0_12px_28px_rgba(15,23,42,0.06)] border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-slate-800">Danh sách người dùng</p>
                  <p className="text-xs text-slate-500">
                    Hiển thị {Array.isArray(users) ? users.length : 0} / {Number(totalItems || 0).toLocaleString('vi-VN')} tài khoản
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    size="small"
                    className="min-w-[120px]"
                    value={selectedPageSize}
                    disabled={usersLoading}
                    options={[
                      { label: '8 / trang', value: 8 },
                      { label: '20 / trang', value: 20 },
                      { label: '50 / trang', value: 50 },
                      { label: '100 / trang', value: 100 },
                    ]}
                    onChange={(nextSize) => {
                      setSelectedPageSize(Number(nextSize));
                      fetchUsers({
                        page: 0,
                        size: Number(nextSize),
                        search: debouncedQuery,
                        roleName: debouncedFilter,
                      });
                    }}
                  />
                  <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                    Trang {currentPage || 1}
                  </span>
                </div>
              </div>
              <Table
                rowKey="userId"
                columns={USER_COLUMNS}
                loading={usersLoading}
                dataSource={users}
                size="small"
                pagination={{
                  total: totalItems,
                  current: currentPage,
                  pageSize: Number(pageSize || selectedPageSize),
                  showSizeChanger: false,
                  onChange: (page) => {
                    fetchUsers({
                      page: page - 1,
                      size: selectedPageSize,
                      search: debouncedQuery,
                      roleName: debouncedFilter,
                    });
                  },
                }}
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
              />
            </div>
          </div>
        </div>
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        >
          <div className="w-[760px] max-w-[90vw]">
            <Tabs
              defaultActiveKey="single"
              items={[
                {
                  key: 'single',
                  label: 'Thêm 1 người dùng',
                  children: (
                    <Form
                      form={form}
                      onFieldsChange={() => {
                        const errors = form.getFieldsError();
                        const hasErrors = errors.some(
                          (field) => field.errors.length !== 0,
                        );
                        const values = Object.entries(form.getFieldsValue());
                        const isEmpty = values.some(([key, value]) => {
                          return value === '' || value === undefined;
                        });
                        setValidationError(hasErrors || isEmpty);
                      }}
                      className="space-y-4 pt-2"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                            Vai trò
                          </label>
                          <Form.Item
                            name="roleName"
                            rules={[
                              {
                                required: true,
                                message: 'Không được để trống',
                              },
                            ]}
                          >
                            <Select
                              allowClear
                              className="w-full"
                              size="middle"
                              options={createUserRoleOptions}
                              placeholder="Chọn vai trò"
                            />
                          </Form.Item>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                            MSSV
                          </label>
                          <Form.Item
                            name="mssv"
                            rules={[
                              {
                                required: true,
                                message: 'Mã số sinh viên không được để trống',
                              },
                            ]}
                          >
                            <Input
                              size="middle"
                              placeholder="Nhập MSSV"
                            />
                          </Form.Item>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                            Họ và tên
                          </label>
                          <Form.Item
                            name="fullName"
                            rules={[
                              {
                                required: true,
                                message: 'Tên không được để trống',
                              },
                            ]}
                          >
                            <Input
                              size="middle"
                              placeholder="Nhập họ và tên"
                            />
                          </Form.Item>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                            Email
                          </label>
                          <Form.Item
                            name="email"
                            rules={[
                              {
                                required: true,
                                message: 'Email không được để trống',
                              },
                              ({ getFieldValue }) => ({
                                validator: (_, value) => {
                                  if (
                                    !value ||
                                    getFieldValue('email').endsWith(
                                      '@fpt.edu.vn',
                                    )
                                  ) {
                                    return Promise.resolve();
                                  }
                                  return Promise.reject(
                                    new Error('Email phải có đuôi @fpt.edu.vn'),
                                  );
                                },
                              }),
                            ]}
                          >
                            <Input
                              size="middle"
                              placeholder="Nhập email"
                            />
                          </Form.Item>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <Button onClick={() => setIsModalOpen(false)}>
                          Hủy
                        </Button>
                        <Button
                          type="primary"
                          loading={createUserLoading}
                          onClick={handleCreateUser}
                          disabled={validationError}
                        >
                          Thêm người dùng
                        </Button>
                      </div>
                    </Form>
                  ),
                },
                {
                  key: 'multiple',
                  label: 'Thêm nhiều người dùng',
                  children: (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-slate-500 mb-0">
                          Tải file mẫu và điền đúng 3 cột: Email, FullName, MSSV.
                        </p>
                        <Button
                          icon={<DownloadOutlined />}
                          onClick={handleDownloadImportTemplate}
                        >
                          Tải template Excel
                        </Button>
                      </div>

                      <Upload.Dragger
                        name="file"
                        multiple={false}
                        directory={false}
                        customRequest={handleUpload}
                        showUploadList={false}
                        disabled={importLoading}
                        style={{ borderColor: '#F37021E6' }}
                      >
                        <p className="ant-upload-drag-icon">
                          <InboxOutlined style={{ color: '#F37021' }} />
                        </p>
                        <p className="ant-upload-text">
                          Nhấn hay kéo file Excel tới khu vực này để upload
                        </p>
                      </Upload.Dragger>
                      <div className="flex items-center justify-end">
                        <Button onClick={() => setIsModalOpen(false)}>
                          Hủy
                        </Button>
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </Modal>
      </ConfigProvider>
    </MainLayout>
  );
};

export default UserManagement;
