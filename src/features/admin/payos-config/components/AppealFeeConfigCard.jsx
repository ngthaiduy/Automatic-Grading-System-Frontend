const inputClassName =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-[#F37021] focus:ring-4 focus:ring-[#F37021]/10';

export default function AppealFeeConfigCard({ values, onChange, onSave }) {
  return (
    <section className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-[#F37021]">payments</span>
        <h2 className="text-lg font-bold text-slate-900">
          Cấu hình phí phúc khảo
        </h2>
      </div>

      <div className="flex-1 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Phí phúc khảo (VND)
          </span>

          <div className="relative">
            <input
              className={`${inputClassName} pr-16`}
              type="text"
              value={values.appealFee}
              onChange={(event) => onChange('appealFee', event.target.value)}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold uppercase text-slate-400">
              VND
            </span>
          </div>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Thời gian hết hạn thanh toán
          </span>

          <div className="relative">
            <input
              className={`${inputClassName} pr-16`}
              type="text"
              value={values.paymentExpiryMinutes}
              onChange={(event) =>
                onChange('paymentExpiryMinutes', event.target.value)
              }
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
              phút
            </span>
          </div>
        </label>

        <div className="rounded-2xl border border-[#F37021]/10 bg-[#F37021]/5 p-4">
          <div className="flex gap-3">
            <span className="material-symbols-outlined text-[20px] text-[#F37021]">
              info
            </span>
            <div className="space-y-1 text-xs leading-relaxed text-slate-600">
              <p className="font-semibold text-slate-800">Chính sách hoàn phí:</p>
              <p>
                Lưu ý rằng các giao dịch phúc khảo sẽ không được hoàn lại tự
                động qua PayOS. Quản trị viên cần xử lý hoàn tiền thủ công nếu
                kết quả phúc khảo thay đổi điểm số của sinh viên theo quy định
                của nhà trường.
              </p>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onSave}
        className="mt-6 w-full rounded-xl border border-[#F37021] px-4 py-2.5 text-sm font-semibold text-[#F37021] transition hover:bg-[#F37021]/5"
      >
        Cập nhật thiết lập phí
      </button>
    </section>
  );
}