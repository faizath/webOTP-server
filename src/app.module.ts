import { Module } from "@nestjs/common";
import { AppConfigModule } from "./config/config.module.ts";
import { DatabaseModule } from "./database/database.module.ts";
import { AuthModule } from "./auth/auth.module.ts";
import { HealthModule } from "./health/health.module.ts";
import { UsersModule } from "./users/users.module.ts";
import { VaultModule } from "./vault/vault.module.ts";

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    UsersModule,
    AuthModule,
    HealthModule,
    VaultModule,
  ],
})
export class AppModule {}
