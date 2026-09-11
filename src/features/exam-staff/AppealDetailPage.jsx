import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import viVN from 'antd/locale/vi_VN';
import { ConfigProvider, Spin, Button, message, Select, DatePicker, Form } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import MainLayout from '../../components/layouts/MainLayout';
import Modal from '../../components/Modal.jsx';
import { STAFF_ICONS, STAFF_SIDEBAR_ITEMS } from '../../constants/sidebarItems';
import { appealStatusConfig } from './config.jsx';
import { useStaffAppealDetail, useStaffAppealLecturers } from '../../hooks';
import {
  formatDateTime,
  formatScore,
  renderSiderIconsMaterialSymbol,
} from '../../components/utils/Utils';
import {
  assignStaffAppeal,
  cancelStaffAppeal,
  confirmStaffAppeal,
} from '../../services/staffApi';
import gradingApi from '../../services/gradingApi';
import {
  buildAppealQuestionRows,
  resolveOriginalScore,
  resolveNewScore,
  resolveScoreDelta,
  getDeltaClassName,
  formatDeltaLabel,
} from './helpers/appealDetailHelpers';

dayjs.locale('vi');

const scoreCardClassName =
  'bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6';

const AppealDetailPage = () => {
  const navigate = useNavigate();
  const { appealId } = useParams();

  const { fetchStaffAppealDetail, data, loading, error } = useStaffAppealDetail();
  const { fetchLecturers, lecturers, loading: lecturersLoading } = useStaffAppealLecturers();

  const [assignForm] = Form.useForm();

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [decisionType, setDecisionType] = useState(null);

  const [gradingDetail, setGradingDetail] = useState(null);
  const [gradingLoading, setGradingLoading] = useState(false);

  const renderedSiderIcons = renderSiderIconsMaterialSymbol({
    icons: STAFF_ICONS,
  });

  const loadGradingDetail = useCallback(async (submissionId) => {
    if (!submissionId) {
      setGradingDetail(null);
      return null;
    }

    setGradingLoading(true);
    try {
      const response = await gradingApi.getSubmissionResult(submissionId);
      setGradingDetail(response?.data ?? null);
      return response?.data ?? null;
    } catch (fetchError) {
      setGradingDetail(null);
      message.error('Không tải được chi tiết điểm bài làm.');
      return null;
    } finally {
      setGradingLoading(false);
    }
  }, []);

  const refreshAppealDetail = useCallback(async () => {
    if (!appealId) return null;
    const response = await fetchStaffAppealDetail(appealId);
    const detail = response?.data ?? null;
    await loadGradingDetail(detail?.submissionId);
    return detail;
  }, [appealId, fetchStaffAppealDetail, loadGradingDetail]);

  useEffect(() => {
    if (!appealId) return;
    refreshAppealDetail().catch(() => {
      message.error('Không tải được chi tiết phúc khảo.');
    });
  }, [appealId, refreshAppealDetail]);

  const status = data?.status;
  const statusCfg = appealStatusConfig[status] ?? appealStatusConfig.PENDING;
  const canAssign = status === 'PENDING';
  const canCancel = status === 'PENDING' || status === 'PROCESSING';
  const canReview = status === 'COMPLETED';

  const lecturerOptions = useMemo(
    () =>
      lecturers.map((lecturer) => ({
        value: lecturer.lecturerId,
        label: `${lecturer.fullName ?? '—'} (đang xử lý: ${lecturer.activeAppealCount ?? 0})`,
      })),
    [lecturers],
  );

  const questionRows = useMemo(
    () =>
      buildAppealQuestionRows({
        gradingDetail,
        newQuestionScores: data?.newQuestionScores,
        status: data?.status,
      }),
    [gradingDetail, data?.newQuestionScores],
  );

  const originalScore = useMemo(
    () => resolveOriginalScore(data, gradingDetail, questionRows),
    [data, gradingDetail, questionRows],
  );

  const revisedScore = useMemo(
    () => resolveNewScore(data, questionRows, originalScore),
    [data, questionRows, originalScore],
  );

  const scoreDelta = useMemo(
    () => resolveScoreDelta(originalScore, revisedScore),
    [originalScore, revisedScore],
  );

  const lecturerComment = data?.lecturerComment?.trim() ? data.lecturerComment : '—';

  const openAssignModal = () => {
    assignForm.resetFields();
    setAssignModalOpen(true);
    fetchLecturers().catch(() => {
      message.error('Không tải được danh sách giảng viên.');
    });
  };

  const closeAssignModal = () => {
    if (assignSubmitting) return;
    setAssignModalOpen(false);
    assignForm.resetFields();
  };

  const handleAssignFinish = async ({ lecturerId, deadlineAt }) => {
    if (!appealId) return;
    setAssignSubmitting(true);
    try {
      const response = await assignStaffAppeal(appealId, {
        lecturerId,
        deadlineAt: deadlineAt.toISOString(),
      });
      message.success(response?.message || 'Phân công giảng viên thành công.');
      closeAssignModal();
      await refreshAppealDetail();
    } catch (submitError) {
      message.error(
        submitError?.response?.data?.message || 'Không thể phân công giảng viên.',
      );
    } finally {
      setAssignSubmitting(false);
    }
  };

  const openDecisionModal = (type) => {
    setDecisionType(type);
    setDecisionModalOpen(true);
  };

  const handleDecision = async () => {
    if (!appealId || !decisionType) return;
    setDecisionSubmitting(true);

    try {
      const response = await confirmStaffAppeal(appealId, {
        isApprove: decisionType === 'approve',
      });
      message.success(
        response?.message ||
          (decisionType === 'approve'
            ? 'Đã duyệt kết quả phúc khảo.'
            : 'Đã từ chối kết quả phúc khảo.'),
      );
      setDecisionModalOpen(false);
      setDecisionType(null);
      await refreshAppealDetail();
    } catch (submitError) {
      message.error(
        submitError?.response?.data?.message || 'Không thể cập nhật kết quả phúc khảo.',
      );
    } finally {
      setDecisionSubmitting(false);
    }
  };

  const handleCancelAppeal = async () => {
    if (!appealId) return;
    setCancelSubmitting(true);
    try {
      const response = await cancelStaffAppeal(appealId);
      message.success(response?.message || 'Đã hủy đơn phúc khảo.');
      setCancelModalOpen(false);
      await refreshAppealDetail();
    } catch (submitError) {
      message.error(submitError?.response?.data?.message || 'Không thể hủy đơn phúc khảo.');
    } finally {
      setCancelSubmitting(false);
    }
  };

  return (
    <MainLayout siderIcons={renderedSiderIcons} siderItems={STAFF_SIDEBAR_ITEMS}>
      <ConfigProvider
        locale={viVN}
        theme={{
          components: {
            Button: { colorPrimary: '#F37021' },
          },
        }}
      >
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
          <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <button
                  type="button"
                  className="hover:text-[#F37021] cursor-pointer bg-transparent border-0 p-0 font-inherit"
                  onClick={() => navigate('/exam-staff/appeals')}
                >
                  Đơn phúc khảo
                </button>
                <span>/</span>
                <span className="text-slate-800 font-medium">Chi tiết</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {canAssign && (
                  <Button type="primary" onClick={openAssignModal}>
                    Phân công giảng viên
                  </Button>
                )}
                {canCancel && (
                  <Button danger onClick={() => setCancelModalOpen(true)}>
                    Hủy đơn
                  </Button>
                )}
                {canReview && (
                  <>
                    <Button danger onClick={() => openDecisionModal('deny')}>
                      Từ chối
                    </Button>
                    <Button type="primary" onClick={() => openDecisionModal('approve')}>
                      Duyệt
                    </Button>
                  </>
                )}
              </div>
            </div>

            <Spin spinning={loading || gradingLoading}>
              {error && !loading && (
                <p className="text-sm text-red-600">
                  Không tải được dữ liệu.{' '}
                  <button
                    type="button"
                    className="text-[#F37021] font-semibold underline"
                    onClick={() => navigate('/exam-staff/appeals')}
                  >
                    Quay lại danh sách
                  </button>
                </p>
              )}

              {data && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
                    <div className={`${scoreCardClassName} h-full`}>
                      <h2 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4">
                        <span className="w-1 h-5 rounded-full bg-[#F37021]" />
                        Thông tin chung
                      </h2>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Họ và tên
                          </p>
                          <div className="text-sm text-slate-800 break-words font-medium">
                            {data.studentName ?? '—'}
                          </div>
                        </div>

                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Trạng thái
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border ${statusCfg.cls}`}
                          >
                            {statusCfg.label}
                          </span>
                        </div>

                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            MSSV
                          </p>
                          <div className="text-sm font-mono text-slate-800 break-words font-medium">
                            {data.studentMssv ?? '—'}
                          </div>
                        </div>

                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Email
                          </p>
                          <div className="text-sm text-slate-800 break-words font-medium">
                            {data.studentEmail ?? '—'}
                          </div>
                        </div>

                        <div className="col-span-2 pt-4 border-t border-slate-100">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Kỳ thi
                              </p>
                              <div className="text-sm text-slate-800 break-words font-medium">
                                {data.examName ?? '—'}
                              </div>
                            </div>

                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Học kỳ
                              </p>
                              <div className="text-sm text-slate-800 break-words font-medium">
                                {data.semester ?? '—'}
                              </div>
                            </div>

                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Block
                              </p>
                              <div className="text-sm text-slate-800 break-words font-medium">
                                {data.blockName ?? '—'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={`${scoreCardClassName} h-full`}>
                      <h2 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4">
                        <span className="w-1 h-5 rounded-full bg-[#F37021]" />
                        Phân công
                      </h2>
                      {data.assignedLecturerName || data.assignedLecturerEmail || data.assignedAt ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                              Giảng viên
                            </p>
                            <div className="text-sm text-slate-800 font-medium break-words">
                              {data.assignedLecturerName ?? '—'}
                            </div>
                          </div>

                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                              Email
                            </p>
                            <div className="text-sm text-slate-800 font-medium break-words">
                              {data.assignedLecturerEmail ?? '—'}
                            </div>
                          </div>

                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                              Thời điểm phân công
                            </p>
                            <div className="text-sm text-slate-800 font-medium break-words">
                              {formatDateTime(data.assignedAt)}
                            </div>
                          </div>

                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                              Hạn chấm
                            </p>
                            <div className="text-sm text-slate-800 font-medium break-words">
                              {formatDateTime(data.deadlineAt)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 m-0">Chưa phân công giảng viên.</p>
                      )}
                    </div>

                    <div className={`${scoreCardClassName} h-full`}>
                      <h2 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4">
                        <span className="w-1 h-5 rounded-full bg-[#F37021]" />
                        Thông tin đơn phúc khảo
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Ngày tạo đơn
                          </p>
                          <div className="text-sm text-slate-800 font-medium">
                            {formatDateTime(data.createdAt)}
                          </div>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Người phân công
                          </p>
                          <div className="text-sm text-slate-800 font-medium">
                            {data.assignedByName ?? '—'}
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                          Lý do
                        </p>
                        <div className="rounded-md bg-slate-50/80 border border-slate-100 p-4 min-h-[120px]">
                          <p className="text-sm text-slate-800 whitespace-pre-wrap m-0">
                            {data.reason?.trim() ? data.reason : '—'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={`${scoreCardClassName} h-full`}>
                      <h2 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4">
                        <span className="w-1 h-5 rounded-full bg-[#F37021]" />
                        Nhận xét giảng viên
                      </h2>
                      <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 whitespace-pre-wrap min-h-[188px]">
                        {lecturerComment}
                      </div>
                    </div>
                  </div>

                  <div className={scoreCardClassName}>
                    <h2 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4">
                      <span className="w-1 h-5 rounded-full bg-[#F37021]" />
                      Tổng quan điểm
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                          Điểm cũ
                        </p>
                        <p className="text-2xl font-bold text-slate-800 m-0">
                          {formatScore(originalScore)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                          Điểm mới
                        </p>
                        <p className="text-2xl font-bold text-slate-800 m-0">
                          {formatScore(revisedScore)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                          Điểm chênh lệch
                        </p>
                        <p className={`text-2xl font-bold m-0 ${getDeltaClassName(scoreDelta)}`}>
                          {formatDeltaLabel(scoreDelta, formatScore)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={scoreCardClassName}>
                    <h2 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4">
                      <span className="w-1 h-5 rounded-full bg-[#F37021]" />
                      Điểm theo câu
                    </h2>

                    {questionRows.length ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm border-separate border-spacing-0">
                          <thead>
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold text-slate-500 bg-slate-50 border-b border-slate-200">
                                Câu
                              </th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-500 bg-slate-50 border-b border-slate-200">
                                Tiêu đề
                              </th>
                              <th className="px-4 py-3 text-right font-semibold text-slate-500 bg-slate-50 border-b border-slate-200">
                                Điểm cũ
                              </th>
                              <th className="px-4 py-3 text-right font-semibold text-slate-500 bg-slate-50 border-b border-slate-200">
                                Điểm mới
                              </th>
                              <th className="px-4 py-3 text-right font-semibold text-slate-500 bg-slate-50 border-b border-slate-200">
                                Chênh lệch
                              </th>
                              <th className="px-4 py-3 text-right font-semibold text-slate-500 bg-slate-50 border-b border-slate-200">
                                Tối đa
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {questionRows.map((row) => (
                              <tr key={row.id} className="odd:bg-white even:bg-slate-50/60">
                                <td className="px-4 py-3 border-b border-slate-100 font-semibold text-slate-800">
                                  Câu {row.questionNumber ?? '—'}
                                </td>
                                <td className="px-4 py-3 border-b border-slate-100 text-slate-700">
                                  <div className="font-medium">{row.questionTitle ?? '—'}</div>
                                  {row.guardRuleTriggered && row.guardRuleNote ? (
                                    <div className="text-xs text-rose-600 mt-1">{row.guardRuleNote}</div>
                                  ) : null}
                                </td>
                                <td className="px-4 py-3 border-b border-slate-100 text-right font-medium text-slate-800">
                                  {formatScore(row.oldScore)}
                                </td>
                                <td className="px-4 py-3 border-b border-slate-100 text-right font-medium text-slate-800">
                                  {formatScore(row.newScore)}
                                </td>
                                <td className={`px-4 py-3 border-b border-slate-100 text-right font-semibold ${getDeltaClassName(row.delta)}`}>
                                  {formatDeltaLabel(row.delta, formatScore)}
                                </td>
                                <td className="px-4 py-3 border-b border-slate-100 text-right text-slate-600">
                                  {formatScore(row.maxScore)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 m-0">Chưa có dữ liệu điểm theo câu.</p>
                    )}
                  </div>
                </div>
              )}

              {!loading && !data && !error && appealId && (
                <p className="text-sm text-slate-500">Không có dữ liệu.</p>
              )}
            </Spin>
          </div>
        </div>

        <Modal isOpen={assignModalOpen} onClose={closeAssignModal}>
          <div className="w-[520px] max-w-[90vw]">
            <h3 className="text-base font-bold text-slate-800 m-0 mb-1">Phân công giảng viên</h3>
            <p className="text-sm text-slate-500 m-0 mb-4">
              Chọn giảng viên và thời hạn chấm cho đơn phúc khảo này.
            </p>
            <Form
              form={assignForm}
              layout="vertical"
              className="space-y-0"
              onFinish={handleAssignFinish}
              requiredMark={false}
              validateTrigger={['onChange', 'onBlur']}
            >
              <Form.Item
                name="lecturerId"
                label="Giảng viên"
                rules={[{ required: true, message: 'Vui lòng chọn giảng viên.' }]}
              >
                <Select
                  className="w-full"
                  placeholder="Chọn giảng viên"
                  loading={lecturersLoading}
                  showSearch
                  optionFilterProp="label"
                  options={lecturerOptions}
                  allowClear
                />
              </Form.Item>

              <Form.Item
                name="deadlineAt"
                label="Hạn chấm"
                rules={[
                  { required: true, message: 'Vui lòng chọn hạn chấm.' },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      if (value.isBefore(dayjs())) {
                        return Promise.reject(new Error('Hạn chấm không được ở quá khứ.'));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <DatePicker
                  showTime
                  className="w-full"
                  format="DD/MM/YYYY HH:mm"
                  disabledDate={(current) =>
                    current && current.isBefore(dayjs().startOf('day'))
                  }
                />
              </Form.Item>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button onClick={closeAssignModal} disabled={assignSubmitting}>
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit" loading={assignSubmitting}>
                  Xác nhận phân công
                </Button>
              </div>
            </Form>
          </div>
        </Modal>

        <Modal
          isOpen={decisionModalOpen}
          onClose={() => {
            if (decisionSubmitting) return;
            setDecisionModalOpen(false);
            setDecisionType(null);
          }}
        >
          <div className="w-[560px] max-w-[90vw]">
            <h3 className="text-base font-bold text-slate-800 m-0 mb-1">
              {decisionType === 'approve' ? 'Duyệt kết quả phúc khảo' : 'Từ chối kết quả phúc khảo'}
            </h3>
            <p className="text-sm text-slate-500 m-0 mb-4">
              {decisionType === 'approve'
                ? 'Điểm mới sẽ được áp dụng cho kết quả chính thức của sinh viên.'
                : 'Hệ thống sẽ giữ nguyên điểm hiện tại của sinh viên.'}
            </p>

            <div className="rounded-xl border border-slate-200 bg-white p-4 mb-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                    Điểm cũ
                  </p>
                  <div className="text-lg font-bold text-slate-800">{formatScore(originalScore)}</div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                    Điểm mới
                  </p>
                  <div className="text-lg font-bold text-slate-800">{formatScore(revisedScore)}</div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                    Chênh lệch
                  </p>
                  <div className={`text-lg font-bold ${getDeltaClassName(scoreDelta)}`}>
                    {formatDeltaLabel(scoreDelta, formatScore)}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 whitespace-pre-wrap mb-4">
              {lecturerComment}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <Button
                onClick={() => {
                  if (decisionSubmitting) return;
                  setDecisionModalOpen(false);
                  setDecisionType(null);
                }}
                disabled={decisionSubmitting}
              >
                Hủy
              </Button>
              <Button
                type="primary"
                danger={decisionType !== 'approve'}
                loading={decisionSubmitting}
                onClick={handleDecision}
              >
                {decisionType === 'approve' ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={cancelModalOpen}
          onClose={() => {
            if (cancelSubmitting) return;
            setCancelModalOpen(false);
          }}
        >
          <div className="w-[480px] max-w-[90vw]">
            <h3 className="text-base font-bold text-slate-800 m-0 mb-2">Hủy đơn phúc khảo</h3>
            <p className="text-sm text-slate-600 m-0 mb-4">
              Bạn có chắc muốn hủy đơn phúc khảo này không?
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button onClick={() => setCancelModalOpen(false)} disabled={cancelSubmitting}>
                Quay lại
              </Button>
              <Button danger type="primary" loading={cancelSubmitting} onClick={handleCancelAppeal}>
                Xác nhận hủy
              </Button>
            </div>
          </div>
        </Modal>
      </ConfigProvider>
    </MainLayout>
  );
};

export default AppealDetailPage;
