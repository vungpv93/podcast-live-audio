import { Inject, Logger, Module, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { MediasoupService } from './mediasoup.service';
import { RoomModule } from './room/room.module';
import { TransportModule } from './transport/transport.module';
import { ProducerConsumerModule } from './producer-consumer/producer-consumer.module';
import { version } from 'mediasoup';
import { RedisService } from './redis.service';
import { LiveModule } from './live/live.module';
import { ResourceModule } from '../resources/resources.module';
import { Router, Worker } from 'mediasoup/node/lib/types';
import { mediaCodecs } from './media.config';
import { SignalingGateway } from '../signaling/signaling.gateway';
import { SignalingModule } from '../signaling/signaling.module';
import { MediasoupResource } from './mediasoup.type';
import { SanctumModule } from './sanctum/sanctum.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminEntity, UserEntity } from '../entities';
import { RecorderModule } from './recorder/recorder.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminEntity, UserEntity]),
    ResourceModule,
    LiveModule,
    RecorderModule,
    SignalingModule,
    RoomModule,
    TransportModule,
    ProducerConsumerModule,
    SanctumModule,
  ],
  providers: [MediasoupService, RedisService],
  exports: [MediasoupService, RedisService, RoomModule, TransportModule, ProducerConsumerModule, SanctumModule],
})
export class MediasoupModule implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(MediasoupModule.name);

  constructor(
    @Inject('RESOURCE') private resource: MediasoupResource,
    private readonly mediasoupService: MediasoupService,
    private readonly redisService: RedisService,
    private readonly signalingGateway: SignalingGateway,
  ) {}

  public async onApplicationBootstrap(): Promise<void> {
    this.logger.log('[*** Mediasoup ***] Application Bootstrap');
    this.logger.log(`Mediasoup version ${version}`);
    await this.mediasoupService.initialWorkers();
    this.logger.log(`Mediasoup workers initialized`);

    const liveIds: string[] = await this.redisService.getLivesRestore();
    this.logger.debug(`Mediasoup routers restored`, liveIds);

    for (const liveId of liveIds) {
      this.logger.debug('Khởi tạo lại phòng live : ', liveId);
      const worker: Worker = this.mediasoupService.getWorker();
      const router: Router = await worker.createRouter({
        mediaCodecs,
        appData: { workerId: worker.pid, liveId: liveId },
      });
      await this.redisService.restoreLive(liveId, router);
      this.resource.routers.set(router.id, router);
      this.logger.debug(`Mediasoup router for live ${liveId} restored`);
      await this.signalingGateway.emitLiveRestored(liveId);
    }
  }

  public async onApplicationShutdown(): Promise<void> {
    this.logger.log('[*** Mediasoup ***] Application Shutdown');
  }
}
