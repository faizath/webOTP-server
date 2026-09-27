import { Module } from "@nestjs/common";
import { AppConfigModule } from "./config/config.module.ts";
import { HealthModule } from "./health/health.module.ts";

@Module({
  imports: [AppConfigModule, HealthModule],
})
export class AppModule {}
