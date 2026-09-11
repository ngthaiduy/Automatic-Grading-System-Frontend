import React, { useState } from 'react';
import { getAdminAuditLogs } from '../services/adminApi';

const useGetAuditLogs = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const callGetAuditLogsEndpoint = async ({
    action,
    entityType,
    userId,
    from,
    to,
    page,
    size,
  }) => {
    setLoading(true);
    setError(null);

    try {
      const res = await getAdminAuditLogs({
        action,
        entityType,
        userId,
        from,
        to,
        page,
        size,
      });
      setData(res.data);
      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    callGetAuditLogsEndpoint,
    data,
    loading,
    error,
  };
};

export default useGetAuditLogs;
