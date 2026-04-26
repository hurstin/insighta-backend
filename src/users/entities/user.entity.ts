import { Entity, Column, PrimaryColumn, BeforeInsert } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';

export enum Role {
  ADMIN = 'ADMIN',
  ANALYST = 'ANALYST',
}

@Entity('users')
export class User {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  githubId: string | null;

  @Column()
  username: string;

  @Column({
    type: 'varchar',
    enum: Role,
    default: Role.ANALYST,
  })
  role: Role;

  @Column({ type: 'varchar', nullable: true })
  refreshToken: string | null;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }
}
