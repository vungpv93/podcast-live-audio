import { forwardRef, Module } from '@nestjs/common';
import { SignalingGateway } from './signaling.gateway';
import { MediasoupModule } from '../mediasoup/mediasoup.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LiveProgramEntity, PersonalAccessTokensEntity } from '../entities';
import { ResourceModule } from '../resources/resources.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LiveProgramEntity, PersonalAccessTokensEntity]),
    ResourceModule,
    forwardRef(() => MediasoupModule),
  ],
  providers: [SignalingGateway],
  exports: [SignalingGateway],
})
export class SignalingModule {}
