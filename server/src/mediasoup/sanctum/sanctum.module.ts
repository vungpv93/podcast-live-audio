import { forwardRef, Module } from '@nestjs/common';
import { SanctumService } from './sanctum.service';
import { MediasoupModule } from '../mediasoup.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminEntity, PersonalAccessTokensEntity, UserEntity } from '../../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([PersonalAccessTokensEntity, AdminEntity, UserEntity]),
    forwardRef(() => MediasoupModule),
  ],
  providers: [SanctumService],
  exports: [SanctumService],
})
export class SanctumModule {}
