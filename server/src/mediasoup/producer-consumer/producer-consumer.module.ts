import { Module } from '@nestjs/common';
import { ProducerConsumerService } from './producer-consumer.service';
import { RoomModule } from '../room/room.module';
import { RecorderModule } from '../recorder/recorder.module';
import { RedisService } from '../redis.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminEntity, UserEntity } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([AdminEntity, UserEntity]), RoomModule, RecorderModule],
  providers: [ProducerConsumerService, RedisService],
  exports: [ProducerConsumerService, RedisService],
})
export class ProducerConsumerModule {}
