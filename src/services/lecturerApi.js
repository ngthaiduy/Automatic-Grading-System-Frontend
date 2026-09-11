import axiosClient from './axiosClient';

const cleanParams = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );

export const getLecturerDashboardOverview = () =>
  axiosClient.get('/lecturer/dashboard/overview');

export const getLecturerDashboardAssignedAppeals = ({ limit = 5, status } = {}) =>
  axiosClient.get('/lecturer/dashboard/assigned-appeals', {
    params: cleanParams({ limit, status }),
  });

export const getLecturerDashboardUpcomingDeadlines = ({ limit = 5 } = {}) =>
  axiosClient.get('/lecturer/dashboard/upcoming-deadlines', {
    params: cleanParams({ limit }),
  });

export const getLecturerDashboardReviewStats = () =>
  axiosClient.get('/lecturer/dashboard/review-stats');

export const getLecturerAppeals = ({
  status,
  keyword,
  page = 0,
  size = 10,
} = {}) =>
  axiosClient.get('/lecturer/appeals', {
    params: cleanParams({ status, keyword, page, size }),
  });

export const getLecturerAppealById = (appealId) =>
  axiosClient.get(`/lecturer/appeals/${appealId}`);

export const submitLecturerAppealReview = (appealId, payload) =>
  axiosClient.put(`/lecturer/appeals/${appealId}/review`, payload);

export const downloadLecturerAppealSubmission = (appealId) =>
  axiosClient.get(`/lecturer/appeals/${appealId}/download`, {
    responseType: 'blob',
  });
