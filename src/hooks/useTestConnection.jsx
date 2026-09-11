import React, { useState } from 'react';
import { testAIConnection } from '../services/adminApi';

const useTestConnection = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const callTestConnectionEndpoint = async ({ provider, model, apiKey }) => {
    setLoading(true);
    setError(null);

    try {
      const res = await testAIConnection({ provider, model, apiKey });
      setResult(res.data);
      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    callTestConnectionEndpoint,
    result,
    loading,
    error,
  };
};

export default useTestConnection;
