import {
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.ts";
import type { User } from "../users/entities/user.entity.ts";
import { DevicesService } from "./devices.service.ts";

type RequestWithUser = {
  user: User;
  ip?: string;
  headers: Record<string, string | undefined>;
};

@Controller("devices")
@UseGuards(JwtAuthGuard)
@ApiTags("devices")
@ApiBearerAuth()
export class DevicesController {
  constructor(private readonly devices: DevicesService) {}

  @Get()
  @ApiOperation({ summary: "List registered devices" })
  @ApiResponse({ status: 200, description: "Registered devices" })
  list(@Req() request: RequestWithUser) {
    return this.devices.list(request.user.id);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Revoke a registered device" })
  @ApiResponse({ status: 204, description: "Device revoked" })
  async revoke(
    @Req() request: RequestWithUser,
    @Param("id") id: string,
    @Headers("user-agent") userAgent?: string,
  ) {
    await this.devices.revoke(request.user.id, id, request.ip, userAgent);
  }
}
