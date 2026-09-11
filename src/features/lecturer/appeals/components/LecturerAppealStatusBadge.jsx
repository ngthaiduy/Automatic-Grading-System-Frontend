import React from 'react';
import { getLecturerAppealStatusMeta } from '../helpers/appealHelpers';

export default function LecturerAppealStatusBadge({ status }) {
  const meta = getLecturerAppealStatusMeta(status);

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${meta.className}`}>
      {meta.label}
    </span>
  );
}