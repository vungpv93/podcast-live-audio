import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { AbstractEntity } from './Abstract.entity';

@Entity({ name: 'personal_access_tokens' })
export class PersonalAccessTokensEntity extends AbstractEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'tokenable_type', type: 'varchar', nullable: true, default: null })
  tokenable_type: string;

  @Column({ name: 'tokenable_id', type: 'bigint', nullable: true, default: null })
  tokenable_id: number;

  @Column({ name: 'name', type: 'varchar', nullable: true })
  name: string;

  @Column({ name: 'token', type: 'varchar', nullable: true })
  token: string;

  @Column({ name: 'abilities', type: 'varchar', nullable: false, length: 200 })
  abilities: string;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true, default: null })
  expires_at: string;

  @Column({ name: 'last_used_at', type: 'timestamp', nullable: true, default: null })
  last_used_at: string;
}
