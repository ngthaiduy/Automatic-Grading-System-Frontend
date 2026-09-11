import { ROLE_HOME_MAP } from '../../constants/routes';

export const NOTIFICATION_FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'unread', label: 'Chưa đọc' },
  { key: 'read', label: 'Đã đọc' },
];

export const normalizeRole = (role) =>
  typeof role === 'string' ? role.trim().toUpperCase() : '';

function isValidDate(value) {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function safeString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function safeBoolean(value, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function safeUuidLike(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/**
 * DEV NOTE:
 * Normalize 1 notification item from backend into a safe UI shape.
 * This prevents rendering crashes if any field is null, undefined, or malformed.
 */
export function normalizeNotification(raw, index = 0) {
  const notificationId =
    safeUuidLike(raw?.notificationId) ??
    safeUuidLike(raw?.notificationid) ??
    `notification-fallback-${index}`;

  const title = safeString(raw?.title, 'Thông báo hệ thống');
  const body = safeString(raw?.body, 'Không có nội dung chi tiết.');
  const relatedEntityType = safeString(
    raw?.relatedEntityType ?? raw?.relatedentitytype,
    '',
  );
  const relatedEntityId =
    safeUuidLike(raw?.relatedEntityId) ??
    safeUuidLike(raw?.relatedentityid);

  const createdAt = isValidDate(raw?.createdAt ?? raw?.createdat)
    ? (raw?.createdAt ?? raw?.createdat)
    : new Date().toISOString();

  const readAt = isValidDate(raw?.readAt ?? raw?.readat)
    ? (raw?.readAt ?? raw?.readat)
    : null;

  return {
    notificationId,
    title,
    body,
    relatedEntityType,
    relatedEntityId,
    isRead: safeBoolean(raw?.isRead ?? raw?.isread, false),
    createdAt,
    readAt,
    type: safeString(raw?.type, 'IN_APP'),
  };
}

/**
 * Normalize backend payload into a clean array for the UI.
 */
export function normalizeNotificationList(payload) {
  if (!Array.isArray(payload)) return [];

  const seen = new Set();

  return payload
    .map((item, index) => normalizeNotification(item, index))
    .filter((item) => {
      if (seen.has(item.notificationId)) return false;
      seen.add(item.notificationId);
      return true;
    });
}

/**
 * Parse unread count safely from backend payload.
 */
export function normalizeUnreadCount(payload) {
  const rawCount =
    payload?.unreadCount ??
    payload?.unreadcount ??
    payload?.count ??
    0;

  const parsed = Number(rawCount);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

/**
 * Format notification time in a friendly way for Vietnamese users.
 */
export function formatRelativeTime(isoString) {
  if (!isValidDate(isoString)) return 'Vừa xong';

  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(date);
}

/**
 * Resolve the best route the user should land on when clicking a notification.
 * Always fallback to role home to avoid navigating into invalid routes.
 */
export function resolveNotificationTarget({ notification, role }) {
  const roleKey = normalizeRole(role);
  const home = ROLE_HOME_MAP[roleKey] ?? '/';

  const type = safeString(notification?.relatedEntityType, '').toUpperCase();
  const id = safeUuidLike(notification?.relatedEntityId);

  if (!id) return home;

  switch (type) {
    case 'EXAM':
      if (roleKey === 'EXAM_STAFF') return `/exam-staff/exams/${id}`;
      return home;

    case 'SUBMISSION':
    case 'GRADING_RESULT':
      if (roleKey === 'STUDENT') return `/student/results/${id}`;
      return home;

    case 'PAYMENT':
    case 'APPEAL':
    default:
      return home;
  }
}

function safeNonNegativeInt(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.floor(parsed));
}

/**
 * Normalize notification payload from backend.
 * Supports:
 * - legacy: data = Notification[]
 * - paged:  data = { items: Notification[], pagination: {...} }
 */
export function normalizeNotificationPayload(payload, fallback = {}) {
  const fallbackPage = safeNonNegativeInt(fallback?.page, 0);
  const fallbackSize = Math.max(1, safeNonNegativeInt(fallback?.size, 10));

  // Legacy shape (array only)
  if (Array.isArray(payload)) {
    const items = normalizeNotificationList(payload);
    const totalElements = items.length;

    return {
      items,
      pagination: {
        page: fallbackPage,
        size: fallbackSize,
        totalElements,
        totalPages: totalElements > 0 ? 1 : 0,
        isLast: true,
      },
    };
  }

  const rawItems = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.content)
      ? payload.content
      : [];

  const items = normalizeNotificationList(rawItems);
  const rawPagination = payload?.pagination ?? payload ?? {};

  const page = safeNonNegativeInt(rawPagination?.page, fallbackPage);
  const size = Math.max(1, safeNonNegativeInt(rawPagination?.size, fallbackSize));
  const totalElements = safeNonNegativeInt(rawPagination?.totalElements, items.length);
  const totalPages = safeNonNegativeInt(
    rawPagination?.totalPages,
    totalElements > 0 ? Math.ceil(totalElements / size) : 0,
  );
  const isLast =
    typeof rawPagination?.isLast === 'boolean'
      ? rawPagination.isLast
      : totalPages === 0 || page >= totalPages - 1;

  return {
    items,
    pagination: {
      page,
      size,
      totalElements,
      totalPages,
      isLast,
    },
  };
}