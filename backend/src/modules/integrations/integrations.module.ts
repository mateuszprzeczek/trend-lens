import { Module } from '@nestjs/common';
import { OneSignalClient } from './onesignal.client';
import { SendGridClient } from './sendgrid.client';

@Module({
  providers: [OneSignalClient, SendGridClient],
  exports: [OneSignalClient, SendGridClient],
})
export class IntegrationsModule {}
