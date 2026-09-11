import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IPagination } from 'src/common/constants/interfaces/interface';
import { Auth } from 'src/common/decorators/auth.decorator';
import { Pagination } from 'src/common/decorators/pagination.decorator';
import { ApiAuth } from 'src/common/decorators/swagger.decorator';
import { ROLES } from '../../users/role/enums/role.enum';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@ApiTags('Contact Us')
@Controller('contact-us')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @ApiAuth('Submit a contact-us request')
  async createContact(@Body() createContactDto: CreateContactDto) {
    const data = await this.contactService.createContact(createContactDto);

    return { data };
  }

  @Get()
  @Auth([ROLES.SUPER_ADMIN])
  @ApiAuth('Get all contact-us requests')
  async getAllContacts(@Pagination() query: IPagination) {
    const data = await this.contactService.getAllContacts(query);

    return { data };
  }

  @Get(':contactId')
  @Auth([ROLES.SUPER_ADMIN])
  @ApiAuth('Get a single contact-us request')
  async getContact(@Param('contactId') contactId: string) {
    const data = await this.contactService.getContact(contactId);

    return { data };
  }

  @Patch()
  @Auth([ROLES.SUPER_ADMIN])
  @ApiAuth('Update a contact-us request status')
  async updateContact(@Body() updateContactDto: UpdateContactDto) {
    const data = await this.contactService.updateContact(updateContactDto);

    return { data };
  }

  @Delete(':contactId')
  @Auth([ROLES.SUPER_ADMIN])
  @ApiAuth('Delete a contact-us request')
  async deleteContact(@Param('contactId') contactId: string) {
    const data = await this.contactService.deleteContact(contactId);

    return { data };
  }
}
