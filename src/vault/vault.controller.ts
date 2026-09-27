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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.ts";
import type { User } from "../users/entities/user.entity.ts";
import { UploadVaultDto } from "./dto/upload-vault.dto.ts";
import { VaultService } from "./vault.service.ts";

type AuthenticatedRequest = { user: User };

@Controller("vault")
@UseGuards(JwtAuthGuard)
@ApiTags("vault")
@ApiBearerAuth()
export class VaultController {
  constructor(private readonly vault: VaultService) {}

  @Get()
  @ApiOperation({ summary: "Get the current encrypted vault" })
  @ApiResponse({ status: 200, description: "Encrypted vault snapshot" })
  get(@Req() request: AuthenticatedRequest) {
    return this.vault.get(request.user.id);
  }

  @Put()
  @ApiOperation({ summary: "Upload an encrypted vault snapshot" })
  @ApiResponse({ status: 200, description: "Updated snapshot" })
  upload(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UploadVaultDto,
    @Headers("if-match") ifMatch?: string,
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    return this.vault.upload(request.user.id, dto, ifMatch, idempotencyKey);
  }

  @Get("history")
  @ApiOperation({ summary: "List encrypted vault history" })
  @ApiResponse({ status: 200, description: "Revision metadata" })
  history(@Req() request: AuthenticatedRequest) {
    return this.vault.history(request.user.id);
  }

  @Get("history/:revision")
  @ApiOperation({ summary: "Get an encrypted historical revision" })
  @ApiResponse({ status: 200, description: "Historical encrypted snapshot" })
  historyRevision(
    @Req() request: AuthenticatedRequest,
    @Param("revision") revision: string,
  ) {
    return this.vault.historyRevision(request.user.id, revision);
  }

  @Post("history/:revision/restore")
  @ApiOperation({ summary: "Restore an encrypted historical revision" })
  @ApiResponse({ status: 200, description: "Restored encrypted snapshot" })
  restore(
    @Req() request: AuthenticatedRequest,
    @Param("revision") revision: string,
  ) {
    return this.vault.restore(request.user.id, revision);
  }
}
