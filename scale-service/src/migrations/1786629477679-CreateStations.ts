import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStations1786629477679 implements MigrationInterface {
    name = 'CreateStations1786629477679'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "stations" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_f047974bd453c85b08bab349367" DEFAULT NEWSEQUENTIALID(), "stationCode" varchar(50) NOT NULL, "assignedStage" varchar(20) NOT NULL, "allowedIpAddress" varchar(45), "isActive" bit NOT NULL CONSTRAINT "DF_3cbfd1c655dcfd61b118d2cbd5e" DEFAULT 1, "description" varchar(255), "createdAt" datetime2 NOT NULL CONSTRAINT "DF_d1f20dc413f64dd864e4c12891b" DEFAULT getdate(), CONSTRAINT "UQ_7ab99dc3ada390063e1270f7462" UNIQUE ("stationCode"), CONSTRAINT "PK_f047974bd453c85b08bab349367" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "stations"`);
    }

}
