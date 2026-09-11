import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { HydratedDocument, SchemaTypes } from 'mongoose';
import validator from 'validator';
import { IRole, Role } from '../../role/entities/role.entity';
import { CREATED_BY, USER_STATUS } from '../enums/user.enum';
import { IOtpCode, OtpCodeSchema } from './otp.entity';
@Schema({
  collection: 'users',
  timestamps: true,
})
class User {
  @Prop({ type: String })
  firstName!: string;

  @Prop({ type: String })
  lastName!: string;

  @Prop({ type: String, default: null })
  company!: string;

  @Prop({ type: String })
  city!: string;

  @Prop({ type: String })
  address1!: string;

  @Prop({ type: String })
  address2!: string;

  @Prop({ type: String })
  state!: string;

  @Prop({ type: String })
  zip!: string;

  @Prop({ type: String })
  country!: string;

  @Prop({ type: String })
  notes!: string;

  @Prop({
    type: String,
    unique: true,
    index: true,
    required: true,
    lowercase: true,
    validate: validator.isEmail,
  })
  email!: string;

  @Prop({ type: String, default: 'default.png' })
  photo!: string;

  @Prop({ type: String })
  phone!: string;

  @Prop({ type: String, enum: CREATED_BY, default: CREATED_BY.USER })
  createdBy!: CREATED_BY;

  @Prop({ type: String, select: false, required: true })
  password!: string;

  @Prop({ type: String, required: false, default: null })
  customer!: string;

  @Prop({
    type: String,
    // required: [true, 'Please confirm your password'],
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function (this: User, el: string) {
        return el === this.password;
      },
      message: 'Passwords are not the same!',
    },
  })
  confirmPassword!: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: Role.name, required: true })
  role!: IRole;

  @Prop({ type: String, enum: USER_STATUS, default: USER_STATUS.ACTIVE })
  status!: USER_STATUS;

  @Prop({ type: [String], default: [] })
  socketIds!: string[];

  @Prop({ type: Number })
  passwordChangedAt!: number;

  @Prop({ type: OtpCodeSchema, select: false })
  otpCode!: IOtpCode;

  changedPasswordAfter(JWTTimestamp: number): boolean {
    if (this.passwordChangedAt) {
      const changedTimestamp = Math.floor(
        new Date(this.passwordChangedAt).getTime() / 1000,
      );
      return JWTTimestamp < changedTimestamp;
    }
    return false;
  }

  async correctPassword(
    candidatePassword: string,
    userPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(candidatePassword, userPassword);
  }
}

const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(this.password, 12);

  this.confirmPassword = undefined as any;
});

UserSchema.methods.correctPassword = async function (
  candidatePassword: string,
  userPassword: string,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

type IUser = HydratedDocument<User>;
export { IUser, User, UserSchema };
