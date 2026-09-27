import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from "typeorm";

@Entity({ name: "vault_revisions" })
@Index(["userId", "revision"], { unique: true })
export class VaultRevision {
  @PrimaryColumn({ type: "uniqueidentifier" })
  id!: string;

  @Column({ name: "vault_snapshot_id", type: "uniqueidentifier" })
  vaultSnapshotId!: string;

  @Column({ name: "user_id", type: "uniqueidentifier" })
  userId!: string;

  @Column({ type: "bigint" })
  revision!: number;

  @Column({ name: "envelope_version", type: "tinyint" })
  envelopeVersion!: number;

  @Column({ type: "nvarchar", length: 64 })
  salt!: string;

  @Column({ type: "nvarchar", length: "MAX" as const })
  ciphertext!: string;

  @Column({ name: "content_hash", type: "char", length: 64 })
  contentHash!: string;

  @CreateDateColumn({ name: "created_at", type: "datetime2" })
  createdAt!: Date;

  @Column({
    name: "created_by_device_id",
    type: "uniqueidentifier",
    nullable: true,
  })
  createdByDeviceId!: string | null;
}
