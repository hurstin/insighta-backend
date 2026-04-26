import { Entity, Column, PrimaryColumn, BeforeInsert } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';

@Entity('profiles')
export class Profile {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  gender: string;

  @Column('float')
  gender_probability: number;

  @Column('int')
  age: number;

  @Column()
  age_group: string;

  @Column({ length: 2 })
  country_id: string;

  @Column()
  country_name: string;

  @Column('float')
  country_probability: number;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }
}
