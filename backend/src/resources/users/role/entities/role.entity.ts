import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({
  collection: 'roles',
  timestamps: true,
})
class Role {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  name!: string;

  @Prop({ type: [String], default: [] })
  permissions!: string[];

  @Prop({ type: Boolean, default: false })
  isDefault!: boolean;
}

const RoleSchema = SchemaFactory.createForClass(Role);
type IRole = HydratedDocument<Role>;
export { IRole, Role, RoleSchema };
