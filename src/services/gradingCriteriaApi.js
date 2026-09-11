import axiosClient from './axiosClient';

/**
 * Grading Criteria API — structural OOP criteria per question.
 * Endpoint base: /api/exams/{examId}/questions/{questionId}/grading-criteria
 *
 * GradingCriteriaResponse shape:
 *   { criteriaId, criteriaCode, criteriaGroup, criterionType,
 *     description, maxScore, checkParamsJson, displayOrder, createdAt }
 */
const gradingCriteriaApi = {
  /**
   * GET /api/exams/{examId}/questions/{questionId}/grading-criteria
   * Lấy danh sách tiêu chí cho 1 câu hỏi.
   */
  listByQuestion: (examId, questionId) =>
    axiosClient.get(`/exams/${examId}/questions/${questionId}/grading-criteria`),

  /**
   * POST /api/exams/{examId}/questions/{questionId}/grading-criteria
   * Tạo tiêu chí mới.
   */
  create: (examId, questionId, body) =>
    axiosClient.post(`/exams/${examId}/questions/${questionId}/grading-criteria`, body),

  /**
   * PUT /api/exams/{examId}/questions/{questionId}/grading-criteria/{criteriaId}
   * Cập nhật tiêu chí.
   */
  update: (examId, questionId, criteriaId, body) =>
    axiosClient.put(
      `/exams/${examId}/questions/${questionId}/grading-criteria/${criteriaId}`,
      body
    ),

  /**
   * DELETE /api/exams/{examId}/questions/{questionId}/grading-criteria/{criteriaId}
   */
  delete: (examId, questionId, criteriaId) =>
    axiosClient.delete(
      `/exams/${examId}/questions/${questionId}/grading-criteria/${criteriaId}`
    ),

  /**
   * PUT /api/exams/{examId}/questions/{questionId}/grading-criteria/batch
   * Lưu toàn bộ danh sách tiêu chí (replace all).
   */
  saveBatch: (examId, questionId, criteriaList) =>
    axiosClient.put(
      `/exams/${examId}/questions/${questionId}/grading-criteria/batch`,
      criteriaList
    ),
};

export default gradingCriteriaApi;
