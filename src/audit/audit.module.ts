import { Global, Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.ts";
import { AuditService } from "../common/services/audit.service.ts";

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
