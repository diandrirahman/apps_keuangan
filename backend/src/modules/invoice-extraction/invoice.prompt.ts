export const invoiceExtractionPrompt = `Baca gambar faktur ini. Ambil hanya informasi yang terlihat.
Kembalikan JSON valid tanpa markdown dengan struktur berikut:
{
  "invoiceDate": "YYYY-MM-DD atau null",
  "supplierName": "nama supplier atau null",
  "invoiceNumber": "nomor faktur atau null",
  "description": "deskripsi singkat transaksi atau null",
  "total": "angka total tanpa simbol mata uang atau null"
}
Jangan mengarang data. Jika tidak terbaca, gunakan null. Total harus berupa number.`
