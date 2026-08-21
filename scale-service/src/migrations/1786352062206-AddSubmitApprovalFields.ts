import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubmitApprovalFields1786352062206 implements MigrationInterface {
    name = 'AddSubmitApprovalFields1786352062206'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "weighing_records" ADD "almcSubmittedBy" varchar(100)`);
        await queryRunner.query(`ALTER TABLE "weighing_records" ADD "almcSubmittedAt" datetime`);
        await queryRunner.query(`ALTER TABLE "weighing_records" ADD "almcRejectionReason" varchar(500)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "weighing_records" DROP COLUMN "almcRejectionReason"`);
        await queryRunner.query(`ALTER TABLE "weighing_records" DROP COLUMN "almcSubmittedAt"`);
        await queryRunner.query(`ALTER TABLE "weighing_records" DROP COLUMN "almcSubmittedBy"`);
    }

}
