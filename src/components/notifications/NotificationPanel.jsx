import React from 'react';
import { BellRing, CheckCheck, Loader2, RefreshCw } from 'lucide-react';
import NotificationFilterTabs from './NotificationFilterTabs';
import NotificationList from './NotificationList';
import styles from './NotificationBell.module.css';

function getPanelTitle(activeFilter) {
  if (activeFilter === 'unread') return 'Thông báo chưa đọc';
  if (activeFilter === 'read') return 'Thông báo đã đọc';
  return 'Tất cả thông báo';
}

/**
 * Notification dropdown panel.
 * All rendering details live here so the bell container stays small and easier to read.
 */
export default function NotificationPanel({
  activeFilter,
  setActiveFilter,
  notifications,
  unreadCount,
  unreadItemsInView,
  loadingList,
  loadingCount,
  actionLoading,
  error,
  refresh,
  markAllAsRead,
  onItemClick,
  onDeleteItem,
  deletingId,
  onOpenAll,
}) {
  const panelTitle = getPanelTitle(activeFilter);

  return (
    <div className={styles.panel}>
      <div className="px-5 pt-5 pb-4 border-b border-slate-100 bg-gradient-to-br from-white to-[#fff7f2]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-2xl bg-[#F37021]/10 text-[#F37021]">
                <BellRing className="h-[18px] w-[18px]" />
              </span>
              <div>
                <h3 className="text-[15px] font-extrabold text-slate-900 leading-none">
                  Notification Center
                </h3>
                <p className="text-xs text-slate-500 mt-1">{panelTitle}</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => refresh(activeFilter)}
            className="inline-flex items-center justify-center size-9 rounded-xl border border-slate-200 text-slate-500 hover:text-[#F37021] hover:border-[#F37021]/30 hover:bg-[#fff7f2] transition-colors"
            title="Tải lại"
          >
            {loadingList || loadingCount ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
          <NotificationFilterTabs
            activeFilter={activeFilter}
            onChange={setActiveFilter}
          />

          <button
            type="button"
            onClick={markAllAsRead}
            disabled={actionLoading || unreadCount === 0}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F37021] disabled:text-slate-300 disabled:cursor-not-allowed"
          >
            {actionLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
            Đọc tất cả
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-slate-500 flex-wrap">
          <span>
            {unreadCount > 0
              ? `${unreadCount} thông báo chưa đọc`
              : 'Bạn đã xem hết thông báo rồi'}
          </span>

          {activeFilter === 'unread' && unreadItemsInView > 0 && (
            <span>{unreadItemsInView} mục trong bộ lọc này</span>
          )}
        </div>
      </div>

      <NotificationList
        notifications={notifications}
        loading={loadingList}
        error={error}
        activeFilter={activeFilter}
        onRetry={refresh}
        onItemClick={onItemClick}
        onDeleteItem={onDeleteItem}
        deletingId={deletingId}
      />

      {typeof onOpenAll === 'function' && (
        <div className="px-4 py-3 border-t border-slate-100 bg-white">
          <button
            type="button"
            onClick={onOpenAll}
            className="w-full h-10 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition-colors"
          >
            Xem tất cả thông báo
          </button>
        </div>
      )}
    </div>
  );
}