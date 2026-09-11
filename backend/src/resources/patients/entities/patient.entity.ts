import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { SEX } from '../enums/patient.enum';

/**
 * Patient Entity
 *
 * Represents the standard minimum demographic dataset required by
 * U.S. healthcare providers for patient registration.
 *
 * Schema Design Decisions:
 * - patient_id (UUID) used as the public identifier instead of MongoDB _id
 * - phone_number has a unique index for duplicate detection (bonus feature)
 * - deleted_at enables soft-delete (assessment requirement)
 * - timestamps: true auto-manages createdAt/updatedAt
 */
@Schema({
  collection: 'patients',
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
class Patient {
  // ──── Auto-generated fields ────

  @Prop({
    type: String,
    required: true,
    unique: true,
    default: () => uuidv4(),
    index: true,
  })
  patient_id!: string;

  // ──── Required demographic fields ────

  @Prop({
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 50,
  })
  first_name!: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 50,
  })
  last_name!: string;

  @Prop({ type: Date, required: true })
  date_of_birth!: Date;

  @Prop({
    type: String,
    required: true,
    enum: SEX,
  })
  sex!: SEX;

  @Prop({
    type: String,
    required: true,
    trim: true,
    index: true,
  })
  phone_number!: string;

  // ──── Optional contact fields ────

  @Prop({ type: String, default: null, lowercase: true, trim: true })
  email!: string;

  // ──── Required address fields ────

  @Prop({ type: String, required: true, trim: true })
  address_line_1!: string;

  @Prop({ type: String, default: null, trim: true })
  address_line_2!: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 100 })
  city!: string;

  @Prop({ type: String, required: true, trim: true, uppercase: true })
  state!: string;

  @Prop({ type: String, required: true, trim: true })
  zip_code!: string;

  // ──── Optional insurance fields ────

  @Prop({ type: String, default: null, trim: true })
  insurance_provider!: string;

  @Prop({ type: String, default: null, trim: true })
  insurance_member_id!: string;

  // ──── Optional preference fields ────

  @Prop({ type: String, default: 'English', trim: true })
  preferred_language!: string;

  // ──── Optional emergency contact ────

  @Prop({ type: String, default: null, trim: true })
  emergency_contact_name!: string;

  @Prop({ type: String, default: null, trim: true })
  emergency_contact_phone!: string;

  // ──── Soft-delete support ────

  @Prop({ type: Date, default: null })
  deleted_at!: Date | null;
}

const PatientSchema = SchemaFactory.createForClass(Patient);

/**
 * Index for duplicate detection:
 * Allows quick lookup by phone_number to check if a patient already exists.
 */
PatientSchema.index({ phone_number: 1 });

/**
 * Compound index for common query patterns:
 * - Filter by last_name + date_of_birth
 */
PatientSchema.index({ last_name: 1, date_of_birth: 1 });

type IPatient = HydratedDocument<Patient>;
export { IPatient, Patient, PatientSchema };
