import axiosClient from './axiosClient';

/**
 * Config API — các endpoint public mà STUDENT được phép gọi để lấy cấu hình hệ thống.
 */
const configApi = {
  /**
   * Lấy System Settings (bao gồm maxUploadSizeMb).
   * GET /api/admin/config/system
   * Authorization: SYSTEM_ADMIN / ADMIN
   * → Được dùng ở trang student để hiển thị giới hạn upload file.
   *
   * Response shape: { success, message, data: { maxUploadSizeMb, maxExamPaperMb, ... } }
   */
  getSystemSettings: () => axiosClient.get('/admin/config/public'),
};

export default configApi;
