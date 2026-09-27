import {
  Column,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "vault_snapshots" })
@Index(["userId"], { unique: true })
export class VaultSnapshot {
  @PrimaryColumn({ type: "uniqueidentifier" })
  id!: string;

  @Column({ name: "user_id", type: "uniqueidentifier" })
  userId!: string;

  @Column({ name: "envelope_version", type: "tinyint" })
  envelopeVersion!: number;

  @Column({ type: "nvarchar", length: 64 })
  salt!: string;

  @Column({ type: "nvarchar", length: "MAX" as const })
  ciphertext!: string;

  @Column({ name: "content_hash", type: "char", length: 64 })
  contentHash!: string;

  @Column({ type: "bigint" })
  revision!: number;

  @UpdateDateColumn({ name: "updated_at", type: "datetime2" })
  updatedAt!: Date;

  @Column({
    name: "updated_by_device_id",
    type: "uniqueidentifier",
    nullable: true,
  })
  updatedByDeviceId!: string | null;
}
