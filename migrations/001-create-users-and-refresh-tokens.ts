import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersAndRefreshTokens001 implements MigrationInterface {
  name = "CreateUsersAndRefreshTokens001";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE users (
        id uniqueidentifier NOT NULL CONSTRAINT PK_users PRIMARY KEY,
        email nvarchar(320) NOT NULL,
        password_hash nvarchar(255) NOT NULL,
        display_name nvarchar(100) NULL,
        is_active bit NOT NULL CONSTRAINT DF_users_is_active DEFAULT 1,
        created_at datetime2 NOT NULL CONSTRAINT DF_users_created_at DEFAULT SYSUTCDATETIME(),
        updated_at datetime2 NOT NULL CONSTRAINT DF_users_updated_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_users_email UNIQUE (email)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE refresh_tokens (
        id uniqueidentifier NOT NULL CONSTRAINT PK_refresh_tokens PRIMARY KEY,
        user_id uniqueidentifier NOT NULL,
        device_id uniqueidentifier NULL,
        token_hash char(64) NOT NULL,
        expires_at datetime2 NOT NULL,
        revoked_at datetime2 NULL,
        created_at datetime2 NOT NULL CONSTRAINT DF_refresh_tokens_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      "CREATE INDEX IX_refresh_tokens_token_hash ON refresh_tokens (token_hash)",
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE refresh_tokens");
    await queryRunner.query("DROP TABLE users");
  }
}
