import { Type } from "class-transformer";
import {
  Equals,
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class VaultEnvelopeDto {
  @ApiProperty({ example: 2 })
  @IsNumber()
  @Equals(2)
  version!: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  salt!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ciphertext!: string;
}

export class UploadVaultDto {
  @ApiProperty({ type: VaultEnvelopeDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => VaultEnvelopeDto)
  envelope!: VaultEnvelopeDto;
}
