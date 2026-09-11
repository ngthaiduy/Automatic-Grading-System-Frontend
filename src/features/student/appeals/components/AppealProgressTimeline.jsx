import React from 'react';
import { getAppealProgressSteps } from '../helpers/appealHelpers';

export default function AppealProgressTimeline({ status }) {
  const steps = getAppealProgressSteps(status);
  const columnsClassName = steps.length === 3 ? 'grid-cols-3' : 'grid-cols-5';

  return (
    <div className={`relative mt-2 grid ${columnsClassName} gap-3`}>
      <div className="pointer-events-none absolute left-[16%] right-[16%] top-4 h-0.5 bg-slate-200" />

      {steps.map((step) => (
        <div key={step.label} className="relative z-[1] flex flex-col items-center gap-2 text-center">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full border ${
              step.isDone
                ? 'border-[#F37021] bg-[#F37021] text-white'
                : step.isCurrent
                  ? 'border-[#F37021] bg-white text-[#F37021]'
                  : 'border-slate-200 bg-slate-50 text-slate-400'
            }`}
          >
            {step.isDone ? (
              <span className="material-symbols-outlined text-[16px]">check</span>
            ) : step.isCurrent ? (
              <span className="material-symbols-outlined text-[16px]">hourglass_empty</span>
            ) : (
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            )}
          </div>

          <span
            className={`text-[11px] font-bold ${
              step.isDone || step.isCurrent ? 'text-slate-700' : 'text-slate-400'
            }`}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}
