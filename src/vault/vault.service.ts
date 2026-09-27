import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { DATABASE_CONNECTION } from "../database/database.module.ts";
import { AuditService } from "../common/services/audit.service.ts";
import type { VaultEnvelope } from "../common/types/vault-envelope.ts";
import { UploadVaultDto } from "./dto/upload-vault.dto.ts";
import { VaultSnapshot } from "./entities/vault-snapshot.entity.ts";

export type VaultResponse = {
  revision: number;
  envelope: VaultEnvelope;
  updatedAt: Date;
  contentHash: string;
};

@Injectable()
export class VaultService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly dataSource: DataSource | null,
    private readonly audit: AuditService,
  ) {}

  async get(userId: string): Promise<VaultResponse> {
    const snapshot = await (await this.repository()).findOneBy({ userId });
    if (!snapshot) throw new NotFoundException("Vault not found");
    return this.toResponse(snapshot);
  }

  async upload(
    userId: string,
    dto: UploadVaultDto,
    ifMatch?: string,
  ): Promise<VaultResponse> {
    const envelope = this.validateEnvelope(dto.envelope);
    const repository = await this.repository();
    const snapshot = await repository.findOneBy({ userId });
    const expectedRevision = this.parseIfMatch(ifMatch);

    if (!snapshot) {
      if (expectedRevision !== undefined && expectedRevision !== 0) {
        throw new ConflictException({
          currentRevision: 0,
          message: "Vault does not exist",
        });
      }
      const created = repository.create({
        id: crypto.randomUUID(),
        userId,
        envelopeVersion: envelope.version,
        salt: envelope.salt,
        ciphertext: envelope.ciphertext,
        contentHash: await this.hash(envelope.ciphertext),
        revision: 1,
        updatedByDeviceId: null,
      });
      const saved = await repository.save(created);
      await this.audit.log({
        userId,
        action: "VAULT_UPLOAD",
        metadata: { revision: saved.revision },
      });
      return this.toResponse(saved);
    }

    if (
      expectedRevision === undefined ||
      expectedRevision !== Number(snapshot.revision)
    ) {
      throw new ConflictException({
        currentRevision: Number(snapshot.revision),
        message: "Vault revision conflict",
      });
    }

    snapshot.envelopeVersion = envelope.version;
    snapshot.salt = envelope.salt;
    snapshot.ciphertext = envelope.ciphertext;
    snapshot.contentHash = await this.hash(envelope.ciphertext);
    snapshot.revision = Number(snapshot.revision) + 1;
    const saved = await repository.save(snapshot);
    await this.audit.log({
      userId,
      action: "VAULT_UPLOAD",
      metadata: { revision: saved.revision },
    });
    return this.toResponse(saved);
  }

  private async repository(): Promise<Repository<VaultSnapshot>> {
    if (!this.dataSource) {
      throw new BadRequestException("Vault database is unavailable");
    }
    if (!this.dataSource.isInitialized) await this.dataSource.initialize();
    return this.dataSource.getRepository(VaultSnapshot);
  }

  private validateEnvelope(
    envelope: UploadVaultDto["envelope"],
  ): VaultEnvelope {
    if (envelope.version !== 2) {
      throw new BadRequestException("Unsupported vault envelope version");
    }
    return {
      version: 2,
      salt: envelope.salt,
      ciphertext: envelope.ciphertext,
    };
  }

  private parseIfMatch(value?: string): number | undefined {
    if (value === undefined) return undefined;
    if (!/^\d+$/.test(value)) {
      throw new BadRequestException("If-Match must be a revision number");
    }
    return Number(value);
  }

  private async hash(value: string): Promise<string> {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(value),
    );
    return Array.from(
      new Uint8Array(digest),
      (byte) => byte.toString(16).padStart(2, "0"),
    ).join("");
  }

  private toResponse(snapshot: VaultSnapshot): VaultResponse {
    return {
      revision: Number(snapshot.revision),
      envelope: {
        version: 2,
        salt: snapshot.salt,
        ciphertext: snapshot.ciphertext,
      },
      updatedAt: snapshot.updatedAt,
      contentHash: snapshot.contentHash,
    };
  }
}
