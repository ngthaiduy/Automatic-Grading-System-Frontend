import axiosClient from './axiosClient';

/**
 * ExamPaper API service — nested resource under Exams → Blocks.
 * Endpoint base: /api/exams/{examId}/blocks/{blockId}/exam-paper
 *
 * ExamPaperResponse shape:
 *   { examPaperId, blockId, fileName, fileSizeBytes, totalQuestions,
 *     totalTestCases, uploadedAt, questions: [...] }
 */
const examPaperApi = {
  /**
   * POST /api/exams/{examId}/blocks/{blockId}/exam-paper
   * Upload đề thi (.zip/.rar). Nếu đã có sẽ tự ghi đè (BR-09).
   * @param {string} examId
   * @param {string} blockId
   * @param {File}   file — file .zip hoặc .rar
   * @param {function} onUploadProgress — callback(percent)
   */
  upload: (examId, blockId, file, onUploadProgress, examCode) => {
    const formData = new FormData();
    formData.append('file', file);
    if (examCode && examCode.trim()) {
      formData.append('examCode', examCode.trim());
    }
    return axiosClient.post(
      `/exams/${examId}/blocks/${blockId}/exam-paper`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (onUploadProgress && e.total) {
            onUploadProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      }
    );
  },

  /**
   * GET /api/exams/{examId}/blocks/{blockId}/exam-paper
   * Lấy metadata + câu hỏi + test cases của đề thi.
   */
  getByBlock: (examId, blockId) =>
    axiosClient.get(`/exams/${examId}/blocks/${blockId}/exam-paper`),

  /**
   * DELETE /api/exams/{examId}/blocks/{blockId}/exam-paper
   * Xóa đề thi — thất bại nếu SV đã nộp bài (BR-11).
   */
  deleteByBlock: (examId, blockId) =>
    axiosClient.delete(`/exams/${examId}/blocks/${blockId}/exam-paper`),

  /**
   * GET /api/exams/{examId}/blocks/{blockId}/exam-paper/download
   * Download file gốc dạng binary stream.
   */
  download: (examId, blockId) =>
    axiosClient.get(`/exams/${examId}/blocks/${blockId}/exam-paper/download`, {
      responseType: 'blob',
    }),
};

export default examPaperApi;
