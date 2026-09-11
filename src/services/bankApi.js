import axios from 'axios';

export async function getVietnamBanks() {
  const response = await axios.get('https://api.vietqr.io/v2/banks', {
    timeout: 10000,
  });

  return Array.isArray(response?.data?.data) ? response.data.data : [];
}