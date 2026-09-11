import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Log {
  @Prop({ type: String, enum: ['error', 'info', 'debug'], default: 'info' })
  level!: string;

  @Prop({ type: String, required: true })
  message!: string;

  @Prop({ type: String, required: true })
  context!: string;

  @Prop({ type: String })
  stack!: string;
}

const LogSchema = SchemaFactory.createForClass(Log);

export { LogSchema };
