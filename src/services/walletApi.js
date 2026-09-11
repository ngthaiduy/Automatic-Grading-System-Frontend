import axiosClient from './axiosClient';

const WALLET_BASE = '/v1/student/wallet';

const walletApi = {
  getMyWallet: () => axiosClient.get(WALLET_BASE),
  getMyWithdrawals: () => axiosClient.get(`${WALLET_BASE}/withdrawals`),
  createWithdrawal: (payload) => axiosClient.post(`${WALLET_BASE}/withdraw`, payload),
  createDeposit: (payload) => axiosClient.post(`${WALLET_BASE}/deposit`, payload),
  getBanks: () => axiosClient.get(`${WALLET_BASE}/banks`),
};

export default walletApi;
