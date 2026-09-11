import React, { useState } from 'react';
import { getSystemConfig } from '../services/adminApi';

const useGetSystemConfig = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [config, setConfig] = useState(null);

  const callGetSystemConfigEndpoint = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getSystemConfig();
      setConfig(res.data);
      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    callGetSystemConfigEndpoint,
    config,
    loading,
    error,
  };
};

export default useGetSystemConfig;

