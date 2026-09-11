import React from 'react';
import { Button, Form, Select } from 'antd';

const DefaultModeBanner = ({
  form,
  gradingModes,
  defaultMode,
  isLoading,
  saving,
  onSave,
}) => {
  return (
    <div className="bg-white border border-[#EAECF0] rounded-lg p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm gap-4">
      <div className="flex items-center gap-4">
        <div className="size-12 rounded-lg bg-[#FFF4EE] flex items-center justify-center text-[#F37021]">
          <span className="material-symbols-outlined text-3xl">info</span>
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Current Default Mode</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Hệ thống đang áp dụng {defaultMode ?? '—'} cho tất cả bài làm mới.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        <Form form={form} className="flex-1 sm:flex-none sm:min-w-[280px]">
          <Form.Item
            className="mb-0"
            name="defaultGradingMode"
            rules={[{ required: true, message: 'Không được để trống' }]}
          >
            <Select
              disabled={isLoading || saving}
              placeholder="Chọn mode mặc định"
              options={gradingModes.map((m) => ({
                value: m.mode,
                label: `${m.displayName} (${m.mode})`,
              }))}
            />
          </Form.Item>
        </Form>
        <Button
          type="primary"
          loading={saving}
          disabled={isLoading}
          onClick={onSave}
        >
          Lưu mặc định
        </Button>
      </div>
    </div>
  );
};

export default DefaultModeBanner;
