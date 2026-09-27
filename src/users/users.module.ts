import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.ts";
import { UsersService } from "./users.service.ts";

@Module({
  imports: [DatabaseModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
