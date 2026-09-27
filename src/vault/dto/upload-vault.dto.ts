import { Type } from "class-transformer";
import {
  Equals,
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from "class-validator";

export class VaultEnvelopeDto {
  @IsNumber()
  @Equals(2)
  version!: number;

  @IsString()
  @IsNotEmpty()
  salt!: string;

  @IsString()
  @IsNotEmpty()
  ciphertext!: string;
}

export class UploadVaultDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => VaultEnvelopeDto)
  envelope!: VaultEnvelopeDto;
}
