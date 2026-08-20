import { InvoiceImageViewer } from './InvoiceImageViewer'

type Props = { message: string; previewUrl: string; onRetry: () => void; onChange: () => void }

export function InvoiceErrorState({ message, previewUrl, onRetry, onChange }: Props) {
  return <section className="mx-auto max-w-xl rounded-2xl bg-white p-6 text-center shadow-sm sm:p-10">
    <InvoiceImageViewer imageUrl={previewUrl} alt="Faktur yang belum berhasil diproses" containerClassName="rounded-xl border border-slate-200" className="mx-auto max-h-72 w-full object-contain" />
    <h2 className="mt-6 text-2xl font-bold text-slate-900">Faktur belum berhasil diproses.</h2>
    <p className="mt-3 leading-7 text-slate-600">{message || 'Pastikan gambar terlihat jelas lalu coba kembali.'}</p>
    <div className="mt-8 grid gap-3 sm:grid-cols-2">
      <button onClick={onRetry} className="rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white transition-colors duration-200 hover:bg-teal-800">Coba Lagi</button>
      <button onClick={onChange} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition-colors duration-200 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-800">Ganti Foto</button>
    </div>
  </section>
}
