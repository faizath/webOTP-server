import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.ts";
import type { User } from "../users/entities/user.entity.ts";
import { UploadVaultDto } from "./dto/upload-vault.dto.ts";
import { VaultService } from "./vault.service.ts";

type AuthenticatedRequest = { user: User };

@Controller("vault")
@UseGuards(JwtAuthGuard)
export class VaultController {
  constructor(private readonly vault: VaultService) {}

  @Get()
  get(@Req() request: AuthenticatedRequest) {
    return this.vault.get(request.user.id);
  }

  @Put()
  upload(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UploadVaultDto,
    @Headers("if-match") ifMatch?: string,
  ) {
    return this.vault.upload(request.user.id, dto, ifMatch);
  }

  @Get("history")
  history(@Req() request: AuthenticatedRequest) {
    return this.vault.history(request.user.id);
  }

  @Get("history/:revision")
  historyRevision(
    @Req() request: AuthenticatedRequest,
    @Param("revision") revision: string,
  ) {
    return this.vault.historyRevision(request.user.id, revision);
  }

  @Post("history/:revision/restore")
  restore(
    @Req() request: AuthenticatedRequest,
    @Param("revision") revision: string,
  ) {
    return this.vault.restore(request.user.id, revision);
  }
}
