import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "users" })
@Index(["email"], { unique: true })
export class User {
  @PrimaryColumn({ type: "uniqueidentifier" })
  id!: string;

  @Column({ type: "nvarchar", length: 320 })
  email!: string;

  @Column({ name: "password_hash", type: "nvarchar", length: 255 })
  passwordHash!: string;

  @Column({
    name: "display_name",
    type: "nvarchar",
    length: 100,
    nullable: true,
  })
  displayName!: string | null;

  @Column({ name: "is_active", type: "bit", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at", type: "datetime2" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime2" })
  updatedAt!: Date;
}
