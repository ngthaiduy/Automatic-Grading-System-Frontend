import React from 'react';

function MetaItem({ label, value, mono = false, accent = false }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-sm ${mono ? 'font-mono break-all' : 'font-semibold'} ${accent ? 'text-[#F37021]' : 'text-slate-900'}`}>
        {value || '—'}
      </p>
    </div>
  );
}

export default function LecturerAppealMetaGrid({ items }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <MetaItem
          key={item.label}
          label={item.label}
          value={item.value}
          mono={item.mono}
          accent={item.accent}
        />
      ))}
    </div>
  );
}
