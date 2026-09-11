import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import viVN from 'antd/locale/vi_VN';
import MainLayout from '../../components/layouts/MainLayout';
import { STAFF_ICONS, STAFF_SIDEBAR_ITEMS } from '../../constants/sidebarItems';
import { ConfigProvider, message, Spin } from 'antd';
import CardContainer from '../../components/CardContainer';
import { useGetAuditLogDetail } from '../../hooks';
import { renderSiderIconsMaterialSymbol } from '../../components/utils/Utils.jsx';

const formatDateTime = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
};

const formatJson = (raw) => {
  if (raw == null || raw === '') return '—';
  if (typeof raw !== 'string') return String(raw);
  try {
    const parsed = JSON.parse(raw);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return raw;
  }
};

const Label = ({ children }) => (
  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
    {children}
  </p>
);

const Value = ({ children, mono }) => (
  <div
    className={`text-sm text-slate-800 break-words ${mono ? 'font-mono text-xs' : 'font-medium'}`}
  >
    {children}
  </div>
);

const AuditLogDetailPage = () => {
  const { auditLogId } = useParams();
  const navigate = useNavigate();

  const { callGetAuditLogDetailEndpoint, detail, loading } =
    useGetAuditLogDetail();

  const renderedSiderIcons = renderSiderIconsMaterialSymbol({
    icons: STAFF_ICONS,
  });

  useEffect(() => {
    if (!auditLogId) return;
    callGetAuditLogDetailEndpoint(auditLogId).catch(() => {
      message.error('Không tải được chi tiết nhật ký.');
    });
  }, [auditLogId]);

  return (
    <MainLayout
      siderIcons={renderedSiderIcons}
      siderItems={STAFF_SIDEBAR_ITEMS}
    >
      <ConfigProvider locale={viVN}>
        <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span
              className="hover:text-[#F37021] cursor-pointer"
              onClick={() => navigate('/exam-staff/audits')}
            >
              Nhật ký thao tác
            </span>
            <span>/</span>
            <span className="text-slate-800 font-medium">Chi tiết nhật ký</span>
          </div>

          <CardContainer className="!p-0 overflow-hidden">
            <div className="px-4 py-3">
              <div className="flex gap-2 items-center mb-4">
                <span className="material-symbols-outlined text-[#F37021] text-2xl">
                  history
                </span>
                <h1 className="text-xl font-semibold">Chi tiết nhật ký</h1>
              </div>

              <Spin spinning={loading}>
                <div className="space-y-5">
                  <div className="rounded-sm border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 sm:p-5 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-3 min-w-0">
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="inline-flex items-center rounded-md bg-[#F37021]/10 text-[#F37021] px-2.5 py-1 text-xs font-bold border border-[#F37021]/20">
                            {detail?.action ?? '—'}
                          </span>
                          <span className="inline-flex items-center rounded-md bg-slate-100 text-slate-700 px-2.5 py-1 text-xs font-semibold border border-slate-200">
                            {detail?.entityType ?? '—'}
                          </span>
                        </div>
                        {/* <div>
                          <Label>Mã nhật ký</Label>
                          <Value mono>{detail?.auditLogId ?? '—'}</Value>
                        </div> */}
                      </div>
                      <div className="shrink-0 text-left sm:text-right flex items-baseline gap-2">
                        <Label>Thời gian</Label>
                        <p className="text-base font-semibold text-slate-900 tabular-nums">
                          {formatDateTime(detail?.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                      <Label>Người dùng</Label>
                      <Value>{detail?.username ?? '—'}</Value>
                      <Label>Vai trò</Label>
                      <Value>{detail?.role ?? '—'}</Value>
                      <Label>ID</Label>
                      <Value mono>{detail?.entityId ?? '—'}</Value>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50/60 p-4 space-y-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Kỹ thuật
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>IP</Label>
                          <Value mono>{detail?.ipAddress ?? '—'}</Value>
                        </div>
                        <div className="md:col-span-2">
                          <Label>Correlation ID</Label>
                          <Value mono>{detail?.correlationId ?? '—'}</Value>
                        </div>
                        <div className="md:col-span-3">
                          <Label>User-Agent</Label>
                          <p className="text-xs text-slate-700 break-all whitespace-pre-wrap leading-relaxed font-mono bg-white rounded-md border border-slate-200/80 px-3 py-2">
                            {detail?.userAgent ?? '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="flex flex-col rounded-md border border-amber-200/80 bg-amber-50/40 overflow-hidden min-h-[12rem]">
                      <div className="px-3 py-2 border-b border-amber-200/60 bg-amber-100/50">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-900/80">
                          Giá trị cũ
                        </span>
                      </div>
                      <pre className="flex-1 text-xs p-3 m-0 overflow-auto max-h-80 whitespace-pre-wrap break-words text-slate-800 font-mono leading-relaxed">
                        {formatJson(detail?.oldValues)}
                      </pre>
                    </div>
                    <div className="flex flex-col rounded-md border border-emerald-200/80 bg-emerald-50/40 overflow-hidden min-h-[12rem]">
                      <div className="px-3 py-2 border-b border-emerald-200/60 bg-emerald-100/50">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-900/80">
                          Giá trị mới
                        </span>
                      </div>
                      <pre className="flex-1 text-xs p-3 m-0 overflow-auto max-h-80 whitespace-pre-wrap break-words text-slate-800 font-mono leading-relaxed">
                        {formatJson(detail?.newValues)}
                      </pre>
                    </div>
                  </div>
                </div>
              </Spin>
            </div>
          </CardContainer>
        </div>
      </ConfigProvider>
    </MainLayout>
  );
};

export default AuditLogDetailPage;
