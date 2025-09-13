import { IWorker } from './interface/media-resources.interfaces';
import { Injectable, Inject } from '@nestjs/common';
import * as mediasoup from 'mediasoup';
import * as os from 'os';
import { MediasoupResource } from './mediasoup.type';
import { Worker } from 'mediasoup/node/lib/types';

@Injectable()
export class MediasoupService {
  private nextWorkerIndex = 0;
  private workers: IWorker[] = [];

  constructor(@Inject('RESOURCE') private resource: MediasoupResource) {}

  /**
   * create mediasoup workers on module init
   */
  // public async onModuleInit() {
  //   const numWorkers = os.cpus().length;
  //   for (let i = 0; i < numWorkers; ++i) {
  //     await this.createWorker();
  //   }
  //
  //   const lives: string[] = ['550e8400-e29b-41d4-a716-446655440000'];
  //   console.log('Khởi tạo lại cac phòng live : ', lives);
  // }

  public async initialWorkers(): Promise<void> {
    const numWorkers = os.cpus().length;
    for (let i = 0; i < numWorkers; ++i) {
      await this.createWorker();
    }
  }

  private async createWorker() {
    const worker = await mediasoup.createWorker({
      rtcMinPort: 40000,
      rtcMaxPort: 49999,
    });

    worker.on('died', () => {
      console.error('mediasoup worker has died');
      setTimeout(() => process.exit(1), 2000);
    });

    this.resource.workers.set(String(worker.pid), worker);
    this.workers.push({ worker, routers: new Map() });
    return worker;
  }

  public getWorker() {
    const worker: Worker = Array.from(this.resource.workers.values())[this.nextWorkerIndex];
    this.nextWorkerIndex = (this.nextWorkerIndex + 1) % this.resource.workers.size;
    return worker;

    // const worker = this.workers[this.nextWorkerIndex].worker;
    // this.nextWorkerIndex = (this.nextWorkerIndex + 1) % this.workers.length;
    // return worker;
  }
}
