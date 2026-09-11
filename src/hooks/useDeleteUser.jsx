import React, { useState } from 'react';
import { deleteUser } from '../services/adminApi';

const useDeleteUser = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletedUser, setDeletedUser] = useState(null);

  const callDeleteUserEndpoint = async (userId) => {
    if (!userId) return null;
    setLoading(true);
    setError(null);

    try {
      const res = await deleteUser(userId);
      const isSuccess = res?.success === true;

      if (!isSuccess) {
        const err = new Error(res?.message ?? 'Khóa tài khoản thất bại.');
        err.response = { data: res };
        throw err;
      }

      setDeletedUser(res?.data ?? null);
      return true;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    callDeleteUserEndpoint,
    deletedUser,
    loading,
    error,
  };
};

export default useDeleteUser;
