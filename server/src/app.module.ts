import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MediasoupModule } from './mediasoup/mediasoup.module';
import { SignalingModule } from './signaling/signaling.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import * as process from 'node:process';
import * as entities from './entities/index';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CleanupModule } from './cleanup/cleanup.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          socket: { host: process.env.REDIS_HOST, port: Number(process.env.REDIS_PORT) },
          ttl: 60 * 60,
        }),
      }),
    }),
    // TODO Need enable db mysql
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      synchronize: false,
      logging: true,
      migrationsRun: false,
      autoLoadEntities: true,
      poolSize: 100,
      logger: 'file',
      maxQueryExecutionTime: 3000,
      extra: { timezone: '+07:00' },
    }),
    TypeOrmModule.forFeature(Object.values(entities as any)),
    HttpModule,
    MediasoupModule,
    SignalingModule,
    CleanupModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
