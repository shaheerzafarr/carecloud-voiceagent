import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { APPOINTMENT_TYPE, APPOINTMENT_STATUS } from '../enums/appointment.enum';

@Schema({
  collection: 'appointments',
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
class Appointment {
  @Prop({ type: String, required: true, unique: true, default: () => uuidv4(), index: true })
  appointment_id!: string;

  @Prop({ type: String, required: true, index: true })
  patient_id!: string;

  @Prop({ type: Date, required: true })
  date!: Date;

  @Prop({ type: String, default: '10:00 AM' })
  time!: string;

  @Prop({ type: String, default: 'Dr. Smith' })
  provider!: string;

  @Prop({ type: String, enum: APPOINTMENT_TYPE, default: APPOINTMENT_TYPE.NEW_PATIENT })
  type!: APPOINTMENT_TYPE;

  @Prop({ type: String, enum: APPOINTMENT_STATUS, default: APPOINTMENT_STATUS.SCHEDULED })
  status!: APPOINTMENT_STATUS;

  @Prop({ type: String, default: null })
  notes!: string | null;
}

const AppointmentSchema = SchemaFactory.createForClass(Appointment);
type IAppointment = HydratedDocument<Appointment>;
export { IAppointment, Appointment, AppointmentSchema };
