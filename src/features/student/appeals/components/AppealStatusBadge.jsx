import React from 'react';
import { getAppealStatusMeta } from '../helpers/appealHelpers';

export default function AppealStatusBadge({ status }) {
  const meta = getAppealStatusMeta(status);

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${meta.className}`}>
      <span className={`h-2 w-2 rounded-full ${meta.dotClassName}`} />
      {meta.label}
    </span>
  );
}
