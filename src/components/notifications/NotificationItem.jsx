import React from 'react';
import { ChevronRight, Loader2, Trash2 } from 'lucide-react';
import { formatRelativeTime } from './notificationHelpers';
import styles from './NotificationBell.module.css';

/**
 * One notification row.
 * Kept separate so future design tweaks do not bloat the bell container file.
 */
export default function NotificationItem({
  notification,
  onClick,
  onDelete,
  deleting,
  selectable = false,
  selected = false,
  onToggleSelect,
}) {
  const unread = notification?.isRead === false;

  return (
    <button
      type="button"
      onClick={() => onClick(notification)}
      className={`group w-full text-left px-5 py-4 transition-colors ${
        unread ? styles.notificationCardUnread : styles.notificationCard
      }`}
    >
      <div className="flex items-start gap-3">
        {selectable && (
          <label
            className="pt-0.5"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            <input
              type="checkbox"
              checked={Boolean(selected)}
              onChange={() => onToggleSelect?.(notification)}
              className="h-4 w-4 rounded border-slate-300 text-[#F37021] focus:ring-[#F37021]"
            />
          </label>
        )}

        <div className="pt-1">
          <span
            className={`flex h-2.5 w-2.5 rounded-full ${
              unread ? 'bg-[#F37021]' : 'bg-slate-200'
            }`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm leading-5 truncate ${
                  unread ? 'font-extrabold text-slate-900' : 'font-bold text-slate-700'
                }`}
              >
                {notification.title}
              </p>

              <p className={`mt-1 text-[13px] leading-5 text-slate-500 ${styles.bodyClamp}`}>
                {notification.body}
              </p>
            </div>

            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#F37021] transition-colors shrink-0 mt-0.5" />
          </div>

          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
            <span>{formatRelativeTime(notification.createdAt)}</span>

            {notification.relatedEntityType && (
              <>
                <span>•</span>
                <span className="uppercase tracking-wide">
                  {String(notification.relatedEntityType).replaceAll('_', ' ')}
                </span>
              </>
            )}

            {unread && (
              <>
                <span>•</span>
                <span className="font-semibold text-[#F37021]">Mới</span>
              </>
            )}

            {typeof onDelete === 'function' && (
              <>
                <span>•</span>
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onDelete(notification);
                  }}
                  disabled={Boolean(deleting)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-500 hover:text-rose-600 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Xóa
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}