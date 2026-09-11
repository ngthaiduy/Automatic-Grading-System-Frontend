import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import notificationApi, { normalizeFilter } from '../services/notificationApi';
import {
  normalizeNotificationPayload,
  normalizeUnreadCount,
} from '../components/notifications/notificationHelpers';

const DEFAULT_FILTER = 'all';
const DEFAULT_PAGE_SIZE = 10;
const STREAM_RECONNECT_DELAY_MS = 2000;

const dispatchSessionExpiredEvent = (message = 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.') => {
  window.dispatchEvent(new CustomEvent('session-expired', {
    detail: { message },
  }));
};

/**
 * Shared notification hook for header bell dropdowns.
 *
 * VALIDATION / DEFENSIVE GOALS:
 * - sanitize API payload before rendering
 * - prevent invalid filter values
 * - avoid state updates after unmount
 * - handle malformed backend data without crashing UI
 * - keep optimistic update but rollback safely when request fails
 */
export default function useNotifications({ enabled = true, isOpen = false } = {}) {
  const [activeFilter, setActiveFilterState] = useState(DEFAULT_FILTER);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pagination, setPagination] = useState({
    page: 0,
    size: DEFAULT_PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
    isLast: true,
  });
  const [loadingList, setLoadingList] = useState(false);
  const [loadingCount, setLoadingCount] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [error, setError] = useState('');

  const mountedRef = useRef(false);
  const initializedRef = useRef(false);
  const listRequestIdRef = useRef(0);
  const countRequestIdRef = useRef(0);
  const streamAbortRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const streamRefreshTimerRef = useRef(null);

  const setActiveFilter = useCallback((nextFilter) => {
    setActiveFilterState(normalizeFilter(nextFilter));
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!enabled) return 0;

    const requestId = ++countRequestIdRef.current;

    try {
      setLoadingCount(true);

      const res = await notificationApi.getUnreadCount();
      const nextCount = normalizeUnreadCount(res?.data);

      if (!mountedRef.current || requestId !== countRequestIdRef.current) {
        return nextCount;
      }

      setUnreadCount(nextCount);
      return nextCount;
    } catch (err) {
      console.error('Failed to load unread notification count:', err);
      return 0;
    } finally {
      if (mountedRef.current && requestId === countRequestIdRef.current) {
        setLoadingCount(false);
      }
    }
  }, [enabled]);

  const fetchNotifications = useCallback(
    async (filter = activeFilter, page = currentPage) => {
      if (!enabled) return [];

      const safeFilter = normalizeFilter(filter);
      const safePage = Number.isFinite(Number(page)) ? Math.max(0, Math.floor(page)) : 0;
      const requestId = ++listRequestIdRef.current;

      try {
        setLoadingList(true);
        setError('');

        const res = await notificationApi.getAll({
          filter: safeFilter,
          page: safePage,
          size: pagination.size,
        });
        const normalized = normalizeNotificationPayload(res?.data, {
          page: safePage,
          size: pagination.size,
        });

        if (!mountedRef.current || requestId !== listRequestIdRef.current) {
          return normalized.items;
        }

        setNotifications(normalized.items);
        setPagination(normalized.pagination);
        setCurrentPage(normalized.pagination.page);

        return normalized.items;
      } catch (err) {
        console.error('Failed to load notifications:', err);

        if (mountedRef.current && requestId === listRequestIdRef.current) {
          setError('Không thể tải thông báo. Vui lòng thử lại.');
          setNotifications([]);
        }

        return [];
      } finally {
        if (mountedRef.current && requestId === listRequestIdRef.current) {
          setLoadingList(false);
        }
      }
    },
    [activeFilter, currentPage, enabled, pagination.size],
  );

  const refresh = useCallback(
    async (filter = activeFilter, page = currentPage) => {
      const safeFilter = normalizeFilter(filter);
      const safePage = Number.isFinite(Number(page)) ? Math.max(0, Math.floor(page)) : 0;
      await Promise.all([
        fetchUnreadCount(),
        fetchNotifications(safeFilter, safePage),
      ]);
    },
    [activeFilter, currentPage, fetchNotifications, fetchUnreadCount],
  );

  const markAsRead = useCallback(
    async (notificationId) => {
      if (typeof notificationId !== 'string' || !notificationId.trim()) {
        return;
      }

      const current = notifications.find((item) => item.notificationId === notificationId);
      if (!current) return;

      const wasUnread = current.isRead === false;

      setNotifications((prev) =>
        prev.map((item) =>
          item.notificationId === notificationId
            ? { ...item, isRead: true, readAt: item.readAt ?? new Date().toISOString() }
            : item,
        ),
      );

      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      try {
        await notificationApi.markAsRead(notificationId);
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
        await refresh();
      }
    },
    [notifications, refresh],
  );

  const markAllAsRead = useCallback(async () => {
    const hasUnread = notifications.some((item) => item.isRead === false);
    if (!hasUnread) return;

    const previous = notifications;

    setActionLoading(true);
    setNotifications((prev) =>
      prev.map((item) => ({
        ...item,
        isRead: true,
        readAt: item.readAt ?? new Date().toISOString(),
      })),
    );
    setUnreadCount(0);

    try {
      await notificationApi.markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);

      if (mountedRef.current) {
        setNotifications(previous);
      }

      await refresh(activeFilter, currentPage);
    } finally {
      if (mountedRef.current) {
        setActionLoading(false);
      }
    }
  }, [activeFilter, currentPage, notifications, refresh]);

  const deleteNotification = useCallback(
    async (notificationId) => {
      if (typeof notificationId !== 'string' || !notificationId.trim()) {
        return;
      }

      const target = notifications.find((item) => item.notificationId === notificationId);
      if (!target) return;

      const previousNotifications = notifications;
      const previousPagination = pagination;
      const previousUnread = unreadCount;

      setDeletingId(notificationId);
      setNotifications((prev) => prev.filter((item) => item.notificationId !== notificationId));
      setPagination((prev) => ({
        ...prev,
        totalElements: Math.max(0, Number(prev.totalElements || 0) - 1),
      }));

      if (target.isRead === false) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      try {
        await notificationApi.deleteOne(notificationId);

        const nextPage =
          previousNotifications.length === 1 && currentPage > 0 ? currentPage - 1 : currentPage;

        await refresh(activeFilter, nextPage);
      } catch (err) {
        console.error('Failed to delete notification:', err);

        if (mountedRef.current) {
          setNotifications(previousNotifications);
          setPagination(previousPagination);
          setUnreadCount(previousUnread);
        }

        await refresh(activeFilter, currentPage);
      } finally {
        if (mountedRef.current) {
          setDeletingId('');
        }
      }
    },
    [activeFilter, currentPage, notifications, pagination, refresh, unreadCount],
  );

  const deleteNotifications = useCallback(
    async (notificationIds) => {
      const uniqueIds = Array.from(
        new Set(
          (Array.isArray(notificationIds) ? notificationIds : []).filter(
            (id) => typeof id === 'string' && id.trim(),
          ),
        ),
      );

      if (!uniqueIds.length) {
        return { deleted: 0, failed: 0 };
      }

      setActionLoading(true);

      try {
        const results = await Promise.allSettled(
          uniqueIds.map((id) => notificationApi.deleteOne(id)),
        );

        const deleted = results.filter((item) => item.status === 'fulfilled').length;
        const failed = uniqueIds.length - deleted;

        const nextPage =
          deleted > 0 && notifications.length <= deleted && currentPage > 0
            ? currentPage - 1
            : currentPage;

        await refresh(activeFilter, nextPage);
        return { deleted, failed };
      } finally {
        if (mountedRef.current) {
          setActionLoading(false);
        }
      }
    },
    [activeFilter, currentPage, notifications.length, refresh],
  );

  const goToPage = useCallback((nextPage) => {
    const parsed = Number(nextPage);
    if (!Number.isFinite(parsed)) return;

    const maxPage = Math.max(0, Number(pagination.totalPages || 0) - 1);
    setCurrentPage(Math.max(0, Math.min(maxPage, Math.floor(parsed))));
  }, [pagination.totalPages]);

  const scheduleRefreshFromStream = useCallback(() => {
    if (streamRefreshTimerRef.current) {
      window.clearTimeout(streamRefreshTimerRef.current);
    }

    streamRefreshTimerRef.current = window.setTimeout(() => {
      fetchUnreadCount();

      if (isOpen) {
        fetchNotifications(activeFilter, currentPage);
      }
    }, 150);
  }, [activeFilter, currentPage, fetchNotifications, fetchUnreadCount, isOpen]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;

      if (streamAbortRef.current) {
        streamAbortRef.current.abort();
        streamAbortRef.current = null;
      }

      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      if (streamRefreshTimerRef.current) {
        window.clearTimeout(streamRefreshTimerRef.current);
        streamRefreshTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    fetchUnreadCount();

    let disposed = false;

    const connect = async () => {
      if (disposed || !mountedRef.current) return;

      const controller = new AbortController();
      let shouldReconnect = true;
      streamAbortRef.current = controller;

      try {
        const response = await fetch(`${__BASE_URL__}/notifications/stream`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'text/event-stream',
          },
          signal: controller.signal,
        });

        if (response.status === 401) {
          shouldReconnect = false;
          dispatchSessionExpiredEvent();
          return;
        }

        if (!response.ok || !response.body) {
          throw new Error(`Stream connect failed: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (!disposed && mountedRef.current) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.replace(/\r/g, '').split('\n\n');
          buffer = chunks.pop() ?? '';

          for (const chunk of chunks) {
            const lines = chunk.split('\n');
            let eventName = '';

            for (const line of lines) {
              if (line.startsWith('event:')) {
                eventName = line.slice(6).trim();
              }
            }

            if (eventName === 'notification-changed') {
              scheduleRefreshFromStream();
            }
          }
        }
      } catch (error) {
        if (controller.signal.aborted || disposed) return;
      } finally {
        if (streamAbortRef.current === controller) {
          streamAbortRef.current = null;
        }

        if (!disposed && mountedRef.current && shouldReconnect) {
          reconnectTimerRef.current = window.setTimeout(connect, STREAM_RECONNECT_DELAY_MS);
        }
      }
    };

    connect();

    return () => {
      disposed = true;

      if (streamAbortRef.current) {
        streamAbortRef.current.abort();
        streamAbortRef.current = null;
      }

      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [enabled, fetchUnreadCount, scheduleRefreshFromStream]);

  useEffect(() => {
    if (!enabled) return;

    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }

    setCurrentPage(0);
  }, [activeFilter, enabled]);

  useEffect(() => {
    if (!enabled || !isOpen) return;
    fetchNotifications(activeFilter, currentPage);
  }, [activeFilter, currentPage, enabled, fetchNotifications, isOpen]);

  const unreadItemsInView = useMemo(
    () => notifications.filter((item) => item.isRead === false).length,
    [notifications],
  );

  return {
    activeFilter,
    setActiveFilter,
    notifications,
    unreadCount,
    unreadItemsInView,
    loadingList,
    loadingCount,
    actionLoading,
    error,
    currentPage,
    pagination,
    deletingId,
    goToPage,
    refresh,
    fetchUnreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteNotifications,
  };
}