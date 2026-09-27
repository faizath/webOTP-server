import { Inject, Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { DATABASE_CONNECTION } from "../database/database.module.ts";

@Injectable()
export class HealthService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly dataSource: DataSource | null,
  ) {}

  async check() {
    let database: "up" | "down" = "down";
    if (this.dataSource) {
      try {
        if (!this.dataSource.isInitialized) {
          await this.dataSource.initialize();
        }
        await this.dataSource.query("SELECT 1");
        database = "up";
      } catch {
        database = "down";
      }
    }
    return { status: "ok", timestamp: new Date().toISOString(), database };
  }
}
