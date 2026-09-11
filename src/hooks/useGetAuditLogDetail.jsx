import React, { useState } from 'react';
import { getAdminAuditLogById } from '../services/adminApi';

const useGetAuditLogDetail = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detail, setDetail] = useState(null);

  const callGetAuditLogDetailEndpoint = async (auditLogId) => {
    if (!auditLogId) return null;
    setLoading(true);
    setError(null);

    try {
      const res = await getAdminAuditLogById(auditLogId);
      // axiosClient returns API body { success, message, data: { ...log } }
      setDetail(res?.data ?? null);
      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    callGetAuditLogDetailEndpoint,
    detail,
    loading,
    error,
  };
};

export default useGetAuditLogDetail;
