import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Patient, IPatient } from './entities/patient.entity';
import { QueryPatientDto } from './dto/query-patient.dto';

/**
 * PatientRepository
 *
 * Data access layer for patient records.
 * Follows the existing ContactRepository pattern.
 *
 * Key behaviors:
 * - All queries exclude soft-deleted records (deleted_at: null)
 * - findByPhone() enables duplicate detection (bonus feature)
 * - softDelete() sets deleted_at timestamp instead of hard-deleting
 */
@Injectable()
export class PatientRepository {
  constructor(
    @InjectModel(Patient.name) private readonly Patient: Model<Patient>,
  ) {}

  async create(data: Partial<IPatient>): Promise<IPatient> {
    return await this.Patient.create(data);
  }

  async findAll(
    query: QueryPatientDto,
  ): Promise<{ patients: IPatient[]; totalCount: number }> {
    const filter: Record<string, any> = { deleted_at: null };

    // Apply optional query filters
    if (query.last_name) {
      filter.last_name = { $regex: new RegExp(query.last_name, 'i') };
    }
    if (query.date_of_birth) {
      const dob = new Date(query.date_of_birth);
      if (!isNaN(dob.getTime())) {
        // Match the entire day
        const startOfDay = new Date(dob);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(dob);
        endOfDay.setUTCHours(23, 59, 59, 999);
        filter.date_of_birth = { $gte: startOfDay, $lte: endOfDay };
      }
    }
    if (query.phone_number) {
      filter.phone_number = query.phone_number;
    }

    const [patients, totalCount] = await Promise.all([
      this.Patient.find(filter).sort({ createdAt: -1 }).exec(),
      this.Patient.countDocuments(filter),
    ]);

    return { patients: patients as unknown as IPatient[], totalCount };
  }

  async findById(patientId: string): Promise<IPatient | null> {
    return (await this.Patient.findOne({
      patient_id: patientId,
      deleted_at: null,
    })) as unknown as IPatient | null;
  }

  /**
   * Find a patient by phone number.
   * Used for duplicate detection (bonus feature):
   * "If the caller provides a phone number that matches an existing patient,
   *  the agent should recognize this and ask to update instead."
   */
  async findByPhone(phoneNumber: string): Promise<IPatient | null> {
    return (await this.Patient.findOne({
      phone_number: phoneNumber,
      deleted_at: null,
    })) as unknown as IPatient | null;
  }

  async update(
    patientId: string,
    data: Partial<IPatient>,
  ): Promise<IPatient | null> {
    return (await this.Patient.findOneAndUpdate(
      { patient_id: patientId, deleted_at: null },
      { $set: data },
      { returnDocument: 'after' },
    )) as unknown as IPatient | null;
  }

  /**
   * Soft-delete: Sets deleted_at timestamp instead of removing the record.
   * Assessment requirement: "Soft-delete a patient record (set deleted_at timestamp; do not hard-delete)"
   */
  async softDelete(patientId: string): Promise<IPatient | null> {
    return (await this.Patient.findOneAndUpdate(
      { patient_id: patientId, deleted_at: null },
      { $set: { deleted_at: new Date() } },
      { returnDocument: 'after' },
    )) as unknown as IPatient | null;
  }

  async count(): Promise<number> {
    return await this.Patient.countDocuments({ deleted_at: null });
  }

  async countToday(): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    return await this.Patient.countDocuments({
      deleted_at: null,
      createdAt: { $gte: startOfDay },
    });
  }
}
