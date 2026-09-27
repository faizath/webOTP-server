import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AppConfigModule } from "./config/config.module.ts";
import { DatabaseModule } from "./database/database.module.ts";
import { AuthModule } from "./auth/auth.module.ts";
import { HealthModule } from "./health/health.module.ts";
import { UsersModule } from "./users/users.module.ts";
import { VaultModule } from "./vault/vault.module.ts";
import { AuditModule } from "./audit/audit.module.ts";
import { DevicesModule } from "./devices/devices.module.ts";

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    UsersModule,
    AuthModule,
    HealthModule,
    VaultModule,
    AuditModule,
    DevicesModule,
    ThrottlerModule.forRoot([{ ttl: 900, limit: 5 }]),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
