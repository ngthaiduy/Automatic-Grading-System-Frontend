export default function StatisticsMetricCards({ cards }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <article
          key={card.key}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-4"
        >
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {card.title}
          </p>
          <div className="flex items-start justify-between mt-3 gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-black text-slate-900 break-words leading-tight">{card.value}</p>
              {card.helper ? (
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{card.helper}</p>
              ) : null}
            </div>
            <span className={`material-symbols-outlined text-[24px] shrink-0 ${card.accent}`}>
              {card.icon}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}