import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * Call Log Status
 * Tracks the outcome of each voice call.
 */
export enum CALL_STATUS {
  COMPLETED = 'completed',
  FAILED = 'failed',
  ABANDONED = 'abandoned',
  IN_PROGRESS = 'in_progress',
}

/**
 * CallLog Entity
 *
 * Stores transcripts and metadata for each voice call.
 * Bonus feature: "Call Recording/Transcript: Store a transcript or summary
 * of each call linked to the patient record."
 */
@Schema({
  collection: 'call_logs',
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
class CallLog {
  @Prop({ type: String, required: true, index: true })
  call_id!: string;

  @Prop({ type: String, default: null, index: true })
  patient_id!: string | null;

  @Prop({ type: String, default: null })
  phone_number!: string | null;

  @Prop({ type: String, default: null })
  transcript!: string | null;

  @Prop({ type: String, default: null })
  summary!: string | null;

  @Prop({ type: Number, default: 0 })
  duration_seconds!: number;

  @Prop({
    type: String,
    enum: CALL_STATUS,
    default: CALL_STATUS.IN_PROGRESS,
  })
  status!: CALL_STATUS;

  @Prop({ type: Object, default: null })
  metadata!: Record<string, any> | null;
}

const CallLogSchema = SchemaFactory.createForClass(CallLog);
type ICallLog = HydratedDocument<CallLog>;
export { ICallLog, CallLog, CallLogSchema };
