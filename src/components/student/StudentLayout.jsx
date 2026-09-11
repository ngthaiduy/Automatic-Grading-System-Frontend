import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../app/context/authContext';
import StudentSidebar from './StudentSidebar';
import StudentHeader from './StudentHeader';

/**
 * Shared student shell layout.
 *
 * DEV NOTE:
 * This component centralizes the duplicated sidebar/header/user-menu code that
 * previously existed in StudentDashboard, StudentResultsPage, and
 * StudentResultDetailPage. New student pages should reuse this layout instead
 * of copying the shell again.
 */
export default function StudentLayout({
  activeNavKey = 'dashboard',
  title,
  subtitle,
  breadcrumbs = [],
  headerActions = null,
  bodyClassName = 'px-8 py-8 max-w-7xl mx-auto space-y-6',
  useBodyContainer = true,
  children,
}) {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [headerDropdownOpen, setHeaderDropdownOpen] = useState(false);
  const [sidebarDropdownOpen, setSidebarDropdownOpen] = useState(false);

  const headerDropdownRef = useRef(null);
  const sidebarDropdownRef = useRef(null);

  const displayName = user?.fullName || 'Sinh viên';
  const displayId = user?.userId ? `ID: ${user.userId.slice(0, 8).toUpperCase()}` : '—';
  const displayEmail = user?.email || '';

  const avatarText = useMemo(() => {
    if (displayName === 'Sinh viên') return 'SV';
    return displayName
      .split(' ')
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [displayName]);

  const resolvedSubtitle = subtitle ?? (
    <p>
      Xin chào trở lại, <span className="text-[#F37021]">{displayName}</span> 👋
    </p>
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerDropdownRef.current && !headerDropdownRef.current.contains(event.target)) {
        setHeaderDropdownOpen(false);
      }
      if (sidebarDropdownRef.current && !sidebarDropdownRef.current.contains(event.target)) {
        setSidebarDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    // Cookie HttpOnly sẽ bị backend tự động xóa khi gọi API logout
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#f7f7f8] via-[#f6f6f8] to-[#fffaf6] font-[Inter,sans-serif] overflow-hidden">
      <StudentSidebar
        sidebarOpen={sidebarOpen}
        activeNavKey={activeNavKey}
        sidebarDropdownOpen={sidebarDropdownOpen}
        setSidebarDropdownOpen={setSidebarDropdownOpen}
        sidebarDropdownRef={sidebarDropdownRef}
        displayName={displayName}
        displayId={displayId}
        displayEmail={displayEmail}
        avatarText={avatarText}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 bg-orange-200/20 rounded-full blur-3xl" />

        <StudentHeader
          title={title}
          subtitle={resolvedSubtitle}
          breadcrumbs={breadcrumbs}
          headerActions={headerActions}
          setSidebarOpen={setSidebarOpen}
          headerDropdownOpen={headerDropdownOpen}
          setHeaderDropdownOpen={setHeaderDropdownOpen}
          headerDropdownRef={headerDropdownRef}
          displayName={displayName}
          displayEmail={displayEmail}
          avatarText={avatarText}
          onLogout={handleLogout}
        />

        <div className="flex-1 overflow-y-auto bg-transparent">
          {useBodyContainer ? (
            <div className={bodyClassName}>{children}</div>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
}
