# PRD — Prototype Foto Faktur ke Excel

**Version:** 0.2
**Status:** Implemented Prototype
**Stage:** Prototype
**Current Work:** Frontend and AI extraction validation
**QA:** Manual oleh Project Owner

---

# 1. Product Overview

Prototype ini membantu pengguna mengubah satu atau beberapa foto faktur menjadi data terstruktur menggunakan AI.

Data hasil pembacaan AI akan ditampilkan dalam form yang dapat diperiksa dan diedit oleh pengguna.

Setelah data dianggap benar, pengguna dapat menyalinnya dan melakukan paste langsung ke Microsoft Excel atau aplikasi spreadsheet lainnya.

Prototype ini dibuat untuk **menguji kebutuhan dan penggunaan nyata**, bukan sebagai produk final.

---

# 2. Problem Statement

Sebagian pelaku UMKM masih memindahkan informasi dari faktur ke Excel secara manual.

Proses saat ini:

```text
Menerima faktur
↓
Membaca isi faktur
↓
Membuka Excel
↓
Mengetik ulang data
↓
Memeriksa kembali
```

Masalah dari proses tersebut:

* Membutuhkan input manual.
* Membutuhkan waktu.
* Berpotensi terjadi salah input.
* Pencatatan terasa merepotkan.
* Pencatatan berpotensi tidak dilakukan secara rutin.

Prototype ingin menguji proses yang lebih sederhana, baik untuk satu faktur maupun antrean maksimal 10 faktur:

```text
Foto Faktur
↓
AI Membaca Faktur
↓
Data Ditampilkan
↓
Pengguna Memeriksa
↓
Copy
↓
Paste ke Excel
```

---

# 3. Prototype Goal

Tujuan prototype adalah menguji apakah AI dapat membantu pengguna mengubah faktur menjadi data yang siap dipindahkan ke Excel.

Prototype harus membantu menjawab:

1. Apakah AI dapat membaca informasi utama dari faktur?
2. Apakah hasil AI cukup mudah diperiksa?
3. Apakah pengguna dapat memperbaiki hasil AI yang salah?
4. Apakah format hasil sesuai untuk dipindahkan ke Excel?
5. Apakah proses tersebut lebih praktis dibandingkan mengetik manual?
6. Apakah pengguna bersedia menggunakan prototype kembali?

---

# 4. Target User

Target pengguna awal:

> Pelaku UMKM yang memiliki faktur atau nota transaksi dan masih memindahkan informasi tersebut secara manual ke Excel.

Prototype akan diuji menggunakan faktur nyata dari pengguna.

---

# 5. Core User Flow

```text
Buka Prototype
      ↓
Foto / pilih 1-10 gambar faktur
      ↓
Preview dan atur antrean
      ↓
Klik "Proses Faktur" atau "Proses Semua Faktur"
      ↓
AI memproses setiap gambar satu per satu
      ↓
Hasil setiap faktur ditampilkan
      ↓
Pengguna memeriksa dan menyimpan setiap hasil
      ↓
Pengguna Mengedit Jika Diperlukan
      ↓
Klik "Copy untuk Excel" atau "Copy Semua untuk Excel"
      ↓
Paste ke Excel
      ↓
Proses faktur atau antrean berikutnya
```

Flow tersebut merupakan flow utama prototype.

---

# 6. Prototype Scope

## 6.1 In Scope

Prototype harus memiliki:

* Upload gambar faktur.
* Mengambil foto melalui perangkat yang mendukung kamera.
* Preview gambar.
* Mengganti gambar sebelum diproses.
* Proses gambar menggunakan AI.
* Loading state.
* Menampilkan hasil pembacaan AI.
* Mengedit hasil AI.
* Validasi data dasar.
* Copy hasil untuk Excel.
* Feedback setelah copy berhasil.
* Reset untuk faktur atau antrean berikutnya.
* Memilih maksimal 10 foto faktur dalam satu antrean.
* Memproses antrean satu per satu.
* Meninjau hasil setiap faktur sebelum seluruh data dicopy.
* Memilih jenis transaksi uang masuk atau uang keluar pada setiap faktur.
* Menampilkan rincian barang, jumlah, satuan, harga satuan, dan jumlah item.
* Error state.
* Responsive mobile.
* Responsive desktop.

---

## 6.2 Out of Scope

Prototype tidak memiliki:

* Login.
* Register.
* Database.
* Penyimpanan gambar.
* Penyimpanan hasil AI.
* Riwayat faktur.
* Dashboard.
* Laporan keuangan.
* Penyimpanan atau pencatatan permanen pemasukan/pengeluaran.
* Manajemen stok.
* User management.
* Business management.
* Integrasi iSeller.
* Integrasi POS.
* Integrasi SI APIK.
* Export `.xlsx`.
* Payment.
* Subscription.
* Android native application.
* iOS native application.

Fitur tersebut tidak boleh ditambahkan pada prototype.

---

# 7. Data yang Dibaca

AI hanya perlu mencoba mengambil informasi berikut:

| Field         | Required | Keterangan                  |
| ------------- | -------- | --------------------------- |
| Tanggal       | Ya       | Tanggal faktur              |
| Nama Supplier | Ya       | Nama toko atau supplier     |
| Nomor Faktur  | Tidak    | Nomor faktur jika tersedia  |
| Alamat Toko   | Tidak    | Alamat supplier jika terlihat |
| Total         | Ya       | Total nominal faktur        |
| Rincian Barang | Ya      | Nama, jumlah, satuan, harga satuan, dan jumlah item |

Keterangan dapat digunakan sebagai data bantu pembacaan, tetapi tidak ditampilkan sebagai field edit dan tidak disalin ke Excel. Total dan alamat toko ditampilkan untuk verifikasi, tetapi tidak disalin ke Excel.

---

# 8. AI Output Structure

Contoh response:

```json
{
  "invoiceDate": "2026-08-16",
  "supplierName": "Toko Maju Jaya",
  "invoiceNumber": "INV-0012",
  "description": "Pembelian barang",
  "total": 1250000
}
```

Jika informasi tidak terbaca:

```json
{
  "invoiceDate": null,
  "supplierName": null,
  "invoiceNumber": null,
  "description": null,
  "total": null
}
```

---

# 9. AI Rules

AI harus mengikuti aturan:

1. Hanya mengambil informasi yang terlihat pada gambar.
2. Tidak boleh mengarang informasi.
3. Jika informasi tidak terbaca, gunakan `null`.
4. Total dikembalikan sebagai angka.
5. Simbol mata uang tidak dimasukkan ke nilai numerik.
6. Tanggal menggunakan format `YYYY-MM-DD`.
7. Output AI dianggap sebagai draft.
8. Pengguna harus dapat mengedit hasil.
9. AI tidak boleh langsung dianggap sebagai sumber data final.

---

# 10. Functional Requirements

## FR-01 — Upload Faktur

Pengguna dapat memilih satu atau beberapa gambar faktur dari perangkat. Satu gambar hanya boleh berisi satu faktur dan satu antrean maksimal berisi 10 gambar.

Format:

```text
JPG
JPEG
PNG
WEBP
```

File yang tidak didukung harus ditolak dengan pesan yang mudah dipahami.

---

## FR-02 — Ambil Foto

Pada perangkat yang mendukung kamera, pengguna dapat mengambil foto faktur langsung melalui browser.

---

## FR-03 — Preview Gambar

Setelah gambar dipilih, sistem harus menampilkan preview.

Pengguna dapat memilih:

```text
[Ganti Foto]

[Proses Faktur]
```

Gambar tidak boleh langsung diproses tanpa konfirmasi pengguna.

---

## FR-04 — Proses Faktur

Ketika pengguna menekan:

```text
Proses Faktur
```

sistem melakukan:

```text
Frontend
↓
Upload gambar ke backend
↓
Backend memvalidasi gambar
↓
Backend mengirim gambar ke AI
↓
AI melakukan extraction
↓
Backend memvalidasi output
↓
Frontend menerima hasil
```

Selama proses berjalan, loading state harus ditampilkan.

---

## FR-05 — Hasil Pembacaan

Data AI ditampilkan dalam form.

Contoh:

```text
Tanggal
[16/08/2026]

Nama Supplier
[Toko Maju Jaya]

Nomor Faktur
[INV-0012]

Total
[1.250.000]

Rincian Barang
[Nama] [Jumlah] [Satuan] [Harga Satuan] [Jumlah Item]
```

---

## FR-06 — Edit Result

Seluruh field hasil AI harus dapat diedit.

Pengguna memiliki keputusan akhir terhadap data yang akan dicopy.

---

## FR-07 — Validation

Sebelum data dicopy:

* Total harus berupa angka jika terisi.
* Struktur form harus valid.
* Field opsional boleh kosong.
* Field yang tidak terbaca AI dapat diisi manual.

Frontend menggunakan:

```text
React Hook Form
+
Zod
```

---

## FR-08 — Copy untuk Excel

Pengguna dapat menekan:

```text
Copy untuk Excel
```

Data disalin menggunakan format **Tab-Separated Values (TSV)**. Untuk setiap barang dibuat satu baris dengan urutan kolom:

```text
Tanggal	Jenis Transaksi	Supplier	Nomor Faktur	Nama Barang	Jumlah	Satuan	Harga Satuan	Jumlah Item
```

Total faktur, keterangan, dan alamat toko tidak disalin ke Excel.

Contoh:

```text
2026-08-16	Uang Keluar	Toko Maju Jaya	INV-0012	Keripik Kentang	2	bks	10000	20000
```

Ketika dipaste ke Excel, setiap barang menjadi satu baris. Faktur dengan beberapa barang mengulang tanggal, jenis transaksi, supplier, dan nomor faktur pada setiap baris.

---

## FR-09 — Copy Success

Setelah copy berhasil:

```text
✓ Data berhasil dicopy
```

Gunakan toast atau inline notification.

Tidak perlu halaman baru.

---

## FR-10 — Proses Faktur atau Antrean Lain

Pengguna dapat memilih:

```text
Proses Faktur Lain
```

State sebelumnya dihapus dan aplikasi kembali ke kondisi awal. Pada mode batch, seluruh data hanya dapat dicopy setelah semua faktur berhasil diperiksa; faktur gagal harus dicoba ulang atau dihapus.

---

## FR-11 — Error Processing

Jika pemrosesan gagal:

```text
Faktur belum berhasil diproses.

Pastikan gambar terlihat jelas lalu coba kembali.

[Coba Lagi]

[Ganti Foto]
```

Technical error tidak boleh ditampilkan langsung kepada pengguna.

Jika Gemini mengembalikan `429` karena batas request per menit:

```text
Menunggu kuota AI...

Proses akan dilanjutkan otomatis dalam 30 detik.
```

Aturan Free Tier:

* Awal setiap request AI diberi jarak minimal 6 detik.
* Backend mengembalikan HTTP `429` dan `Retry-After`; backend tidak melakukan retry cepat untuk rate limit.
* Frontend menghentikan sementara seluruh antrean sesuai `Retry-After`, lalu mencoba faktur yang sama satu kali secara otomatis.
* Waktu tunggu dibatasi antara 5 sampai 60 detik, dengan fallback 30 detik.
* Jika percobaan otomatis masih terkena rate limit, faktur ditandai gagal dan pengguna dapat mencoba lagi secara manual.
* Retry backend hanya dilakukan satu kali untuk timeout, gangguan upstream, atau respons AI yang tidak valid, menggunakan exponential backoff dan jitter.

---

# 11. UI/UX Requirements

Prototype harus:

* Mobile-first.
* Responsive.
* Sederhana.
* Bersih.
* Mudah dipahami.
* Menggunakan Bahasa Indonesia.
* Fokus pada satu pekerjaan utama.
* Mudah digunakan pengguna non-teknis.
* Memiliki hierarchy visual yang jelas.
* Memiliki CTA utama yang mudah ditemukan.

Prototype bukan:

```text
Admin Dashboard
Financial Dashboard
Enterprise Dashboard
SaaS Landing Page
```

Hindari:

* Sidebar yang tidak diperlukan.
* Navbar kompleks.
* Card berlebihan.
* Gradient berlebihan.
* Efek visual tanpa fungsi.
* Ornamen AI yang tidak diperlukan.
* Informasi teknis.

---

# 12. Required Figma Screens / States

## 12.1 Upload

Minimum:

```text
Ubah Faktur Menjadi Data Excel

Foto atau upload faktur dan sistem akan
membantu mengambil datanya.

[Ambil Foto]

[Pilih Gambar]
```

---

## 12.2 Preview

```text
Periksa Foto Faktur

[Preview Faktur]

Pastikan tulisan terlihat jelas dan seluruh
faktur masuk ke dalam foto.

[Ganti Foto]

[Proses Faktur]
```

---

## 12.3 Processing

```text
Membaca faktur...

AI sedang mengambil informasi dari gambar.
```

Gunakan loading indicator sederhana.

---

## 12.4 Result

```text
Hasil Pembacaan Faktur

Tanggal
[____________]

Nama Supplier
[____________]

Nomor Faktur
[____________]

Total
[____________]

Rincian Barang
[Nama] [Jumlah] [Satuan] [Harga Satuan] [Jumlah Item]

[Copy untuk Excel]

[Proses Faktur Lain]
```

---

## 12.5 Copy Success

```text
✓ Data berhasil dicopy
```

---

## 12.6 Error

```text
Faktur belum berhasil diproses.

Pastikan foto terlihat jelas lalu coba kembali.

[Coba Lagi]

[Ganti Foto]
```

---

# 13. Responsive Behaviour

## Mobile

Mobile menjadi prioritas utama.

Gunakan:

```text
Single-column layout
```

Preview gambar berada di atas.

Form berada di bawah.

CTA utama harus mudah dijangkau.

---

## Desktop

Untuk result page dapat menggunakan:

```text
┌───────────────────────┬───────────────────────┐
│                       │                       │
│    Preview Faktur     │      Form Hasil       │
│                       │                       │
│                       │                       │
└───────────────────────┴───────────────────────┘
```

Pada layar kecil, layout kembali menjadi satu kolom.

---

# 14. Tech Stack

## Frontend

```text
React
TypeScript
Vite
Tailwind CSS
React Hook Form
Zod
```

## Backend

```text
Node.js
Express.js
TypeScript
Zod
```

## AI

```text
Gemini API
```

## Database

```text
Tidak digunakan.
```

---

# 15. High-Level Architecture

```text
Browser
   ↓
React Frontend
   ↓
Express Backend
   ↓
Gemini API
   ↓
Express Backend
   ↓
React Result Form
```

Gemini API key hanya berada di backend.

API key tidak boleh diekspos ke frontend.

---

# 16. Backend API

Prototype hanya membutuhkan satu endpoint utama. Antrean batch dikelola frontend dan setiap request tetap mengirim satu gambar:

```http
POST /api/invoices/extract
```

Request:

```text
Content-Type: multipart/form-data

image: <image-file>
```

Response:

```json
{
  "invoiceDate": "2026-08-16",
  "supplierName": "Toko Maju Jaya",
  "invoiceNumber": "INV-0012",
  "description": "Pembelian barang",
  "items": [
    {
      "name": "Keripik Kentang",
      "quantity": 2,
      "unit": "bks",
      "unitPrice": 10000,
      "lineTotal": 20000
    }
  ],
  "total": 1250000
}
```

---

# 17. Data Storage Policy

Prototype tidak menggunakan database.

Prototype tidak menyimpan secara permanen:

* Gambar faktur.
* Hasil pembacaan AI.
* Data pengguna.
* Riwayat pemrosesan.

Data hanya digunakan selama proses request dan sesi halaman berlangsung. State antrean berada di memory browser dan hilang ketika halaman dimuat ulang.

---

# 18. Code Quality Principles

Walaupun project masih berupa prototype, kode harus:

```text
Readable
Simple
Modular
Predictable
Maintainable
Extensible
```

Prototype tidak boleh menggunakan pendekatan:

```text
"Yang penting jalan."
```

Namun project juga tidak boleh mengalami over-engineering.

---

# 19. Readability

Kode harus mudah dipahami oleh developer lain, termasuk developer junior yang baru mengenal project.

Prioritaskan kode eksplisit dibanding kode yang terlalu pintar atau terlalu abstrak.

Hindari:

```ts
const x = await p(f).then(r => t(r));
```

Gunakan:

```ts
const extractionResult = await extractInvoice(imageFile);

const validatedInvoice =
  validateExtractionResult(extractionResult);
```

---

# 20. Naming Convention

Gunakan nama yang menjelaskan tujuan.

Contoh:

```text
InvoiceUploader
InvoicePreview
InvoiceResultForm
InvoiceProcessing
InvoiceErrorState

extractInvoice
validateInvoiceResult
formatInvoiceForExcel
copyInvoiceToClipboard
```

Hindari nama:

```text
data
temp
processData
handler2
utils2
doStuff
finalResult2
```

---

# 21. Single Responsibility

Satu component, function, atau file harus memiliki satu tanggung jawab utama.

Contoh:

```text
InvoiceUploader
→ memilih gambar

InvoicePreview
→ menampilkan preview

InvoiceResultForm
→ menangani form hasil

invoice.api
→ komunikasi dengan backend

invoice.schema
→ validation

GeminiProvider
→ integrasi Gemini
```

Jangan membuat semua logic berada di `App.tsx`.

---

# 22. Architecture Style

Gunakan:

```text
Feature-Based Architecture
```

untuk frontend.

Gunakan:

```text
Modular Layered Architecture
```

untuk backend.

Prototype tetap berupa:

```text
React Frontend
+
Express Backend
```

Tidak menggunakan microservices.

---

# 23. Frontend Folder Structure

Gunakan struktur:

```text
frontend/
├── public/
│
├── src/
│   ├── app/
│   │   └── App.tsx
│   │
│   ├── assets/
│   │
│   ├── components/
│   │   └── ui/
│   │
│   ├── features/
│   │   └── invoice-extraction/
│   │       ├── components/
│   │       │   ├── InvoiceUploader.tsx
│   │       │   ├── InvoicePreview.tsx
│   │       │   ├── InvoiceProcessing.tsx
│   │       │   ├── InvoiceResultForm.tsx
│   │       │   └── InvoiceErrorState.tsx
│   │       │
│   │       ├── hooks/
│   │       │   └── useInvoiceBatch.ts
│   │       │
│   │       ├── schemas/
│   │       │   └── invoice.schema.ts
│   │       │
│   │       ├── services/
│   │       │   └── invoice.api.ts
│   │       │
│   │       ├── types/
│   │       │   └── invoice.types.ts
│   │       │
│   │       └── utils/
│   │           └── invoiceClipboard.ts
│   │
│   ├── lib/
│   │
│   ├── styles/
│   │
│   └── main.tsx
│
├── package.json
├── tsconfig.json
└── vite.config.ts
```

Tidak semua folder wajib dibuat sejak awal.

Jika folder belum memiliki fungsi, jangan dibuat kosong hanya untuk mengikuti struktur.

---

# 24. Frontend Responsibilities

## `app/`

Application-level setup.

Jangan menaruh invoice business logic di sini.

---

## `components/ui/`

Reusable generic UI.

Contoh:

```text
Button
Input
Spinner
Toast
```

Component ini tidak mengetahui business logic invoice.

---

## `features/invoice-extraction/`

Seluruh logic khusus invoice extraction berada di sini.

Tujuannya agar developer dapat memahami fitur dari satu lokasi.

---

## `hooks/`

Digunakan jika diperlukan untuk mengelola state atau reusable React logic.

Contoh state:

```text
idle
preview
processing
success
error
```

---

## `services/`

Berisi komunikasi API.

Contoh:

```ts
extractInvoice()
```

HTTP request tidak perlu ditulis langsung di component UI.

---

## `schemas/`

Berisi Zod schema.

Digunakan untuk:

* Form validation.
* API validation.
* Type inference.

---

## `types/`

Berisi TypeScript type yang memang diperlukan.

Jangan menduplikasi type jika dapat menggunakan:

```ts
z.infer
```

---

## `utils/`

Hanya untuk pure helper yang jelas.

Contoh:

```text
formatInvoiceForExcel
copyInvoiceToClipboard
```

Folder `utils` tidak boleh menjadi tempat menaruh function secara sembarangan.

---

# 25. Backend Folder Structure

Gunakan:

```text
backend/
├── src/
│   ├── app.ts
│   ├── server.ts
│   │
│   ├── config/
│   │   └── env.ts
│   │
│   ├── modules/
│   │   └── invoice-extraction/
│   │       ├── invoice.route.ts
│   │       ├── invoice.controller.ts
│   │       ├── invoice.service.ts
│   │       ├── invoice.schema.ts
│   │       ├── invoice.types.ts
│   │       └── invoice.prompt.ts
│   │
│   ├── providers/
│   │   └── ai/
│   │       └── gemini.provider.ts
│   │
│   ├── middlewares/
│   │   ├── error.middleware.ts
│   │   └── upload.middleware.ts
│   │
│   └── shared/
│
├── package.json
└── tsconfig.json
```

Repository layer tidak diperlukan karena tidak ada database.

---

# 26. Backend Layer Responsibility

Backend mengikuti:

```text
Route
↓
Controller
↓
Service
↓
Provider
```

## Route

Mendefinisikan endpoint.

Tidak berisi business logic.

---

## Controller

Bertanggung jawab pada HTTP layer:

```text
receive request
↓
call service
↓
return response
```

Controller tidak boleh berisi prompt Gemini atau AI logic kompleks.

---

## Service

Berisi application logic:

```text
validate input
↓
call AI provider
↓
validate result
↓
return application result
```

---

## Provider

Mengelola integrasi external service.

Untuk prototype:

```text
GeminiProvider
```

Provider mengetahui detail:

* Gemini SDK.
* Model.
* Request.
* Provider response.
* Provider-specific errors.

Application logic tidak boleh bergantung langsung kepada SDK Gemini.

---

## Prompt

AI prompt harus dipisahkan:

```text
invoice.prompt.ts
```

Prompt tidak boleh dicampurkan di controller.

Tujuannya agar prompt mudah:

* Dibaca.
* Dievaluasi.
* Diubah.
* Diuji.

---

# 27. Dependency Direction

Frontend:

```text
Feature Component
↓
Hook
↓
Service
↓
Backend API
```

Backend:

```text
Route
↓
Controller
↓
Service
↓
Provider
```

Hindari dependency terbalik atau circular dependency.

---

# 28. Separation of Concerns

Pisahkan:

```text
UI rendering
Form state
Validation
HTTP communication
AI processing
AI prompt
Clipboard formatting
Error handling
```

Jangan mencampur seluruh concern dalam satu file.

---

# 29. Function Design

Function harus:

* Memiliki tujuan jelas.
* Memiliki nama jelas.
* Tidak memiliki responsibility berlebihan.
* Menghindari side effect yang tidak perlu.
* Tidak menerima parameter yang tidak digunakan.

Contoh:

```ts
function formatInvoiceForExcel(
  invoice: InvoiceFormData
): string {
  // ...
}
```

Hindari:

```ts
function processData(data: any) {
  // validate
  // API
  // format
  // copy
  // update state
  // error handling
}
```

---

# 30. TypeScript Rules

Hindari:

```ts
any
```

kecuali benar-benar diperlukan dan memiliki alasan jelas.

Prioritaskan:

```text
Domain types
Zod inference
unknown untuk untrusted external data
```

Data dari:

```text
Gemini
HTTP request
External API
```

harus dianggap tidak dipercaya sampai tervalidasi.

---

# 31. Error Handling

Error harus ditangani sesuai layer.

Contoh:

```text
GeminiProvider
↓
Provider-specific error

InvoiceService
↓
Application error

Controller
↓
HTTP response

Frontend
↓
User-friendly message
```

Jangan menampilkan:

```text
GeminiError: 503 RESOURCE_EXHAUSTED
```

kepada pengguna.

Gunakan:

```text
Faktur belum berhasil diproses.
Silakan coba kembali.
```

Rate limit merupakan kondisi sementara, bukan kegagalan pembacaan faktur. Backend mengirim `429` dengan waktu tunggu, sedangkan frontend menampilkan countdown dan melanjutkan antrean secara otomatis. Throttle memory backend bersifat best-effort per server instance; penggunaan beberapa instance atau banyak pengguna tetap berbagi kuota Gemini pada level project.

---

# 32. Scalability Definition

Dalam prototype ini, scalable berarti:

```text
Mudah membaca source code
Mudah menambahkan fitur
Mudah mengganti implementation
Mudah melakukan testing
Mudah melakukan refactor
Dependency jelas
Tidak tightly coupled
```

Scalable **tidak berarti**:

```text
Microservices
Redis
Message Queue
Kubernetes
Distributed System
Complex Infrastructure
```

Hal tersebut tidak diperlukan pada prototype.

---

# 33. Avoid Over-Engineering

Jangan membuat abstraction untuk kebutuhan yang belum ada.

Tidak diperlukan:

```text
BaseController
BaseService
BaseRepository
GenericRepository<T>
AbstractAIFactory
Event Bus
CQRS
Microservices
Plugin Architecture
```

Buat abstraction ketika terdapat kebutuhan nyata.

---

# 34. Clean Code Priority

Urutan prioritas:

```text
Correctness
↓
Readability
↓
Maintainability
↓
Testability
↓
Performance Optimization
```

Jangan mengorbankan readability untuk micro-optimization.

---

# 35. Comment Rules

Komentar digunakan untuk menjelaskan:

```text
WHY
```

bukan menjelaskan ulang apa yang sudah jelas dari kode.

Hindari:

```ts
// Set loading to true
setLoading(true);
```

Komentar yang berguna:

```ts
// TSV is used so pasted values are automatically
// separated into Excel columns.
```

---

# 36. Code Quality Rules

Codex harus:

1. Menggunakan descriptive naming.
2. Memisahkan responsibility.
3. Menghindari component atau function terlalu besar.
4. Memisahkan UI dari application logic.
5. Memisahkan integration dari business logic.
6. Menghindari `any` tanpa alasan.
7. Tidak menyimpan dead code.
8. Tidak menyimpan commented-out implementation.
9. Tidak membuat speculative abstraction.
10. Tidak menambah dependency tanpa kebutuhan.
11. Tidak membuat folder kosong hanya karena template.
12. Menggunakan import convention yang konsisten.
13. Menangani error secara eksplisit.
14. Memvalidasi external data.
15. Menjaga scope prototype.

---

# 37. Testing-Friendly Design

Business logic yang penting harus dapat diuji tanpa membutuhkan UI.

Contoh:

```text
validateExtractionResult()
formatInvoiceForExcel()
```

Integrasi Gemini harus berada di provider agar dapat dimock saat testing.

---

# 38. Implementation Order

Pengerjaan dilakukan dengan urutan:

```text
1. UI/UX Design di Figma
        ↓
2. Review Project Owner
        ↓
3. Approval Project Owner
        ↓
4. Frontend Implementation
        ↓
5. Backend Implementation
        ↓
6. Gemini Integration
        ↓
7. Frontend + Backend Integration
        ↓
8. Automated Technical Checks
        ↓
9. Manual QA Project Owner
        ↓
10. User Testing
```

Saat ini implementasi prototype dan validasi menggunakan faktur nyata sedang berlangsung.

---

# 39. Automated Technical Checks

Codex menjalankan technical check yang relevan dan tersedia.

Contoh:

```bash
npm run lint
npm run build
npm test
```

Jika test belum tersedia untuk suatu bagian sederhana, Codex tidak perlu membuat sistem test yang berlebihan hanya untuk prototype.

---

# 40. Manual QA Policy

Manual QA dilakukan langsung oleh Project Owner.

Codex tidak perlu meminta:

* Screenshot evidence.
* Video evidence.
* QA document.
* Proof folder.
* Manual QA report.

Pernyataan Project Owner bahwa manual QA selesai dianggap cukup.

---

# 41. Manual QA Checklist

Project Owner memeriksa:

* [ ] Upload gambar.
* [ ] Ambil foto.
* [ ] Preview gambar.
* [ ] Ganti gambar.
* [ ] Proses faktur.
* [ ] Loading state.
* [ ] Hasil AI.
* [ ] Edit hasil.
* [ ] Validation.
* [ ] Copy untuk Excel.
* [ ] Paste ke Excel.
* [ ] Copy success state.
* [ ] Reset.
* [ ] Error state.
* [ ] Mobile layout.
* [ ] Desktop layout.

---

# 42. User Testing

Setelah prototype lolos manual QA, prototype diberikan kepada pengguna untuk diuji dengan faktur nyata.

Hal yang diamati:

1. Apakah pengguna memahami cara upload?
2. Apakah pengguna memahami alur tanpa banyak bantuan?
3. Apakah AI membaca data dengan benar?
4. Field apa yang paling sering salah?
5. Apakah pengguna mudah memperbaiki hasil?
6. Apakah hasil copy sesuai dengan Excel pengguna?
7. Apakah proses lebih praktis daripada mengetik manual?
8. Apakah pengguna bersedia menggunakan prototype kembali?

Jangan hanya menanyakan:

```text
"Bagus atau tidak?"
```

Perilaku penggunaan lebih penting daripada pujian pengguna.

---

# 43. Prototype Success Criteria

Prototype dianggap memberikan sinyal positif apabila:

* Core flow berjalan tanpa blocker.
* Faktur dengan gambar jelas dapat diproses.
* Informasi utama dapat diekstraksi dengan cukup konsisten.
* Kesalahan AI mudah diperbaiki.
* Data dapat dicopy ke Excel dengan benar.
* Pengguna memahami alur tanpa banyak bantuan.
* Proses terasa lebih praktis dibanding input manual.
* Pengguna bersedia menggunakan prototype kembali.

Prototype tidak membutuhkan akurasi AI 100%.

---

# 44. Definition of Done

Prototype selesai ketika:

* [ ] UI/UX Figma selesai.
* [ ] UI/UX disetujui Project Owner.
* [ ] Upload gambar bekerja.
* [ ] Kamera bekerja pada perangkat yang mendukung.
* [ ] Preview bekerja.
* [ ] AI processing bekerja.
* [ ] Loading state tersedia.
* [ ] Output AI terstruktur.
* [ ] Hasil tampil dalam form.
* [ ] Hasil dapat diedit.
* [ ] Validation bekerja.
* [ ] Copy ke Excel bekerja.
* [ ] Paste ke Excel menghasilkan kolom yang sesuai.
* [ ] Copy feedback bekerja.
* [ ] Reset bekerja.
* [ ] Error state tersedia.
* [ ] Mobile responsive.
* [ ] Desktop responsive.
* [ ] Source code mudah dibaca.
* [ ] Struktur folder mengikuti architecture yang ditentukan.
* [ ] Tidak ada unnecessary architecture.
* [ ] Automated technical check yang tersedia berhasil.
* [ ] Project Owner telah menyelesaikan manual QA.
* [ ] Prototype siap diberikan kepada pengguna.

---

# 45. Scope Lock

Selama pengerjaan prototype:

> Implementasikan hanya requirement dalam PRD ini.

Jangan menambahkan:

```text
Authentication
Database
Dashboard
History
Financial Report
Accounting
Inventory
POS Integration
iSeller Integration
SI APIK Integration
Subscription
Payment
Native Mobile Application
```

Jangan membuat fitur masa depan hanya untuk persiapan.

Jika muncul ide baru:

```text
CATAT
↓
JANGAN IMPLEMENTASIKAN
↓
BAHAS SETELAH USER TESTING
```

---

# 46. Architecture Scope Lock

Codex tidak boleh memperkenalkan tanpa approval:

```text
Framework baru
Database
Redis
Queue
Microservices
Docker infrastructure kompleks
Repository layer
CQRS
Event-driven architecture
Additional external services
```

Jika terdapat dua pendekatan yang sama-sama benar, pilih yang:

```text
Lebih sederhana
Lebih eksplisit
Lebih mudah dibaca
Lebih mudah diuji
Lebih sedikit dependency
```

---

# 47. Codex Working Rules

Sebelum membuat perubahan, Codex harus memeriksa:

```text
Apakah perubahan diperlukan PRD?

Apakah kode mudah dibaca?

Apakah responsibility berada di layer yang tepat?

Apakah abstraction ini memang dibutuhkan sekarang?

Apakah developer lain dapat memahami flow project?

Apakah solusi sederhana sudah cukup?

Apakah perubahan masih berada dalam scope prototype?
```

Codex tidak boleh memperluas scope atas inisiatif sendiri.

---

# 48. Current Development Instruction

```text
CURRENT STAGE:
Prototype

CURRENT TASK:
Validate single and batch invoice processing.

CURRENT PRIORITY:
Validate the core user flow and AI extraction with real invoices.
```

React frontend, Express backend, dan Gemini integration telah diimplementasikan. Perubahan berikutnya tetap dibatasi pada prototype yang didefinisikan dalam PRD ini dan instruksi eksplisit Project Owner.

---

# 49. Prototype Boundary

PRD ini berakhir pada:

```text
Prototype selesai
↓
Manual QA selesai
↓
Prototype diuji oleh user
↓
Hasil user testing diperoleh
```

PRD ini **tidak menentukan arah bisnis atau fitur produk setelah prototype**.

Jika prototype terbukti berguna dan memiliki potensi untuk dikembangkan menjadi bisnis, kebutuhan dan PRD berikutnya akan dibahas berdasarkan hasil user testing.
