import axiosClient from './axiosClient';

/**
 * Block API service — nested resource under Exams.
 * Endpoint base: /api/exams/{examId}/blocks
 *
 * BlockResponse shape:
 *   { blockId, examId, name, description, examDate, startTime, endTime, createdAt, hasPaper }
 */
const blockApi = {
  /**
   * GET /api/exams/{examId}/blocks
   * Lấy danh sách tất cả block (đợt thi) của một kỳ thi.
   */
  getByExam: (examId) => axiosClient.get(`/exams/${examId}/blocks`),

  /**
   * GET /api/staff/blocks
   * Lấy toàn bộ block trên hệ thống kèm thông tin exam để staff validate lịch.
   */
  getAllForStaff: () => axiosClient.get('/staff/blocks'),

  /**
   * GET /api/exams/{examId}/blocks/{blockId}
   * Lấy chi tiết một block.
   */
  getById: (examId, blockId) => axiosClient.get(`/exams/${examId}/blocks/${blockId}`),

  /**
   * POST /api/exams/{examId}/blocks
   * Tạo đợt thi mới trong kỳ thi.
   * @param {string} examId
   * @param {object} body - { name: string, description?: string }
   */
  create: (examId, body) => axiosClient.post(`/exams/${examId}/blocks`, body),

  /**
   * PUT /api/exams/{examId}/blocks/{blockId}
   * Cập nhật lịch thi của block (examDate, startTime, endTime).
   * @param {string} examId
   * @param {string} blockId
   * @param {object} body - { examDate: 'YYYY-MM-DD', startTime: ISO, endTime: ISO }
   */
  update: (examId, blockId, body) => axiosClient.put(`/exams/${examId}/blocks/${blockId}`, body),

  /**
   * DELETE /api/exams/{examId}/blocks/{blockId}
   * Xóa một đợt thi.
   * @param {string} examId
   * @param {string} blockId
   */
  delete: (examId, blockId) => axiosClient.delete(`/exams/${examId}/blocks/${blockId}`),
};

export default blockApi;
