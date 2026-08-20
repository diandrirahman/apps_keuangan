type Props = {
  cooldownSeconds?: number
}

export function InvoiceProcessing({ cooldownSeconds = 0 }: Props) {
  const isWaitingForQuota = cooldownSeconds > 0
  return <section className="mx-auto max-w-xl rounded-2xl bg-white p-10 text-center shadow-sm">
    <div className={`mx-auto h-10 w-10 rounded-full border-4 border-slate-200 border-t-teal-700 ${isWaitingForQuota ? '' : 'animate-spin'}`} />
    <h2 className="mt-6 text-2xl font-bold">{isWaitingForQuota ? 'Menunggu kuota AI...' : 'Membaca faktur...'}</h2>
    <p className="mt-3 text-slate-600">
      {isWaitingForQuota
        ? `Batas request per menit sedang penuh. Proses dilanjutkan otomatis dalam ${cooldownSeconds} detik.`
        : 'AI sedang mengambil informasi dari gambar.'}
    </p>
  </section>
}
