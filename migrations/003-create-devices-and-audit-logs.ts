import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDevicesAuditLogsAndPreferences003
  implements MigrationInterface {
  name = "CreateDevicesAuditLogsAndPreferences003";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE devices (
        id uniqueidentifier NOT NULL CONSTRAINT PK_devices PRIMARY KEY,
        user_id uniqueidentifier NOT NULL,
        name nvarchar(100) NOT NULL,
        user_agent nvarchar(500) NULL,
        last_seen_at datetime2 NOT NULL CONSTRAINT DF_devices_last_seen_at DEFAULT SYSUTCDATETIME(),
        created_at datetime2 NOT NULL CONSTRAINT DF_devices_created_at DEFAULT SYSUTCDATETIME(),
        revoked_at datetime2 NULL,
        CONSTRAINT FK_devices_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      "CREATE INDEX IX_devices_user_id ON devices (user_id)",
    );
    await queryRunner.query(`
      ALTER TABLE refresh_tokens
      ADD CONSTRAINT FK_refresh_tokens_device
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL
    `);
    await queryRunner.query(`
      CREATE TABLE audit_logs (
        id bigint IDENTITY(1,1) NOT NULL CONSTRAINT PK_audit_logs PRIMARY KEY,
        user_id uniqueidentifier NULL,
        action nvarchar(50) NOT NULL,
        ip_address nvarchar(45) NULL,
        user_agent nvarchar(500) NULL,
        metadata nvarchar(MAX) NULL,
        created_at datetime2 NOT NULL CONSTRAINT DF_audit_logs_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE user_preferences (
        user_id uniqueidentifier NOT NULL CONSTRAINT PK_user_preferences PRIMARY KEY,
        theme nvarchar(20) NOT NULL CONSTRAINT DF_user_preferences_theme DEFAULT 'default',
        lock_timeout_minutes int NULL,
        lock_action nvarchar(20) NOT NULL CONSTRAINT DF_user_preferences_lock_action DEFAULT 'master',
        CONSTRAINT FK_user_preferences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE user_preferences");
    await queryRunner.query("DROP TABLE audit_logs");
    await queryRunner.query(
      "ALTER TABLE refresh_tokens DROP CONSTRAINT FK_refresh_tokens_device",
    );
    await queryRunner.query("DROP TABLE devices");
  }
}
