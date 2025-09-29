import { createHash } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AdminEntity, PersonalAccessTokensEntity, UserEntity } from '../../entities';
import { Repository } from 'typeorm';

@Injectable()
export class SanctumService {
  private readonly logger: Logger = new Logger(SanctumService.name);

  constructor(
    @InjectRepository(PersonalAccessTokensEntity) private readonly repo: Repository<PersonalAccessTokensEntity>,
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(AdminEntity) private readonly adminRepo: Repository<AdminEntity>,
  ) {}

  /**
   * @param token
   */
  public async verify(token: string): Promise<{ id: number; type: string; authId: number; nickname: string } | null> {
    this.logger.log(token, 'Running SanctumService@verify');
    const [id, plainTextToken] = token.split('|');
    if (!id || !plainTextToken) return null;
    this.logger.log(
      JSON.stringify({ id: Number(id), plainTextToken: plainTextToken }, null, 2),
      'Running SanctumService@verify',
    );
    const entity: PersonalAccessTokensEntity | null = await this.repo.findOneOrFail({ where: { id: Number(id) } });
    if (!entity) return null;

    const hashed = createHash('sha256').update(plainTextToken).digest('hex');
    this.logger.log(entity.token, 'Running SanctumService@verify -> entity.token ');
    this.logger.log(hashed, 'Running SanctumService@verify -> hashed ');
    if (entity.token !== hashed) {
      return null;
    }

    if (entity.tokenable_type === 'App\\Models\\Admin') {
      const admin: AdminEntity = await this.adminRepo.findOne({ where: { id: Number(entity.tokenable_id) } });
      return {
        id: entity.id,
        type: 'ADMIN',
        authId: Number(entity.tokenable_id),
        nickname: this.getAdminNickname(admin),
      };
    } else {
      const user: UserEntity = await this.userRepo.findOne({ where: { id: Number(entity.tokenable_id) } });
      return {
        id: entity.id,
        type: 'USER',
        authId: Number(entity.tokenable_id),
        nickname: this.getUserNickname(user),
      };
    }
  }

  public getUserNickname(user: UserEntity): string {
    const fullName = [user.firstname, user.lastname].filter(Boolean).join(' ').trim();
    if (fullName) return fullName;

    if (user.username) return user.username;

    if (user.email) return user.email;

    return 'NA';
  }

  public getAdminNickname(user: AdminEntity): string {
    if (user.name) return user.name;

    if (user.username) return user.username;

    if (user.email) return user.email;

    return 'NA';
  }
}
