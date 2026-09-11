import React, { useState } from 'react';
import { getSystemGradingModes } from '../services/adminApi';

const useGetSystemGradingModes = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const callGetSystemGradingModesEndpoint = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getSystemGradingModes();
      setData(res.data);
      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    callGetSystemGradingModesEndpoint,
    data,
    loading,
    error,
  };
};

export default useGetSystemGradingModes;

