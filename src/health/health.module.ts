import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.ts";
import { HealthController } from "./health.controller.ts";
import { HealthService } from "./health.service.ts";

@Module({
  imports: [DatabaseModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
