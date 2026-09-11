export default function StatisticsSectionCard({ title, extra, children, className = '' }) {
  return (
    <section className={`bg-white rounded-3xl border border-slate-200 shadow-sm ${className}`.trim()}>
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4">
        <h3 className="text-base font-bold text-slate-800">{title}</h3>
        {extra}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}
