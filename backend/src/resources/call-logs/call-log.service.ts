import { Injectable, Logger } from '@nestjs/common';
import { CallLogRepository } from './call-log.repository';
import { ICallLog, CALL_STATUS } from './entities/call-log.entity';

@Injectable()
export class CallLogService {
  private readonly logger = new Logger(CallLogService.name);

  constructor(private readonly callLogRepository: CallLogRepository) {}

  async createOrUpdate(data: {
    call_id: string;
    patient_id?: string;
    phone_number?: string;
    transcript?: string;
    summary?: string;
    duration_seconds?: number;
    status?: CALL_STATUS;
    metadata?: Record<string, any>;
  }): Promise<ICallLog | null> {
    this.logger.log(`📞 Call log update: ${data.call_id} | Status: ${data.status || 'update'}`);
    return (await this.callLogRepository.update(data.call_id, data)) as ICallLog;
  }

  async findByPatientId(patientId: string): Promise<ICallLog[]> {
    return await this.callLogRepository.findByPatientId(patientId);
  }

  async getRecentCalls(limit = 10): Promise<ICallLog[]> {
    return await this.callLogRepository.getRecentCalls(limit);
  }

  async countToday(): Promise<number> {
    return await this.callLogRepository.countToday();
  }
}
