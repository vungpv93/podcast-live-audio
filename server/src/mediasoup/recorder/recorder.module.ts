import { forwardRef, Module } from '@nestjs/common';
import { MediasoupModule } from '../mediasoup.module';
import { RecorderService } from './recorder.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule, forwardRef(() => MediasoupModule)],
  providers: [RecorderService],
  exports: [RecorderService],
})
export class RecorderModule {}
