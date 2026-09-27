import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerModule } from "@nestjs/throttler";
import { ConfigService } from "@nestjs/config";
import { PassportModule } from "@nestjs/passport";
import { DatabaseModule } from "../database/database.module.ts";
import { UsersModule } from "../users/users.module.ts";
import { AuthController } from "./auth.controller.ts";
import { AuthService } from "./auth.service.ts";
import { JwtStrategy } from "./strategies/jwt.strategy.ts";

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET"),
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 900, limit: 5 }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
