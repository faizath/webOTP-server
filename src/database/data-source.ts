import "reflect-metadata";
import { DataSource, type DataSourceOptions } from "typeorm";
import { validateEnvironment } from "../config/configuration.ts";
import { User } from "../users/entities/user.entity.ts";
import { RefreshToken } from "../common/entities/refresh-token.entity.ts";
import { VaultSnapshot } from "../vault/entities/vault-snapshot.entity.ts";
import { AuditLog } from "../common/entities/audit-log.entity.ts";
import { Device } from "../devices/entities/device.entity.ts";
import { UserPreferences } from "../users/entities/user-preferences.entity.ts";
import { CreateUsersAndRefreshTokens001 } from "../../migrations/001-create-users-and-refresh-tokens.ts";
import { CreateVaultSnapshots002 } from "../../migrations/002-create-vault-snapshots.ts";
import { CreateDevicesAuditLogsAndPreferences003 } from "../../migrations/003-create-devices-and-audit-logs.ts";

const config = validateEnvironment(Deno.env.toObject());

export function createDataSource(): DataSource {
  const options: DataSourceOptions = {
    type: "mssql",
    host: config.DB_HOST,
    port: config.DB_PORT,
    username: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
    synchronize: false,
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
    entities: [
      User,
      RefreshToken,
      VaultSnapshot,
      AuditLog,
      Device,
      UserPreferences,
    ],
    migrations: [
      CreateUsersAndRefreshTokens001,
      CreateVaultSnapshots002,
      CreateDevicesAuditLogsAndPreferences003,
    ],
  };
  return new DataSource(options);
}

export const AppDataSource = createDataSource();
