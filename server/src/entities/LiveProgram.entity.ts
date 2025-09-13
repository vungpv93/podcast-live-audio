import { Entity, PrimaryGeneratedColumn, Column, DeleteDateColumn } from 'typeorm';
import { AbstractEntity } from './Abstract.entity';

@Entity({ name: 'live_programs' })
export class LiveProgramEntity extends AbstractEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'code', type: 'varchar', nullable: true, default: null })
  code: string;

  @Column({ name: 'name', type: 'varchar', nullable: true })
  name: string;

  @Column({ name: 'image', type: 'varchar', nullable: true })
  image: string;

  @Column({ name: 'status', type: 'varchar', nullable: false, length: 200 })
  status: string;

  @Column({ name: 'scheduled_at', type: 'timestamp', nullable: true, default: null })
  scheduled_at: string;

  @Column({ name: 'live_at', type: 'timestamp', nullable: true, default: null })
  live_at: string;

  @Column({ name: 'recorder_flag', type: 'tinyint', nullable: true, default: null })
  recorder_flag: number;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true, default: null })
  deleted_at: string;
}
