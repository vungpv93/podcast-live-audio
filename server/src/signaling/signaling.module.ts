import { forwardRef, Module } from '@nestjs/common';
import { SignalingGateway } from './signaling.gateway';
import { MediasoupModule } from '../mediasoup/mediasoup.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LiveProgramEntity, PersonalAccessTokensEntity } from '../entities';
import { ResourceModule } from '../resources/resources.module';
import { RecorderModule } from '../mediasoup/recorder/recorder.module';
import { ClientService } from './client.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([LiveProgramEntity, PersonalAccessTokensEntity]),
    ResourceModule,
    RecorderModule,
    forwardRef(() => MediasoupModule),
  ],
  providers: [SignalingGateway, ClientService],
  exports: [SignalingGateway, ClientService],
})
export class SignalingModule {}
