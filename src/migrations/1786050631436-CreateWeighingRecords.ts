import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWeighingRecords1786050631436 implements MigrationInterface {
    name = 'CreateWeighingRecords1786050631436'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "weighing_records" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_444fa8d70e45820b8da71266c72" DEFAULT NEWSEQUENTIALID(), "deliveryBarcode" varchar(100) NOT NULL, "currentStage" varchar(20) NOT NULL CONSTRAINT "DF_28a041fff7a5b98aea930954468" DEFAULT 'ALMC', "materialLotBatch" varchar(100), "poNumber" varchar(100), "isValidatedWithExistingSystem" bit NOT NULL CONSTRAINT "DF_38541d800e9e67eeed25e4fc96a" DEFAULT 0, "almcWeightValue" decimal(10,2), "almcCctvSnapshotUrl" varchar(500), "almcApprovalStatus" varchar(20) NOT NULL CONSTRAINT "DF_39ebbc13227e5eee4017999210a" DEFAULT 'PENDING', "almcApprovedBy" varchar(100), "almcApprovedAt" datetime, "almcRawAsciiPayload" varchar(200), "dcWeightValue" decimal(10,2), "dcCctvSnapshotUrl" varchar(500), "dcApprovalStatus" varchar(20) NOT NULL CONSTRAINT "DF_1ab8be62a41344f3742957f5405" DEFAULT 'PENDING', "dcApprovedBy" varchar(100), "dcApprovedAt" datetime, "dcRawAsciiPayload" varchar(200), "truckScaleWeightValue" decimal(10,2), "truckScaleCctvSnapshotUrl" varchar(500), "truckScaleApprovalStatus" varchar(20) NOT NULL CONSTRAINT "DF_b6121837e5e3ae77b41d2b3152a" DEFAULT 'PENDING', "truckScaleApprovedBy" varchar(100), "truckScaleApprovedAt" datetime, "truckScaleRawAsciiPayload" varchar(200), "isPublishedToPublicWeb" bit NOT NULL CONSTRAINT "DF_714ffc20050c7d6e79eaca112d3" DEFAULT 0, "weightUnit" varchar(10) NOT NULL CONSTRAINT "DF_41ea86f74e65eb3d65f8c0f7651" DEFAULT 'kg', "createdAt" datetime2 NOT NULL CONSTRAINT "DF_df7dec327f7d100354bd470b3e3" DEFAULT getdate(), "updatedAt" datetime2 NOT NULL CONSTRAINT "DF_23462e7da59427db80e6fb537db" DEFAULT getdate(), CONSTRAINT "UQ_7f040704b069fc24d6d7e20e347" UNIQUE ("deliveryBarcode"), CONSTRAINT "PK_444fa8d70e45820b8da71266c72" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "weighing_records"`);
    }

}
