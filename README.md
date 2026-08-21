# Scrap System Management — Scale Service

Backend untuk sistem tracking timbangan scrap (limbah industri) berbasis arsitektur **Central–Edge**, dengan 3 tahapan penimbangan: **ALMC → DC → Truck Scale** disertai validasi ke sistem Traceability & Purchase Order (PO) dan approval berjenjang.

---

## 1. Prasyarat & Menjalankan

### Opsi A: Menggunakan Docker Compose (Direkomendasikan)

Semua dependensi (SQL Server 2022, Redis 7, dan Node.js app) otomatis terkonfigurasi.

1. **Siapkan Environment File:**
   ```bash
   cp .env.example .env
   ```

2. **Jalankan Semua Service:**
   ```bash
   docker compose up -d --build
   ```

3. **Jalankan Database Migration (sekali saja saat awal):**
   ```bash
   docker compose exec -T app npm run migration:run:prod
   ```

4. **Daftarkan Station Awal (sekali saja):**
   ```bash
   docker compose exec -T sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'StrongP@ssw0rd!' -d ScrapSystemManagement -C -Q "
   IF NOT EXISTS (SELECT 1 FROM stations WHERE stationCode = 'ALMC-01')
   BEGIN
     INSERT INTO stations (id, stationCode, assignedStage, isActive, createdAt)
     VALUES
       (NEWID(), 'ALMC-01', 'ALMC', 1, GETDATE()),
       (NEWID(), 'DC-01', 'DC', 1, GETDATE()),
       (NEWID(), 'TRUCKSCALE-01', 'TRUCK_SCALE', 1, GETDATE());
   END
   SELECT stationCode, assignedStage, isActive FROM stations;
   "
   ```

5. **Akses Swagger UI di Browser:**
   👉 **`http://localhost:3001/docs`** (atau cukup `http://localhost:3001`)

---

### Opsi B: Menjalankan Secara Manual (Development Lokal)

- Node.js 20+
- SQL Server lokal aktif dengan database `ScrapSystemManagement`
- `com0com` (virtual COM port `COM3` ↔ `COM4`) untuk simulasi hardware

1. **Install Dependensi:**
   ```bash
   npm install
   ```

2. **Jalankan Migration:**
   ```bash
   npm run migration:run
   ```

3. **Jalankan Central Server:**
   ```bash
   npm run dev
   ```

---

## 2. Menjalankan Komponen Tambahan (Simulasi Edge & Hardware)

Aplikasi memiliki 2 entry point:

| Entry Point | Lokasi Eksekusi | Command | Deskripsi |
|---|---|---|---|
| `src/server.ts` | Central Server (Local Server / Docker) | `npm run dev` | Menampung buffer, business logic, DB, & REST API |
| `src/edgeServer.ts` | Mini PC di setiap Station timbangan | `npm run dev:edge` | Membaca port RS-232, parse, dan push data ke Central |

### Simulasi 3 Terminal di Lokal (Development):

* **Terminal 1 (Central Server):**
  ```bash
  npm run dev
  ```
* **Terminal 2 (Edge Agent ALMC):**
  ```bash
  STATION_CODE=ALMC-01 npm run dev:edge
  ```
* **Terminal 3 (Mock Scale Generator — Virtual COM4):**
  ```bash
  npm run mock:scale
  ```

---

## 3. Struktur Folder

```
.
├── docker-compose.yml          # Orchestrasi SQL Server + Redis + Scale Service
├── Dockerfile                  # Multi-stage production container build
├── package.json
├── tsconfig.json
├── .env.example                # Template environment variables
├── src/
│   ├── app.ts                  # Express app & route aggregator
│   ├── server.ts               # Entry point Central Server
│   ├── edgeServer.ts           # Entry point Edge Agent (Mini PC)
│   ├── config/                 # Konfigurasi Database, Redis, Serial
│   ├── controllers/            # HTTP Request Handlers
│   ├── docs/                   # Spesifikasi OpenAPI 3.0 (Swagger UI)
│   ├── entities/               # TypeORM Entities (WeighingRecord, Station)
│   ├── middlewares/             # Middleware identifikasi & validasi station
│   ├── migrations/             # TypeORM Database Migrations
│   ├── routes/                 # Express Route Definitions
│   ├── services/               # Core Business Logic (Weighing & Validation)
│   ├── providers/              # External Integrations (Interface + Mock)
│   │   ├── cctv/               # CCTV Snapshot capture
│   │   ├── traceability/       # Integrasi sistem Traceability
│   │   └── po/                 # Integrasi sistem Purchase Order (PO)
│   ├── edge/                   # Modul Edge (Serial listener & Raw file watcher)
│   ├── mock/                   # Generator data dummy timbangan
│   ├── types/                  # Type definitions TypeScript
│   └── utils/                  # Utility (ASCII parser, Hex converter)
```

---

## 4. Arsitektur Central–Edge

```
Mini PC ALMC (EDGE)          Mini PC DC (EDGE)          Mini PC Truck Scale (EDGE)
  - Baca RS-232                - Baca RS-232               - Baca RS-232
  - Parse ASCII → JSON         - Parse ASCII → JSON        - Parse ASCII → JSON
  - Capture CCTV               - Capture CCTV              - Capture CCTV
  - Push via HTTP  ────┐       - Push via HTTP  ────┐      - Push via HTTP  ────┐
                       ▼                            ▼                           ▼
                             ┌──────────────────────────────┐
                             │   Central Server             │
                             │   - Express.js + TypeScript  │
                             │   - TypeORM + SQL Server     │
                             │   - In-Memory Buffer         │
                             │   - Swagger UI (/docs)       │
                             └──────────────────────────────┘
```

Prinsip kunci: **Mini PC (Edge) tidak pernah menyentuh database secara langsung**. Edge hanya membaca stream hardware serial, mem-parse ke JSON, dan mem-push data ke Central via HTTP REST API.

---

## 5. Dokumentasi API & Uji Coba Interaktif (Swagger UI)

Buka **`http://localhost:3001/docs`** di browser.

### Urutan Pengujian 1 Siklus Penuh:

1. **`POST /api/weighing/scan`**
   - Header: `x-station-id: ALMC-01`
   - Body: `{ "deliveryBarcode": "DEL-VALID-TEST-001", "stage": "ALMC" }`
   - *Fungsi*: Membuka sesi timbang & validasi otomatis ke mock Traceability + PO.
   - *Simulasi Error*: Gunakan `DEL-NOTFOUND-TEST` (422) atau `DEL-PO-CLOSED-TEST` (422).

2. **`POST /api/weighing/push-reading`** (Simulasi Edge)
   - Header: `x-station-id: ALMC-01`
   - Body: Kirim data dengan status `"STABLE"`, value `88.44`, unit `"kg"`.
   - *Fungsi*: Menyimpan nilai stabil ke buffer in-memory central.

3. **`GET /api/weighing/live-reading`**
   - Header: `x-station-id: ALMC-01`
   - *Fungsi*: Polling nilai stabil terkini yang ada di buffer station.

4. **`POST /api/weighing/{id}/submit`**
   - Header: `x-station-id: ALMC-01`
   - Path param: `id` dari response step 1.
   - Body: `{ "stage": "ALMC", "operatorName": "Budi Operator" }`
   - *Fungsi*: Operator meng-commit nilai timbangan ke DB (status approval jadi `PENDING`).

5. **`POST /api/weighing/{id}/approve`**
   - Body: `{ "stage": "ALMC", "approverName": "Siti Manager" }`
   - *Fungsi*: Approval sukses, `currentStage` record otomatis maju ke `DC`.

6. **Ulangi langkah 1–5 untuk stage `DC` (station: `DC-01`) dan `TRUCK_SCALE` (station: `TRUCKSCALE-01`)**:
   - Pada approval Truck Scale terakhir, status `currentStage` menjadi **`COMPLETED`** dan `isPublishedToPublicWeb` otomatis menjadi **`true`**.

---

## 6. Ringkasan Endpoints

| Method | Endpoint | Deskripsi | Middleware |
|---|---|---|---|
| `GET` | `/docs` | Swagger UI Interactive API Documentation | — |
| `GET` | `/api/health` | Central Server Health Check | — |
| `POST` | `/api/weighing/scan` | Scan barcode delivery & inisialisasi sesi | `validateStationStage` |
| `POST` | `/api/weighing/push-reading` | Edge push hasil pembacaan serial & snapshot | `identifyStation` |
| `GET` | `/api/weighing/live-reading` | Polling nilai timbangan stabil di station | `identifyStation` |
| `POST` | `/api/weighing/:id/submit` | Operator submit hasil timbangan | `validateStationStage` |
| `POST` | `/api/weighing/:id/approve` | GL / Manager menyetujui hasil timbang | — |
| `POST` | `/api/weighing/:id/reject` | GL / Manager menolak hasil timbang | — |

Untuk detail roadmap dan progres pengembangan fitur berikutnya, silakan merujuk ke **`PROGRESS.md`**.
