const inputClassName =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-[#F37021] focus:ring-4 focus:ring-[#F37021]/10';

export default function MerchantConfigCard({
  values,
  connectionStatus,
  onChange,
  onSave,
  onTestConnection,
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-[#F37021]">store</span>
        <h2 className="text-lg font-bold text-slate-900">Cấu hình Merchant</h2>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Client ID
          </span>
          <input
            className={inputClassName}
            type="password"
            value={values.clientId}
            placeholder="Nhập Client ID"
            onChange={(event) => onChange('clientId', event.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            API Key
          </span>
          <input
            className={inputClassName}
            type="password"
            value={values.apiKey}
            placeholder="Nhập API Key"
            onChange={(event) => onChange('apiKey', event.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Checksum Key
          </span>
          <input
            className={inputClassName}
            type="password"
            value={values.checksumKey}
            placeholder="Nhập Checksum Key"
            onChange={(event) => onChange('checksumKey', event.target.value)}
          />
        </label>

        {connectionStatus && (
          <div className="flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <span className="material-symbols-outlined text-[20px]">
              check_circle
            </span>
            <p className="font-medium">{connectionStatus}</p>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <button
            type="button"
            onClick={onSave}
            className="flex-1 rounded-xl bg-[#F37021] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#F37021]/20 transition hover:bg-[#df6519]"
          >
            Lưu cấu hình
          </button>

          <button
            type="button"
            onClick={onTestConnection}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Test Connection
          </button>
        </div>
      </div>
    </section>
  );
}