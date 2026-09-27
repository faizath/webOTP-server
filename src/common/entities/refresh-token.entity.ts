import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity.ts";

@Entity({ name: "refresh_tokens" })
export class RefreshToken {
  @PrimaryColumn({ type: "uniqueidentifier" })
  id!: string;

  @Column({ name: "user_id", type: "uniqueidentifier" })
  userId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "device_id", type: "uniqueidentifier", nullable: true })
  deviceId!: string | null;

  @Column({ name: "token_hash", type: "char", length: 64 })
  tokenHash!: string;

  @Column({ name: "expires_at", type: "datetime2" })
  expiresAt!: Date;

  @Column({ name: "revoked_at", type: "datetime2", nullable: true })
  revokedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "datetime2" })
  createdAt!: Date;
}
