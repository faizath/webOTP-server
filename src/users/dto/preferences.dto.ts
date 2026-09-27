import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class PreferencesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  theme?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1440)
  lockTimeoutMinutes?: number;

  @ApiPropertyOptional({ enum: ["master", "logout", "none"] })
  @IsOptional()
  @IsString()
  @IsIn(["master", "logout", "none"])
  lockAction?: string;
}
