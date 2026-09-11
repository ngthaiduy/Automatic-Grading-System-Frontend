import React, { useEffect, useState } from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import {
  ADMIN_SIDEBAR_ITEMS,
  ADMIN_ICONS,
  ADMIN_SIDEBAR_ITEMS_FLAT,
} from '../../constants/sidebarItems';
import { renderSiderIconsMaterialSymbol } from '../../components/utils/Utils';
import {
  Button,
  ConfigProvider,
  Form,
  Input,
  message,
} from 'antd';
import CardContainer from '../../components/CardContainer';
import {
  useGetSystemConfig,
  useUpdatePassThreshold,
  useUpdateSystemConfig,
} from '../../hooks';

const SystemConfig = () => {
  const [form] = Form.useForm();
  const [validationError, setValidationError] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const {
    callGetSystemConfigEndpoint,
    config,
    loading: getSystemConfigLoading,
  } = useGetSystemConfig();

  const { callUpdateSystemConfigEndpoint, loading: updateSystemConfigLoading } =
    useUpdateSystemConfig();
  const { callUpdatePassThresholdEndpoint, loading: updatePassThresholdLoading } =
    useUpdatePassThreshold();

  const isFptEmail = (value) => {
    return value.endsWith('@fpt.edu.vn');
  };

  useEffect(() => {
    callGetSystemConfigEndpoint();
  }, []);

  useEffect(() => {
    const systemData = config ?? null;

    if (!systemData) return;
    form.setFieldsValue({
      maxUploadSizeMb: systemData?.maxUploadSizeMb,
      maxExamPaperMb: systemData?.maxExamPaperMb,
      gradingPassThreshold: Number(systemData?.gradingPassThreshold ?? 0),
      smtpHost: systemData?.smtpHost,
      smtpPort: systemData?.smtpPort,
      smtpUsername: systemData?.smtpUsername,
      smtpPassword: '',
      smtpFromEmail: systemData?.smtpFromEmail,
    });
  }, [config, form]);

  const handleCancel = () => {
    const systemData = config ?? null;
    form.setFieldsValue({
      maxUploadSizeMb: systemData?.maxUploadSizeMb,
      maxExamPaperMb: systemData?.maxExamPaperMb,
      gradingPassThreshold: Number(systemData?.gradingPassThreshold ?? 0),
      smtpHost: systemData?.smtpHost,
      smtpPort: systemData?.smtpPort,
      smtpUsername: systemData?.smtpUsername,
      smtpPassword: '',
      smtpFromEmail: systemData?.smtpFromEmail,
    });
    setValidationError(false);
  };

  const handleEdit = async () => {
    try {
      const values = await form.validateFields();

      const systemPayload = {
        maxUploadSizeMb: Number(values.maxUploadSizeMb),
        maxExamPaperMb: Number(values.maxExamPaperMb),
        defaultGradingMode: config?.defaultGradingMode,
      };

      const passThresholdPayload = {
        passThreshold: Number(values.gradingPassThreshold),
      };

      await callUpdateSystemConfigEndpoint(systemPayload);
      await callUpdatePassThresholdEndpoint(passThresholdPayload);

      message.success('Cập nhật cấu hình hệ thống thành công.');
      setIsEdit(false);
      setValidationError(false);
      callGetSystemConfigEndpoint();
    } catch (err) {
      message.error(
        err?.response?.data?.message ||
          err?.message ||
          'Cập nhật cấu hình hệ thống thất bại.',
      );
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
            InputNumber: {
              controlWidth: '60px',
            },
          },
        }}
      >
        <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
          <CardContainer>
            <div className="px-4 py-3">
              <div className="flex gap-2 items-center mb-2">
                <span className="material-symbols-outlined text-[#F37021] text-2xl">
                  settings
                </span>
                <h1 className="text-xl font-semibold">Cấu hình hệ thống</h1>
              </div>

              <Form
                form={form}
                layout="vertical"
                disabled={
                  !isEdit ||
                  getSystemConfigLoading ||
                  updateSystemConfigLoading ||
                  updatePassThresholdLoading
                }
                onFieldsChange={() => {
                  const errors = form.getFieldsError();
                  const hasErrors = errors.some(
                    (field) => field.errors.length !== 0,
                  );
                  setValidationError(hasErrors);
                }}
                className="-space-y-2"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="p-2">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="px-2 py-2 rounded-md bg-[#F37120]/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#F37120]">
                          upload_file
                        </span>
                      </div>
                      <h2 className="font-semibold text-lg">
                        Giới hạn file tải lên
                      </h2>
                    </div>

                    <div className="flex flex-col">
                      <Form.Item
                        colon={false}
                        className="mb-3"
                      >
                        <div className="flex items-center gap-3">
                          <label className="min-w-[180px] text-xs font-semibold text-slate-500">
                            Dung lượng bài làm tối đa (MB):
                          </label>
                          <Form.Item
                            name="maxUploadSizeMb"
                            rules={[
                              {
                                required: true,
                                message: 'Không được để trống',
                              },
                              {
                                validator: (_, value) => {
                                  if (Number(value) >= 1)
                                    return Promise.resolve();
                                  return Promise.reject(
                                    new Error(
                                      'Giá trị phải lớn hơn hoặc bằng 1',
                                    ),
                                  );
                                },
                              },
                            ]}
                            noStyle
                          >
                            <Input
                              className="w-[100px]"
                              type="number"
                              controls={false}
                              placeholder="VD: 20"
                            />
                          </Form.Item>
                          <span className="text-xs relative -left-2">MB</span>
                        </div>
                      </Form.Item>

                      <Form.Item colon={false}>
                        <div className="flex items-center gap-3">
                          <label className="min-w-[180px] text-xs font-semibold text-slate-500">
                            Dung lượng đề thi tối đa (MB):
                          </label>
                          <Form.Item
                            controls={false}
                            name="maxExamPaperMb"
                            rules={[
                              {
                                required: true,
                                message: 'Không được để trống',
                              },
                              {
                                validator: (_, value) => {
                                  if (Number(value) >= 1)
                                    return Promise.resolve();
                                  return Promise.reject(
                                    new Error(
                                      'Giá trị phải lớn hơn hoặc bằng 1',
                                    ),
                                  );
                                },
                              },
                            ]}
                            noStyle
                          >
                            <Input
                              className="w-[100px]"
                              type="number"
                              controls={false}
                              placeholder="VD: 20"
                            />
                          </Form.Item>

                          <span className="text-xs relative -left-2">MB</span>
                        </div>
                      </Form.Item>

                      <Form.Item colon={false}>
                        <div className="flex items-center gap-3">
                          <label className="min-w-[180px] text-xs font-semibold text-slate-500">
                            Ngưỡng điểm đạt:
                          </label>
                          <Form.Item
                            name="gradingPassThreshold"
                            rules={[
                              {
                                required: true,
                                message: 'Không được để trống',
                              },
                              {
                                validator: (_, value) => {
                                  if (Number(value) >= 0)
                                    return Promise.resolve();
                                  return Promise.reject(
                                    new Error('Giá trị phải lớn hơn hoặc bằng 0'),
                                  );
                                },
                              },
                            ]}
                            noStyle
                          >
                            <Input
                              className="w-[100px]"
                              type="number"
                              step="0.1"
                              controls={false}
                              placeholder="VD: 4"
                            />
                          </Form.Item>
                          <span className="text-xs relative -left-2">điểm</span>
                        </div>
                      </Form.Item>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3  ">
                      <div className="px-2 py-2 rounded-md bg-[#16A34A]/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#16A34A]">
                          mail
                        </span>
                      </div>
                      <h2 className="font-semibold text-lg ">
                        Thiết lập Email (SMTP)
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-1">
                      <div>
                        <label className="min-w-[180px] text-xs font-semibold text-slate-500">
                          SMTP Host
                        </label>
                        <Form.Item name="smtpHost">
                          <Input disabled />
                        </Form.Item>
                      </div>
                      <div>
                        <label className="min-w-[180px] text-xs font-semibold text-slate-500">
                          Port
                        </label>
                        <Form.Item name="smtpPort">
                          <Input
                            className="w-full"
                            disabled
                            placeholder="VD: 587"
                          />
                        </Form.Item>
                      </div>
                      <div>
                        <label className="min-w-[180px] text-xs font-semibold text-slate-500">
                          SMTP Username
                        </label>
                        <Form.Item name="smtpUsername">
                          <Input disabled />
                        </Form.Item>
                      </div>
                      {/* <div>
                        <label className="min-w-[180px] text-xs font-semibold text-slate-500">
                          SMTP Password
                        </label>
                        <Form.Item name="smtpPassword">
                          <Input.Password disabled placeholder="••••••••" />
                        </Form.Item>
                      </div> */}
                      <div>
                        <label className="min-w-[180px] text-xs font-semibold text-slate-500">
                          Email gửi đi
                        </label>
                        <Form.Item name="smtpFromEmail">
                          <Input
                            disabled
                            placeholder="VD: noreply@domain.com"
                          />
                        </Form.Item>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 px-4 pt-1 pb-3">
                  {isEdit ? (
                    <>
                      <Button
                        size="large"
                        onClick={() => {
                          setIsEdit(false);
                          handleCancel();
                        }}
                      >
                        Hủy
                      </Button>
                      <Button
                        type="primary"
                        size="large"
                        disabled={validationError}
                        loading={
                          updateSystemConfigLoading ||
                          updatePassThresholdLoading
                        }
                        onClick={handleEdit}
                      >
                        Lưu cấu hình
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="primary"
                      size="large"
                      disabled={false}
                      onClick={() => {
                        setIsEdit(true);
                      }}
                    >
                      Cập nhật cấu hình
                    </Button>
                  )}
                </div>
              </Form>
            </div>
          </CardContainer>
        </div>
      </ConfigProvider>
    </MainLayout>
  );
};

export default SystemConfig;
