import { Module } from '@nestjs/common';
import { SignalingGateway } from './signaling.gateway';
import { MediasoupModule } from '../mediasoup/mediasoup.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LiveProgramEntity } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([LiveProgramEntity]), MediasoupModule],
  providers: [SignalingGateway],
})
export class SignalingModule {}
