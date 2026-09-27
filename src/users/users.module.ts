import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module.ts";
import { DatabaseModule } from "../database/database.module.ts";
import { UsersController } from "./users.controller.ts";
import { UsersService } from "./users.service.ts";

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
