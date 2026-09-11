import axiosClient from './axiosClient';

/**
 * Submission API service — Nested under /api/exams/{examId}/blocks/{blockId}/submission.
 * Authorization: STUDENT (POST, GET), EXAM_STAFF / SYSTEM_ADMIN (GET, Download).
 */
const submissionApi = {
  /**
   * Lấy thông tin bài nộp của sinh viên hiện tại cho một block.
   * GET /api/exams/{examId}/blocks/{blockId}/submission
   *
   * @param {string} examId  - UUID của kỳ thi
   * @param {string} blockId - UUID của block
   * @returns {Promise<{ success, message, data: SubmissionResponse }>}
   */
  getMySubmission: (examId, blockId) =>
    axiosClient.get(`/exams/${examId}/blocks/${blockId}/submission`),

  /**
   * Nộp bài (submit hoặc resubmit).
   * POST /api/exams/{examId}/blocks/{blockId}/submission
   *
   * @param {string} examId  - UUID của kỳ thi
   * @param {string} blockId - UUID của block
   * @param {File}   file    - File .zip hoặc .rar của bài nộp
   * @returns {Promise<{ success, message, data: SubmissionResponse }>}
   */
  submit: (examId, blockId, file) => {
    const form = new FormData();
    form.append('file', file);
    return axiosClient.post(`/exams/${examId}/blocks/${blockId}/submission`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Download file bài nộp của sinh viên hiện tại.
   * GET /api/exams/{examId}/blocks/{blockId}/submission/download
   *
   * @param {string} examId  - UUID của kỳ thi
   * @param {string} blockId - UUID của block
   * @returns {Promise<Blob>}
   */
  download: (examId, blockId) =>
    axiosClient.get(`/exams/${examId}/blocks/${blockId}/submission/download`, {
      responseType: 'blob',
    }),

  /**
   * Lấy toàn bộ danh sách bài nộp của một block (EXAM_STAFF / SYSTEM_ADMIN) có phân trang.
   * GET /api/exams/{examId}/blocks/{blockId}/submissions
   *
   * @param {string} examId
   * @param {string} blockId
   * @param {Object} params  - { page=0, size=20, search='', status='' }
   * @returns {Promise<{ success, message, data: SubmissionListItemResponse[], pagination }>}
   */
  getBlockSubmissions: (examId, blockId, params = {}) =>
    axiosClient.get(`/exams/${examId}/blocks/${blockId}/submissions`, { params }),

  /**
   * Lấy toàn bộ danh sách Block kèm thông tin Exam trong 1 lần gọi (dành cho Staff).
   * GET /api/staff/blocks
   *
   * @returns {Promise<{ success, message, data: BlockWithExamResponse[] }>}
   */
  getStaffBlocks: () =>
    axiosClient.get('/staff/blocks'),

  /**
   * Lấy metadata của một bài nộp theo submissionId (không cần examId/blockId).
   * GET /api/submissions/{submissionId}
   *
   * @param {string} submissionId - UUID của bài nộp
   * @returns {Promise<{ success, message, data: SubmissionResponse }>}
   */
  getSubmissionById: (submissionId) =>
    axiosClient.get(`/submissions/${submissionId}`),
};


export default submissionApi;
