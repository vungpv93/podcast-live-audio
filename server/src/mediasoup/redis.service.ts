import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import * as moment from 'moment';
import { Router } from 'mediasoup/node/lib/types';
import { TTL } from '../constants/app';

@Injectable()
export class RedisService {
  private readonly redis: Redis;

  constructor() {
    console.log('REDIS PORT is ', Number(process.env.REDIS_PORT));
    this.redis = new Redis({ host: process.env.REDIS_HOST, port: Number(process.env.REDIS_PORT) });
  }

  /**
   * @functionName initial
   */
  public async initial(socketId: string) {
    await this.redis.zadd(`sockets`, Date.now(), socketId);
  }

  public async destroy(socketId: string) {
    await this.redis.zrem(`sockets`, socketId);
  }

  /**
   * @functionName sockets
   */
  public async sockets(liveId: string, socketId: string) {
    await this.redis.zadd(`live:${liveId}:sockets`, Date.now(), socketId);
  }

  /**
   * @param liveId
   * @param socketId
   * @param userId
   */
  public async join(liveId: string, socketId: string, userId: number): Promise<void> {
    await this.redis.zadd(`live:${liveId}:sockets`, Date.now(), socketId);
    await this.redis.set(`live:${liveId}:socket:${socketId}`, userId, 'EX', TTL);
    await this.redis.sadd(`live:${liveId}:histories`, userId);
  }

  /**
   * @param liveId
   * @param socketId
   * @param userId
   */
  public async refreshTtl(liveId: string, socketId: string, userId: number): Promise<void> {
    await this.redis.set(`live:${liveId}:socket:${socketId}`, userId, 'EX', TTL);
  }

  /**
   * @param liveId
   * @param router
   */
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

  /**
   * ================================================================================
   *                              #liveId Comments
   * ================================================================================
   */
  /**
   * Lưu bình luận vào Redis Sorted Set với điểm số là timestamp
   * @param liveId
   * @param score
   * @param comment
   */
  public async storeComment(liveId: string, score: number, comment: any): Promise<void> {
    await this.redis.zadd(`live:${liveId}:comments`, score, JSON.stringify(comment));
  }

  public async deleteComment(liveId: string, score: number): Promise<void> {
    await this.redis.zremrangebyscore(`live:${liveId}:comments`, score, score);
  }

  /**
   * @param liveId
   * @param cursor
   */
  public async getComments(liveId: string, cursor?: number): Promise<any> {
    const limit = 20;
    const max = cursor ? `(${cursor}` : '+inf'; // exclusive nếu có cursor
    const min = '-inf';
    const items = await this.redis.zrevrangebyscore(`live:${liveId}:comments`, max, min, 'LIMIT', 0, limit);
    const comments = items.map((strObj) => JSON.parse(strObj));

    let nextCursor: string | null = null;
    if (comments.length > 0) {
      const last = comments[comments.length - 1];
      nextCursor = last.score || null;
    }

    return {
      data: comments,
      nextCursor,
      hasMore: !!nextCursor,
    };
  }

  /**
   * ================================================================================
   *                              #liveId sockets
   * ================================================================================
   */
  public async countSockets(liveId: string) {
    const sockets: string[] = await this.redis.zrange(`live:${liveId}:sockets`, 0, -1);
    const pipeline = this.redis.pipeline();
    sockets.forEach((s) => pipeline.exists(`live:${liveId}:socket:${s}`));
    const results = await pipeline.exec();
    return results.filter((r) => r[1] === 1).length;
  }

  public async getSockets(liveId: string, page = 1, pageSize = 50): Promise<{ socketId: string; userId: number }[]> {
    const start = (page - 1) * pageSize;
    const stop = start + pageSize - 1;

    const sockets = await this.redis.zrevrange(`live:${liveId}:sockets`, start, stop);
    const pipeline = this.redis.pipeline();
    // sockets.forEach((s) => pipeline.exists(`live:${liveId}:socket:${s}`));
    // const results = await pipeline.exec();
    // return sockets.filter((s, i) => results[i][1] === 1);

    sockets.forEach((s) => pipeline.get(`live:${liveId}:socket:${s}`));
    const results = await pipeline.exec();

    return sockets
      .map((s, i) => {
        const userId = results[i][1];
        if (!userId) return null;
        return { socketId: s, userId: Number(userId) };
      })
      .filter((item: { socketId: string; userId: number }): boolean => item !== null);
  }
}
