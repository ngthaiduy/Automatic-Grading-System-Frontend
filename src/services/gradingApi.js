import axiosClient from './axiosClient';

/**
 * Grading API service — endpoints chấm bài.
 * Authorization: STUDENT (my-result, submission detail), EXAM_STAFF / SYSTEM_ADMIN (trigger, list).
 */
const gradingApi = {
  /**
   * Trigger grading for all submissions or selected submissions in a block.
   * POST /api/exams/{examId}/blocks/{blockId}/grading/trigger
   *
   * @param {string} examId
   * @param {string} blockId
   * @param {{ blockId: string, submissionIds?: string[] | null }} body
   */
  triggerGrading: (examId, blockId, body) =>
    axiosClient.post(`/exams/${examId}/blocks/${blockId}/grading/trigger`, body),

  /**
   * Trigger grading for a single submission (chấm lại 1 bài).
   * POST /api/exams/{examId}/blocks/{blockId}/grading/trigger/{submissionId}
   */
  triggerSingleGrading: (examId, blockId, submissionId) =>
    axiosClient.post(`/exams/${examId}/blocks/${blockId}/grading/trigger/${submissionId}`),

  /**
   * Stop grading process for a block.
   * POST /api/exams/{examId}/blocks/{blockId}/grading/stop
   *
   * @param {string} examId
   * @param {string} blockId
   */
  stopGrading: (examId, blockId) =>
    axiosClient.post(`/exams/${examId}/blocks/${blockId}/grading/stop`),

  /**
   * Lấy kết quả chấm bài của sinh viên hiện tại cho một block.
   * GET /api/exams/{examId}/blocks/{blockId}/grading/my-result
   *
   * @param {string} examId
   * @param {string} blockId
   * @returns {Promise<{ success, message, data: GradingResultResponse }>}
   */
  getMyResult: (examId, blockId) =>
    axiosClient.get(`/exams/${examId}/blocks/${blockId}/grading/my-result`),

  /**
   * Lấy tiến độ chấm bài của block (EXAM_STAFF / SYSTEM_ADMIN).
   * GET /api/exams/{examId}/blocks/{blockId}/grading/progress
   *
   * Response shape: { blockId, totalSubmissions, gradedCount, gradingCount, pendingCount, status, progressPercent }
   *
   * @param {string} examId
   * @param {string} blockId
   */
  getProgress: (examId, blockId) =>
    axiosClient.get(`/exams/${examId}/blocks/${blockId}/grading/progress`),

  /**
   * Lấy kết quả chi tiết của một submission.
   * GET /api/submissions/{submissionId}/grading-result
   *
   * @param {string} submissionId
   * @returns {Promise<{ success, message, data: GradingResultResponse }>}
   */
  getSubmissionResult: (submissionId) =>
    axiosClient.get(`/submissions/${submissionId}/grading-result`),

  /**
   * Lấy danh sách toàn bộ kết quả chấm bài trong một block (EXAM_STAFF / SYSTEM_ADMIN).
   * GET /api/exams/{examId}/blocks/{blockId}/grading/results
   *
   * @param {string} examId
   * @param {string} blockId
   * @returns {Promise<{ success, message, data: GradingResultResponse[] }>}
   */
  getBlockResults: (examId, blockId) =>
    axiosClient.get(`/exams/${examId}/blocks/${blockId}/grading/results`),
};

export default gradingApi;
