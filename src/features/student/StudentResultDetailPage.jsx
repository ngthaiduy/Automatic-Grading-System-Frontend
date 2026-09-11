import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import StudentLayout from '../../components/layouts/student';
import SubmissionDetailPage from '../submission/SubmissionDetailPage';

export default function StudentResultDetailPage() {
  const { submissionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { examId, blockId } = location.state || {};

  return (
    <StudentLayout
      activeNavKey="results"
      title="Chi tiết bài nộp"
      breadcrumbs={[
        { label: 'Trang chủ', to: '/student' },
        { label: 'Kết quả', to: '/student/results' },
        { label: 'Chi tiết' },
      ]}
      useBodyContainer={false}
    >
      <SubmissionDetailPage
        examId={examId}
        blockId={blockId}
        submissionId={submissionId}
        isStudentView
        onBack={() => navigate('/student/results')}
      />
    </StudentLayout>
  );
}
