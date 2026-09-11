import React, { useState } from 'react';
import { updateSystemPassThreshold } from '../services/adminApi';

const useUpdatePassThreshold = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updatedThreshold, setUpdatedThreshold] = useState(null);

  const callUpdatePassThresholdEndpoint = async ({ passThreshold }) => {
    setLoading(true);
    setError(null);

    try {
      const res = await updateSystemPassThreshold({ passThreshold });
      setUpdatedThreshold(res.data);
      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    callUpdatePassThresholdEndpoint,
    updatedThreshold,
    loading,
    error,
  };
};

export default useUpdatePassThreshold;
