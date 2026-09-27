import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.ts";
import { AuditModule } from "../audit/audit.module.ts";
import { VaultController } from "./vault.controller.ts";
import { VaultService } from "./vault.service.ts";

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [VaultController],
  providers: [VaultService],
})
export class VaultModule {}
