import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module.ts";
import { DatabaseModule } from "../database/database.module.ts";
import { DevicesController } from "./devices.controller.ts";
import { DevicesService } from "./devices.service.ts";

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}
