import { Injectable, Logger } from '@nestjs/common';
import Redis, { ScanStream } from 'ioredis';
import { Server } from 'socket.io';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);
  private server: Server;
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis({ host: process.env.REDIS_HOST, port: Number(process.env.REDIS_PORT) });
  }

  public setServer(server: Server) {
    this.server = server;
  }

  /**
   * @functionName sockets
   * @description
   * - live:*:sockets
   * - sockets
   * - socket:*:lives
   */
  public async socket(): Promise<void> {
    this.logger.log(`The server is started`);

    const stream1: ScanStream = this.redis.scanStream({ match: `live:*:sockets` });
    for await (const keys of stream1) {
      for (const key of keys) {
        const socketIds = await this.redis.zrange(key, 0, -1);
        this.logger.log(JSON.stringify({ socketIds }, null, 2), `Received ${socketIds.length} in ${key}`);
        for (const socketId of socketIds) {
          if (!this.server.sockets.sockets.has(socketId)) {
            this.redis.zrem(key, socketId);
          }
        }
      }
    }

    const stream2: ScanStream = this.redis.scanStream({ match: `sockets` });
    for await (const keys of stream2) {
      for (const key of keys) {
        const socketIds = await this.redis.zrange(key, 0, -1);
        for (const socketId of socketIds) {
          if (!this.server.sockets.sockets.has(socketId)) {
            this.redis.zrem(key, socketId);
          }
        }
      }
    }

    const stream3: ScanStream = this.redis.scanStream({ match: 'socket:*:lives' });
    for await (const keys of stream3) {
      if (keys.length) {
        await this.redis.del(...keys);
      }
    }
  }
}
