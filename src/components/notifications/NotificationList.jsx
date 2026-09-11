import React from 'react';
import { Inbox, Loader2, RefreshCw } from 'lucide-react';
import NotificationItem from './NotificationItem';
import styles from './NotificationBell.module.css';

/**
 * Presentational list section for notifications.
 */
export default function NotificationList({
  notifications,
  loading,
  error,
  activeFilter,
  onRetry,
  onItemClick,
  onDeleteItem,
  deletingId,
  selectable = false,
  selectedIds = [],
  onToggleSelect,
}) {
  const selectedSet = selectedIds instanceof Set ? selectedIds : new Set(selectedIds);

  if (loading) {
    return (
      <div className="px-5 py-8 flex flex-col items-center justify-center gap-3 text-slate-400 bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-[#F37021]" />
        <p className="text-sm font-medium">Đang tải thông báo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-5 py-8 text-center bg-white">
        <p className="text-sm font-semibold text-slate-700">Có lỗi khi tải thông báo</p>
        <p className="text-xs text-slate-500 mt-1">{error}</p>
        <button
          type="button"
          onClick={() => onRetry(activeFilter)}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F37021]/10 text-[#F37021] text-sm font-bold hover:bg-[#F37021]/15 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Thử lại
        </button>
      </div>
    );
  }

  if (!notifications.length) {
    return (
      <div className="px-5 py-10 flex flex-col items-center text-center gap-3 bg-white">
        <span className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-slate-100 text-slate-400">
          <Inbox className="h-6 w-6" />
        </span>
        <div>
          <p className="text-sm font-bold text-slate-800">Chưa có thông báo nào</p>
          <p className="text-xs text-slate-500 mt-1">
            Khi hệ thống có cập nhật mới, bạn sẽ thấy chúng xuất hiện tại đây.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.listScroll} bg-white`}>
      <div className="divide-y divide-slate-100">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.notificationId}
            notification={notification}
            onClick={onItemClick}
            onDelete={onDeleteItem}
            deleting={deletingId === notification.notificationId}
            selectable={selectable}
            selected={selectedSet.has(notification.notificationId)}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>
    </div>
  );
}