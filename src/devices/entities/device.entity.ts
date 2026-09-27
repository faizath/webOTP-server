import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity.ts";

@Entity({ name: "devices" })
export class Device {
  @PrimaryColumn({ type: "uniqueidentifier" })
  id!: string;

  @Column({ name: "user_id", type: "uniqueidentifier" })
  userId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "nvarchar", length: 100 })
  name!: string;

  @Column({ name: "user_agent", type: "nvarchar", length: 500, nullable: true })
  userAgent!: string | null;

  @Column({ name: "last_seen_at", type: "datetime2" })
  lastSeenAt!: Date;

  @CreateDateColumn({ name: "created_at", type: "datetime2" })
  createdAt!: Date;

  @Column({ name: "revoked_at", type: "datetime2", nullable: true })
  revokedAt!: Date | null;
}
