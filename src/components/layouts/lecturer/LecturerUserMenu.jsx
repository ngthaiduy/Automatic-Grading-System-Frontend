import React from 'react';

export default function LecturerUserMenu({
  displayName,
  displayEmail = '',
  onLogout,
  tone = 'light',
}) {
  const wrapperClassName = tone === 'dark'
    ? 'overflow-hidden rounded-2xl border border-slate-700 bg-[#3a3a3a] py-1 shadow-xl'
    : 'overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-xl';

  const dividerClassName = tone === 'dark' ? 'border-slate-700' : 'border-slate-100';
  const textClassName = tone === 'dark' ? 'text-white' : 'text-slate-800';
  const emailClassName = 'text-slate-400';
  const placeholderClassName = tone === 'dark'
    ? 'flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400'
    : 'flex items-center gap-3 px-4 py-2.5 text-sm text-slate-500';
  const iconClassName = 'text-slate-400';
  const logoutClassName = tone === 'dark'
    ? 'flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-slate-700'
    : 'flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50';

  return (
    <div className={wrapperClassName}>
      <div className={`border-b px-4 py-3 ${dividerClassName}`}>
        <p className={`text-sm font-bold ${textClassName}`}>{displayName}</p>
        {displayEmail && <p className={`text-xs ${emailClassName}`}>{displayEmail}</p>}
      </div>

      <div className={placeholderClassName}>
        <span className={`material-symbols-outlined text-[18px] ${iconClassName}`}>person</span>
        <div>
          <p>Hồ sơ cá nhân</p>
          <p className="text-[11px] text-slate-400">Sẽ mở ở bước sau</p>
        </div>
      </div>

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
