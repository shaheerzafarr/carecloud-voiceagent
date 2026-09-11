import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { CONTACT_STATUS } from '../enums/contact-status.enum';

@Schema({
  collection: 'contacts',
  timestamps: true,
})
class Contact {
  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: String, required: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ type: String, default: null })
  phone!: string;

  @Prop({ type: String, required: true, trim: true })
  subject!: string;

  @Prop({ type: String, required: true })
  message!: string;

  @Prop({
    type: String,
    enum: CONTACT_STATUS,
    default: CONTACT_STATUS.PENDING,
  })
  status!: CONTACT_STATUS;
}

const ContactSchema = SchemaFactory.createForClass(Contact);
type IContact = HydratedDocument<Contact>;
export { IContact, Contact, ContactSchema };
