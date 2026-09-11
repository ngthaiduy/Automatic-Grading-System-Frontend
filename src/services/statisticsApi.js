import axiosClient from './axiosClient';

const statisticsApi = {
  getBlockStatistics: (examId, blockId) =>
    axiosClient.get(`/exams/${examId}/blocks/${blockId}/statistics`),

  exportStatisticsReport: (examId, blockId) =>
    axiosClient.get(`/exams/${examId}/blocks/${blockId}/export/statistics-report`, {
      responseType: 'blob',
    }),
};

export default statisticsApi;
