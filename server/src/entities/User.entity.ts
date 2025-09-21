import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { AbstractEntity } from './Abstract.entity';

@Entity({ name: 'users' })
export class UserEntity extends AbstractEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'firstname', type: 'varchar', nullable: true, default: null })
  firstname: string;

  @Column({ name: 'lastname', type: 'varchar', nullable: true, default: null })
  lastname: string;

  @Column({ name: 'username', type: 'varchar', nullable: true })
  username: string;

  @Column({ name: 'email', type: 'varchar', nullable: true })
  email: string;

  public getNickname(): string {
    const fullName = [this.firstname, this.lastname].filter(Boolean).join(' ').trim();
    if (fullName) return fullName;
    if (this.username) return this.username;
    if (this.email) return this.email;
    return 'NA';
  }
}
