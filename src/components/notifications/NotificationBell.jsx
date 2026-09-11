import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellRing } from 'lucide-react';
import useNotifications from '../../hooks/useNotifications';
import { useAuth } from '../../app/context/authContext';
import { ROLE_HOME_MAP } from '../../constants/routes';
import NotificationPanel from './NotificationPanel';
import { resolveNotificationTarget } from './notificationHelpers';
import styles from './NotificationBell.module.css';

/**
 * Notification bell container.
 *
 * Defensive handling added:
 * - only enable notification logic when authenticated
 * - safe unread count fallback
 * - click handler guards invalid notification objects
 */
export default function NotificationBell({
  buttonClassName = '',
  iconClassName = 'h-5 w-5',
  badgeClassName = '',
}) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const {
    activeFilter,
    setActiveFilter,
    notifications,
    unreadCount,
    unreadItemsInView,
    loadingList,
    loadingCount,
    actionLoading,
    deletingId,
    error,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications({
    enabled: Boolean(isAuthenticated),
    isOpen: open,
  });

  const safeUnreadCount =
    Number.isFinite(unreadCount) && unreadCount >= 0 ? unreadCount : 0;

  const panelUnreadCount = Math.max(safeUnreadCount, unreadItemsInView);

  const role = user?.roleName ?? user?.role;
  const roleKey = String(role || '').toUpperCase();
  const notificationPagePath = ROLE_HOME_MAP[roleKey]
    ? `${ROLE_HOME_MAP[roleKey]}/notifications`
    : null;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification) => {
    if (!notification || typeof notification !== 'object') {
      setOpen(false);
      return;
    }

    const target = resolveNotificationTarget({ notification, role });

    if (notification?.isRead === false && notification?.notificationId) {
      await markAsRead(notification.notificationId);
    }

    setOpen(false);
    navigate(target || '/');
  };

  if (!isAuthenticated) {
    return null;
  }

  const handleOpenAll = () => {
    if (notificationPagePath) {
      setOpen(false);
      navigate(notificationPagePath);
    }
  };

  const handleDeleteNotification = async (notification) => {
    const notificationId = notification?.notificationId;
    if (!notificationId) return;
    await deleteNotification(notificationId);
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        aria-label="Mở thông báo"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`relative inline-flex items-center justify-center transition-all duration-200 ${buttonClassName}`}
      >
        {safeUnreadCount > 0 ? (
          <BellRing className={`${iconClassName} ${open ? 'text-[#F37021]' : 'text-current'}`} />
        ) : (
          <Bell className={`${iconClassName} ${open ? 'text-[#F37021]' : 'text-current'}`} />
        )}

        {safeUnreadCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-[#F37021] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm ${styles.badgePulse} ${badgeClassName}`}
          >
            {safeUnreadCount > 99 ? '99+' : safeUnreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationPanel
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          notifications={notifications}
          unreadCount={panelUnreadCount}
          unreadItemsInView={unreadItemsInView}
          loadingList={loadingList}
          loadingCount={loadingCount}
          actionLoading={actionLoading}
          error={error}
          refresh={refresh}
          markAllAsRead={markAllAsRead}
          onItemClick={handleNotificationClick}
          onDeleteItem={handleDeleteNotification}
          deletingId={deletingId}
          onOpenAll={notificationPagePath ? handleOpenAll : null}
        />
      )}
    </div>
  );
}