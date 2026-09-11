export default function StatisticsHeader({
  title,
  subtitle,
  onBack,
  onExportExcel,
  exportingExcel,
}) {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-[#F37021] transition-colors text-sm font-semibold group"
      >
        <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
        Quay lại block
      </button>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 mt-2">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onExportExcel}
            disabled={exportingExcel}
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-[#F37120] text-[#F37120] rounded-xl text-sm font-bold hover:bg-orange-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[20px]">table_view</span>
            {exportingExcel ? 'Đang xuất...' : 'Xuất Excel'}
          </button>
        </div>
      </div>
    </div>
  );
}