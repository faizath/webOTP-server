import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateVaultRevisions004 implements MigrationInterface {
  name = "CreateVaultRevisions004";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE vault_revisions (
        id uniqueidentifier NOT NULL CONSTRAINT PK_vault_revisions PRIMARY KEY,
        vault_snapshot_id uniqueidentifier NOT NULL,
        user_id uniqueidentifier NOT NULL,
        revision bigint NOT NULL,
        envelope_version tinyint NOT NULL,
        salt nvarchar(64) NOT NULL,
        ciphertext nvarchar(MAX) NOT NULL,
        content_hash char(64) NOT NULL,
        created_at datetime2 NOT NULL CONSTRAINT DF_vault_revisions_created_at DEFAULT SYSUTCDATETIME(),
        created_by_device_id uniqueidentifier NULL,
        CONSTRAINT FK_vault_revisions_snapshot FOREIGN KEY (vault_snapshot_id) REFERENCES vault_snapshots(id) ON DELETE CASCADE,
        CONSTRAINT FK_vault_revisions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT UQ_vault_revisions_user_revision UNIQUE (user_id, revision)
      )
    `);
    await queryRunner.query(
      "CREATE INDEX IX_vault_revisions_user_revision ON vault_revisions (user_id, revision DESC)",
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE vault_revisions");
  }
}
