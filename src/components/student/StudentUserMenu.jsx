import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Reusable user dropdown for the student layout.
 * The same actions are shown in both the sidebar and the header avatar menu.
 */
export default function StudentUserMenu({
  displayName,
  displayEmail = '',
  onClose,
  onLogout,
  tone = 'light',
}) {
  const wrapperClassName = tone === 'dark'
    ? 'rounded-2xl border border-slate-700 bg-[#3a3a3a] shadow-xl py-1 overflow-hidden'
    : 'rounded-2xl border border-slate-200 bg-white shadow-xl py-1 overflow-hidden';

  const dividerClassName = tone === 'dark' ? 'border-slate-700' : 'border-slate-100';
  const textClassName = tone === 'dark' ? 'text-white' : 'text-slate-800';
  const emailClassName = tone === 'dark' ? 'text-slate-400' : 'text-slate-400';
  const linkClassName = tone === 'dark'
    ? 'flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors'
    : 'flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors';
  const iconClassName = tone === 'dark' ? 'text-slate-400' : 'text-slate-400';
  const logoutClassName = tone === 'dark'
    ? 'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-slate-700 transition-colors'
    : 'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors';

  return (
    <div className={wrapperClassName}>
      <div className={`px-4 py-3 border-b ${dividerClassName}`}>
        <p className={`text-sm font-bold ${textClassName}`}>{displayName}</p>
        {displayEmail && <p className={`text-xs ${emailClassName}`}>{displayEmail}</p>}
      </div>

      <Link
        to="/student/profile"
        onClick={onClose}
        className={linkClassName}
      >
        <span className={`material-symbols-outlined text-[18px] ${iconClassName}`}>person</span>
        Hồ sơ cá nhân
      </Link>

      <button
        type="button"
        onClick={onLogout}
        className={logoutClassName}
      >
        <span className="material-symbols-outlined text-[18px]">logout</span>
        Đăng xuất
      </button>
    </div>
  );
}
