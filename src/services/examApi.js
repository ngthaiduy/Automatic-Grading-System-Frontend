import axiosClient from './axiosClient';

/**
 * Exam API service — tất cả calls đều tự gắn Bearer token qua axiosClient interceptor.
 * Response shape từ backend: { success, message, data, errors }
 * axiosClient trả về res.data nên caller nhận được object trên trực tiếp.
 */
const examApi = {
  /**
   * Lấy danh sách kỳ thi có phân trang + tìm kiếm + lọc.
   *
   * GET /api/exams?page=0&size=20&sort=createdAt,desc&name=...&semester=...&academicYear=...
   *
   * @param {object} params - query params
   * @param {number} [params.page=0]
   * @param {number} [params.size=20]
   * @param {string} [params.sort='createdAt,desc']
   * @param {string} [params.name]         - tìm theo tên (contains, ignore-case)
   * @param {string} [params.semester]     - lọc theo học kỳ (SP/SU/FA, contains)
   * @param {string} [params.academicYear] - lọc theo năm (contains, e.g. '2026')
   * @returns {Promise<{ success, message, data: { content, currentPage, totalItems, totalPages, pageSize, isLast } }>}
   */
  getAll: (params = {}) => axiosClient.get('/exams', { params }),

  /**
   * Lấy chi tiết một kỳ thi theo UUID.
   * GET /api/exams/{examId}
   */
  getById: (examId) => axiosClient.get(`/exams/${examId}`),

  /**
   * Tạo kỳ thi mới.
   * POST /api/exams
   * @param {object} body - CreateExamRequest
   */
  create: (body) => axiosClient.post('/exams', body),

  /**
   * Cập nhật kỳ thi.
   * PUT /api/exams/{examId}
   * @param {string} examId
   * @param {object} body - UpdateExamRequest
   */
  update: (examId, body) => axiosClient.put(`/exams/${examId}`, body),

  /**
   * Soft-delete kỳ thi.
   * DELETE /api/exams/{examId}
   */
  delete: (examId) => axiosClient.delete(`/exams/${examId}`),
};

export default examApi;
