import "reflect-metadata";
import { DataSource, type DataSourceOptions } from "typeorm";
import { validateEnvironment } from "../config/configuration.ts";

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
    entities: [],
    migrations: [],
  };
  return new DataSource(options);
}

export const AppDataSource = createDataSource();
