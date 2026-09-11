import React from 'react';
import { Link } from 'react-router-dom';
import StudentUserMenu from './StudentUserMenu';
import { STUDENT_NAV_ITEMS } from './studentNavConfig';

/**
 * Shared sidebar for all student pages.
 */
export default function StudentSidebar({
  sidebarOpen,
  activeNavKey,
  sidebarDropdownOpen,
  setSidebarDropdownOpen,
  sidebarDropdownRef,
  displayName,
  displayId,
  displayEmail,
  avatarText,
  onLogout,
}) {
  return (
    <aside className={`${sidebarOpen ? 'w-64' : 'w-[72px]'} transition-[width] duration-300 ease-in-out flex-shrink-0 flex flex-col bg-gradient-to-b from-[#2b2b2f] to-[#232327] border-r border-slate-800 shadow-2xl z-20`}>
      <div className="px-5 py-5 flex items-center gap-3 border-b border-slate-700/50">
        <div className="w-9 h-9 bg-[#F37021] rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
          <span className="material-symbols-outlined text-white text-[18px]">terminal</span>
        </div>
        {sidebarOpen && (
          <div className="min-w-0">
            <p className="text-white text-sm font-black leading-none truncate">Java OOP Exam</p>
            <p className="text-slate-400 text-[9px] mt-0.5 uppercase tracking-widest">FPT University</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {STUDENT_NAV_ITEMS.map((item) => {
          const active = item.key === activeNavKey;

          return (
            <Link
              key={item.key}
              to={item.to}
              title={!sidebarOpen ? item.label : undefined}
              className={`flex items-center gap-3 h-11 px-3 rounded-xl transition-all duration-200 group ${
                active
                  ? 'bg-[#F37021]/10 text-[#F37021]'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] flex-shrink-0 ${active ? 'text-[#F37021]' : 'group-hover:text-slate-200'}`}>
                {item.icon}
              </span>
              {sidebarOpen && (
                <span className={`text-sm font-semibold truncate ${active ? 'font-bold text-[#F37021]' : ''}`}>
                  {item.label}
                </span>
              )}
              {active && sidebarOpen && (
                <div className="ml-auto w-1.5 h-5 rounded-full bg-[#F37021] flex-shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-700/50" ref={sidebarDropdownRef}>
        {sidebarDropdownOpen && sidebarOpen && (
          <div className="mb-2">
            <StudentUserMenu
              tone="dark"
              displayName={displayName}
              displayEmail={displayEmail}
              onClose={() => setSidebarDropdownOpen(false)}
              onLogout={onLogout}
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => setSidebarDropdownOpen((prev) => !prev)}
          className={`w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 transition-colors ${!sidebarOpen ? 'justify-center' : ''}`}
        >
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-[#F37021]/20 text-[#F37021] font-black text-sm flex items-center justify-center ring-2 ring-[#F37021]/30">
              {avatarText}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#2D2D2D]" />
          </div>

          {sidebarOpen && (
            <>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-white text-[13px] font-bold truncate">{displayName}</p>
                <p className="text-slate-400 text-[10px] truncate">{displayId}</p>
              </div>
              <span className={`material-symbols-outlined text-slate-400 text-[18px] transition-transform duration-200 ${sidebarDropdownOpen ? 'rotate-180' : ''}`}>
                expand_less
              </span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
