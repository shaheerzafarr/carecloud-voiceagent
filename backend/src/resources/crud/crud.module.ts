import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContactController } from './contact-us/contact.controller';
import { ContactRepository } from './contact-us/contact.repository';
import { ContactService } from './contact-us/contact.service';
import { Contact, ContactSchema } from './contact-us/entities/contact.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Contact.name, schema: ContactSchema },
    ]),
  ],
  controllers: [ContactController],
  providers: [ContactService, ContactRepository],
  exports: [ContactService, ContactRepository],
})
export class CrudModule {}
