import React, { Suspense, lazy, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../../components/layouts/MainLayout.jsx';
import { STAFF_ICONS, STAFF_SIDEBAR_ITEMS } from '../../constants/sidebarItems.jsx';
import DashboardCard from '../../components/DashboardCard.jsx';
import { renderSiderIconsMaterialSymbol } from '../../components/utils/Utils.jsx';
import { ConfigProvider, Table, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import ExamManagementPage from '../exam/ExamManagementPage.jsx';
import CreateExamPage from '../exam/CreateExamPage.jsx';
import ExamDetailPage from '../exam/ExamDetailPage.jsx';
import UploadExamPaperPage from '../exam-paper/UploadExamPaperPage.jsx';
import CriteriaPage from '../exam-paper/CriteriaPage.jsx';
import BlockDetailPage from '../block/BlockDetailPage.jsx';
import BlockSubmissionsPage from '../submission/BlockSubmissionsPage.jsx';
import SubmissionDetailPage from '../submission/SubmissionDetailPage.jsx';
import ExamStaffHomeDashboard from './ExamStaffHomeDashboard.jsx';
import ExamStaffNotificationsPage from './notifications/ExamStaffNotificationsPage.jsx';
import AllSubmissionsManagementPage from '../submission/AllSubmissionsManagementPage.jsx';

const BlockStatisticsPage = lazy(() => import('./statistics/BlockStatisticsPage.jsx'));

export default function ExamStaffDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { examId, blockId, submissionId } = useParams();

  const dashboardIndex =
    STAFF_SIDEBAR_ITEMS.findIndex((item) => item.to === '/exam-staff') + 1;
  const examsIndex =
    STAFF_SIDEBAR_ITEMS.findIndex((item) => item.to === '/exam-staff/exams') + 1;
  const appealsIndex =
    STAFF_SIDEBAR_ITEMS.findIndex((item) => item.to === '/exam-staff/appeals') +
    1;
  const withdrawalsIndex =
    STAFF_SIDEBAR_ITEMS.findIndex((item) => item.to === '/exam-staff/withdrawals') +
    1;
  const notificationsIndex =
    STAFF_SIDEBAR_ITEMS.findIndex((item) => item.to === '/exam-staff/notifications') +
    1;
  const submissionsIndex =
    STAFF_SIDEBAR_ITEMS.findIndex((item) => item.to === '/exam-staff/submissions') +
    1;
  const auditsIndex =
    STAFF_SIDEBAR_ITEMS.findIndex((item) => item.to === '/exam-staff/audits') +
    1;

  const pathSelectedIndexMap = {
    '/exam-staff': dashboardIndex,
    '/exam-staff/exams': examsIndex,
    '/exam-staff/exams/create': examsIndex,
    '/exam-staff/appeals': appealsIndex,
    '/exam-staff/withdrawals': withdrawalsIndex,
    '/exam-staff/notifications': notificationsIndex,
    '/exam-staff/submissions': submissionsIndex,
    '/exam-staff/audits': auditsIndex,
  };

  const selectedIndex = location.pathname.startsWith('/exam-staff/exams')
    ? examsIndex
    : location.pathname.startsWith('/exam-staff/submissions')
      ? submissionsIndex
      : location.pathname.startsWith('/exam-staff/withdrawals')
        ? withdrawalsIndex
        : location.pathname.startsWith('/exam-staff/audits')
          ? auditsIndex
          : location.pathname.startsWith('/exam-staff/appeals')
            ? appealsIndex
            : location.pathname.startsWith('/exam-staff/notifications')
              ? notificationsIndex
              : (pathSelectedIndexMap[location.pathname] ?? dashboardIndex);

  const isExamManagementPage = location.pathname === '/exam-staff/exams';
  const isNotificationsPage = location.pathname === '/exam-staff/notifications';
  const isAllSubmissionsPage = location.pathname === '/exam-staff/submissions';
  const isCreateExamPage = location.pathname === '/exam-staff/exams/create';
  const isUpdateExamPage =
    location.pathname.startsWith('/exam-staff/exams/') &&
    location.pathname.endsWith('/edit');
  const isUploadExamPaperPage = location.pathname.includes('/upload-paper');
  const isBlockSubmissionsPage =
    location.pathname.startsWith('/exam-staff/exams/') &&
    location.pathname.includes('/blocks/') &&
    location.pathname.endsWith('/submissions');
  const isSubmissionDetailPage =
    location.pathname.startsWith('/exam-staff/exams/') &&
    location.pathname.includes('/blocks/') &&
    /\/submissions\/[^/]+$/.test(location.pathname);
  const isStatisticsPage =
    location.pathname.startsWith('/exam-staff/exams/') &&
    location.pathname.includes('/blocks/') &&
    location.pathname.endsWith('/statistics');
  const isCriteriaPage =
    location.pathname.startsWith('/exam-staff/exams/') &&
    location.pathname.includes('/blocks/') &&
    location.pathname.endsWith('/criteria');
  const isBlockDetailPage =
    location.pathname.startsWith('/exam-staff/exams/') &&
    location.pathname.includes('/blocks/') &&
    !isUploadExamPaperPage &&
    !isCriteriaPage &&
    !isBlockSubmissionsPage &&
    !isSubmissionDetailPage &&
    !isStatisticsPage;
  const isExamDetailPage =
    location.pathname.startsWith('/exam-staff/exams/') &&
    !isCreateExamPage &&
    !isUpdateExamPage &&
    !isUploadExamPaperPage &&
    !isBlockDetailPage;

  const renderedSiderIcons = renderSiderIconsMaterialSymbol({
    icons: STAFF_ICONS,
  });

  return (
    <MainLayout
      siderIcons={renderedSiderIcons}
      siderItems={STAFF_SIDEBAR_ITEMS}
      actionBtn={({ collapsed }) => {
        return (
          <Button
            type="primary"
            size="large"
            onClick={() => navigate('/exam-staff/exams/create')}
            icon={
              <PlusOutlined
                style={{
                  fontSize: '16px',
                  strokeWidth: '30',
                  stroke: 'white',
                }}
              />
            }
            className="w-full bg-[#F37021] 
            text-white hover:bg-[#F37021]/90 
            py-3 rounded-md text-sm font-bold 
            transition-all flex items-center 
            justify-center gap-2 shadow-lg 
            shadow-[#F37021]/20"
          >
            {collapsed ? '' : 'Tạo kỳ thi mới'}
          </Button>
        );
      }}
    >
      {isCreateExamPage ? (
        <CreateExamPage
          onGoDashboard={() => navigate('/exam-staff')}
          onGoExamManagement={() => navigate('/exam-staff/exams')}
          onGoCreatedExamDetail={(id) => navigate(`/exam-staff/exams/${id}`)}
          onCancel={() => navigate('/exam-staff/exams')}
        />
      ) : isUpdateExamPage ? (
        <CreateExamPage
          examIdToEdit={examId}
          onGoDashboard={() => navigate('/exam-staff')}
          onGoExamManagement={() => navigate('/exam-staff/exams')}
          onGoExamDetail={() => navigate(`/exam-staff/exams/${examId}`)}
          onCancel={() => navigate(`/exam-staff/exams/${examId}`)}
        />
      ) : isUploadExamPaperPage ? (
        <UploadExamPaperPage
          examId={examId}
          blockId={blockId}
          onBack={() => navigate(`/exam-staff/exams/${examId}/blocks/${blockId}`)}
        />
      ) : isBlockSubmissionsPage ? (
        <BlockSubmissionsPage
          examId={examId}
          blockId={blockId}
          onBack={() => navigate(`/exam-staff/exams/${examId}/blocks/${blockId}`)}
        />
      ) : isSubmissionDetailPage ? (
        <SubmissionDetailPage
          examId={examId}
          blockId={blockId}
          submissionId={submissionId}
          onBack={() => {
            if (window.history.length > 2) {
              navigate(-1);
            } else {
              navigate('/exam-staff/submissions');
            }
          }}
        />
      ) : isStatisticsPage ? (
        <Suspense
          fallback={
            <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8 space-y-4 animate-pulse">
              <div className="h-8 w-40 bg-slate-200 rounded-lg" />
              <div className="h-28 bg-slate-100 rounded-3xl" />
              <div className="h-96 bg-slate-100 rounded-3xl" />
            </div>
          }
        >
          <BlockStatisticsPage
            examId={examId}
            blockId={blockId}
            onBack={() => navigate(`/exam-staff/exams/${examId}/blocks/${blockId}`)}
          />
        </Suspense>
      ) : isCriteriaPage ? (
        <CriteriaPage
          examId={examId}
          blockId={blockId}
          onBack={() => navigate(`/exam-staff/exams/${examId}/blocks/${blockId}`)}
        />
      ) : isBlockDetailPage ? (
        <BlockDetailPage
          examId={examId}
          blockId={blockId}
          onBack={() => navigate(`/exam-staff/exams/${examId}`)}
          onOpenUploadPaper={(id) =>
            navigate(`/exam-staff/exams/${examId}/blocks/${id}/upload-paper`)
          }
          onOpenCriteria={(id) =>
            navigate(`/exam-staff/exams/${examId}/blocks/${id}/criteria`)
          }
          onOpenSubmissions={(id) =>
            navigate(`/exam-staff/exams/${examId}/blocks/${id}/submissions`)
          }
          onOpenStatistics={(id) =>
            navigate(`/exam-staff/exams/${examId}/blocks/${id}/statistics`)
          }
        />
      ) : isExamDetailPage ? (
        <ExamDetailPage
          examId={examId}
          onBack={() => navigate('/exam-staff/exams')}
          onEdit={() => navigate(`/exam-staff/exams/${examId}/edit`)}
          onOpenBlockDetail={(targetBlockId) =>
            navigate(`/exam-staff/exams/${examId}/blocks/${targetBlockId}`)
          }
        />
      ) : isExamManagementPage ? (
        <ExamManagementPage
          onCreateExam={() => navigate('/exam-staff/exams/create')}
          onOpenExamDetail={(id) => navigate(`/exam-staff/exams/${id}`)}
        />
      ) : isAllSubmissionsPage ? (
        <AllSubmissionsManagementPage />
      ) : isNotificationsPage ? (
        <ExamStaffNotificationsPage />
      ) : (
        <ExamStaffHomeDashboard />
      )}
    </MainLayout>
  );
}
