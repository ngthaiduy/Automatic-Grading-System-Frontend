import React, { Suspense, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../app/context/authContext';
import LecturerSidebar from './LecturerSidebar';
import LecturerHeader from './LecturerHeader';

const DEFAULT_PAGE_META = {
  title: 'Giảng viên',
  subtitle: 'Quản lý dashboard và xử lý phúc khảo được giao.',
  breadcrumbs: [],
  headerActions: null,
};

const getDefaultPageMeta = (pathname) => {
  if (pathname.startsWith('/lecturer/appeals')) {
    return {
      title: 'Phúc khảo',
      subtitle: 'Theo dõi và xử lý các đơn phúc khảo được giao.',
      breadcrumbs: [
        { label: 'Dashboard', to: '/lecturer' },
        { label: 'Phúc khảo' },
      ],
      headerActions: null,
    };
  }

  return DEFAULT_PAGE_META;
};

export default function LecturerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [headerDropdownOpen, setHeaderDropdownOpen] = useState(false);
  const [sidebarDropdownOpen, setSidebarDropdownOpen] = useState(false);
  const [pageMetaState, setPageMetaState] = useState(() => ({
    pathname: location.pathname,
    meta: getDefaultPageMeta(location.pathname),
  }));

  const headerDropdownRef = useRef(null);
  const sidebarDropdownRef = useRef(null);

  const displayName = user?.fullName || 'Giảng viên';
  const displaySubtext = user?.email || user?.username || 'Lecturer';
  const displayEmail = user?.email || '';

  const avatarText = useMemo(() => {
    if (displayName === 'Giảng viên') return 'GV';

    return displayName
      .split(' ')
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [displayName]);

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

  const setPageMeta = useMemo(
    () => (meta) => {
      setPageMetaState({
        pathname: location.pathname,
        meta,
      });
    },
    [location.pathname],
  );

  const resolvedPageMeta = useMemo(() => {
    if (pageMetaState.pathname === location.pathname) {
      return pageMetaState.meta;
    }

    return getDefaultPageMeta(location.pathname);
  }, [location.pathname, pageMetaState.meta, pageMetaState.pathname]);

  const outletContext = useMemo(
    () => ({ setPageMeta }),
    [setPageMeta],
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#f7f7f8] via-[#f6f6f8] to-[#fffaf6] font-[Inter,sans-serif]">
      <LecturerSidebar
        sidebarOpen={sidebarOpen}
        pathname={location.pathname}
        sidebarDropdownOpen={sidebarDropdownOpen}
        setSidebarDropdownOpen={setSidebarDropdownOpen}
        sidebarDropdownRef={sidebarDropdownRef}
        displayName={displayName}
        displaySubtext={displaySubtext}
        displayEmail={displayEmail}
        avatarText={avatarText}
        onLogout={handleLogout}
      />

      <main className="relative flex min-w-0 flex-1 flex-col">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-orange-200/20 blur-3xl" />

        <LecturerHeader
          title={resolvedPageMeta.title}
          subtitle={resolvedPageMeta.subtitle}
          breadcrumbs={resolvedPageMeta.breadcrumbs}
          headerActions={resolvedPageMeta.headerActions}
          setSidebarOpen={setSidebarOpen}
          headerDropdownOpen={headerDropdownOpen}
          setHeaderDropdownOpen={setHeaderDropdownOpen}
          headerDropdownRef={headerDropdownRef}
          displayName={displayName}
          displayEmail={displayEmail}
          avatarText={avatarText}
          onLogout={handleLogout}
        />

        <div className="flex-1 bg-transparent px-8 py-8">
          <Suspense
            fallback={
              <div className="space-y-4">
                <div className="h-10 w-64 rounded-2xl bg-slate-100 animate-pulse" />
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
                  <div className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
                  <div className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
                </div>
                <div className="h-72 rounded-2xl bg-slate-100 animate-pulse" />
              </div>
            }
          >
            <Outlet context={outletContext} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
