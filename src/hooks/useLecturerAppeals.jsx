import { useCallback, useEffect, useState } from 'react';
import { getLecturerAppeals } from '../services/lecturerApi';

export default function useLecturerAppeals(params) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLecturerAppeals = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getLecturerAppeals(params);
      setData(response?.data ?? null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchLecturerAppeals();
  }, [fetchLecturerAppeals]);

  return {
    data,
    loading,
    error,
    refresh: fetchLecturerAppeals,
  };
}
