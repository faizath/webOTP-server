import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity.ts";

@Entity({ name: "audit_logs" })
export class AuditLog {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: string;

  @Column({ name: "user_id", type: "uniqueidentifier", nullable: true })
  userId!: string | null;

  @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "user_id" })
  user!: User | null;

  @Column({ type: "nvarchar", length: 50 })
  action!: string;

  @Column({ name: "ip_address", type: "nvarchar", length: 45, nullable: true })
  ipAddress!: string | null;

  @Column({ name: "user_agent", type: "nvarchar", length: 500, nullable: true })
  userAgent!: string | null;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  metadata!: string | null;

  @CreateDateColumn({ name: "created_at", type: "datetime2" })
  createdAt!: Date;
}
