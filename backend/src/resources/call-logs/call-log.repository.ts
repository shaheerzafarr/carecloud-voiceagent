import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CallLog, ICallLog } from './entities/call-log.entity';

@Injectable()
export class CallLogRepository {
  constructor(
    @InjectModel(CallLog.name) private readonly CallLog: Model<CallLog>,
  ) {}

  async create(data: Partial<ICallLog>): Promise<ICallLog> {
    return await this.CallLog.create(data);
  }

  async findByCallId(callId: string): Promise<ICallLog | null> {
    return (await this.CallLog.findOne({ call_id: callId })) as unknown as ICallLog | null;
  }

  async findByPatientId(patientId: string): Promise<ICallLog[]> {
    return (await this.CallLog.find({ patient_id: patientId })
      .sort({ createdAt: -1 })
      .exec()) as unknown as ICallLog[];
  }

  async update(callId: string, data: Partial<ICallLog>): Promise<ICallLog | null> {
    return (await this.CallLog.findOneAndUpdate(
      { call_id: callId },
      { $set: data },
      { returnDocument: 'after', upsert: true },
    )) as unknown as ICallLog | null;
  }

  async getRecentCalls(limit = 10): Promise<ICallLog[]> {
    return (await this.CallLog.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec()) as unknown as ICallLog[];
  }

  async countToday(): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    return await this.CallLog.countDocuments({
      createdAt: { $gte: startOfDay },
    });
  }
}
