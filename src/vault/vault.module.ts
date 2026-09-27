import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.ts";
import { AuditService } from "../common/services/audit.service.ts";
import { VaultController } from "./vault.controller.ts";
import { VaultService } from "./vault.service.ts";

@Module({
  imports: [DatabaseModule],
  controllers: [VaultController],
  providers: [VaultService, AuditService],
})
export class VaultModule {}
