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
 * - timestamps creates created_at / updated_at per spec
 */
@Schema({
  collection: 'patients',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      delete (ret as any)._id;
      delete (ret as any).__v;
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
 * Compound index for common query patterns:
 * - Filter by last_name + date_of_birth
 */
PatientSchema.index({ last_name: 1, date_of_birth: 1 });

PatientSchema.virtual('createdAt').get(function (this: any) {
  return this.created_at;
});
PatientSchema.virtual('updatedAt').get(function (this: any) {
  return this.updated_at;
});

type IPatient = HydratedDocument<Patient>;
export { IPatient, Patient, PatientSchema };
