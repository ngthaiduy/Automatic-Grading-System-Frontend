import axios from "axios";

/**
 * Preconfigured Axios instance for all API calls.
 * - Base URL: http://localhost:8080/api
 * - Request interceptor: auto-attaches Bearer token from localStorage
 * - Response interceptor: on 401, attempts a silent token refresh then retries
 *   the original request once. On refresh failure, dispatches 'session-expired'
 *   event which AuthContext handles to logout + redirect to /login.
 */
const axiosClient = axios.create({
  // Đỏ nhưng mà xài dc
  baseURL: `${__BASE_URL__}`,
  // timeout: 10000,
  timeout: 30000,
  withCredentials: true,
});

// ── Centralized force logout: dispatch event → AuthContext handles the rest ──
// Dùng custom event thay vì xóa localStorage trực tiếp để đảm bảo React state
// (user) cũng được reset về null, không chỉ xóa localStorage.
let isSessionExpiredDispatched = false;

const dispatchSessionExpired = (message = "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.") => {
  if (isSessionExpiredDispatched) return;

  isSessionExpiredDispatched = true;
  window.dispatchEvent(new CustomEvent("session-expired", {
    detail: { message },
  }));
};

// ── Request interceptor: attach Access Token to every outgoing request ──
// Skip Authorization header for public auth endpoints (login, register, etc.)
const PUBLIC_AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/forgot-password",
  "/auth/reset-password", "/auth/verify-reset-token", "/auth/verify-account"];

axiosClient.interceptors.request.use((config) => {
  // Không cần add Authorization header vì token đã nằm trong HttpOnly Cookie
  // Thêm Cache-Control để tránh browser cache GET responses (quan trọng khi polling grading status)
  if (!config.method || config.method.toLowerCase() === 'get') {
    config.headers = config.headers || {};
    config.headers['Cache-Control'] = 'no-cache';
    config.headers['Pragma'] = 'no-cache';
  }
  return config;
});

// ── Response interceptor: silent Refresh Token rotation on 401 ──
axiosClient.interceptors.response.use(
  // Pass through successful responses (return res.data directly)
  (res) => res.data,

  async (err) => {
    const originalRequest = err.config;

    // Only attempt refresh if:
    //   1. The server returned 401 (Unauthorized)
    //   2. This request hasn't already been retried (avoid infinite loop)
    //   3. The failing request was NOT itself the refresh endpoint
    const is401 = err.response?.status === 401;
    const notRetried = !originalRequest._retry;
    const notRefreshEndpoint = !originalRequest.url?.includes("/auth/refresh");
    // Don't trigger refresh/redirect for public auth endpoints (login, register, etc.)
    const isPublicAuthPath = PUBLIC_AUTH_PATHS.some((path) => originalRequest.url?.includes(path));

    if (is401 && notRetried && notRefreshEndpoint && !isPublicAuthPath) {
      originalRequest._retry = true; // flag to prevent infinite retry loop

      try {
        // Call the refresh endpoint directly (bypass interceptor to avoid recursion)
        await axios.post(
          `${__BASE_URL__}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        // Backend automatically sets the new access token and refresh token in HttpOnly cookies
        // Retry the original request (browser will automatically include the new cookies)
        return axiosClient(originalRequest);
      } catch {
        // Refresh token không có, hết hạn hoặc bị thu hồi → dispatch event để AuthContext logout
        dispatchSessionExpired("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
        return Promise.reject(err);
      }
    }

    return Promise.reject(err);
  }
);

export default axiosClient;

