import { Global, Module } from '@nestjs/common';

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
  ],
  exports: ['RESOURCE'],
})
export class ResourceModule {}
