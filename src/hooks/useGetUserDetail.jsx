import React, { useState } from 'react';
import { getUserDetail } from '../services/adminApi';

const useGetUserDetail = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userDetail, setUserDetail] = useState(null);

  const fetchUserDetail = async (userId) => {
    if (!userId) return null;
    setLoading(true);
    setError(null);

    try {
      const res = await getUserDetail(userId);
      setUserDetail(res.data);
      return res.data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchUserDetail,
    loading,
    error,
    userDetail,
  };
};

export default useGetUserDetail;
