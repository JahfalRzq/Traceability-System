export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Scrap System Management — Scale Service API",
    version: "1.0.0",
    description: `API dokumentasi dan testing interaktif untuk sistem timbangan scrap/limbah.
    
### Alur Penggunaan (1 Siklus Lengkap):
1. **POST /api/weighing/scan** — Scan barcode (validasi otomatis ke mock Traceability & PO)
2. **POST /api/weighing/push-reading** — Simulasi data pembacaan timbangan & snapshot CCTV dari edge
3. **GET /api/weighing/live-reading** — Polling nilai timbangan stabil di station saat ini
4. **POST /api/weighing/{id}/submit** — Operator men-submit hasil timbangan
5. **POST /api/weighing/{id}/approve** atau **POST /api/weighing/{id}/reject** — GL/Manager verifikasi
6. Ulangi untuk stage **DC** dan **TRUCK_SCALE** hingga status **COMPLETED** & terbit ke Public Web.`,
  },
  servers: [
    {
      url: "http://localhost:3001",
      description: "Local Central Server",
    },
  ],
  tags: [
    {
      name: "Weighing Flow",
      description: "Endpoint operasional timbangan (Scan, Live Reading, Submit, Approval)",
    },
    {
      name: "Edge Simulation",
      description: "Endpoint simulasi mini PC / Edge device (Push Reading)",
    },
    {
      name: "System",
      description: "Health check & status sistem",
    },
    {
      name: "Public Access",
      description: "Endpoint untuk Public Dashboard (semua data real-time) & Public Web (hanya data yang sudah COMPLETED)",
    },
  ],
  components: {
    parameters: {
      StationIdHeader: {
        name: "x-station-id",
        in: "header",
        required: true,
        description: "Kode Station mini PC yang terdaftar di database (`ALMC-01`, `DC-01`, `TRUCKSCALE-01`)",
        schema: {
          type: "string",
          enum: ["ALMC-01", "DC-01", "TRUCKSCALE-01"],
          default: "ALMC-01",
        },
      },
    },
    schemas: {
      WeighingRecord: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", example: "62DE4730-519D-F111-9891-85E476DFF1F6" },
          deliveryBarcode: { type: "string", example: "DEL-VALID-TEST-001" },
          currentStage: { type: "string", enum: ["ALMC", "DC", "TRUCK_SCALE", "COMPLETED"], example: "ALMC" },
          materialLotBatch: { type: "string", nullable: true, example: "LOT-ST-001" },
          poNumber: { type: "string", nullable: true, example: "PO-2026-001" },
          isValidatedWithExistingSystem: { type: "boolean", example: true },
          weightUnit: { type: "string", example: "kg" },
          isPublishedToPublicWeb: { type: "boolean", example: false },
          almcWeightValue: { type: "number", nullable: true, example: 88.44 },
          almcCctvSnapshotUrl: { type: "string", nullable: true, example: "logs/cctv-snapshots/ALMC-01_2026-08-21T11-13-43-347Z.txt" },
          almcRawAsciiPayload: { type: "string", nullable: true, example: "ST,GS,+000088.44,kg" },
          almcSubmittedBy: { type: "string", nullable: true, example: "Budi Operator" },
          almcSubmittedAt: { type: "string", format: "date-time", nullable: true, example: "2026-08-21T11:13:45.000Z" },
          almcApprovalStatus: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"], example: "PENDING" },
          almcApprovedBy: { type: "string", nullable: true, example: null },
          almcApprovedAt: { type: "string", format: "date-time", nullable: true, example: null },
          almcRejectionReason: { type: "string", nullable: true, example: null },
          dcWeightValue: { type: "number", nullable: true },
          dcApprovalStatus: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"], example: "PENDING" },
          truckScaleWeightValue: { type: "number", nullable: true },
          truckScaleApprovalStatus: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"], example: "PENDING" },
          createdAt: { type: "string", format: "date-time", example: "2026-08-21T11:12:26.303Z" },
          updatedAt: { type: "string", format: "date-time", example: "2026-08-21T11:13:45.693Z" },
        },
      },
      LiveReading: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["STABLE", "UNSTABLE"], example: "STABLE" },
          weightType: { type: "string", enum: ["GROSS", "NET"], example: "GROSS" },
          value: { type: "number", example: 88.44 },
          unit: { type: "string", example: "kg" },
          rawPayload: { type: "string", example: "ST,GS,+000088.44,kg" },
          timestamp: { type: "string", format: "date-time", example: "2026-08-21T11:13:22.293Z" },
          cctvSnapshotUrl: { type: "string", nullable: true, example: "logs/cctv-snapshots/ALMC-01_2026-08-21T11-13-22-293Z.txt" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string", example: "Pesan error spesifik" },
        },
      },
    },
  },
  paths: {
    "/api/health": {
      get: {
        tags: ["System"],
        summary: "Cek status server",
        description: "Mengembalikan status health check central server",
        responses: {
          200: {
            description: "Server berjalan normal",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/weighing/scan": {
      post: {
        tags: ["Weighing Flow"],
        summary: "1. Scan barcode & mulai sesi timbang",
        description: `Operator men-scan barcode delivery pada station tertentu. 
Secara otomatis memvalidasi barcode ke sistem eksternal (Mock Traceability & Mock PO).
Jika barcode atau PO tidak valid, request ditolak dengan kode 422.`,
        parameters: [{ $ref: "#/components/parameters/StationIdHeader" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["deliveryBarcode", "stage"],
                properties: {
                  deliveryBarcode: { type: "string", description: "Nomor barcode yang di-scan" },
                  stage: { type: "string", enum: ["ALMC", "DC", "TRUCK_SCALE"] },
                },
              },
              examples: {
                "Valid - ALMC Stage": {
                  summary: "Skenario Sukses ALMC",
                  value: {
                    deliveryBarcode: "DEL-VALID-TEST-001",
                    stage: "ALMC",
                  },
                },
                "Valid - DC Stage": {
                  summary: "Skenario Sukses DC (Ganti header x-station-id ke DC-01)",
                  value: {
                    deliveryBarcode: "DEL-VALID-TEST-001",
                    stage: "DC",
                  },
                },
                "Valid - Truck Scale Stage": {
                  summary: "Skenario Sukses Truck Scale (Ganti header x-station-id ke TRUCKSCALE-01)",
                  value: {
                    deliveryBarcode: "DEL-VALID-TEST-001",
                    stage: "TRUCK_SCALE",
                  },
                },
                "Error - Barcode Not Found": {
                  summary: "Mock Test: Barcode tidak terdaftar di Traceability",
                  value: {
                    deliveryBarcode: "DEL-NOTFOUND-TEST",
                    stage: "ALMC",
                  },
                },
                "Error - PO Closed": {
                  summary: "Mock Test: PO sudah berstatus CLOSED",
                  value: {
                    deliveryBarcode: "DEL-PO-CLOSED-TEST",
                    stage: "ALMC",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Scan berhasil, sesi timbang dimulai",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/WeighingRecord" },
              },
            },
          },
          401: {
            description: "Header x-station-id tidak disertakan",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          403: {
            description: "Station tidak terdaftar atau stage tidak cocok dengan assigned stage",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          422: {
            description: "Gagal validasi bisnis ke sistem Traceability atau PO",
            content: {
              "application/json": {
                example: { error: "Validasi gagal: Barcode tidak ditemukan di sistem traceability" },
              },
            },
          },
        },
      },
    },
    "/api/weighing/push-reading": {
      post: {
        tags: ["Edge Simulation"],
        summary: "Simulasi Edge: Push data timbangan & snapshot CCTV",
        description: `Endpoint yang dipanggil oleh mini PC (Edge) setiap kali ada data timbangan yang terbaca dari serial port RS-232 dan snapshot CCTV tertangkap.
Data yang berstatus **STABLE** akan disimpan ke buffer in-memory central server.`,
        parameters: [{ $ref: "#/components/parameters/StationIdHeader" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status", "weightType", "value", "unit", "rawPayload", "timestamp"],
                properties: {
                  status: { type: "string", enum: ["STABLE", "UNSTABLE"], example: "STABLE" },
                  weightType: { type: "string", enum: ["GROSS", "NET"], example: "GROSS" },
                  value: { type: "number", example: 88.44 },
                  unit: { type: "string", example: "kg" },
                  rawPayload: { type: "string", example: "ST,GS,+000088.44,kg" },
                  timestamp: { type: "string", format: "date-time", example: "2026-08-21T11:13:22.293Z" },
                  cctvSnapshotUrl: { type: "string", nullable: true, example: "logs/cctv-snapshots/ALMC-01_2026-08-21T11-13-22-293Z.txt" },
                },
              },
              examples: {
                "ALMC Reading (88.44 kg)": {
                  summary: "Simulasi Timbangan ALMC",
                  value: {
                    status: "STABLE",
                    weightType: "GROSS",
                    value: 88.44,
                    unit: "kg",
                    rawPayload: "ST,GS,+000088.44,kg",
                    timestamp: new Date().toISOString(),
                    cctvSnapshotUrl: "logs/cctv-snapshots/ALMC-01_snapshot.txt",
                  },
                },
                "DC Reading (280.50 kg)": {
                  summary: "Simulasi Timbangan DC (Ganti header x-station-id ke DC-01)",
                  value: {
                    status: "STABLE",
                    weightType: "GROSS",
                    value: 280.50,
                    unit: "kg",
                    rawPayload: "ST,GS,+000280.50,kg",
                    timestamp: new Date().toISOString(),
                    cctvSnapshotUrl: "logs/cctv-snapshots/DC-01_snapshot.txt",
                  },
                },
                "Truck Scale Reading (1850.75 kg)": {
                  summary: "Simulasi Timbangan Truck Scale (Ganti header x-station-id ke TRUCKSCALE-01)",
                  value: {
                    status: "STABLE",
                    weightType: "GROSS",
                    value: 1850.75,
                    unit: "kg",
                    rawPayload: "ST,GS,+001850.75,kg",
                    timestamp: new Date().toISOString(),
                    cctvSnapshotUrl: "logs/cctv-snapshots/TRUCKSCALE-01_snapshot.txt",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Reading tersimpan di buffer in-memory central",
            content: {
              "application/json": {
                example: { received: true, stationCode: "ALMC-01" },
              },
            },
          },
        },
      },
    },
    "/api/weighing/live-reading": {
      get: {
        tags: ["Weighing Flow"],
        summary: "2. Polling nilai timbangan stabil terkini",
        description: "Mengambil nilai timbangan stabil terbaru dari buffer in-memory untuk station terkait (sesuai header `x-station-id`).",
        parameters: [{ $ref: "#/components/parameters/StationIdHeader" }],
        responses: {
          200: {
            description: "Data reading terkini",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    reading: { $ref: "#/components/schemas/LiveReading", nullable: true },
                  },
                },
                examples: {
                  "Ada Nilai Stabil": {
                    value: {
                      reading: {
                        status: "STABLE",
                        weightType: "GROSS",
                        value: 88.44,
                        unit: "kg",
                        rawPayload: "ST,GS,+000088.44,kg",
                        timestamp: "2026-08-21T11:13:22.293Z",
                        cctvSnapshotUrl: "logs/cctv-snapshots/ALMC-01_2026-08-21T11-13-22-293Z.txt",
                      },
                    },
                  },
                  "Belum Ada Data": {
                    value: { reading: null },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/weighing/{id}/submit": {
      post: {
        tags: ["Weighing Flow"],
        summary: "3. Operator submit hasil timbang",
        description: `Operator menyetujui nilai timbangan yang tampil dan men-submit data ke database permanen.
Nilai diambil dari buffer reading stabil terakhir dan status approval stage menjadi **PENDING**.`,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID UUID dari WeighingRecord (didapat dari hasil response scan)",
            schema: { type: "string", format: "uuid" },
            example: "62DE4730-519D-F111-9891-85E476DFF1F6",
          },
          { $ref: "#/components/parameters/StationIdHeader" },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["stage", "operatorName"],
                properties: {
                  stage: { type: "string", enum: ["ALMC", "DC", "TRUCK_SCALE"] },
                  operatorName: { type: "string", example: "Budi Operator" },
                },
              },
              examples: {
                "Submit ALMC": {
                  value: {
                    stage: "ALMC",
                    operatorName: "Budi Operator",
                  },
                },
                "Submit DC": {
                  summary: "Submit Stage DC (Ganti header ke DC-01)",
                  value: {
                    stage: "DC",
                    operatorName: "Budi Operator",
                  },
                },
                "Submit Truck Scale": {
                  summary: "Submit Stage Truck Scale (Ganti header ke TRUCKSCALE-01)",
                  value: {
                    stage: "TRUCK_SCALE",
                    operatorName: "Budi Operator",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Submit berhasil, status approval stage menjadi PENDING",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/WeighingRecord" },
              },
            },
          },
          400: {
            description: "Stage tidak sesuai atau belum ada reading stabil di buffer",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/api/weighing/{id}/approve": {
      post: {
        tags: ["Weighing Flow"],
        summary: "4a. GL/Manager approve stage",
        description: `GL atau Manager menyetujui hasil timbangan.
Status approval menjadi **APPROVED** dan record otomatis maju ke stage berikutnya (ALMC → DC → TRUCK_SCALE → COMPLETED).
Pada stage **TRUCK_SCALE**, persetujuan akan mengubah \`isPublishedToPublicWeb\` menjadi \`true\`.`,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID UUID dari WeighingRecord",
            schema: { type: "string", format: "uuid" },
            example: "62DE4730-519D-F111-9891-85E476DFF1F6",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["stage", "approverName"],
                properties: {
                  stage: { type: "string", enum: ["ALMC", "DC", "TRUCK_SCALE"] },
                  approverName: { type: "string", example: "Siti Manager" },
                },
              },
              examples: {
                "Approve ALMC": {
                  value: {
                    stage: "ALMC",
                    approverName: "Siti Manager",
                  },
                },
                "Approve DC": {
                  value: {
                    stage: "DC",
                    approverName: "Siti Manager",
                  },
                },
                "Approve Truck Scale (Final)": {
                  value: {
                    stage: "TRUCK_SCALE",
                    approverName: "Siti Manager",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Persetujuan berhasil",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/WeighingRecord" },
              },
            },
          },
        },
      },
    },
    "/api/weighing/{id}/reject": {
      post: {
        tags: ["Weighing Flow"],
        summary: "4b. GL/Manager reject stage (Tolak timbangan)",
        description: `GL atau Manager menolak hasil timbangan dengan menyertakan alasan penolakan.
Status approval menjadi **REJECTED**. Operator harus mengulang dari langkah scan untuk menimbang kembali.`,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID UUID dari WeighingRecord",
            schema: { type: "string", format: "uuid" },
            example: "62DE4730-519D-F111-9891-85E476DFF1F6",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["stage", "approverName", "reason"],
                properties: {
                  stage: { type: "string", enum: ["ALMC", "DC", "TRUCK_SCALE"] },
                  approverName: { type: "string", example: "Siti Manager" },
                  reason: { type: "string", example: "Berat tidak sesuai dengan dokumen pengiriman" },
                },
              },
              examples: {
                "Reject ALMC": {
                  value: {
                    stage: "ALMC",
                    approverName: "Siti Manager",
                    reason: "Berat tidak sesuai dengan dokumen pengiriman",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Penolakan berhasil dicatat",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/WeighingRecord" },
              },
            },
          },
        },
      },
    },
    "/api/public/dashboard": {
  get: {
    tags: ["Public Access"],
    summary: "Data untuk Public Dashboard (semua stage, real-time)",
    description: "Menampilkan seluruh record timbangan tanpa filter status — dipakai untuk monitoring internal semua tahap (ALMC/DC/Truck Scale).",
    parameters: [
      { name: "page", in: "query", schema: { type: "integer", default: 1 } },
      { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
      { name: "stage", in: "query", schema: { type: "string", enum: ["ALMC", "DC", "TRUCK_SCALE", "COMPLETED"] } },
      { name: "fromDate", in: "query", schema: { type: "string", format: "date" } },
      { name: "toDate", in: "query", schema: { type: "string", format: "date" } },
    ],
    responses: {
      200: {
        description: "Daftar record dengan pagination",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                data: { type: "array", items: { $ref: "#/components/schemas/WeighingRecord" } },
                pagination: {
                  type: "object",
                  properties: {
                    page: { type: "integer" },
                    limit: { type: "integer" },
                    total: { type: "integer" },
                    totalPages: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
},
"/api/public/web": {
  get: {
    tags: ["Public Access"],
    summary: "Data untuk Public Web (hanya yang sudah terbit)",
    description: "Menampilkan HANYA record yang sudah COMPLETED dan isPublishedToPublicWeb = true — data final yang boleh ditampilkan ke publik.",
    parameters: [
      { name: "page", in: "query", schema: { type: "integer", default: 1 } },
      { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
      { name: "fromDate", in: "query", schema: { type: "string", format: "date" } },
      { name: "toDate", in: "query", schema: { type: "string", format: "date" } },
    ],
    responses: {
      200: {
        description: "Daftar record yang sudah terbit, dengan pagination",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                data: { type: "array", items: { $ref: "#/components/schemas/WeighingRecord" } },
                pagination: {
                  type: "object",
                  properties: {
                    page: { type: "integer" },
                    limit: { type: "integer" },
                    total: { type: "integer" },
                    totalPages: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
},
  },
};
