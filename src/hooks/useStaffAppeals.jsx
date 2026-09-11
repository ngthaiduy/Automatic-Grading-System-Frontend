import { useState, useCallback } from 'react';
import { getStaffAppeals } from '../services/staffApi';

/**
 * Staff appeals list (GET /staff/appeals).
 * Response body is { success, message, data: StaffAppealPageResponse } after axios interceptor.
 */
const useStaffAppeals = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const fetchStaffAppeals = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStaffAppeals(params);
      setData(res?.data ?? null);
      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    fetchStaffAppeals,
    data,
    loading,
    error,
  };
};

export default useStaffAppeals;
