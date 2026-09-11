import React, { useState } from 'react';
import { createUser } from '../services/adminApi';

const useCreateUser = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdUser, setCreatedUser] = useState(null);

  const callCreateUserEndpoint = async ({ roleName, email, fullName, mssv }) => {
    setLoading(true);
    setError(null);

    try {
      const res = await createUser({ roleName, email, fullName, mssv });
      setCreatedUser(res?.data ?? res);
      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    callCreateUserEndpoint,
    createdUser,
    loading,
    error,
  };
};

export default useCreateUser;
