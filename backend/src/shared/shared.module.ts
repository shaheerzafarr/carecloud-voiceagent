import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { LogService } from './log.service';
import { S3Service } from './s3.service';
import { StripeService } from './stripe.service';
@Global()
@Module({
  imports: [],
  providers: [EmailService, S3Service, LogService, StripeService],
  exports: [EmailService, S3Service, LogService, StripeService],
})
export class SharedModule {}
