import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'otpCodes', timestamps: true })
class OtpCode {
  @Prop({ type: String, default: null })
  code!: string;

  @Prop({ type: Date, default: null })
  expireAt!: Date;
}

const OtpCodeSchema = SchemaFactory.createForClass(OtpCode);
type IOtpCode = HydratedDocument<OtpCode>;

export { IOtpCode, OtpCode, OtpCodeSchema };
