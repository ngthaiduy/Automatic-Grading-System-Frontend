import axiosClient from "./axiosClient";

/**
 * POST /api/auth/login
 */
export const loginApi = (username, password) =>
  axiosClient.post("/auth/login", { username, password });

/**
 * POST /api/auth/register
 * Đăng ký sinh viên. Backend tự derive và validate username + mssv từ email.
 * @param {{ fullName, email, username, mssv, password }} data
 */
export const registerApi = (data) =>
  axiosClient.post("/auth/register", data);

/**
 * POST /api/auth/forgot-password
 * Gửi link khôi phục mật khẩu vào email FPT.
 * @param {string} email
 */
export const forgotPasswordApi = (email) =>
  axiosClient.post("/auth/forgot-password", { email });

/**
 * GET /api/auth/verify-reset-token?token=<UUID>
 */
export const verifyResetTokenApi = (token) =>
  axiosClient.get(`/auth/verify-reset-token?token=${encodeURIComponent(token)}`);

/**
 * POST /api/auth/reset-password
 */
export const resetPasswordApi = (token, newPassword, confirmPassword) =>
  axiosClient.post("/auth/reset-password", { token, newPassword, confirmPassword });

/**
 * GET /api/auth/verify-account?token=<JWT>
 */
export const verifyAccountApi = (token) =>
  axiosClient.get(`/auth/verify-account?token=${encodeURIComponent(token)}`);
