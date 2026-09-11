import React, { useState } from 'react';
import { updateSystemConfig } from '../services/adminApi';

const useUpdateSystemConfig = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updatedConfig, setUpdatedConfig] = useState(null);

  const callUpdateSystemConfigEndpoint = async ({
    maxUploadSizeMb,
    maxExamPaperMb,
    defaultGradingMode,
  }) => {
    setLoading(true);
    setError(null);

    try {
      const res = await updateSystemConfig({
        maxUploadSizeMb,
        maxExamPaperMb,
        defaultGradingMode,
      });
      setUpdatedConfig(res.data);
      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    callUpdateSystemConfigEndpoint,
    updatedConfig,
    loading,
    error,
  };
};

export default useUpdateSystemConfig;
