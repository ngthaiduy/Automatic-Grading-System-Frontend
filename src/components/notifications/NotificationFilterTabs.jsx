import React from 'react';
import { NOTIFICATION_FILTERS } from './notificationHelpers';

/**
 * Small presentational component to keep filter tab rendering out of NotificationBell.
 */
export default function NotificationFilterTabs({ activeFilter, onChange }) {
  return (
    <div className="inline-flex rounded-2xl bg-slate-100 p-1">
      {NOTIFICATION_FILTERS.map((filter) => {
        const active = activeFilter === filter.key;

        return (
          <button
            key={filter.key}
            type="button"
            onClick={() => onChange(filter.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              active
                ? 'bg-white text-[#F37021] shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}