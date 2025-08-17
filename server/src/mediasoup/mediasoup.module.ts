import { Logger, Module, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { MediasoupService } from './mediasoup.service';
import { RoomModule } from './room/room.module';
import { TransportModule } from './transport/transport.module';
import { ProducerConsumerModule } from './producer-consumer/producer-consumer.module';
import { version } from 'mediasoup';
import { RedisService } from './redis.service';

@Module({
  imports: [RoomModule, TransportModule, ProducerConsumerModule],
  providers: [
    MediasoupService,
    RedisService,
    {
      provide: 'RESOURCE',
      useValue: {
        workers: [],
        routers: [],
        consumers: [],
        producers: [],
        transports: [],
        dataConsumers: [],
        dataProducers: [],
        audioLevelObserver: [],
        activeSpeakerObserver: [],
        currentWorker: 0,
      },
    },
  ],
  exports: [MediasoupService, RedisService, RoomModule, TransportModule, ProducerConsumerModule],
})
export class MediasoupModule implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(MediasoupModule.name);

  constructor(private readonly mediasoupService: MediasoupService) {}

  public async onApplicationBootstrap(): Promise<void> {
    this.logger.log('[*** Mediasoup ***] Application Bootstrap');
    this.logger.log(`Mediasoup version ${version}`);
    await this.mediasoupService.initialWorkers();
  }

  public async onApplicationShutdown(): Promise<void> {
    this.logger.log('[*** Mediasoup ***] Application Shutdown');
  }
}
