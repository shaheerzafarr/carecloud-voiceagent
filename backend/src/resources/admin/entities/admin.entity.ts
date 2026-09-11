import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ADMIN_STATUS } from '../enums/admin.enum';

@Schema({
  collection: 'admins',
  timestamps: true,
})
class Admin {
  @Prop({ type: String })
  name!: string;

  @Prop({ type: String, enum: ADMIN_STATUS, default: ADMIN_STATUS.ACTIVE })
  status!: ADMIN_STATUS;
}

const AdminSchema = SchemaFactory.createForClass(Admin);
type IAdmin = HydratedDocument<Admin>;
export { IAdmin, Admin, AdminSchema };
