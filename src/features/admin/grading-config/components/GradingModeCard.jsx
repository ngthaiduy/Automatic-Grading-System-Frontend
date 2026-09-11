import React from 'react';
import { Button } from 'antd';
import { renderBooleanPill } from '../../../../components/utils/Utils';

const GradingModeCard = ({
  mode,
  defaultMode,
  isLoading,
  saving,
  savingMode,
  onSetDefault,
  onEdit,
}) => {
  const isDefault = mode.mode === defaultMode;
  const isInactive = mode.isActive === false;
  const testWeight = Number(mode.testCaseWeight ?? 0);
  const oopWeight = Number(mode.oopWeight ?? 0);

  return (
    <div
      className={`bg-white rounded-lg p-6 shadow-sm relative border ${
        isDefault ? 'border-2 border-[#F37021]' : 'border border-[#EAECF0]'
      } ${isInactive ? 'opacity-60' : ''}`}
    >
      {isDefault && (
        <div className="absolute -top-3 right-6 bg-[#FFF4EE] text-[#F37021] border border-[#F37021] text-[10px] font-bold px-3 py-0.5 rounded-full tracking-widest uppercase">
          Default
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <h4 className="text-lg font-bold text-slate-900">
          {mode.displayName || mode.mode}
        </h4>
        <span
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
            isInactive
              ? 'bg-slate-100 text-slate-500'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          {isInactive ? 'Đã tắt' : 'Đang bật'}
        </span>
      </div>

      <p className="text-sm text-slate-600 mb-6 min-h-[40px]">
        {mode.description ||
          'Cấu hình trọng số chấm điểm và quy tắc rớt tự động theo mode.'}
      </p>

      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between text-xs font-bold mb-1">
          <span className="text-[#F37021]">Test Case ({testWeight}%)</span>
          <span className="text-blue-600">OOP Analysis ({oopWeight}%)</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-[#F37021]"
            style={{ width: `${Math.max(0, Math.min(100, testWeight))}%` }}
          />
          <div
            className="h-full bg-blue-600"
            style={{ width: `${Math.max(0, Math.min(100, oopWeight))}%` }}
          />
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg mb-6">
        <ul className="text-xs space-y-2 text-slate-600">
          <li className="flex items-center justify-between gap-2">
            <span>Chỉ nhận xét OOP</span>
            {renderBooleanPill(mode.oopCommentOnly, {
              trueText: 'Có',
              falseText: 'Không',
            })}
          </li>
          <li className="flex items-center justify-between gap-2">
            <span>Rớt nếu Test Case 0đ</span>
            {renderBooleanPill(mode.failIfZeroTestCase, {
              trueText: 'Có',
              falseText: 'Không',
            })}
          </li>
          <li className="flex items-center justify-between gap-2">
            <span>Rớt nếu vi phạm OOP</span>
            {renderBooleanPill(mode.failIfOopViolated, {
              trueText: 'Có',
              falseText: 'Không',
            })}
          </li>
        </ul>
      </div>

      <div className="flex gap-3">
        <Button
          className="flex-1"
          type={isDefault ? 'primary' : 'default'}
          disabled={isDefault || isLoading || saving || isInactive}
          loading={saving && savingMode === mode.mode}
          onClick={() => onSetDefault(mode.mode)}
        >
          {isDefault ? 'Đang là mặc định' : 'Đặt làm mặc định'}
        </Button>
        <Button
          disabled={isLoading || saving}
          onClick={() => onEdit(mode)}
          icon={<span className="material-symbols-outlined">edit</span>}
        />
      </div>
    </div>
  );
};

export default GradingModeCard;
