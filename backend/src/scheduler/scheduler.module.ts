import { Module } from '@nestjs/common';
import { CampaignsScheduler } from './campaigns.scheduler';

@Module({
  providers: [CampaignsScheduler],
  exports: [CampaignsScheduler],
})
export class SchedulerModule {}
