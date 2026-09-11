import axiosClient from './axiosClient';

/**
 * DEV NOTE:
 * Keep all notification endpoint calls in one place so validation and
 * request normalization are consistent across the app.
 */

const ALLOWED_FILTERS = ['all', 'unread', 'read'];

function normalizeFilter(filter) {
  if (typeof filter !== 'string') return 'all';

  const normalized = filter.trim().toLowerCase();
  return ALLOWED_FILTERS.includes(normalized) ? normalized : 'all';
}

function assertValidNotificationId(notificationId) {
  if (typeof notificationId !== 'string' || !notificationId.trim()) {
    throw new Error('Invalid notificationId');
  }
}

function normalizePage(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function normalizeSize(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 10;
  return Math.min(100, Math.max(1, Math.floor(parsed)));
}

const notificationApi = {
  getAll: (params = {}) => {
    const safeFilter = normalizeFilter(params?.filter);
    const page = normalizePage(params?.page);
    const size = normalizeSize(params?.size);

    return axiosClient.get('/notifications', {
      params: { filter: safeFilter, page, size },
    });
  },

  getUnreadCount: () => axiosClient.get('/notifications/unread-count'),

  markAsRead: (notificationId) => {
    assertValidNotificationId(notificationId);
    return axiosClient.put(`/notifications/${notificationId}/read`);
  },

  markAllAsRead: () => axiosClient.put('/notifications/read-all'),

  deleteOne: (notificationId) => {
    assertValidNotificationId(notificationId);
    return axiosClient.delete(`/notifications/${notificationId}`);
  },
};

export { ALLOWED_FILTERS, normalizeFilter };
export default notificationApi;