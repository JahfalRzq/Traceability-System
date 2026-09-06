import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

export enum UserRole {
  OPERATOR = "OPERATOR",
  GL_MANAGER = "GL_MANAGER",
  ADMIN = "ADMIN",
}

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 50, unique: true })
  username!: string;

  @Column({ type: "varchar", length: 255 })
  passwordHash!: string;

  @Column({ type: "varchar", length: 100 })
  fullName!: string;

  @Column({ type: "varchar", length: 20 })
  role!: UserRole;

  @Column({ type: "bit", default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: "datetime2" })
  createdAt!: Date;
}