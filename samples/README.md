# Sampel Dokumen Transaksi

Sampel lokal diekstrak dari halaman 14-20 `LPJ WMSJ rev.pdf` untuk pengujian pembacaan faktur.

Karena gambar dapat memuat nama, nomor telepon, alamat, rekening, dan data transaksi, seluruh file disimpan di `samples/private/` dan diabaikan oleh Git.

Struktur lokal:

- `private/invoices-receipts/`: 38 faktur, nota, kwitansi, dan struk yang dapat diuji sebagai dokumen tunggal.
- `private/non-invoices/`: 8 bukti transfer, tangkapan layar pesanan, dan label pengiriman untuk pengujian penolakan atau klasifikasi dokumen.
- `private/multi-document/`: 2 gambar berisi lebih dari satu dokumen untuk pengujian deteksi multi-dokumen.

Nama file memakai format `p<halaman>-x<objek>.jpeg`. Akhiran `-a` dan `-b` menandai dua nota yang dipisahkan dari satu foto pada halaman 19.

Sebelum digunakan sebagai dataset evaluasi, setiap sampel positif perlu diberi ground truth yang diverifikasi manusia untuk nama supplier, alamat, tanggal, nomor faktur, rincian barang, harga satuan, jumlah item, dan total.
