import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { Socket } from 'socket.io';

@Injectable()
export class RedisService {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis({ host: process.env.REDIS_HOST, port: 6379 });
  }

  public async storeRoom(roomId: string): Promise<void> {
    await this.redis.hmset(`room:${roomId}`, {
      createdAt: Date.now().toString(),
      status: 'live',
    });
  }

  public async addHost(socket: Socket, roomId: string, userId: number): Promise<void> {
    await this.redis.hset(`room:${roomId}:ADM`, socket.id, userId);
    // await this.redis.hset(`room:${roomId}:USR`, socket.id, userId);
  }

  public async getHosts(roomId: string): Promise<{ socketId: string; userId: number; role: 'ADM' | 'USR' }[]> {
    const hosts: Record<string, string> = await this.redis.hgetall(`room:${roomId}:ADM`);
    return Object.entries(hosts).map(([socketId, userId]) => ({
      socketId: socketId,
      userId: Number(userId),
      role: 'ADM',
    }));
  }
}
