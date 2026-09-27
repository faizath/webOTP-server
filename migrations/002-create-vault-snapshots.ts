import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateVaultSnapshots002 implements MigrationInterface {
  name = "CreateVaultSnapshots002";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE vault_snapshots (
        id uniqueidentifier NOT NULL CONSTRAINT PK_vault_snapshots PRIMARY KEY,
        user_id uniqueidentifier NOT NULL,
        envelope_version tinyint NOT NULL,
        salt nvarchar(64) NOT NULL,
        ciphertext nvarchar(MAX) NOT NULL,
        content_hash char(64) NOT NULL,
        revision bigint NOT NULL,
        updated_at datetime2 NOT NULL CONSTRAINT DF_vault_snapshots_updated_at DEFAULT SYSUTCDATETIME(),
        updated_by_device_id uniqueidentifier NULL,
        CONSTRAINT UQ_vault_snapshots_user_id UNIQUE (user_id),
        CONSTRAINT FK_vault_snapshots_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE vault_snapshots");
  }
}
