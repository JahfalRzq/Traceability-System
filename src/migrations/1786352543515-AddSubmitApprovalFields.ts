import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubmitApprovalFields1786352543515 implements MigrationInterface {
    name = 'AddSubmitApprovalFields1786352543515'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "weighing_records" ADD "dcSubmittedBy" varchar(100)`);
        await queryRunner.query(`ALTER TABLE "weighing_records" ADD "dcSubmittedAt" datetime`);
        await queryRunner.query(`ALTER TABLE "weighing_records" ADD "dcRejectionReason" varchar(500)`);
        await queryRunner.query(`ALTER TABLE "weighing_records" ADD "truckScaleSubmittedBy" varchar(100)`);
        await queryRunner.query(`ALTER TABLE "weighing_records" ADD "truckScaleSubmittedAt" datetime`);
        await queryRunner.query(`ALTER TABLE "weighing_records" ADD "truckScaleRejectionReason" varchar(500)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "weighing_records" DROP COLUMN "truckScaleRejectionReason"`);
        await queryRunner.query(`ALTER TABLE "weighing_records" DROP COLUMN "truckScaleSubmittedAt"`);
        await queryRunner.query(`ALTER TABLE "weighing_records" DROP COLUMN "truckScaleSubmittedBy"`);
        await queryRunner.query(`ALTER TABLE "weighing_records" DROP COLUMN "dcRejectionReason"`);
        await queryRunner.query(`ALTER TABLE "weighing_records" DROP COLUMN "dcSubmittedAt"`);
        await queryRunner.query(`ALTER TABLE "weighing_records" DROP COLUMN "dcSubmittedBy"`);
    }

}
