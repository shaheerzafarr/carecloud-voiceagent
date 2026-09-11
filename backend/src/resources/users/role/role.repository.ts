import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IRole, Role } from './entities/role.entity';

@Injectable()
export class RoleRepository {
  constructor(@InjectModel(Role.name) private readonly Role: Model<Role>) {}

  async create(data: Partial<IRole>): Promise<IRole> {
    return await this.Role.create(data);
  }

  async findByRoleName(name: string): Promise<IRole> {
    return (await this.Role.findOne({ name })) as unknown as IRole;
  }
}
