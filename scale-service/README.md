# Scale Service — Panduan Menjalankan & Testing

Backend untuk sistem tracking timbangan scrap (`scale-service`). Dokumen ini menjelaskan cara menjalankan aplikasi, urutan testing, dan bagaimana alur kerjanya.

---

## 1. Prasyarat

- Node.js terinstall
- SQL Server terinstall, database `ScrapSystemManagement` sudah dibuat, mixed authentication aktif
- `com0com` terinstall dengan port virtual `COM3` ↔ `COM4` (untuk simulasi hardware; skip kalau sudah pakai hardware asli)
- File `.env` sudah terisi (lihat `.env.example` atau minta ke tim kalau belum ada), minimal berisi:
  ```
  PORT=3001
  DB_HOST=localhost
  DB_PORT=1433
  DB_USER=scrap_app_user
  DB_PASSWORD=***
  DB_NAME=ScrapSystemManagement
  SERIAL_PORT=COM3
  SERIAL_BAUD_RATE=9600
  STATION_CODE=ALMC-01
  CENTRAL_API_BASE_URL=http://localhost:3001
  ```
  `STATION_CODE` diisi sesuai mini PC yang menjalankan edge agent (`ALMC-01` / `DC-01` / `TRUCKSCALE-01`).

Install dependency:
```bash
npm install
```

Jalankan migration (kalau database masih kosong):
```bash
npm run migration:run
```

Daftarkan station (sekali saja, via SSMS):
```sql
USE ScrapSystemManagement;
INSERT INTO stations (id, stationCode, assignedStage, isActive, createdAt)
VALUES
  (NEWID(), 'ALMC-01', 'ALMC', 1, GETDATE()),
  (NEWID(), 'DC-01', 'DC', 1, GETDATE()),
  (NEWID(), 'TRUCKSCALE-01', 'TRUCK_SCALE', 1, GETDATE());
```

---

## 2. Cara Menjalankan

Aplikasi ini terdiri dari **2 entry point terpisah**:

| Entry point | Jalan di | Command | Fungsi |
|---|---|---|---|
| `src/server.ts` | Server pusat (Local Server) | `npm run dev` | Terima push dari edge, handle business logic, akses DB |
| `src/edgeServer.ts` | Tiap mini PC (ALMC/DC/Truck Scale) | `npm run dev:edge` | Baca serial lokal, parse, push ke central |

### Simulasi lokal (development, 1 mesin)

Karena belum ada hardware asli, jalankan 3 terminal:

**Terminal 1 — Central server**
```bash
npm run dev
```
Tunggu sampai muncul `Database connected` dan `[central] scale-service running on port 3001`.

**Terminal 2 — Edge agent (simulasi mini PC, sesuaikan `STATION_CODE` di `.env`)**
```bash
npm run dev:edge
```
Tunggu sampai muncul `[serial-listener] Listening di COM3`.

**Terminal 3 — Mock generator (simulasi hardware timbangan, kirim data ke COM4)**
```bash
npm run mock:scale
```

Kalau ketiganya jalan, Terminal 2 akan menunjukkan log `[edge-agent] Berhasil push reading ke central`, dan data bisa dicek lewat endpoint `live-reading` (lihat bagian testing di bawah).

**Untuk simulasi mini PC lain** (DC, Truck Scale): ganti `STATION_CODE` di `.env` sesuai stage, jalankan `npm run dev:edge` lagi di terminal terpisah. Untuk sekarang, karena baru ada 1 port COM fisik/virtual, mini PC DC/Truck Scale disimulasikan manual lewat REST Client (lihat bagian testing).

### Di production (nanti)

- **Central**: jalan 1 kali di Local Server, `npm run build && npm run start`
- **Edge**: jalan di tiap mini PC fisik yang terhubung ke indikator timbangannya masing-masing, dengan `.env` yang `STATION_CODE`-nya sesuai lokasi, dan `CENTRAL_API_BASE_URL` mengarah ke IP LAN server pusat

---

## 3. Bagaimana Aplikasi Ini Bekerja

### 3.1 Alur Data Timbangan (per stage)

```
1. Indikator timbangan kirim data ASCII via RS-232/RS-485
2. Edge (mini PC) baca serial → convert ke HEX → tulis ke file log mentah (audit trail)
3. Edge baca file log → decode HEX → ASCII → parse ke JSON
4. Edge push hasil parsing ke Central via HTTP (POST /push-reading)
5. Central simpan nilai ini di buffer in-memory (per station), BUKAN langsung ke DB
```

### 3.2 Alur Bisnis (Operator & Approval)

```
1. Operator scan barcode delivery → POST /scan
   → Central cari/buat record WeighingRecord untuk barcode ini

2. Operator lihat nilai timbangan real-time → GET /live-reading (polling)
   → Ambil dari buffer in-memory station terkait

3. Operator yakin dengan nilai yang tampil → POST /:id/submit
   → Nilai dari buffer di-commit ke kolom stage terkait di WeighingRecord
   → Status approval stage ini jadi PENDING
   → Buffer di-clear

   (Kalau operator TIDAK yakin, tinggal tunggu nilai baru dari serial,
    ulangi langkah 2-3 — belum ada yang tersimpan permanen sebelum submit)

4. GL/Manager approve → POST /:id/approve
   → Status jadi APPROVED
   → currentStage record maju ke stage berikutnya
   → Kalau ini approval Truck Scale (stage terakhir): currentStage jadi
     COMPLETED, isPublishedToPublicWeb jadi true

   ATAU GL/Manager reject → POST /:id/reject
   → Status jadi REJECTED, ada rejectionReason
   → Proses untuk stage ini perlu diulang dari langkah 1
```

### 3.3 Validasi Keamanan

- **Validasi station**: tiap request dari mini PC wajib bawa header `x-station-id`. Central cek station itu terdaftar, aktif, dan (untuk `/scan` & `/submit`) stage yang diminta cocok dengan `assignedStage` station tersebut. Mini PC ALMC tidak akan bisa submit data untuk stage DC, misalnya.
- **Validasi stage**: submit/approve/reject akan ditolak kalau `stage` di body tidak sama dengan `currentStage` record — mencegah data ke-submit ke kolom yang salah kalau record sudah lanjut ke stage lain.

---

## 4. Urutan Testing (via REST Client / file `.rest`)

Gunakan file `weighing.rest` yang sudah ada di project. Urutan lengkap 1 siklus:

```http
### 1. Scan — mulai sesi ALMC
POST http://localhost:3001/api/weighing/scan
Content-Type: application/json
x-station-id: ALMC-01

{
  "deliveryBarcode": "DEL-TEST-001",
  "stage": "ALMC"
}

### 2. Cek live-reading (ulangi sampai ada nilai STABLE)
GET http://localhost:3001/api/weighing/live-reading
x-station-id: ALMC-01

### 3. Submit ALMC (copy "id" dari response step 1)
POST http://localhost:3001/api/weighing/{id}/submit
Content-Type: application/json
x-station-id: ALMC-01

{
  "stage": "ALMC",
  "operatorName": "Nama Operator"
}

### 4. Approve ALMC
POST http://localhost:3001/api/weighing/{id}/approve
Content-Type: application/json

{
  "stage": "ALMC",
  "approverName": "Nama Manager"
}

### 5-8. Ulangi pola submit+approve untuk stage DC dan TRUCK_SCALE
### (kalau belum ada edge agent aktif untuk stage itu, simulasikan push-reading manual:)
POST http://localhost:3001/api/weighing/push-reading
Content-Type: application/json
x-station-id: DC-01

{
  "status": "STABLE",
  "weightType": "GROSS",
  "value": 280.50,
  "unit": "kg",
  "rawPayload": "ST,GS,+000280.50,kg",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

**Tanda sukses siklus penuh:** response step approve terakhir (Truck Scale) menunjukkan `currentStage: "COMPLETED"` dan `isPublishedToPublicWeb: true`.

### Test skenario reject (belum divalidasi, disarankan dicoba)

```http
POST http://localhost:3001/api/weighing/{id}/reject
Content-Type: application/json

{
  "stage": "ALMC",
  "approverName": "Nama Manager",
  "reason": "Berat tidak sesuai dokumen"
}
```

### Test skenario validasi (harus gagal — expected error)

- Panggil `/scan` atau `/submit` **tanpa** header `x-station-id` → harus dapat `401`
- Panggil dengan `x-station-id: DC-01` tapi `stage: "ALMC"` di body → harus dapat `403` (mismatch)
- Panggil `/submit` untuk `stage` yang bukan `currentStage` record saat ini → harus dapat error "Stage tidak sesuai"

---

## 5. Struktur Folder Singkat

```
scale-service/
├── src/
│   ├── config/          # database, redis (belum aktif), serial config
│   ├── entities/         # WeighingRecord, Station
│   ├── services/          # business logic (weighingService, serialListener, rawFileWatcher)
│   ├── controllers/        # HTTP handler
│   ├── routes/              # route definitions
│   ├── middlewares/          # stationValidation
│   ├── utils/                 # asciiParser, hexUtils
│   ├── migrations/             # TypeORM migrations
│   ├── mock/                    # mockScaleGenerator (simulasi hardware)
│   ├── server.ts                 # entry point CENTRAL
│   └── edgeServer.ts              # entry point EDGE (mini PC)
├── logs/raw/                       # raw hex log per hari (audit trail)
└── weighing.rest                    # file testing REST Client
```

Untuk detail progres & rencana ke depan, lihat `PROGRESS.md`.
