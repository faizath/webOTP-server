import "reflect-metadata";
import { DataSource, type DataSourceOptions } from "typeorm";
import { validateEnvironment } from "../config/configuration.ts";
import { User } from "../users/entities/user.entity.ts";
import { RefreshToken } from "../common/entities/refresh-token.entity.ts";
import { VaultSnapshot } from "../vault/entities/vault-snapshot.entity.ts";

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
    entities: [User, RefreshToken, VaultSnapshot],
    migrations: ["migrations/*.ts"],
  };
  return new DataSource(options);
}

export const AppDataSource = createDataSource();
