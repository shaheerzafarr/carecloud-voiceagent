import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { Admin, IAdmin } from './entities/admin.entity';

@Injectable()
export class AdminRepository {
  constructor(@InjectModel(Admin.name) private readonly Admin: Model<Admin>) {}

  async create(data: Partial<IAdmin>): Promise<IAdmin> {
    return await this.Admin.create(data);
  }

  async findById(id: string): Promise<IAdmin> {
    return (await this.Admin.findById(id)) as unknown as IAdmin;
  }

  async update(id: string, data: Partial<IAdmin>): Promise<IAdmin> {
    return (await this.Admin.findByIdAndUpdate(id, data, {
      returnDocument: 'after',
    })) as unknown as IAdmin;
  }

  async aggregate(pipeline: PipelineStage[]) {
    return await this.Admin.aggregate(pipeline);
  }
}
