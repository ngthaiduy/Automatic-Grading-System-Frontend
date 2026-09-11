import React, { useState } from 'react';
import { editUserDetail } from '../services/adminApi';

const useEditDetail = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editedUser, setEditedUser] = useState(null);

  const callEditUserEndpoint = async ({
    userId,
    fullName,
    email,
    username,
    mssv,
    phone,
    roleName,
  }) => {
    setLoading(true);
    setError(null);

    try {
      const res = await editUserDetail({
        userId,
        fullName,
        email,
        username,
        mssv,
        phone,
        roleName,
      });
      setEditedUser(res.data);

      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    callEditUserEndpoint,
    editedUser,
    loading,
    error,
  };
};

export default useEditDetail;
