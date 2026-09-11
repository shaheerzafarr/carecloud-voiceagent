import { BadRequestException, Injectable } from '@nestjs/common';
import { IPagination } from 'src/common/constants/interfaces/interface';
import { ContactRepository } from './contact.repository';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { IContact } from './entities/contact.entity';

@Injectable()
export class ContactService {
  constructor(private readonly contactRepository: ContactRepository) {}

  async createContact(createContactDto: CreateContactDto): Promise<IContact> {
    return await this.contactRepository.create(createContactDto);
  }

  async getAllContacts(
    query: IPagination,
  ): Promise<{ contacts: IContact[]; totalCount: number }> {
    return await this.contactRepository.findAll(query);
  }

  async getContact(contactId: string): Promise<IContact> {
    const contact = await this.contactRepository.findById(contactId);

    if (!contact) throw new BadRequestException('Contact not found');

    return contact;
  }

  async updateContact(updateContactDto: UpdateContactDto): Promise<IContact> {
    const { contactId, ...rest } = updateContactDto;

    await this.getContact(contactId);

    return await this.contactRepository.update(contactId, rest);
  }

  async deleteContact(contactId: string): Promise<IContact> {
    await this.getContact(contactId);

    return await this.contactRepository.delete(contactId);
  }
}
