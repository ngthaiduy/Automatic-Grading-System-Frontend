import React, { useState } from 'react';
import { getApiConfig } from '../services/adminApi';

const useGetAIConfig = () => {
  const [loading, setLoading] = useState();
  const [error, setError] = useState(null);
  const [config, setConfig] = useState(null);

  const callGetAIConfigEndpoint = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getApiConfig();

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
    callGetAIConfigEndpoint,
    config,
    loading,
    error,
  };
};

export default useGetAIConfig;
