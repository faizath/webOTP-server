import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class PreferencesDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  theme?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1440)
  lockTimeoutMinutes?: number;

  @IsOptional()
  @IsString()
  @IsIn(["master", "logout", "none"])
  lockAction?: string;
}
