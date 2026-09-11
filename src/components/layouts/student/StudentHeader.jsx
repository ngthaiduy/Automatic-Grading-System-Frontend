import React from 'react';
import { Link } from 'react-router-dom';
import NotificationBell from '../../notifications/NotificationBell';
import StudentUserMenu from './StudentUserMenu';

function HeaderMeta({ title, subtitle, breadcrumbs }) {
  const hasBreadcrumbs = Array.isArray(breadcrumbs) && breadcrumbs.length > 0;

  return (
    <div>
      <h1 className="text-slate-800 font-black text-[17px] leading-none">{title}</h1>

      {hasBreadcrumbs ? (
        <div className="flex items-center text-[11px] text-slate-400 gap-1 mt-0.5 flex-wrap">
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={`${item.label}-${index}`}>
              {item.to ? (
                <Link to={item.to} className="hover:text-[#F37021] transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="text-[#F37021] font-medium">{item.label}</span>
              )}

              {index < breadcrumbs.length - 1 && (
                <span className="material-symbols-outlined text-[12px]">chevron_right</span>
              )}
            </React.Fragment>
          ))}
        </div>
      ) : (
        <div className="text-slate-400 text-[11px] mt-0.5">{subtitle}</div>
      )}
    </div>
  );
}

/**
 * Shared sticky header for student pages.
 */
export default function StudentHeader({
  title,
  subtitle,
  breadcrumbs,
  headerActions,
  setSidebarOpen,
  headerDropdownOpen,
  setHeaderDropdownOpen,
  headerDropdownRef,
  displayName,
  displayEmail,
  avatarText,
  onLogout,
}) {
  return (
    <header className="flex-shrink-0 flex items-center justify-between h-16 px-8 border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-10">
      <div className="flex items-center gap-4 min-w-0">
        <button
          type="button"
          onClick={() => setSidebarOpen((prev) => !prev)}
          className="w-9 h-9 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-all"
        >
          <span className="material-symbols-outlined text-xl">menu</span>
        </button>

        <HeaderMeta title={title} subtitle={subtitle} breadcrumbs={breadcrumbs} />
      </div>

      <div className="flex items-center gap-3">
        {headerActions}

        <NotificationBell
          buttonClassName="w-9 h-9 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          iconClassName="h-5 w-5"
        />

        <div className="relative" ref={headerDropdownRef}>
          <button
            type="button"
            onClick={() => setHeaderDropdownOpen((prev) => !prev)}
            className="w-9 h-9 rounded-full bg-[#F37021]/20 text-[#F37021] font-black text-sm flex items-center justify-center ring-2 ring-[#F37021]/30 hover:ring-[#F37021]/60 transition-all cursor-pointer"
          >
            {avatarText}
          </button>

          {headerDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 z-50">
              <StudentUserMenu
                displayName={displayName}
                displayEmail={displayEmail}
                onClose={() => setHeaderDropdownOpen(false)}
                onLogout={onLogout}
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
