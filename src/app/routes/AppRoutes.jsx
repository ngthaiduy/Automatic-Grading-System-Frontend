import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../../features/auth/Login.jsx';
import ForgotPassword from '../../features/auth/ForgotPassword.jsx';
import ResetPassword from '../../features/auth/ResetPassword.jsx';
import StudentDashboard from '../../features/student/StudentDashboard.jsx';
import StudentResultsPage from '../../features/student/StudentResultsPage.jsx';
import StudentResultDetailPage from '../../features/student/StudentResultDetailPage.jsx';
import SubmitCode from '../../features/submission/SubmitCode.jsx';
import LandingPage from '../../pages/LandingPage.jsx';
import ExamStaffDashboard from '../../features/exam-staff/ExamStaffDashboard.jsx';
import SystemAdminDashboard from '../../features/admin/SystemAdminDashboard.jsx';
import UserManagement from '../../features/admin/UserManagement.jsx';
import PayOSConfigurationPage from '../../features/admin/PayOSConfigurationPage.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import { ROLE_HOME_MAP } from '../../constants/routes.js';
import { useAuth } from '../context/authContext.js';
import VerifyAccount from '../../features/auth/VerifyAccount.jsx';
import UserDetail from '../../features/admin/UserDetail.jsx';
import SystemConfig from '../../features/admin/SystemConfig.jsx';
import GradingModeConfig from '../../features/admin/GradingModeConfig.jsx';
import AIConfig from '../../features/admin/AIConfig.jsx';
import AuditLogsPage from '../../features/admin/AuditLogsPage.jsx';
import AuditLogDetailPage from '../../features/admin/AuditLogDetailPage.jsx';
import AppealPage from '../../features/exam-staff/AppealPage.jsx';
import AppealDetailPage from '../../features/exam-staff/AppealDetailPage.jsx';
import WithdrawalManagementPage from '../../features/exam-staff/WithdrawalManagementPage.jsx';
import StudentNotificationsPage from '../../features/student/StudentNotificationsPage.jsx';

const LecturerLayout = lazy(() => import('../../components/layouts/lecturer'));
const LecturerDashboard = lazy(() => import('../../features/lecturer/LecturerDashboard.jsx'));
const LecturerAppealsPage = lazy(() => import('../../features/lecturer/appeals/pages/LecturerAppealsPage.jsx'));
const LecturerAppealReviewPage = lazy(() => import('../../features/lecturer/appeals/pages/LecturerAppealReviewPage.jsx'));
const LecturerAppealSubmittedPage = lazy(() => import('../../features/lecturer/appeals/pages/LecturerAppealSubmittedPage.jsx'));
const LecturerNotificationsPage = lazy(() => import('../../features/lecturer/notifications/pages/LecturerNotificationsPage.jsx'));
const StudentWalletPage = lazy(() => import('../../features/student/StudentWalletPage.jsx'));
const StudentWalletDepositQrPage = lazy(() => import('../../features/student/wallet/StudentWalletDepositQrPage.jsx'));
const StudentWalletDepositSuccessPage = lazy(() => import('../../features/student/wallet/StudentWalletDepositSuccessPage.jsx'));
const StudentAppealsPage = lazy(() => import('../../features/student/StudentAppealsPage.jsx'));
const StudentAppealCreatePage = lazy(() => import('../../features/student/StudentAppealCreatePage.jsx'));
const StudentAppealDetailPage = lazy(() => import('../../features/student/StudentAppealDetailPage.jsx'));

const normalizeRole = (role) =>
  typeof role === 'string' ? role.trim().toUpperCase() : '';

const getDefaultRoute = (user) => {
  const roleName = normalizeRole(user?.roleName);

  if (roleName && ROLE_HOME_MAP[roleName]) {
    return ROLE_HOME_MAP[roleName];
  }

  return '/';
};

function LecturerRouteFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f7f8] via-[#f6f6f8] to-[#fffaf6] px-8 py-8">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="h-10 w-56 rounded-2xl bg-slate-100 animate-pulse" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
          <div className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
          <div className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
        </div>
        <div className="h-72 rounded-2xl bg-slate-100 animate-pulse" />
      </div>
    </div>
  );
}

export default function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  const defaultRoute = getDefaultRoute(user);
  const isLoggedIn = Boolean(user);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route
        path="/login"
        element={
          isLoggedIn ? <Navigate to={defaultRoute} replace /> : <Login />
        }
      />

      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-account" element={<VerifyAccount />} />

      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/submit"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <SubmitCode />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/results"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentResultsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/results/:submissionId"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentResultDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/notifications"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentNotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/wallet"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <Suspense fallback={<LecturerRouteFallback />}>
              <StudentWalletPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/wallet/deposit/qr"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <Suspense fallback={<LecturerRouteFallback />}>
              <StudentWalletDepositQrPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/wallet/deposit/success"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <Suspense fallback={<LecturerRouteFallback />}>
              <StudentWalletDepositSuccessPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/appeals"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <Suspense fallback={<LecturerRouteFallback />}>
              <StudentAppealsPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/appeals/create/:submissionId"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <Suspense fallback={<LecturerRouteFallback />}>
              <StudentAppealCreatePage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/appeals/:appealId"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <Suspense fallback={<LecturerRouteFallback />}>
              <StudentAppealDetailPage />
            </Suspense>
          </ProtectedRoute>
        }
      />

      <Route
        path="/lecturer"
        element={
          <ProtectedRoute allowedRoles={['LECTURER']}>
            <Suspense fallback={<LecturerRouteFallback />}>
              <LecturerLayout />
            </Suspense>
          </ProtectedRoute>
        }
      >
        <Route index element={<LecturerDashboard />} />
        <Route path="notifications" element={<LecturerNotificationsPage />} />
        <Route path="appeals" element={<LecturerAppealsPage />} />
        <Route path="appeals/:appealId" element={<LecturerAppealReviewPage />} />
        <Route path="appeals/:appealId/submitted" element={<LecturerAppealSubmittedPage />} />
      </Route>

      <Route
        path="/exam-staff"
        element={
          <ProtectedRoute allowedRoles={['EXAM_STAFF']}>
            <ExamStaffDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam-staff/exams"
        element={
          <ProtectedRoute allowedRoles={['EXAM_STAFF']}>
            <ExamStaffDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam-staff/exams/create"
        element={
          <ProtectedRoute allowedRoles={['EXAM_STAFF']}>
            <ExamStaffDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam-staff/exams/:examId"
        element={
          <ProtectedRoute allowedRoles={['EXAM_STAFF']}>
            <ExamStaffDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam-staff/exams/:examId/edit"
        element={
          <ProtectedRoute allowedRoles={['EXAM_STAFF']}>
            <ExamStaffDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam-staff/exams/:examId/blocks/:blockId"
        element={
          <ProtectedRoute allowedRoles={['EXAM_STAFF']}>
            <ExamStaffDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam-staff/exams/:examId/blocks/:blockId/statistics"
        element={
          <ProtectedRoute allowedRoles={['EXAM_STAFF']}>
            <ExamStaffDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam-staff/exams/:examId/blocks/:blockId/upload-paper"
        element={
          <ProtectedRoute allowedRoles={['EXAM_STAFF']}>
            <ExamStaffDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam-staff/exams/:examId/blocks/:blockId/submissions"
        element={
          <ProtectedRoute allowedRoles={['EXAM_STAFF']}>
            <ExamStaffDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam-staff/exams/:examId/blocks/:blockId/submissions/:submissionId"
        element={
          <ProtectedRoute allowedRoles={['EXAM_STAFF']}>
            <ExamStaffDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam-staff/exams/:examId/blocks/:blockId/criteria"
        element={
          <ProtectedRoute allowedRoles={['EXAM_STAFF']}>
            <ExamStaffDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam-staff/notifications"
        element={
          <ProtectedRoute allowedRoles={['EXAM_STAFF']}>
            <ExamStaffDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam-staff/submissions"
        element={
          <ProtectedRoute allowedRoles={['EXAM_STAFF']}>
            <ExamStaffDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam-staff/appeals"
        element={
          <ProtectedRoute allowedRoles={['EXAM_STAFF']}>
            <AppealPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam-staff/appeals/:appealId"
        element={
          <ProtectedRoute allowedRoles={['EXAM_STAFF']}>
            <AppealDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam-staff/withdrawals"
        element={
          <ProtectedRoute allowedRoles={['EXAM_STAFF']}>
            <WithdrawalManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/audits/:auditLogId"
        element={
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <AuditLogDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/audits"
        element={
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <AuditLogsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <SystemAdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/student-management"
        element={
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/student-management/:userId"
        element={
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <UserDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/payos-configuration"
        element={
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <PayOSConfigurationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/ai-config"
        element={
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <AIConfig />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/grading-config"
        element={
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <GradingModeConfig />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/system-config"
        element={
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <SystemConfig />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to={defaultRoute} replace />} />
    </Routes>
  );
}
