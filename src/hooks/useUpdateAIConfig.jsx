import React, { useState } from 'react';
import { updateAiConfig } from '../services/adminApi';

const useUpdateAIConfig = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editedConfig, setEditedConfig] = useState(null);

  const callEditAIConfigEndpoint = async ({
    provider,
    model,
    apiKey,
    language,
  }) => {
    setLoading(true);
    setError(null);

    try {
      const res = await updateAiConfig({ provider, model, apiKey, language });

      setEditedConfig(res.data);

      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    callEditAIConfigEndpoint,
    editedConfig,
    loading,
    error,
  };
};
export default useUpdateAIConfig;
