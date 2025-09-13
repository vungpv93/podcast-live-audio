import { forwardRef, Module } from '@nestjs/common';
import { LiveService } from './live.service';
import { MediasoupModule } from '../mediasoup.module';

@Module({
  imports: [forwardRef(() => MediasoupModule)],
  providers: [LiveService],
  exports: [LiveService],
})
export class LiveModule {}
