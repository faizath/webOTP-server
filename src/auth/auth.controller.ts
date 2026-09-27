import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { AuthService } from "./auth.service.ts";
import { LoginDto } from "./dto/login.dto.ts";
import { RefreshDto } from "./dto/refresh.dto.ts";
import { RegisterDto } from "./dto/register.dto.ts";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto, @Req() request: RequestContext) {
    return this.auth.register(dto, request.ip, request.headers["user-agent"]);
  }

  @Post("login")
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 900 } })
  login(@Body() dto: LoginDto, @Req() request: RequestContext) {
    return this.auth.login(dto, request.ip, request.headers["user-agent"]);
  }

  @Post("refresh")
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() dto: RefreshDto, @Req() request: RequestContext) {
    await this.auth.logout(
      dto.refreshToken,
      request.ip,
      request.headers["user-agent"],
    );
  }
}

type RequestContext = {
  ip?: string;
  headers: Record<string, string | undefined>;
};
