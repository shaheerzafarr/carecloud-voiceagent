import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IPagination } from 'src/common/constants/interfaces/interface';
import { Contact, IContact } from './entities/contact.entity';

@Injectable()
export class ContactRepository {
  constructor(
    @InjectModel(Contact.name) private readonly Contact: Model<Contact>,
  ) {}

  async create(data: Partial<IContact>): Promise<IContact> {
    return await this.Contact.create(data);
  }

  async findAll(
    query: IPagination,
  ): Promise<{ contacts: IContact[]; totalCount: number }> {
    const { skip, limit } = query;

    const contactsQuery = this.Contact.find().sort({ createdAt: -1 });

    if (skip !== undefined) contactsQuery.skip(skip);
    if (limit !== undefined) contactsQuery.limit(limit);

    const [contacts, totalCount] = await Promise.all([
      contactsQuery.exec(),
      this.Contact.countDocuments(),
    ]);

    return { contacts: contacts as unknown as IContact[], totalCount };
  }

  async findById(id: string): Promise<IContact> {
    return (await this.Contact.findById(id)) as unknown as IContact;
  }

  async update(id: string, data: Partial<IContact>): Promise<IContact> {
    return (await this.Contact.findByIdAndUpdate(id, data, {
      returnDocument: 'after',
    })) as unknown as IContact;
  }

  async delete(id: string): Promise<IContact> {
    return (await this.Contact.findByIdAndDelete(id)) as unknown as IContact;
  }
}
