import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
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
@ApiTags("users")
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({ summary: "Get the current user profile" })
  @ApiResponse({ status: 200, description: "User profile" })
  me(@Req() request: RequestWithUser) {
    return this.users.profile(request.user.id);
  }

  @Patch("preferences")
  @ApiOperation({ summary: "Update user preferences" })
  @ApiResponse({ status: 200, description: "Updated preferences" })
  preferences(@Req() request: RequestWithUser, @Body() dto: PreferencesDto) {
    return this.users.updatePreferences(request.user.id, dto);
  }

  @Delete()
  @ApiOperation({ summary: "Delete the current user" })
  @ApiResponse({ status: 204, description: "User deleted" })
  async remove(@Req() request: RequestWithUser) {
    await this.users.remove(request.user.id, request.ip);
  }
}
