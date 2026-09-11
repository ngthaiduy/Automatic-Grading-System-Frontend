import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import StudentLayout from '../../components/layouts/student';
import appealApi from '../../services/appealApi';
import gradingApi from '../../services/gradingApi';
import walletApi from '../../services/walletApi';
import {
  extractAppealErrorMessage,
  formatCurrency,
  formatDateTime,
  formatScore,
  normalizeAppealReason,
  resolveAppealCreatePrefill,
  unwrapApiData,
  validateAppealReason,
} from './appeals/helpers/appealHelpers';

function InfoRow({ label, value, accent = false }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className={`font-semibold ${accent ? 'text-[#F37021]' : 'text-slate-900'}`}>{value}</p>
    </div>
  );
}

export default function StudentAppealCreatePage() {
  const { submissionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [detail, setDetail] = useState(resolveAppealCreatePrefill(location.state?.prefill, submissionId));
  const [walletBalance, setWalletBalance] = useState(null);
  const [hasWallet, setHasWallet] = useState(false);
  const [appealFee, setAppealFee] = useState(200000);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadPageData = useCallback(async () => {
    if (!submissionId) {
      setLoading(false);
      setLoadError('Thiếu submissionId để tạo yêu cầu phúc khảo.');
      return;
    }

    setLoading(true);
    setLoadError('');

    try {
      const [resultResponse, walletResponse] = await Promise.allSettled([
        gradingApi.getSubmissionResult(submissionId),
        walletApi.getMyWallet(),
      ]);

      if (resultResponse.status === 'fulfilled') {
        const payload = unwrapApiData(resultResponse.value);
        setDetail((prev) => ({
          ...prev,
          ...payload,
          submissionId: payload?.submissionId || prev?.submissionId || submissionId,
          examName: prev?.examName || payload?.examName || prev?.blockName || 'Bài nộp cần phúc khảo',
          semesterName: prev?.semesterName || payload?.semesterName || '—',
          blockName: payload?.blockName || prev?.blockName || '—',
        }));
      }

      if (walletResponse.status === 'fulfilled') {
        const wallet = unwrapApiData(walletResponse.value);
        const resolvedHasWallet = typeof wallet?.hasWallet === 'boolean'
          ? wallet.hasWallet
          : Boolean(wallet?.walletId);

        setHasWallet(resolvedHasWallet);
        setWalletBalance(resolvedHasWallet ? Number(wallet?.balance ?? 0) : 0);
        setAppealFee(Number(wallet?.appealFee ?? 200000) || 200000);
      } else {
        throw walletResponse.reason;
      }

      if (resultResponse.status === 'rejected') {
        throw resultResponse.reason;
      }
    } catch (apiError) {
      setLoadError(
        extractAppealErrorMessage(
          apiError,
          'Không thể tải dữ liệu cần thiết để tạo yêu cầu phúc khảo.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  const reasonLength = reason.length;

  const handleReasonChange = useCallback((value) => {
    setReason(normalizeAppealReason(value));
    setReasonError('');
  }, []);

  const hasEnoughBalance = useMemo(() => hasWallet && Number(walletBalance ?? 0) >= Number(appealFee ?? 0), [appealFee, hasWallet, walletBalance]);

  const canSubmit = useMemo(
    () => !submitting && !loading && !!detail?.submissionId && agreed && hasEnoughBalance,
    [agreed, detail?.submissionId, hasEnoughBalance, loading, submitting],
  );

  const handleSubmit = useCallback(async () => {
    const normalizedReason = normalizeAppealReason(reason).trim();
    const validationError = validateAppealReason(reason);
    if (validationError) {
      setReasonError(validationError);
      return;
    }

    if (!hasWallet) {
      message.warning('Bạn cần mở ví và nạp tiền trước khi gửi yêu cầu phúc khảo.');
      return;
    }

    if (!hasEnoughBalance) {
      message.warning('Số dư hiện tại chưa đủ để thanh toán phí phúc khảo.');
      return;
    }

    if (!agreed) {
      message.warning('Bạn cần xác nhận đã đọc quy định phúc khảo trước khi gửi.');
      return;
    }

    setSubmitting(true);
    setReasonError('');

    try {
      const response = await appealApi.createAppeal({
        submissionId: detail?.submissionId || submissionId,
        reason: normalizedReason,
      });

      const payload = unwrapApiData(response);
      message.success(response?.message || 'Đã tạo yêu cầu phúc khảo thành công.');
      navigate('/student/appeals', {
        replace: true,
        state: { createdAppeal: payload },
      });
    } catch (apiError) {
      message.error(
        extractAppealErrorMessage(apiError, 'Không thể tạo yêu cầu phúc khảo lúc này.'),
      );
    } finally {
      setSubmitting(false);
    }
  }, [agreed, detail?.submissionId, hasEnoughBalance, hasWallet, navigate, reason, submissionId]);

  const headerActions = (
    <div className="flex items-center gap-2">
      <Link
        to="/student/appeals"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:border-[#F37021]/30 hover:text-[#F37021]"
      >
        <span className="material-symbols-outlined text-[18px]">list_alt</span>
        Danh sách phúc khảo
      </Link>
    </div>
  );

  return (
    <StudentLayout
      activeNavKey="appeals"
      title="Gửi yêu cầu phúc khảo"
      breadcrumbs={[
        { label: 'Trang chủ', to: '/student' },
        { label: 'Phúc khảo', to: '/student/appeals' },
        { label: 'Tạo yêu cầu' },
      ]}
      headerActions={headerActions}
      bodyClassName="mx-auto max-w-5xl space-y-6 px-8 py-8"
    >
      <button
        type="button"
        onClick={() => navigate('/student/appeals')}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition-colors hover:text-[#F37021]"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Quay lại danh sách phúc khảo
      </button>

      <section className="rounded-3xl border border-orange-100 bg-orange-50/70 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined mt-0.5 text-[#F37021]">info</span>
          <div className="space-y-2 text-sm leading-6 text-slate-700">
            <h2 className="text-base font-black text-[#F37021]">Lưu ý trước khi gửi phúc khảo</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>Chỉ gửi phúc khảo cho bài nộp đã có kết quả chấm.</li>
              <li>Phí phúc khảo sẽ được trừ từ ví sinh viên khi gửi yêu cầu thành công.</li>
              <li>Nêu rõ câu hỏi hoặc phần bài làm muốn xem xét lại để giảng viên xử lý nhanh hơn.</li>
            </ul>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-16 shadow-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#F37021]/30 border-t-[#F37021]" />
            <p className="text-sm font-medium text-slate-500">Đang tải thông tin bài nộp và ví sinh viên...</p>
          </div>
        </div>
      ) : loadError ? (
        <div className="rounded-3xl border border-rose-200 bg-white p-12 shadow-sm">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="material-symbols-outlined text-[44px] text-rose-500">error</span>
            <h2 className="text-xl font-black text-slate-800">Không thể tạo yêu cầu</h2>
            <p className="max-w-xl text-sm leading-6 text-slate-500">{loadError}</p>
            <button
              type="button"
              onClick={loadPageData}
              className="mt-1 inline-flex h-11 items-center justify-center rounded-2xl bg-[#F37021] px-5 text-sm font-black text-white transition-colors hover:bg-orange-500"
            >
              Thử lại
            </button>
          </div>
        </div>
      ) : (
        <>
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-black text-slate-900">Thông tin bài thi</h2>
            </div>

            <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
              <InfoRow label="Tên kỳ thi" value={detail?.examName || 'Bài nộp cần phúc khảo'} />
              <InfoRow label="Block / ca thi" value={detail?.blockName || '—'} />
              <InfoRow label="Học kỳ" value={detail?.semesterName || '—'} />
              <InfoRow label="Ngày chấm" value={formatDateTime(detail?.gradedAt)} />
              <InfoRow label="Điểm hiện tại" value={`${formatScore(detail?.totalScore)} / ${formatScore(detail?.maxScore)}`} accent />
              <InfoRow label="Phí phúc khảo" value={formatCurrency(appealFee)} />
              <InfoRow
                label={hasWallet ? 'Số dư ví hiện tại' : 'Trạng thái ví'}
                value={hasWallet ? formatCurrency(walletBalance) : 'Chưa có ví sinh viên'}
                accent={hasWallet && hasEnoughBalance}
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-black text-slate-900">Nội dung phúc khảo</h2>
            </div>

            <div className="space-y-6 p-6">
              <div>
                <label htmlFor="appeal-reason" className="mb-2 block text-sm font-bold text-slate-700">
                  Lý do phúc khảo <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="appeal-reason"
                  value={reason}
                  onChange={(event) => handleReasonChange(event.target.value)}
                  placeholder="Mô tả rõ câu hỏi hoặc phần bài làm mà bạn muốn được xem xét lại..."
                  className={`min-h-[180px] w-full rounded-2xl border bg-white px-4 py-4 text-sm leading-6 text-slate-700 outline-none transition-all ${
                    reasonError
                      ? 'border-rose-300 ring-4 ring-rose-100'
                      : 'border-slate-200 focus:border-[#F37021] focus:ring-4 focus:ring-orange-100'
                  }`}
                />
                <div className="mt-2 flex items-center justify-between gap-3">
                  {reasonError ? (
                    <p className="text-sm font-medium text-rose-600">{reasonError}</p>
                  ) : (
                    <p className="text-sm text-slate-500">Lý do càng rõ ràng thì giảng viên càng dễ đối chiếu lại kết quả.</p>
                  )}
                  <span className="text-xs font-medium text-slate-400">{reasonLength} / 2000 ký tự</span>
                </div>
              </div>

              {!hasWallet ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-bold text-amber-800">Bạn chưa có ví sinh viên</p>
                      <p className="mt-1 text-sm leading-6 text-amber-700">
                        Hãy mở ví và nạp tiền trước khi gửi yêu cầu phúc khảo.
                      </p>
                    </div>

                    <Link
                      to="/student/wallet"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white px-4 text-sm font-bold text-amber-800 transition-colors hover:bg-amber-100"
                    >
                      <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                      Mở ví
                    </Link>
                  </div>
                </div>
              ) : (
                <div className={`rounded-2xl border px-5 py-4 ${hasEnoughBalance ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
                  <div className="flex flex-col gap-2">
                    <p className={`text-sm font-bold ${hasEnoughBalance ? 'text-emerald-800' : 'text-rose-800'}`}>
                      {hasEnoughBalance ? 'Số dư hiện tại đủ để gửi phúc khảo' : 'Số dư hiện tại chưa đủ'}
                    </p>
                    <p className={`text-sm leading-6 ${hasEnoughBalance ? 'text-emerald-700' : 'text-rose-700'}`}>
                      Số dư hiện tại: <span className="font-bold">{formatCurrency(walletBalance)}</span> · Phí thủ tục: <span className="font-bold">{formatCurrency(appealFee)}</span>
                    </p>
                  </div>
                </div>
              )}

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm leading-6 text-slate-600">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(event) => setAgreed(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[#F37021] focus:ring-[#F37021]"
                />
                <span>
                  Tôi xác nhận thông tin cung cấp là chính xác và đồng ý thanh toán phí phúc khảo bằng ví sinh viên khi gửi yêu cầu.
                </span>
              </label>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => navigate('/student/appeals')}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#F37021] px-5 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition-colors hover:bg-orange-500 disabled:cursor-not-allowed disabled:bg-orange-300"
              >
                <span className={`material-symbols-outlined text-[18px] ${submitting ? 'animate-spin' : ''}`}>
                  {submitting ? 'progress_activity' : 'gavel'}
                </span>
                {submitting ? 'Đang gửi yêu cầu...' : 'Xác nhận gửi yêu cầu'}
              </button>
            </div>
          </section>
        </>
      )}
    </StudentLayout>
  );
}
