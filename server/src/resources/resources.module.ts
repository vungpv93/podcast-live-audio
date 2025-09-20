import { Global, Module } from '@nestjs/common';
import { ResourcesService } from './resources.service';

@Global()
@Module({
  providers: [
    {
      provide: 'RESOURCE',
      useValue: {
        workers: new Map(),
        routers: new Map(),
        transports: new Map(),
        producers: new Map(),
        consumers: new Map(),
        sockets: new Map<string, { transports: string[]; producers: string[]; consumers: string[] }>(),
        // workers: [],
        // routers: [],
        // consumers: [],
        // producers: [],
        // transports: [],
        dataConsumers: [],
        dataProducers: [],
        audioLevelObserver: [],
        activeSpeakerObserver: [],
        currentWorker: 0,
      },
    },
    ResourcesService,
  ],
  exports: ['RESOURCE', ResourcesService],
})
export class ResourceModule {}
