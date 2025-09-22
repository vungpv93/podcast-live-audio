import { Global, Module, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { CleanupService } from './cleanup.service';

@Global()
@Module({
  providers: [CleanupService],
  exports: [CleanupService],
})
export class CleanupModule implements OnApplicationBootstrap, OnApplicationShutdown {
  constructor(private readonly cleanupService: CleanupService) {}

  public async onApplicationBootstrap(): Promise<void> {
    console.log('Running CleanupModule -> onApplicationBootstrap -> cleanup ...');
    await this.cleanupService.socket();
  }

  public async onApplicationShutdown(): Promise<void> {
    console.log('Running CleanupModule -> onApplicationShutdown -> cleanup ...');
  }
}
