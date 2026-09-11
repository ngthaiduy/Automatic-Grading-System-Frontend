import { useCallback, useEffect, useState } from 'react';
import { getLecturerAppealById } from '../services/lecturerApi';

export default function useLecturerAppealDetail(appealId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLecturerAppealDetail = useCallback(async () => {
    if (!appealId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getLecturerAppealById(appealId);
      setData(response?.data ?? null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [appealId]);

  useEffect(() => {
    fetchLecturerAppealDetail();
  }, [fetchLecturerAppealDetail]);

  return {
    data,
    loading,
    error,
    refresh: fetchLecturerAppealDetail,
    setData,
  };
}
