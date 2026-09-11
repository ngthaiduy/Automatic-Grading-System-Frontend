import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing, CheckCheck, ChevronLeft, ChevronRight, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import useNotifications from '../../hooks/useNotifications';
import NotificationFilterTabs from './NotificationFilterTabs';
import NotificationList from './NotificationList';
import { resolveNotificationTarget } from './notificationHelpers';

/**
 * Full-page Notification Center for Student / Lecturer / Exam Staff.
 */
export default function NotificationCenterPage({ role }) {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const {
    activeFilter,
    setActiveFilter,
    notifications,
    unreadCount,
    loadingList,
    loadingCount,
    actionLoading,
    deletingId,
    error,
    currentPage,
    pagination,
    goToPage,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteNotifications,
  } = useNotifications({ enabled: true, isOpen: true });

  const safeUnread = Number.isFinite(Number(unreadCount)) ? Number(unreadCount) : 0;
  const total = Number.isFinite(Number(pagination?.totalElements))
    ? Number(pagination.totalElements)
    : notifications.length;
  const readCount = Math.max(0, total - safeUnread);
  const totalPages = Math.max(0, Number(pagination?.totalPages || 0));
  const isFirstPage = currentPage <= 0;
  const isLastPage = totalPages === 0 || currentPage >= totalPages - 1;
  const selectedCount = selectedIds.size;

  const visibleIds = useMemo(
    () => notifications
      .map((item) => item?.notificationId)
      .filter((id) => typeof id === 'string' && id.trim()),
    [notifications],
  );

  const allSelectedOnPage = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  useEffect(() => {
    const visibleSet = new Set(visibleIds);
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => visibleSet.has(id)));
      return next;
    });
  }, [visibleIds]);

  const handleOpenNotification = async (notification) => {
    if (!notification || typeof notification !== 'object') return;

    if (notification?.isRead === false && notification?.notificationId) {
      await markAsRead(notification.notificationId);
    }

    const target = resolveNotificationTarget({ notification, role });
    if (target) navigate(target);
  };

  const handleDeleteNotification = async (notification) => {
    if (!notification?.notificationId) return;
    await deleteNotification(notification.notificationId);
    setSelectedIds((prev) => {
      if (!prev.has(notification.notificationId)) return prev;
      const next = new Set(prev);
      next.delete(notification.notificationId);
      return next;
    });
  };

  const handleToggleSelect = (notification) => {
    const notificationId = notification?.notificationId;
    if (!notificationId) return;

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(notificationId)) {
        next.delete(notificationId);
      } else {
        next.add(notificationId);
      }
      return next;
    });
  };

  const handleToggleSelectAllPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (allSelectedOnPage) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }

      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (!selectedCount || bulkDeleting) return;

    setBulkDeleting(true);
    try {
      await deleteNotifications(Array.from(selectedIds));
      setSelectedIds(new Set());
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full space-y-5">
      <section className="rounded-3xl border border-[#F37021]/20 bg-gradient-to-br from-white via-[#fff8f4] to-white p-6 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F37021]/10 text-[#F37021] text-xs font-bold uppercase tracking-widest">
              <BellRing className="h-3.5 w-3.5" />
              Notification Center
            </div>
            <h1 className="mt-3 text-3xl font-black text-slate-900">Trang thông báo</h1>
            <p className="mt-1 text-sm text-slate-500">Quản lý toàn bộ thông báo.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 w-full xl:w-auto">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 min-w-[170px]">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tổng thông báo</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{total.toLocaleString('vi-VN')}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 min-w-[170px]">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Chưa đọc</p>
              <p className="mt-1 text-2xl font-black text-amber-800">{safeUnread.toLocaleString('vi-VN')}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 min-w-[170px]">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Đã đọc</p>
              <p className="mt-1 text-2xl font-black text-emerald-800">{readCount.toLocaleString('vi-VN')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/80 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => refresh(activeFilter)}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50"
            >
              {loadingList || loadingCount ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Làm mới
            </button>

            <button
              type="button"
              onClick={markAllAsRead}
              disabled={actionLoading || safeUnread === 0}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-[#F37021] text-white text-sm font-bold hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              Đánh dấu đã đọc tất cả
            </button>

            <button
              type="button"
              onClick={handleToggleSelectAllPage}
              disabled={!visibleIds.length || loadingList || bulkDeleting}
              className="inline-flex items-center h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {allSelectedOnPage ? 'Bỏ chọn trang' : 'Chọn cả trang'}
            </button>

            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={!selectedCount || bulkDeleting || actionLoading}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bulkDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Xóa đã chọn ({selectedCount})
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <NotificationFilterTabs
              activeFilter={activeFilter}
              onChange={setActiveFilter}
            />
            <p className="text-xs text-slate-500">
              {safeUnread > 0 ? `${safeUnread} thông báo chưa đọc` : 'Bạn đã xem hết thông báo'}
            </p>
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-white">
          <div className="rounded-2xl border border-slate-100 overflow-hidden">
            <NotificationList
              notifications={notifications}
              loading={loadingList}
              error={error}
              activeFilter={activeFilter}
              onRetry={refresh}
              onItemClick={handleOpenNotification}
              onDeleteItem={handleDeleteNotification}
              deletingId={deletingId}
              selectable
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Trang {Math.max(1, currentPage + 1)} / {Math.max(1, totalPages)} • Tổng {total.toLocaleString('vi-VN')} thông báo
          </p>

          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={loadingList || isFirstPage}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Trước
            </button>

            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={loadingList || isLastPage}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
