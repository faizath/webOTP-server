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
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service.ts";
import { LoginDto } from "./dto/login.dto.ts";
import { RefreshDto } from "./dto/refresh.dto.ts";
import { RegisterDto } from "./dto/register.dto.ts";

@Controller("auth")
@ApiTags("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Register a user" })
  @ApiResponse({ status: 201, description: "Tokens issued" })
  register(@Body() dto: RegisterDto, @Req() request: RequestContext) {
    return this.auth.register(dto, request.ip, request.headers["user-agent"]);
  }

  @Post("login")
  @ApiOperation({ summary: "Log in" })
  @ApiResponse({ status: 201, description: "Tokens issued" })
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 900 } })
  login(@Body() dto: LoginDto, @Req() request: RequestContext) {
    return this.auth.login(dto, request.ip, request.headers["user-agent"]);
  }

  @Post("refresh")
  @ApiOperation({ summary: "Rotate a refresh token" })
  @ApiResponse({ status: 201, description: "Tokens issued" })
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post("logout")
  @ApiOperation({ summary: "Revoke a refresh token" })
  @ApiResponse({ status: 204, description: "Token revoked" })
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
