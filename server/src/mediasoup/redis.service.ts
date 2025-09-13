import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { Socket } from 'socket.io';
import * as moment from 'moment';
import { Router } from 'mediasoup/node/lib/types';

@Injectable()
export class RedisService {
  private readonly redis: Redis;

  constructor() {
    console.log('REDIS PORT is ', Number(process.env.REDIS_PORT));
    this.redis = new Redis({ host: process.env.REDIS_HOST, port: Number(process.env.REDIS_PORT) });
  }

  public async initial() {
    await this.redis.set('App:Initialized', 'true');
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

  public async beginLive(liveId: string, router: Router): Promise<void> {
    await this.redis
      .multi()
      .set(`live:${liveId}:status`, 'ongoing')
      .set(`live:${liveId}:live_at`, Date.now().toString())
      .set(`live:${liveId}:router_id`, router.id)
      .set(`live:${liveId}:rtp_capabilities`, JSON.stringify(router.rtpCapabilities))
      .exec();
  }

  /**
   * @functionName endLive
   * @param liveId
   * @author vungpv93@gmail.com
   * @description
   * - Thực hiện xóa dữ liệu khỏi Redis khi kết thúc phiên live
   * - Dữ liệu xóa bao gồm: trạng thái buổi live, thời gian bắt đầu live, ID của router và khả năng RTP của router.
   * - Việc này giúp giải phóng tài nguyên và đảm bảo rằng thông tin không còn được lưu trữ sau khi phiên live kết thúc.
   */
  public async endLive(liveId: string): Promise<void> {
    await this.redis.del(`live:${liveId}:status`);
    await this.redis.del(`live:${liveId}:live_at`);
    await this.redis.del(`live:${liveId}:router_id`);
    await this.redis.del(`live:${liveId}:rtp_capabilities`);
  }

  /**
   * @param liveId
   * @param router
   */
  public async restoreLive(liveId: string, router: Router) {
    await this.redis
      .multi()
      .set(`live:${liveId}:status`, 'ongoing')
      .set(`live:${liveId}:router_id`, router.id)
      .set(`live:${liveId}:rtp_capabilities`, JSON.stringify(router.rtpCapabilities))
      .exec();
  }

  public async getLive(
    liveId: string,
  ): Promise<{ liveId: string; status: string; liveAt: string | null; routerId?: string } | null> {
    const [status, liveAt, routerId] = await this.redis.mget(
      `live:${liveId}:status`,
      `live:${liveId}:live_at`,
      `live:${liveId}:router_id`,
    );

    if (!status) return null;

    return {
      liveId: liveId,
      routerId: routerId,
      status: status,
      liveAt: liveAt ? moment(new Date(Number(liveAt))).format('YYYY-MM-DD HH:mm:ss') : null,
    };
  }

  public async getLivesRestore(): Promise<string[]> {
    const keys = await this.redis.keys('live:*:status');
    return keys.map((key) => key.split(':')[1]);
  }
}
