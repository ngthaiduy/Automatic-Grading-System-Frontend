import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  ConfigProvider,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Progress,
  Select,
  Switch,
  message,
} from 'antd';
import MainLayout from '../../components/layouts/MainLayout';
import {
  ADMIN_SIDEBAR_ITEMS,
  ADMIN_ICONS,
  ADMIN_SIDEBAR_ITEMS_FLAT,
} from '../../constants/sidebarItems';
import { renderSiderIconsMaterialSymbol } from '../../components/utils/Utils';
import { useGetSystemGradingModes, useGetSystemConfig } from '../../hooks';
import {
  createSystemGradingMode,
  setDefaultGradingMode,
  updateSystemGradingMode,
} from '../../services/adminApi';
import DefaultModeBanner from './grading-config/components/DefaultModeBanner';
import GradingModeCard from './grading-config/components/GradingModeCard';
import GradingModeNotice from './grading-config/components/GradingModeNotice';

const ALL_GRADING_MODES = ['MODE_1', 'MODE_2', 'MODE_3', 'MODE_4'];

const GradingModeConfig = () => {
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [savingMode, setSavingMode] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMode, setEditingMode] = useState(null);
  const createWatchTestCaseWeight = Form.useWatch('testCaseWeight', createForm);
  const createWatchOopWeight = Form.useWatch('oopWeight', createForm);
  const watchTestCaseWeight = Form.useWatch('testCaseWeight', editForm);
  const watchOopWeight = Form.useWatch('oopWeight', editForm);

  const {
    callGetSystemGradingModesEndpoint,
    data: gradingModesResponse,
    loading: getGradingModesLoading,
  } = useGetSystemGradingModes();

  const {
    callGetSystemConfigEndpoint,
    config,
    loading: getSystemConfigLoading,
  } = useGetSystemConfig();

  useEffect(() => {
    callGetSystemGradingModesEndpoint();
    callGetSystemConfigEndpoint();
  }, []);

  const gradingModes = useMemo(
    () => gradingModesResponse?.modes ?? [],
    [gradingModesResponse],
  );

  const defaultMode = useMemo(
    () => config?.defaultGradingMode ?? gradingModesResponse?.defaultMode,
    [config, gradingModesResponse],
  );

  useEffect(() => {
    if (!defaultMode) return;
    form.setFieldsValue({ defaultGradingMode: defaultMode });
  }, [defaultMode, form]);

  const applyDefaultMode = async (mode) => {
    if (!mode) {
      message.warning('Vui lòng chọn chế độ chấm.');
      return;
    }

    try {
      setSaving(true);
      setSavingMode(mode);
      await setDefaultGradingMode(mode);
      message.success('Cập nhật chế độ chấm mặc định thành công.');
      form.setFieldsValue({ defaultGradingMode: mode });
      await callGetSystemGradingModesEndpoint();
      await callGetSystemConfigEndpoint();
    } catch (err) {
      message.error(
        err?.response?.data?.message ||
          'Cập nhật chế độ chấm mặc định thất bại.',
      );
    } finally {
      setSaving(false);
      setSavingMode(null);
    }
  };

  const handleSaveTop = async () => {
    const mode = form.getFieldValue('defaultGradingMode');
    await applyDefaultMode(mode);
  };

  const handleOpenEditMode = (mode) => {
    setEditingMode(mode);
    editForm.setFieldsValue({
      displayName: mode?.displayName ?? '',
      testCaseWeight: Number(mode?.testCaseWeight ?? 0),
      oopWeight: Number(mode?.oopWeight ?? 0),
      oopCommentOnly: Boolean(mode?.oopCommentOnly),
      failIfZeroTestCase: Boolean(mode?.failIfZeroTestCase),
      failIfOopViolated: Boolean(mode?.failIfOopViolated),
      isActive: mode?.isActive !== false,
      description: mode?.description ?? '',
    });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingMode(null);
    editForm.resetFields();
  };

  const handleUpdateMode = async () => {
    if (!editingMode?.mode) return;

    try {
      const values = await editForm.validateFields();
      const payload = {
        displayName: String(values.displayName ?? '').trim(),
        testCaseWeight: Number(values.testCaseWeight ?? 0),
        oopWeight: Number(values.oopWeight ?? 0),
        oopCommentOnly: Boolean(values.oopCommentOnly),
        failIfZeroTestCase: Boolean(values.failIfZeroTestCase),
        failIfOopViolated: Boolean(values.failIfOopViolated),
        isActive: Boolean(values.isActive),
        description: values.description ? String(values.description).trim() : '',
      };

      if (payload.testCaseWeight + payload.oopWeight !== 100) {
        message.error('Tổng trọng số Test Case + OOP phải bằng 100.');
        return;
      }

      setSaving(true);
      await updateSystemGradingMode(editingMode.mode, payload);
      message.success(`Cập nhật ${editingMode.mode} thành công.`);
      handleCloseEditModal();
      await callGetSystemGradingModesEndpoint();
      await callGetSystemConfigEndpoint();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(
        err?.response?.data?.message || 'Cập nhật cấu hình mode thất bại.',
      );
    } finally {
      setSaving(false);
    }
  };

  const isLoading = getGradingModesLoading || getSystemConfigLoading;
  const availableModes = useMemo(() => {
    const existingModes = new Set(gradingModes.map((mode) => mode.mode));
    return ALL_GRADING_MODES.filter((mode) => !existingModes.has(mode));
  }, [gradingModes]);

  const createTotalWeight =
    Number(createWatchTestCaseWeight ?? 0) + Number(createWatchOopWeight ?? 0);
  const isCreateTotalWeightValid = createTotalWeight === 100;

  const totalWeight =
    Number(watchTestCaseWeight ?? 0) + Number(watchOopWeight ?? 0);
  const isTotalWeightValid = totalWeight === 100;

  const handleOpenCreateModal = () => {
    if (availableModes.length === 0) {
      message.info('Đã có đủ tất cả mode có sẵn (MODE_1 đến MODE_4).');
      return;
    }

    createForm.setFieldsValue({
      mode: availableModes[0],
      displayName: '',
      testCaseWeight: 70,
      oopWeight: 30,
      oopCommentOnly: false,
      failIfZeroTestCase: true,
      failIfOopViolated: false,
      isActive: true,
      description: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    createForm.resetFields();
  };

  const handleCreateMode = async () => {
    try {
      const values = await createForm.validateFields();
      const payload = {
        mode: values.mode,
        displayName: String(values.displayName ?? '').trim(),
        testCaseWeight: Number(values.testCaseWeight ?? 0),
        oopWeight: Number(values.oopWeight ?? 0),
        oopCommentOnly: Boolean(values.oopCommentOnly),
        failIfZeroTestCase: Boolean(values.failIfZeroTestCase),
        failIfOopViolated: Boolean(values.failIfOopViolated),
        isActive: Boolean(values.isActive),
        description: values.description ? String(values.description).trim() : '',
      };

      if (payload.testCaseWeight + payload.oopWeight !== 100) {
        message.error('Tổng trọng số Test Case + OOP phải bằng 100.');
        return;
      }

      setSaving(true);
      await createSystemGradingMode(payload);
      message.success(`Tạo cấu hình ${payload.mode} thành công.`);
      handleCloseCreateModal();
      await callGetSystemGradingModesEndpoint();
      await callGetSystemConfigEndpoint();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.response?.data?.message || 'Tạo grading mode thất bại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout
      siderIcons={renderSiderIconsMaterialSymbol({ icons: ADMIN_ICONS })}
      siderItems={({ collapsed }) =>
        collapsed ? ADMIN_SIDEBAR_ITEMS_FLAT : ADMIN_SIDEBAR_ITEMS
      }
    >
      <ConfigProvider
        theme={{
          components: {
            Button: { colorPrimary: '#F37021' },
            Select: { colorPrimary: '#F37021' },
          },
        }}
      >
        <div className="p-8 max-w-7xl mx-auto w-full space-y-8 bg-[#F5F7FA] min-h-[calc(100vh-64px)]">
          <DefaultModeBanner
            form={form}
            gradingModes={gradingModes}
            defaultMode={defaultMode}
            isLoading={isLoading}
            saving={saving}
            onSave={handleSaveTop}
          />

          <div className="bg-white border border-[#EAECF0] rounded-lg p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-sm font-semibold text-slate-800 mb-0">Danh sách cấu hình grading mode</p>
              <p className="text-xs text-slate-500 mb-0">
                Bạn có thể tạo mới mode còn thiếu trong bộ MODE_1 đến MODE_4.
              </p>
            </div>
            <Button
              type="primary"
              onClick={handleOpenCreateModal}
              disabled={isLoading || saving || availableModes.length === 0}
              icon={<span className="material-symbols-outlined">add</span>}
            >
              Thêm grading mode
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {gradingModes.map((mode) => {
              return (
                <GradingModeCard
                  key={mode.mode}
                  mode={mode}
                  defaultMode={defaultMode}
                  isLoading={isLoading}
                  saving={saving}
                  savingMode={savingMode}
                  onSetDefault={applyDefaultMode}
                  onEdit={handleOpenEditMode}
                />
              );
            })}
          </div>

          <GradingModeNotice />

          <Modal
            title="Tạo mới cấu hình grading mode"
            open={isCreateModalOpen}
            onCancel={handleCloseCreateModal}
            onOk={handleCreateMode}
            okText="Tạo mode"
            cancelText="Hủy"
            confirmLoading={saving}
            destroyOnHidden
            width={760}
          >
            <Form
              form={createForm}
              layout="vertical"
              onValuesChange={(changedValues) => {
                if (changedValues.oopCommentOnly === true) {
                  createForm.setFieldsValue({ failIfOopViolated: false });
                } else if (changedValues.failIfOopViolated === true) {
                  createForm.setFieldsValue({ oopCommentOnly: false });
                }
              }}
            >
              <Alert
                type="info"
                showIcon
                className="mb-4"
                message="Lưu ý khi tạo mode mới"
                description="Mỗi mode chỉ được tạo một lần. Hãy chọn mode còn trống và đảm bảo tổng trọng số bằng 100%."
              />

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-slate-700 m-0">Kiểm tra tổng trọng số</p>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      isCreateTotalWeightValid
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {isCreateTotalWeightValid ? 'Hợp lệ' : 'Chưa hợp lệ'}
                  </span>
                </div>
                <Progress
                  percent={Math.max(0, Math.min(100, createTotalWeight))}
                  size="small"
                  status={isCreateTotalWeightValid ? 'success' : 'active'}
                  strokeColor={isCreateTotalWeightValid ? '#16a34a' : '#f59e0b'}
                  format={() => `${createTotalWeight}% / 100%`}
                />
              </div>

              <Form.Item
                label="Mode"
                name="mode"
                rules={[{ required: true, message: 'Không được để trống' }]}
                extra="Chỉ hiển thị các mode chưa tồn tại trong hệ thống."
              >
                <Select
                  placeholder="Chọn mode"
                  options={availableModes.map((mode) => ({ value: mode, label: mode }))}
                />
              </Form.Item>

              <Form.Item
                label="Tên hiển thị"
                name="displayName"
                rules={[{ required: true, message: 'Không được để trống' }]}
              >
                <Input placeholder="Nhập tên hiển thị" />
              </Form.Item>

              <div className="grid grid-cols-2 gap-3">
                <Form.Item
                  label="Trọng số Test Case"
                  name="testCaseWeight"
                  rules={[{ required: true, message: 'Không được để trống' }]}
                >
                  <InputNumber min={0} max={100} className="w-full" addonAfter="%" />
                </Form.Item>
                <Form.Item
                  label="Trọng số OOP"
                  name="oopWeight"
                  rules={[{ required: true, message: 'Không được để trống' }]}
                >
                  <InputNumber min={0} max={100} className="w-full" addonAfter="%" />
                </Form.Item>
              </div>

              <Form.Item label="Mô tả" name="description">
                <Input.TextArea rows={3} placeholder="Mô tả mode" />
              </Form.Item>

              <Divider className="my-3" />
              <p className="text-sm font-semibold text-slate-700 mb-3">Quy tắc áp dụng</p>

              <div className="grid grid-cols-2 gap-x-3">
                <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                  <span className="text-sm text-slate-700">Chỉ nhận xét OOP</span>
                  <Form.Item name="oopCommentOnly" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>
                <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                  <span className="text-sm text-slate-700">Rớt nếu Test Case 0đ</span>
                  <Form.Item name="failIfZeroTestCase" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>
                <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                  <span className="text-sm text-slate-700">Rớt nếu vi phạm OOP</span>
                  <Form.Item name="failIfOopViolated" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>
                <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                  <span className="text-sm text-slate-700">Kích hoạt mode</span>
                  <Form.Item name="isActive" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>
              </div>
            </Form>
          </Modal>

          <Modal
            title={`Cập nhật cấu hình ${editingMode?.mode ?? ''}`}
            open={isEditModalOpen}
            onCancel={handleCloseEditModal}
            onOk={handleUpdateMode}
            okText="Lưu thay đổi"
            cancelText="Hủy"
            confirmLoading={saving}
            destroyOnHidden
            width={760}
          >
            <Form
              form={editForm}
              layout="vertical"
              onValuesChange={(changedValues) => {
                if (changedValues.oopCommentOnly === true) {
                  editForm.setFieldsValue({ failIfOopViolated: false });
                } else if (changedValues.failIfOopViolated === true) {
                  editForm.setFieldsValue({ oopCommentOnly: false });
                }
              }}
            >
              <Alert
                type="info"
                showIcon
                className="mb-4"
                message="Lưu ý khi chỉnh sửa mode chấm"
                description="Thay đổi sẽ áp dụng cho các bài nộp mới sau thời điểm cập nhật. Tổng trọng số Test Case + OOP phải bằng 100%."
              />

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-slate-700 m-0">Kiểm tra tổng trọng số</p>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      isTotalWeightValid
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {isTotalWeightValid ? 'Hợp lệ' : 'Chưa hợp lệ'}
                  </span>
                </div>
                <Progress
                  percent={Math.max(0, Math.min(100, totalWeight))}
                  size="small"
                  status={isTotalWeightValid ? 'success' : 'active'}
                  strokeColor={isTotalWeightValid ? '#16a34a' : '#f59e0b'}
                  format={() => `${totalWeight}% / 100%`}
                />
                {!isTotalWeightValid && (
                  <p className="text-xs text-amber-700 mt-2 mb-0">
                    Hãy điều chỉnh để tổng đúng 100% trước khi lưu.
                  </p>
                )}
              </div>

              <Form.Item
                label="Tên hiển thị"
                name="displayName"
                rules={[{ required: true, message: 'Không được để trống' }]}
                extra="Tên này hiển thị trên giao diện quản trị và màn hình cấu hình."
              >
                <Input placeholder="Nhập tên hiển thị" />
              </Form.Item>

              <div className="grid grid-cols-2 gap-3">
                <Form.Item
                  label="Trọng số Test Case"
                  name="testCaseWeight"
                  rules={[{ required: true, message: 'Không được để trống' }]}
                  extra="Điểm dành cho test case tự động (0 - 100%)."
                >
                  <InputNumber min={0} max={100} className="w-full" addonAfter="%" />
                </Form.Item>
                <Form.Item
                  label="Trọng số OOP"
                  name="oopWeight"
                  rules={[{ required: true, message: 'Không được để trống' }]}
                  extra="Điểm đánh giá OOP/manual (0 - 100%)."
                >
                  <InputNumber min={0} max={100} className="w-full" addonAfter="%" />
                </Form.Item>
              </div>

              <Form.Item
                label="Mô tả"
                name="description"
                extra="Mô tả ngắn mục đích sử dụng mode này (khuyến nghị 1-2 câu)."
              >
                <Input.TextArea rows={3} placeholder="Mô tả mode" />
              </Form.Item>

              <Divider className="my-3" />
              <p className="text-sm font-semibold text-slate-700 mb-3">Quy tắc áp dụng</p>

              <div className="grid grid-cols-2 gap-x-3">
                <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                  <div>
                    <p className="text-sm text-slate-700 mb-0">Chỉ nhận xét OOP</p>
                    <p className="text-xs text-slate-500 mb-0">Không tính điểm OOP, chỉ phản hồi nhận xét.</p>
                  </div>
                  <Form.Item name="oopCommentOnly" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>
                <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                  <div>
                    <p className="text-sm text-slate-700 mb-0">Rớt nếu Test Case 0đ</p>
                    <p className="text-xs text-slate-500 mb-0">Bài làm sẽ bị đánh rớt khi điểm test case bằng 0.</p>
                  </div>
                  <Form.Item name="failIfZeroTestCase" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>
                <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                  <div>
                    <p className="text-sm text-slate-700 mb-0">Rớt nếu vi phạm OOP</p>
                    <p className="text-xs text-slate-500 mb-0">Bài làm vi phạm quy tắc OOP sẽ bị đánh rớt.</p>
                  </div>
                  <Form.Item name="failIfOopViolated" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>
                <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                  <div>
                    <p className="text-sm text-slate-700 mb-0">Kích hoạt mode</p>
                    <p className="text-xs text-slate-500 mb-0">Mode tắt sẽ không thể đặt làm mặc định.</p>
                  </div>
                  <Form.Item name="isActive" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>
              </div>
            </Form>
          </Modal>
        </div>
      </ConfigProvider>
    </MainLayout>
  );
};

export default GradingModeConfig;
