import { useState, useCallback } from 'react';
import { getStaffAppealById } from '../services/staffApi';

/**
 * Staff appeal detail (GET /staff/appeals/:appealId).
 * Axios interceptor returns { success, message, data: StaffAppealDetailResponse }.
 */
const useStaffAppealDetail = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const fetchStaffAppealDetail = useCallback(async (appealId) => {
    if (!appealId) {
      setData(null);
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getStaffAppealById(appealId);
      setData(res?.data ?? null);
      return res;
    } catch (err) {
      setError(err);
      setData(null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    fetchStaffAppealDetail,
    data,
    loading,
    error,
  };
};

export default useStaffAppealDetail;
