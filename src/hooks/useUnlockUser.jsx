import React, { useState } from 'react';
import { unlockUser } from '../services/adminApi';

const useUnlockUser = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callUnlockUserEndpoint = async (userId) => {
    if (!userId) return null;
    setLoading(true);
    setError(null);

    try {
      const res = await unlockUser(userId);
      const isSuccess = res?.success === true;

      if (!isSuccess) {
        const err = new Error(res?.message ?? 'Mở khóa tài khoản thất bại.');
        err.response = { data: res };
        throw err;
      }

      return true;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    callUnlockUserEndpoint,
    loading,
    error,
  };
};

export default useUnlockUser;
