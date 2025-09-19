import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { AbstractEntity } from './Abstract.entity';

@Entity({ name: 'admins' })
export class AdminEntity extends AbstractEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', type: 'varchar', nullable: true, default: null })
  name: string;

  @Column({ name: 'username', type: 'varchar', nullable: true })
  username: string;

  @Column({ name: 'email', type: 'varchar', nullable: true })
  email: string;
}
