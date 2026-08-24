# Scrap System Management — Progress & Roadmap

Dokumen ini merangkum apa yang sudah dibangun, arsitektur yang dipakai, dan apa yang masih perlu dikerjakan pada backend `scale-service`.

---

## 1. Gambaran Umum Sistem

Sistem tracking timbangan scrap/limbah untuk 3 tahap proses: **ALMC → DC → Truck Scale**, dengan approval berjenjang (operator submit → GL/Manager approve) sebelum lanjut ke tahap berikutnya. Data publik (public web) baru terbit setelah tahap Truck Scale disetujui; public dashboard menampilkan semua tahap secara real-time.

### Arsitektur Central–Edge

```
Mini PC ALMC (EDGE)          Mini PC DC (EDGE)          Mini PC Truck Scale (EDGE)
  - Baca RS-232                - Baca RS-232               - Baca RS-232
  - Parse ASCII → JSON          - Parse ASCII → JSON         - Parse ASCII → JSON
  - Push via HTTP  ────┐        - Push via HTTP  ────┐       - Push via HTTP  ────┐
                       ▼                             ▼                            ▼
                              ┌─────────────────────────────┐
                              │   Local Server (CENTRAL)      │
                              │   - Terima push per-station    │
                              │   - Business logic (submit/    │
                              │     approve/reject)            │
                              │   - Database (SQL Server)      │
                              └─────────────────────────────┘
```

Prinsip kunci: **mini PC (edge) tidak pernah akses database langsung** — cuma baca serial, decode, parse, lalu push hasil parsing via HTTP ke server pusat. Server pusat yang pegang semua business logic dan DB.

---

## 2. Tech Stack

| Layer | Teknologi |
|---|---|
| Backend | Express.js + TypeScript |
| ORM | TypeORM |
| Database | SQL Server (native Windows, belum di-Docker-kan) |
| Caching | Redis (di-skip sementara, kode sudah ada tapi di-comment) |
| Komunikasi Edge→Central | HTTP (axios) |
| Serial Communication | `serialport` package, RS-232/RS-485 via COM port |
| Dev tooling | `ts-node-dev`, TypeORM CLI migrations |
| Containerization | Docker (direncanakan, belum dieksekusi — SQL Server tetap native untuk sekarang) |

---

## 3. Yang Sudah Selesai ✅

### 3.1 Setup & Infrastruktur
- Instalasi Node.js, SQL Server, database `ScrapSystemManagement` dibuat
- SQL Server Authentication (mixed mode) diaktifkan, user aplikasi `scrap_app_user` dibuat dengan role `db_owner`
- Struktur folder microservices-ready: `services/scale-service/src/{config,entities,services,controllers,routes,middlewares,utils,types,migrations,mock}`
- TypeORM migration berjalan (`weighing_records`, `stations` sudah ter-generate ke SQL Server)

### 3.2 Simulasi Hardware (Virtual COM Port)
- `com0com` terinstall (dari sumber resmi SourceForge, Windows Test Mode) — pasangan port virtual `COM3` ↔ `COM4`
- Mock generator (`mockScaleGenerator.ts`) mengirim data ASCII dummy format `ST,GS,+000xxx.xx,kg` ke COM4 tiap 3 detik
- **Catatan penting:** format ASCII asli dari hardware real (Avery Weigh-Tronix E1005, ZM510-SDA) belum terverifikasi 100% — riset menemukan bahwa indikator ini pakai protokol keluarga **NCI** (RS-232, 9600 8N1), tapi byte-level raw string belum bisa dikonfirmasi dari dokumentasi publik. Format yang dipakai sekarang adalah **placeholder/inferred**, perlu divalidasi ulang begitu hardware asli tersedia. Model "Kubota KLD 1000S" juga belum terverifikasi keberadaannya — perlu dikonfirmasi ulang nama brand/model-nya.

### 3.3 Pipeline Data (Edge)
Alur lengkap sudah tervalidasi end-to-end:
1. **Serial listener** (`serialListenerService.ts`) — baca data dari COM port, convert ke HEX, tulis ke file log mentah (`logs/raw/weighing-raw-YYYY-MM-DD.log`) — berfungsi sebagai audit trail raw data
2. **Raw file watcher** (`rawFileWatcherService.ts`) — watch file log, baca baris baru, decode HEX → ASCII, parse ke JSON
3. **Edge agent** (`edgeServer.ts`) — jalankan serial listener + file watcher, lalu push hasil parsing ke central via `POST /api/weighing/push-reading`

### 3.4 Central API & Business Logic
- **Entity `WeighingRecord`** — 1 row per `deliveryBarcode`, kolom terpisah per stage (`almc*`, `dc*`, `truckScale*`), masing-masing dengan: weight value, raw payload, CCTV URL (belum dipakai), submit info (by/at), approval info (status/by/at), rejection reason
- **Entity `Station`** — daftar mini PC terdaftar (`stationCode`, `assignedStage`, `allowedIpAddress` opsional, `isActive`)
- **State machine approval 2 lapis:**
  ```
  IDLE → SCANNED → WEIGHING → READY_TO_SUBMIT
    → operator SUBMIT → PENDING (menunggu GL/Manager)
    → GL/Manager APPROVE → lanjut ke stage berikutnya
    → GL/Manager REJECT → perlu diulang dari scan
  ```
- **Buffer in-memory per-station** — nilai stabil terakhir dari tiap mini PC ditampung di memory (bukan langsung ke DB), baru di-commit ke `WeighingRecord` saat operator submit. Ini yang memungkinkan alur retry (timbang ulang) sebelum data final tersimpan.
- **Guard validasi stage** — submit/approve/reject akan ditolak kalau `stage` di request tidak cocok dengan `currentStage` record (mencegah data masuk ke kolom stage yang salah)
- **Validasi network per-station** (`stationValidation.ts`) — middleware `identifyStation` (cek station terdaftar & aktif) dan `validateStationStage` (+ cek kecocokan stage) berdasarkan header `x-station-id`

### 3.5 Integrasi CCTV
- Interface `ICctvProvider` + `MockCctvProvider` — capture snapshot (placeholder file) tiap ada reading `STABLE` di edge, path snapshot ikut terbawa dari edge → buffer central → tersimpan di `*CctvSnapshotUrl` saat submit
- Tervalidasi end-to-end (path file muncul konsisten di live-reading dan setelah submit/approve)
- Real camera provider belum diimplementasi (belum ada akses hardware) — tinggal buat implementasi baru dari interface yang sama

### 3.6 Validasi ke Existing System (Traceability & PO)
- Interface `ITraceabilityProvider` + `IPOProvider`, masing-masing dengan mock implementation berbasis fixture (barcode/lot-batch tertentu menghasilkan skenario gagal yang deterministik untuk testing)
- Validasi dipanggil **di setiap scan**, di stage manapun (bukan cuma sekali di awal) — sesuai kebutuhan bisnis bahwa tiap barang harus tervalidasi ulang sebelum lanjut ke scale berikutnya
- Hasil validasi (`materialLotBatch`, `poNumber`, `isValidatedWithExistingSystem`) ditulis ke record; scan ditolak dengan `422` kalau validasi gagal
- Tervalidasi untuk skenario sukses maupun gagal (traceability not found, PO closed)
- Real API ke sistem existing belum diimplementasi — tinggal buat implementasi baru dari interface yang sama

### 3.7 Alur Reject & Retry
- Tervalidasi end-to-end: submit → reject → scan ulang (barcode sama) → weigh ulang → submit ulang → approve → `currentStage` maju
- **Bug ditemukan & diperbaiki:** `*RejectionReason` sebelumnya tidak ter-reset saat submit ulang, sehingga record yang sudah `APPROVED` masih membawa jejak alasan reject dari percobaan sebelumnya. Fix: `submitWeighing` sekarang set `*RejectionReason = null` di setiap submit baru.

### 3.9 Docker Containerization
Repo di-refactor oleh kolaborator (root folder di-flatten, provider dikelompokkan per domain, `src/edge/` dipisah, ditambah **Swagger UI** di `/docs` dan **docker-compose.yml** yang orkestrasi SQL Server + Redis + app container.

- Berhasil dijalankan penuh: `docker compose up -d` → database dibuat manual → migration dijalankan di dalam container (`npm run migration:run:prod`) → data station di-insert → aplikasi terverifikasi jalan lewat Swagger UI (`http://localhost:3001/docs`)
- **Edge agent TETAP jalan di luar Docker** (langsung di mini PC, `npm run dev:edge`) — akses serial port dari dalam container tidak reliable, terutama di Windows
- Kendala yang ditemukan & solusinya, dicatat untuk referensi:
  - Password `sa` di-set sekali saat container SQL Server pertama init dan disimpan permanen di **volume** — kalau init sempat terganggu (mis. proses ke-interrupt di tengah jalan), password bisa jadi tidak konsisten dengan `.env`; solusi: hapus volume (`docker volume rm ..._sqlserver-data`) dan biarkan re-init dari nol
  - Kalau SQL Server native Windows & SQL Server versi Docker sama-sama terinstall di mesin yang sama, SSMS bisa salah pilih protokol (Shared Memory vs TCP) saat connect ke `localhost` — perlu paksa `tcp:localhost,1433` di Server Name
  - Ditemukan kasus SSMS gagal login terus-menerus (`Error 18456`) padahal password sudah diverifikasi benar lewat `sqlcmd` langsung di container (berkali-kali sukses) — kemungkinan bug/cache lokal di instalasi SSMS itu sendiri; solusi sementara: skip SSMS, jalankan semua setup (create database, cek tabel, insert data) lewat `docker compose exec sqlserver sqlcmd ...` langsung dari command line, yang terbukti selalu berhasil
  - `docker compose ps` kosong / command Docker gagal dengan error `pipe/dockerDesktopLinuxEngine` → tandanya aplikasi Docker Desktop itu sendiri belum dibuka (bukan cuma container berhenti)

### 3.10 Endpoint yang Sudah Ada & Teruji

| Method | Endpoint | Fungsi | Middleware |
|---|---|---|---|
| POST | `/api/weighing/scan` | Mulai sesi timbang (scan barcode) + validasi existing system | `validateStationStage` |
| POST | `/api/weighing/push-reading` | Edge push hasil parsing serial + CCTV snapshot | `identifyStation` |
| GET | `/api/weighing/live-reading` | Polling nilai stabil terkini per-station | `identifyStation` |
| POST | `/api/weighing/:id/submit` | Operator submit hasil timbang | `validateStationStage` |
| POST | `/api/weighing/:id/approve` | GL/Manager approve stage | — |
| POST | `/api/weighing/:id/reject` | GL/Manager reject stage | — |

**Hasil test terakhir (21 Agustus 2026):** siklus penuh `ALMC → DC → TRUCK_SCALE → COMPLETED`, CCTV snapshot, validasi traceability/PO, dan alur reject-retry-approve semuanya tervalidasi end-to-end.

---

## 4. Yang Belum Dikerjakan ⏳

Urutan di bawah bukan prioritas mutlak — didiskusikan lagi sesuai kebutuhan:

1. **Integrasi barcode scanner & printer fisik** — alur "scan barang → print label spesifikasi" dari PPT belum diimplementasi (baru simulasi via REST manual)
2. **Verifikasi format ASCII hardware asli** — perlu capture langsung dari indikator timbangan fisik (Avery Weigh-Tronix E1005 / ZM510-SDA) begitu ada akses, untuk mengganti placeholder format yang dipakai sekarang
3. **Klarifikasi brand "Kubota KLD 1000S"** — belum terverifikasi, mungkin salah catat
4. **Real CCTV provider** — implementasi `ICctvProvider` yang beneran akses kamera, begitu ada akses hardware
5. **Real Traceability & PO provider** — implementasi `ITraceabilityProvider`/`IPOProvider` yang beneran manggil API sistem existing, begitu ada akses
6. **Redis caching** — kode sudah ada, container Redis sudah jalan di Docker Compose, tapi service belum benar-benar dipakai (`connectRedis()` belum dipanggil di `server.ts`)
7. **Endpoint public dashboard & public web** — belum dibuat endpoint terpisah untuk menampilkan data ke 2 kanal ini (saat ini cuma data tersimpan di `WeighingRecord`, belum ada view/endpoint khusus)
8. **Autentikasi & otorisasi user (operator/GL/Manager)** — saat ini `operatorName`/`approverName` dikirim bebas via body request, belum ada sistem login/role yang sesungguhnya
9. **Auth service / user management** — kalau microservices lain (auth-service dll) direncanakan, belum mulai dibangun
10. **CI/CD, deployment production** — belum dibahas sama sekali