import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWeighingAttemptLogs1787534005855 implements MigrationInterface {
    name = 'CreateWeighingAttemptLogs1787534005855'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "weighing_attempt_logs" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_06730f9490480b3688bb7579d2f" DEFAULT NEWSEQUENTIALID(), "weighingRecordId" uniqueidentifier NOT NULL, "stage" varchar(20) NOT NULL, "attemptNumber" int NOT NULL, "weightValue" decimal(10,2) NOT NULL, "rawAsciiPayload" varchar(200), "cctvSnapshotUrl" varchar(500), "submittedBy" varchar(100) NOT NULL, "submittedAt" datetime NOT NULL, "result" varchar(20) NOT NULL CONSTRAINT "DF_ced7dee87b208b1d6a057a1360e" DEFAULT 'PENDING', "reviewedBy" varchar(100), "reviewedAt" datetime, "rejectionReason" varchar(500), "createdAt" datetime2 NOT NULL CONSTRAINT "DF_063eca0edca2babc3870b7b1ef6" DEFAULT getdate(), CONSTRAINT "PK_06730f9490480b3688bb7579d2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "weighing_attempt_logs" ADD CONSTRAINT "FK_d4c2e07542f2aa488823570c623" FOREIGN KEY ("weighingRecordId") REFERENCES "weighing_records"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "weighing_attempt_logs" DROP CONSTRAINT "FK_d4c2e07542f2aa488823570c623"`);
        await queryRunner.query(`DROP TABLE "weighing_attempt_logs"`);
    }

}
