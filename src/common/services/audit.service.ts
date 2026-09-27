import { Inject, Injectable, Optional } from "@nestjs/common";
import { DataSource } from "typeorm";
import { DATABASE_CONNECTION } from "../../database/database.module.ts";
import { AuditLog } from "../entities/audit-log.entity.ts";

export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "VAULT_UPLOAD"
  | "DEVICE_REVOKE"
  | "REGISTER"
  | "ACCOUNT_DELETE";

export type AuditParams = {
  userId?: string;
  action: AuditAction;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class AuditService {
  constructor(
    @Optional()
    @Inject(DATABASE_CONNECTION)
    private readonly dataSource: DataSource | null = null,
  ) {}

  async log(params: AuditParams): Promise<void> {
    if (!this.dataSource) return;
    if (!this.dataSource.isInitialized) await this.dataSource.initialize();
    const repository = this.dataSource.getRepository(AuditLog);
    const audit = repository.create({
      userId: params.userId ?? null,
      action: params.action,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
      metadata: params.metadata === undefined
        ? null
        : JSON.stringify(this.redact(params.metadata)),
    });
    await repository.save(audit);
  }

  private redact(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((item) => this.redact(item));
    if (!value || typeof value !== "object") return value;
    return Object.fromEntries(
      Object.entries(value).flatMap(([key, item]) =>
        /(pass(word)?|token|secret|ciphertext|authorization|cookie)/i.test(key)
          ? []
          : [[key, this.redact(item)]]
      ),
    );
  }
}
