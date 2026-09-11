import axiosClient from './axiosClient';

const APPEAL_BASE = '/v1/student/appeals';

const appealApi = {
  getMyAppeals: () => axiosClient.get(APPEAL_BASE),
  createAppeal: (payload) => axiosClient.post(APPEAL_BASE, payload),
};

export default appealApi;
