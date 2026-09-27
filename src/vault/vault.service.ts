import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DataSource, EntityManager, In, Repository } from "typeorm";
import { DATABASE_CONNECTION } from "../database/database.module.ts";
import { AuditService } from "../common/services/audit.service.ts";
import type { VaultEnvelope } from "../common/types/vault-envelope.ts";
import { UploadVaultDto } from "./dto/upload-vault.dto.ts";
import { VaultRevision } from "./entities/vault-revision.entity.ts";
import { VaultSnapshot } from "./entities/vault-snapshot.entity.ts";

export type VaultResponse = {
  revision: number;
  envelope: VaultEnvelope;
  updatedAt: Date;
  contentHash: string;
};

export type VaultHistoryItem = {
  revision: number;
  contentHash: string;
  createdAt: Date;
  envelopeVersion: number;
};

export type VaultHistoryResponse = VaultHistoryItem & {
  envelope: VaultEnvelope;
};

@Injectable()
export class VaultService {
  private readonly idempotency = new Map<
    string,
    { bodyHash: string; response: VaultResponse; expiresAt: number }
  >();

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
    idempotencyKey?: string,
  ): Promise<VaultResponse> {
    const envelope = this.validateEnvelope(dto.envelope);
    const expectedRevision = this.parseIfMatch(ifMatch);
    const requestHash = await this.hash(JSON.stringify(dto));
    const cached = this.cachedIdempotency(userId, idempotencyKey);
    if (cached) {
      if (cached.bodyHash !== requestHash) {
        throw new ConflictException(
          "Idempotency-Key was used with a different request",
        );
      }
      return cached.response;
    }
    const repository = await this.repository();
    const snapshot = await repository.findOneBy({ userId });

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
      const response = this.toResponse(saved);
      this.cacheIdempotency(userId, idempotencyKey, requestHash, response);
      return response;
    }

    const result = await this.inTransaction(async (manager) => {
      const snapshots = manager.getRepository(VaultSnapshot);
      const revisions = manager.getRepository(VaultRevision);
      const current = await snapshots.findOneBy({ userId });
      if (!current) throw new NotFoundException("Vault not found");
      if (
        expectedRevision === undefined ||
        expectedRevision !== Number(current.revision)
      ) {
        throw new ConflictException({
          currentRevision: Number(current.revision),
          message: "Vault revision conflict",
        });
      }

      await revisions.save(this.toRevision(current));
      current.envelopeVersion = envelope.version;
      current.salt = envelope.salt;
      current.ciphertext = envelope.ciphertext;
      current.contentHash = await this.hash(envelope.ciphertext);
      current.revision = Number(current.revision) + 1;
      const saved = await snapshots.save(current);
      await this.enforceRetention(revisions, userId);
      return saved;
    });

    await this.audit.log({
      userId,
      action: "VAULT_UPLOAD",
      metadata: { revision: result.revision },
    });
    const response = this.toResponse(result);
    this.cacheIdempotency(userId, idempotencyKey, requestHash, response);
    return response;
  }

  async history(userId: string): Promise<VaultHistoryItem[]> {
    const snapshot = await (await this.repository()).findOneBy({ userId });
    if (!snapshot) throw new NotFoundException("Vault not found");
    const revisions = await (await this.revisionRepository()).find({
      where: { userId },
      order: { revision: "DESC" },
    });
    return revisions.map((revision) => this.toHistoryItem(revision));
  }

  async historyRevision(
    userId: string,
    revision: string,
  ): Promise<VaultHistoryResponse> {
    const revisionNumber = this.parseRevision(revision);
    const found = await (await this.revisionRepository()).findOneBy({
      userId,
      revision: revisionNumber,
    });
    if (!found) throw new NotFoundException("Vault revision not found");
    return {
      ...this.toHistoryItem(found),
      envelope: {
        version: found.envelopeVersion as 2,
        salt: found.salt,
        ciphertext: found.ciphertext,
      },
    };
  }

  async restore(
    userId: string,
    revision: string,
  ): Promise<VaultResponse> {
    const fromRevision = this.parseRevision(revision);
    const result = await this.inTransaction(async (manager) => {
      const snapshots = manager.getRepository(VaultSnapshot);
      const revisions = manager.getRepository(VaultRevision);
      const [current, historical] = await Promise.all([
        snapshots.findOneBy({ userId }),
        revisions.findOneBy({ userId, revision: fromRevision }),
      ]);
      if (!current) throw new NotFoundException("Vault not found");
      if (!historical) throw new NotFoundException("Vault revision not found");

      await revisions.save(this.toRevision(current));
      current.envelopeVersion = historical.envelopeVersion;
      current.salt = historical.salt;
      current.ciphertext = historical.ciphertext;
      current.contentHash = historical.contentHash;
      current.revision = Number(current.revision) + 1;
      const saved = await snapshots.save(current);
      await this.enforceRetention(revisions, userId);
      return saved;
    });

    await this.audit.log({
      userId,
      action: "VAULT_RESTORE",
      metadata: { fromRevision, newRevision: Number(result.revision) },
    });
    return this.toResponse(result);
  }

  private async repository(): Promise<Repository<VaultSnapshot>> {
    if (!this.dataSource) {
      throw new BadRequestException("Vault database is unavailable");
    }
    if (!this.dataSource.isInitialized) await this.dataSource.initialize();
    return this.dataSource.getRepository(VaultSnapshot);
  }

  private async revisionRepository(): Promise<Repository<VaultRevision>> {
    if (!this.dataSource) {
      throw new BadRequestException("Vault database is unavailable");
    }
    if (!this.dataSource.isInitialized) await this.dataSource.initialize();
    return this.dataSource.getRepository(VaultRevision);
  }

  private inTransaction<T>(
    work: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    if (!this.dataSource) {
      throw new BadRequestException("Vault database is unavailable");
    }
    if (typeof this.dataSource.transaction === "function") {
      return this.dataSource.transaction(work);
    }
    const repositories = this.dataSource as DataSource & {
      manager?: EntityManager;
    };
    if (repositories.manager) return work(repositories.manager);
    const repository = this.dataSource.getRepository(VaultSnapshot);
    return work({
      getRepository: () => repository,
    } as unknown as EntityManager);
  }

  private async enforceRetention(
    revisions: Repository<VaultRevision>,
    userId: string,
  ): Promise<void> {
    const all = await revisions.find({
      where: { userId },
      order: { revision: "DESC" },
    });
    if (all.length <= 20) return;
    const expired = all.slice(20);
    if (typeof revisions.remove === "function") {
      await revisions.remove(expired);
      return;
    }
    await (
      revisions as Repository<VaultRevision> & {
        delete: (criteria: unknown) => Promise<unknown>;
      }
    ).delete({ id: In(expired.map((revision) => revision.id)) });
  }

  private toRevision(snapshot: VaultSnapshot): Partial<VaultRevision> {
    return {
      id: crypto.randomUUID(),
      vaultSnapshotId: snapshot.id,
      userId: snapshot.userId,
      revision: Number(snapshot.revision),
      envelopeVersion: snapshot.envelopeVersion,
      salt: snapshot.salt,
      ciphertext: snapshot.ciphertext,
      contentHash: snapshot.contentHash,
      createdByDeviceId: snapshot.updatedByDeviceId,
    };
  }

  private validateEnvelope(
    envelope: UploadVaultDto["envelope"],
  ): VaultEnvelope {
    if (envelope.version !== 2) {
      throw new BadRequestException("Unsupported vault envelope version");
    }
    return { version: 2, salt: envelope.salt, ciphertext: envelope.ciphertext };
  }

  private parseIfMatch(value?: string): number | undefined {
    if (value === undefined) return undefined;
    if (!/^\d+$/.test(value)) {
      throw new BadRequestException("If-Match must be a revision number");
    }
    return Number(value);
  }

  private parseRevision(value: string): number {
    if (!/^\d+$/.test(value) || Number(value) < 1) {
      throw new BadRequestException("Revision must be a positive number");
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

  private cachedIdempotency(
    userId: string,
    key: string | undefined,
  ):
    | { bodyHash: string; response: VaultResponse; expiresAt: number }
    | undefined {
    if (!key) return undefined;
    const cacheKey = `${userId}:${key}`;
    const cached = this.idempotency.get(cacheKey);
    if (!cached) return undefined;
    if (cached.expiresAt <= Date.now()) {
      this.idempotency.delete(cacheKey);
      return undefined;
    }
    return cached;
  }

  private cacheIdempotency(
    userId: string,
    key: string | undefined,
    bodyHash: string,
    response: VaultResponse,
  ): void {
    if (!key) return;
    this.idempotency.set(`${userId}:${key}`, {
      bodyHash,
      response,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });
  }

  private toResponse(snapshot: VaultSnapshot): VaultResponse {
    return {
      revision: Number(snapshot.revision),
      envelope: {
        version: snapshot.envelopeVersion as 2,
        salt: snapshot.salt,
        ciphertext: snapshot.ciphertext,
      },
      updatedAt: snapshot.updatedAt,
      contentHash: snapshot.contentHash,
    };
  }

  private toHistoryItem(revision: VaultRevision): VaultHistoryItem {
    return {
      revision: Number(revision.revision),
      contentHash: revision.contentHash,
      createdAt: revision.createdAt,
      envelopeVersion: revision.envelopeVersion,
    };
  }
}
