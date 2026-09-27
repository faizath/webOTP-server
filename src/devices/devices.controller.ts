import {
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Req,
  UseGuards,
} from "@nestjs/common";
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
export class DevicesController {
  constructor(private readonly devices: DevicesService) {}

  @Get()
  list(@Req() request: RequestWithUser) {
    return this.devices.list(request.user.id);
  }

  @Delete(":id")
  async revoke(
    @Req() request: RequestWithUser,
    @Param("id") id: string,
    @Headers("user-agent") userAgent?: string,
  ) {
    await this.devices.revoke(request.user.id, id, request.ip, userAgent);
  }
}
