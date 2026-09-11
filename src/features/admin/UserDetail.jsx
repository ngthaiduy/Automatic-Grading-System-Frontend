import React, { useEffect, useState } from 'react';
import { useAuth } from '../../app/context/authContext';
import {
  ConfigProvider,
  Tabs,
  Input,
  Button,
  Select,
  Form,
  message,
  Modal,
} from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../../components/layouts/MainLayout';
import { renderSiderIconsMaterialSymbol } from '../../components/utils/Utils';
import {
  ADMIN_SIDEBAR_ITEMS,
  ADMIN_ICONS,
  ADMIN_SIDEBAR_ITEMS_FLAT,
} from '../../constants/sidebarItems';
import { renderStatusPill } from '../../components/utils/Utils';
import {
  useDeleteUser,
  useGetUserDetail,
  useEditDetail,
  useUnlockUser,
} from '../../hooks';

const ROLE_LABEL_VI = {
  STUDENT: 'Sinh viên',
  LECTURER: 'Giảng viên',
  SYSTEM_ADMIN: 'Quản trị viên',
  EXAM_STAFF: 'Cán bộ khảo thí',
};
const ROLE_MAP = new Map([
  ['STUDENT', 'Sinh viên'],
  ['LECTURER', 'Giảng viên'],
  ['SYSTEM_ADMIN', 'Quản trị viên'],
  ['EXAM_STAFF', 'Cán bộ khảo thí'],
]);
const ROLE_MAP_REVERSE = new Map([
  ['Sinh viên', 'STUDENT'],
  ['Giảng viên', 'LECTURER'],
  ['Quản trị viên', 'SYSTEM_ADMIN'],
  ['Cán bộ khảo thí', 'EXAM_STAFF'],
]);
const formatDateVi = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

const UserDetail = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();
  const [selectedIndex, setSelectedIndex] = useState(1);
  const { fetchUserDetail, loading, userDetail } = useGetUserDetail();
  const { callDeleteUserEndpoint, loading: deleteLoading } = useDeleteUser();
  const { callUnlockUserEndpoint, loading: unlockLoading } = useUnlockUser();
  const { callEditUserEndpoint, loading: editLoading } = useEditDetail();
  const [validationError, setValidationError] = useState(false);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);

  const [form] = Form.useForm();
  const user = userDetail;
  useEffect(() => {
    if (!userId) return;
    fetchUserDetail(userId).catch((err) => {
      const msg = err?.response?.data?.message || 'Không thể tải thông tin người dùng.';
      message.error(msg);
    });
  }, [userId]);

  const [isEdit, setIsEdit] = useState(false);

  // First time fetch
  useEffect(() => {
    form.setFieldsValue({
      fullName: user?.fullName,
      mssv: user?.mssv,
      email: user?.email,
      roleName: user?.roleName,
      phone: user?.phone,
      username: user?.username,
    });
  }, [user]);

  const roleDisplay = ROLE_LABEL_VI[user?.roleName] ?? user?.roleName;
  const roleOptions = Object.entries(ROLE_LABEL_VI).map(([value, label]) => ({
    value,
    label,
  }));
  const isSelfProfile = Boolean(
    currentUser?.userId && user?.userId && currentUser.userId === user.userId,
  );

  const isUserLocked = Boolean(user?.isLocked);

  const statusLabel = isUserLocked
    ? 'đã bị khóa'
    : user?.isActive
      ? 'đang hoạt động'
      : 'chưa kích hoạt';

  const handleLockUser = async () => {
    try {
      await callDeleteUserEndpoint(userId);
      setIsLockModalOpen(false);
      message.success('Khóa tài khoản thành công.');
      setTimeout(() => {
        navigate('/admin/student-management');
      }, 1500);
    } catch (err) {
      setIsLockModalOpen(false);
      if (err?.response?.data?.message) {
        message.error(err.response.data.message);
      } else {
        message.error('Khóa tài khoản thất bại.');
      }
    }
  };

  const handleUnlockUser = async () => {
    try {
      await callUnlockUserEndpoint(userId);
      setIsUnlockModalOpen(false);
      message.success('Mở khóa tài khoản thành công.');
      await fetchUserDetail(userId);
    } catch (err) {
      setIsUnlockModalOpen(false);
      if (err?.response?.data?.message) {
        message.error(err.response.data.message);
      } else {
        message.error('Mở khóa tài khoản thất bại.');
      }
    }
  };

  const handleEdit = async () => {
    try {
      const payload = Object.fromEntries(
        Object.entries(form.getFieldsValue()).map(([key, value]) => [
          key,
          typeof value === 'string' ? value.trim() : value,
        ]),
      );

      if (Object.values(payload).some((value) => value === '')) {
        message.warning('Vui lòng nhập đầy đủ thông tin người dùng.');
        return;
      }

      const { roleName } = payload;
      const roleToServer = isSelfProfile
        ? user?.roleName
        : ROLE_LABEL_VI[roleName]
          ? roleName
          : ROLE_MAP_REVERSE.get(roleName) || user?.roleName;

      await callEditUserEndpoint({
        userId,
        ...payload,
        roleName: roleToServer,
      });
      message.success('Cập nhật thông tin người dùng thành công.');

      form.setFieldsValue({
        fullName: '',
        mssv: '',
        email: '',
        roleName: '',
        phone: '',
        username: '',
      });

      await fetchUserDetail(userId);
      setIsEdit(false);
    } catch (err) {
      if (err?.response?.data?.message) {
        message.error(err.response.data.message);
      } else {
        message.error('Cập nhật thông tin người dùng thất bại.');
      }
    }
  };

  // Reset back to original object
  const handleCancel = () => {
    form.setFieldsValue({
      fullName: user?.fullName,
      mssv: user?.mssv,
      email: user?.email,
      roleName: user?.roleName,
      phone: user?.phone,
      username: user?.username,
    });
  };
  return (
    <MainLayout
      siderIcons={renderSiderIconsMaterialSymbol({ icons: ADMIN_ICONS })}
      siderItems={({ collapsed }) =>
        collapsed ? ADMIN_SIDEBAR_ITEMS_FLAT : ADMIN_SIDEBAR_ITEMS
      }
      currentSelectedItem={(item) => setSelectedIndex(Number(item.key))}
    >
      <ConfigProvider
        theme={{
          components: {
            Button: { colorPrimary: '#F37021' },
            Tabs: {
              inkBarColor: '#F37021',
              itemActiveColor: '#F37021',
              itemHoverColor: '#F37021',
              itemSelectedColor: '#F37021',
            },
          },
        }}
      >
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
          <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span
                className="hover:text-[#F37021] cursor-pointer"
                onClick={() => navigate(-1)}
              >
                Quản lý người dùng
              </span>
              <span>/</span>
              <span className="text-slate-800 font-medium">
                Chi tiết người dùng
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <aside className="lg:col-span-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <div className="size-28 rounded-full bg-slate-200 ring-4 ring-slate-100 bg-cover bg-center">
                      <div className="size-full rounded-full flex items-center justify-center text-3xl font-bold text-slate-400">
                        {user?.fullName?.charAt(0) ?? '?'}
                      </div>
                    </div>
                    <span
                      className={`absolute bottom-1 right-1 size-3.5 rounded-full border-2 border-white ${
                        user?.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                      title={user?.isActive ? 'Hoạt động' : 'Không hoạt động'}
                    />
                  </div>

                  <h1 className="text-xl font-bold text-slate-900">
                    {user?.fullName}
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    MSSV: {user?.mssv ?? '—'}
                  </p>

                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {roleDisplay}
                    </span>
                  </div>

                  <div className="w-full mt-6 pt-6 border-t border-slate-100 space-y-4 text-left">
                    <div className="flex gap-3">
                      <span className="material-symbols-outlined text-slate-400 text-[20px] shrink-0">
                        mail
                      </span>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                          Email
                        </p>
                        <p className="text-sm text-slate-800 break-all">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="material-symbols-outlined text-slate-400 text-[20px] shrink-0">
                        phone
                      </span>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                          Số điện thoại
                        </p>
                        <p className="text-sm text-slate-800">
                          {user?.phone ?? '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="material-symbols-outlined text-slate-400 text-[20px] shrink-0">
                        calendar_today
                      </span>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                          Ngày gia nhập
                        </p>
                        <p className="text-sm text-slate-800">
                          {formatDateVi(user?.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>

              <section className="lg:col-span-8">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[480px] flex flex-col">
                  {loading && (
                    <div className="px-6 py-4 text-sm text-slate-500">
                      Đang tải thông tin người dùng...
                    </div>
                  )}
                  <Tabs
                    defaultActiveKey="info"
                    className="user-detail-tabs px-6 pt-2"
                    items={[
                      {
                        key: 'info',
                        label: 'Thông tin cá nhân',
                        children: (
                          <div className="px-6 pb-6 space-y-8">
                            <Form
                              form={form}
                              name="detail"
                              onFieldsChange={() => {
                                const errors = form.getFieldsError();
                                const hasErrors = errors.some(
                                  (field) => field.errors.length !== 0,
                                );

                                setValidationError(hasErrors);
                              }}
                            >
                              <h3 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4">
                                <span className="w-1 h-5 rounded-full bg-[#F37021]" />
                                Thông tin tài khoản
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
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
                                      size="large"
                                      disabled={!isEdit}
                                    />
                                  </Form.Item>
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                                    Mã số sinh viên (MSSV)
                                  </label>
                                  <Form.Item
                                    name="mssv"
                                    rules={[
                                      {
                                        required: true,
                                        message:
                                          'Mã số sinh viên không được để trống',
                                      },
                                    ]}
                                  >
                                    <Input
                                      size="large"
                                      disabled={!isEdit}
                                    />
                                  </Form.Item>
                                </div>

                                <div>
                                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                                    Email FPT
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
                                            new Error(
                                              'Email phải có đuôi @fpt.edu.vn',
                                            ),
                                          );
                                        },
                                      }),
                                    ]}
                                  >
                                    <Input
                                      size="large"
                                      disabled={!isEdit}
                                    />
                                  </Form.Item>
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                                    Vai trò
                                  </label>
                                  <Form.Item name="roleName">
                                    <Select
                                      className="w-full"
                                      size="large"
                                      options={roleOptions}
                                      disabled={!isEdit || isSelfProfile}
                                    />
                                  </Form.Item>
                                  {isSelfProfile && (
                                    <p className="text-[11px] text-amber-600 mt-1">
                                      Bạn không thể chỉnh sửa role của chính mình.
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                                    Số điện thoại
                                  </label>
                                  <Form.Item
                                    name="phone"
                                    rules={[
                                      {
                                        required: true,
                                        message:
                                          'Số điện thoại không được để trống',
                                      },
                                      ({ getFieldValue }) => ({
                                        validator: (_, value) => {
                                          if (!value) return Promise.resolve();
                                          if (
                                            value.length == 10 &&
                                            value.match(/^\d+$/)
                                          ) {
                                            return Promise.resolve();
                                          } else {
                                            return Promise.reject(
                                              new Error(
                                                'Số điện thoại phải có đúng 10 chữ số',
                                              ),
                                            );
                                          }
                                        },
                                      }),
                                    ]}
                                  >
                                    <Input
                                      size="large"
                                      placeholder="Chưa cập nhật"
                                      disabled={!isEdit}
                                    />
                                  </Form.Item>
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                                    Tên đăng nhập
                                  </label>
                                  <Form.Item name="username">
                                    <Input
                                      size="large"
                                      // value={user?.username}
                                      disabled={true}
                                    />
                                  </Form.Item>
                                </div>
                              </div>
                            </Form>

                            <div>
                              <h3 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4">
                                <span className="w-1 h-5 rounded-full bg-[#F37021]" />
                                Thông tin bổ sung
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <div className="flex items-center gap-2">
                                  <label className="text-xs font-semibold text-slate-500">
                                    Trạng thái tài khoản
                                  </label>

                                  {renderStatusPill({ status: statusLabel })}
                                </div>
                                <div className="flex items-center gap-2">
                                  <label className="text-xs font-semibold text-slate-500 w-fit">
                                    Cập nhật lần cuối
                                  </label>
                                  <span>{formatDateVi(user?.updatedAt)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                              {isEdit ? (
                                <Button
                                  size="large"
                                  onClick={() => {
                                    setIsEdit((prev) => !prev);
                                    handleCancel();
                                  }}
                                >
                                  Hủy
                                </Button>
                              ) : (
                                ''
                              )}
                              <Button
                                type="primary"
                                size="large"
                                disabled={validationError}
                                onClick={() => {
                                  setIsEdit((prev) => !prev);
                                  if (isEdit) handleEdit();
                                }}
                              >
                                {isEdit ? 'Lưu thay đổi' : 'Chỉnh sửa'}
                              </Button>
                              {isUserLocked ? (
                                <Button
                                  type="primary"
                                  size="large"
                                  onClick={() => setIsUnlockModalOpen(true)}
                                >
                                  Mở khóa tài khoản
                                </Button>
                              ) : (
                                <Button
                                  danger
                                  size="large"
                                  onClick={() => setIsLockModalOpen(true)}
                                >
                                  Khóa tài khoản
                                </Button>
                              )}
                            </div>
                          </div>
                        ),
                      },
                    ]}
                  />
                </div>
              </section>
            </div>
          </div>
        </div>

        <Modal
          title={
            <div className="flex items-center gap-2 text-red-600 font-bold text-lg">
              <span className="material-symbols-outlined text-[24px]">warning</span>
              Xác nhận khóa tài khoản
            </div>
          }
          open={isLockModalOpen}
          onOk={handleLockUser}
          onCancel={() => setIsLockModalOpen(false)}
          okText="Khóa tài khoản"
          cancelText="Hủy"
          okButtonProps={{ danger: true, size: 'large', loading: deleteLoading }}
          cancelButtonProps={{ size: 'large' }}
          centered
          className="custom-confirm-modal"
        >
          <div className="py-4 space-y-3">
            <p className="text-slate-600 leading-relaxed text-sm">
              Bạn có chắc chắn muốn khóa tài khoản của người dùng{' '}
              <strong className="text-slate-800 font-bold">{user?.fullName}</strong>?
            </p>
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5">
              <span className="material-symbols-outlined text-red-500 text-[18px] mt-0.5">
                info
              </span>
              <p className="text-[12px] text-red-600 leading-relaxed">
                Người dùng này sẽ không thể đăng nhập hoặc thực hiện bất kỳ thao tác nào trên hệ thống sau khi tài khoản bị khóa.
              </p>
            </div>
          </div>
        </Modal>

        <Modal
          title={
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-lg">
              <span className="material-symbols-outlined text-[24px]">lock_open</span>
              Xác nhận mở khóa tài khoản
            </div>
          }
          open={isUnlockModalOpen}
          onOk={handleUnlockUser}
          onCancel={() => setIsUnlockModalOpen(false)}
          okText="Mở khóa tài khoản"
          cancelText="Hủy"
          okButtonProps={{ size: 'large', loading: unlockLoading }}
          cancelButtonProps={{ size: 'large' }}
          centered
          className="custom-confirm-modal"
        >
          <div className="py-4 space-y-3">
            <p className="text-slate-600 leading-relaxed text-sm">
              Bạn có chắc chắn muốn mở khóa tài khoản của người dùng{' '}
              <strong className="text-slate-800 font-bold">{user?.fullName}</strong>?
            </p>
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2.5">
              <span className="material-symbols-outlined text-emerald-500 text-[18px] mt-0.5">
                check_circle
              </span>
              <p className="text-[12px] text-emerald-600 leading-relaxed">
                Người dùng này sẽ được khôi phục quyền truy cập, có thể đăng nhập và làm việc bình thường trên hệ thống ngay lập tức.
              </p>
            </div>
          </div>
        </Modal>
      </ConfigProvider>
    </MainLayout>
  );
};

export default UserDetail;
