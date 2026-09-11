import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CallLogRepository } from './call-log.repository';
import { CallLogService } from './call-log.service';
import { CallLog, CallLogSchema } from './entities/call-log.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CallLog.name, schema: CallLogSchema },
    ]),
  ],
  providers: [CallLogService, CallLogRepository],
  exports: [CallLogService],
})
export class CallLogModule {}
