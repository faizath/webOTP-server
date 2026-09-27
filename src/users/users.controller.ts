import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.ts";
import type { User } from "./entities/user.entity.ts";
import { PreferencesDto } from "./dto/preferences.dto.ts";
import { UsersService } from "./users.service.ts";

type RequestWithUser = {
  user: User;
  ip?: string;
  headers: Record<string, string | undefined>;
};

@Controller("me")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  me(@Req() request: RequestWithUser) {
    return this.users.profile(request.user.id);
  }

  @Patch("preferences")
  preferences(@Req() request: RequestWithUser, @Body() dto: PreferencesDto) {
    return this.users.updatePreferences(request.user.id, dto);
  }

  @Delete()
  async remove(@Req() request: RequestWithUser) {
    await this.users.remove(request.user.id, request.ip);
  }
}
