import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { IUser, User } from './entities/user.entity';

@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private readonly User: Model<User>) {}

  async create(data: Partial<IUser>): Promise<IUser> {
    const user = await this.User.create(data);
    user.password = undefined as any;
    user.confirmPassword = undefined as any;
    return user as unknown as IUser;
  }

  async findByEmail(email: string, select?: string): Promise<IUser> {
    const user = (await this.User.findOne({ email })
      .select(select as any)
      .populate(userPopulate)) as unknown as IUser;
    return user;
  }

  async findByEmailorPhone(
    type: 'email' | 'phone',
    value: string,
    select?: string,
  ): Promise<IUser> {
    const user = (await this.User.findOne({ [type]: value })
      .select(select as any)
      .populate(userPopulate)) as unknown as IUser;
    return user as unknown as IUser;
  }

  async findByEmailAndPhone(value: string, select?: string): Promise<IUser> {
    const user = (await this.User.findOne({
      $or: [{ email: value }, { phone: value }],
    })
      .select(select as any)
      .populate(userPopulate)) as unknown as IUser;
    return user as unknown as IUser;
  }

  async findByCustomer(customer: string): Promise<IUser> {
    const user = (await this.User.findOne({ customer }).populate(
      userPopulate,
    )) as unknown as IUser;
    return user;
  }

  async findByEmailAndOtpCode(email: string, code: string): Promise<IUser> {
    const user = (await this.User.findOne({
      email,
      'otpCode.code': code,
    })
      .select('+otpCode +password')
      .populate(userPopulate)) as unknown as IUser;
    return user;
  }

  async findById(id: string): Promise<IUser> {
    const user = await this.User.findById(id).populate(userPopulate);
    return user as unknown as IUser;
  }

  async updateUser(id: string, data: Partial<IUser>): Promise<IUser> {
    const user = await this.User.findByIdAndUpdate(id, data, {
      returnDocument: 'after',
    }).populate(userPopulate);
    return user as unknown as IUser;
  }

  async getAllUsers(pipeline: PipelineStage[]) {
    return await this.User.aggregate(pipeline);
  }
}

const userPopulate = [
  {
    path: 'role',
    select: 'name',
  },
];
