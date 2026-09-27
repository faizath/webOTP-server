import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";
import { User } from "./user.entity.ts";

@Entity({ name: "user_preferences" })
export class UserPreferences {
  @PrimaryColumn({ name: "user_id", type: "uniqueidentifier" })
  userId!: string;

  @OneToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "nvarchar", length: 20, default: "default" })
  theme!: string;

  @Column({ name: "lock_timeout_minutes", type: "int", nullable: true })
  lockTimeoutMinutes!: number | null;

  @Column({
    name: "lock_action",
    type: "nvarchar",
    length: 20,
    default: "master",
  })
  lockAction!: string;
}
