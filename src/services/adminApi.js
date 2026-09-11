import axiosClient from './axiosClient';

const importExcel = (file) => {
  const formData = new FormData();

  formData.append('file', file);

  const res = axiosClient.post('/admin/users/import-excel', formData);
  return res;
};

const createUser = ({ roleName, email, fullName, mssv }) => {
  return axiosClient.post('/admin/users/create', {
    roleName,
    email,
    fullName,
    mssv,
  });
};

const getAllUsers = ({ page, size, sort, search, roleName }) => {
  const res = axiosClient.get('/admin/users', {
    params: {
      page,
      size,
      sort,
      search,
      roleName,
    },
  });

  return res;
};

const getUserDetail = (userId) => {
  return axiosClient.get(`/admin/users/${userId}`);
};

const editUserDetail = ({
  userId,
  fullName,
  email,
  username,
  mssv,
  phone,
  roleName,
}) => {
  return axiosClient.put(`/admin/users/${userId}`, {
    fullName,
    email,
    username,
    mssv,
    phone,
    roleName,
  });
};

const deleteUser = (userId) => {
  return axiosClient.delete(`/admin/users/${userId}`);
};

const unlockUser = (userId) => {
  return axiosClient.patch(`/admin/users/${userId}/unlock`);
};

const getApiConfig = () => {
  return axiosClient.get('/admin/config/ai');
};

const updateAiConfig = ({ provider, model, apiKey, language }) => {
  return axiosClient.put('/admin/config/ai', {
    provider,
    model,
    apiKey,
    language,
  });
};

const testAIConnection = ({ provider, model, apiKey }) => {
  return axiosClient.post('/admin/config/ai/test-connection', {
    provider,
    model,
    apiKey,
  });
};

const getSystemConfig = () => {
  return axiosClient.get('/admin/config/system');
};

const getSystemGradingModes = () => {
  return axiosClient.get('/admin/config/grading-modes');
};

const getSystemGradingMode = (mode) => {
  return axiosClient.get(`/admin/config/grading-modes/${mode}`);
};

const createSystemGradingMode = (payload) => {
  return axiosClient.post('/admin/config/grading-modes', payload);
};

const updateSystemGradingMode = (mode, payload) => {
  return axiosClient.put(`/admin/config/grading-modes/${mode}`, payload);
};

const setDefaultGradingMode = (mode) => {
  return axiosClient.put(`/admin/config/grading-modes/${mode}/set-default`);
};

const updateSystemConfig = ({
  maxUploadSizeMb,
  maxExamPaperMb,
  defaultGradingMode,
}) => {
  return axiosClient.put('/admin/config/system', {
    maxUploadSizeMb,
    maxExamPaperMb,
    defaultGradingMode,
  });
};

const updateSystemPassThreshold = ({ passThreshold }) => {
  return axiosClient.put('/admin/config/system/pass-threshold', {
    passThreshold,
  });
};

const getAdminAuditLogs = ({
  action,
  entityType,
  userId,
  from,
  to,
  page = 0,
  size = 20,
} = {}) => {
  return axiosClient.get('/admin/audit-logs', {
    params: cleanParams({
      action,
      entityType,
      userId,
      from,
      to,
      page,
      size,
    }),
  });
};

const getAdminAuditLogById = (auditLogId) => {
  return axiosClient.get(`/admin/audit-logs/${auditLogId}`);
};

const cleanParams = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null),
  );

const getAdminDashboardOverview = ({ from, to } = {}) => {
  return axiosClient.get('/admin/dashboard/overview', {
    params: cleanParams({ from, to }),
  });
};

const getAdminDashboardUserStats = ({ from, to } = {}) => {
  return axiosClient.get('/admin/dashboard/user-stats', {
    params: cleanParams({ from, to }),
  });
};

const getAdminDashboardRecentActivities = ({ limit, from, to } = {}) => {
  return axiosClient.get('/admin/dashboard/recent-activities', {
    params: cleanParams({ limit, from, to }),
  });
};

const getAdminDashboardSystemHealth = () => {
  return axiosClient.get('/admin/dashboard/system-health');
};

const getAdminDashboardSystemActivity = ({ period } = {}) => {
  return axiosClient.get('/admin/dashboard/system-activity', {
    params: cleanParams({ period }),
  });
};

const getAdminPayments = ({ from, to, search, page = 0, size = 15 } = {}) => {
  return axiosClient.get('/admin/config/payments', {
    params: cleanParams({ from, to, search, page, size }),
  });
};

const getPayosConfig = () => {
  return axiosClient.get('/admin/config/payos');
};

const updatePayosConfig = ({ clientId, apiKey, checksumKey, appealFee, paymentTimeoutMin }) => {
  return axiosClient.put('/admin/config/payos', {
    clientId,
    apiKey,
    checksumKey,
    appealFee,
    paymentTimeoutMin,
  });
};

export {
  importExcel,
  createUser,
  getAllUsers,
  getUserDetail,
  deleteUser,
  unlockUser,
  editUserDetail,
  getApiConfig,
  updateAiConfig,
  testAIConnection,
  getSystemConfig,
  getSystemGradingModes,
  getSystemGradingMode,
  createSystemGradingMode,
  updateSystemGradingMode,
  setDefaultGradingMode,
  updateSystemConfig,
  updateSystemPassThreshold,
  getAdminAuditLogs,
  getAdminAuditLogById,
  getAdminDashboardOverview,
  getAdminDashboardUserStats,
  getAdminDashboardRecentActivities,
  getAdminDashboardSystemHealth,
  getAdminDashboardSystemActivity,
  getAdminPayments,
  getPayosConfig,
  updatePayosConfig,
};
