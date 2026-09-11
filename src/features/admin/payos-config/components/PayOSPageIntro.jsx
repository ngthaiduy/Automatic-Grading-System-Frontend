const breadcrumbItems = ['Admin', 'Cấu hình PayOS'];

export default function PayOSPageIntro() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold text-slate-900">Cấu hình PayOS</h1>

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;

          return (
            <div
              key={item}
              className="flex items-center gap-2"
            >
              <span className={isLast ? 'font-semibold text-[#F37021]' : ''}>
                {item}
              </span>

              {!isLast && (
                <span className="material-symbols-outlined text-[14px] text-slate-400">
                  chevron_right
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}