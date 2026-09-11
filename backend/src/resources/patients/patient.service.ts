import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PatientRepository } from './patient.repository';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { QueryPatientDto } from './dto/query-patient.dto';
import { IPatient } from './entities/patient.entity';

/**
 * PatientService
 *
 * Business logic layer for patient CRUD operations.
 * Handles validation, error messaging, duplicate detection,
 * and logging (observability requirement).
 */
@Injectable()
export class PatientService {
  private readonly logger = new Logger(PatientService.name);

  constructor(private readonly patientRepository: PatientRepository) {}

  /**
   * Create a new patient record.
   * - Converts date_of_birth string to Date object
   * - Logs the created patient data (observability requirement)
   */
  async createPatient(createPatientDto: CreatePatientDto): Promise<IPatient> {
    // Convert date_of_birth string to Date
    const patientData: any = {
      ...createPatientDto,
      date_of_birth: new Date(createPatientDto.date_of_birth),
    };

    try {
      const patient = await this.patientRepository.create(patientData);

      // Observability: Log the created patient data payload
      this.logger.log(
        `✅ Patient created: ${patient.patient_id} | ${patient.first_name} ${patient.last_name} | Phone: ${patient.phone_number}`,
      );

      return patient;
    } catch (error: any) {
      // Handle MongoDB duplicate key error (phone_number unique index)
      if (error?.code === 11000) {
        throw new ConflictException(
          'A patient with this phone number already exists',
        );
      }
      throw error;
    }
  }

  /**
   * Get all patients with optional filters.
   * Assessment: "Support optional query params: ?last_name=, ?date_of_birth=, ?phone_number="
   */
  async getAllPatients(
    query: QueryPatientDto,
  ): Promise<{ patients: IPatient[]; totalCount: number }> {
    return await this.patientRepository.findAll(query);
  }

  /**
   * Get a single patient by UUID.
   * Assessment: "Retrieve a single patient by patient_id (UUID)"
   */
  async getPatient(patientId: string): Promise<IPatient> {
    const patient = await this.patientRepository.findById(patientId);

    if (!patient) {
      throw new NotFoundException(
        `Patient with ID ${patientId} not found`,
      );
    }

    return patient;
  }

  /**
   * Find existing patient by phone number.
   * Bonus feature: Duplicate detection.
   * "If the caller provides a phone number that matches an existing patient,
   *  the agent should recognize this."
   */
  async findByPhone(phoneNumber: string): Promise<IPatient | null> {
    return await this.patientRepository.findByPhone(phoneNumber);
  }

  /**
   * Update an existing patient (partial updates allowed).
   * Assessment: "Update an existing patient record. Partial updates allowed."
   */
  async updatePatient(
    patientId: string,
    updatePatientDto: UpdatePatientDto,
  ): Promise<IPatient> {
    // Verify patient exists first
    await this.getPatient(patientId);

    const updateData: any = { ...updatePatientDto };

    // Convert date_of_birth if provided
    if (updateData.date_of_birth) {
      updateData.date_of_birth = new Date(updateData.date_of_birth);
    }

    const updated = await this.patientRepository.update(patientId, updateData);

    if (!updated) {
      throw new BadRequestException('Failed to update patient');
    }

    this.logger.log(
      `📝 Patient updated: ${patientId} | Fields: ${Object.keys(updatePatientDto).join(', ')}`,
    );

    return updated;
  }

  /**
   * Soft-delete a patient record.
   * Assessment: "Soft-delete a patient record (set deleted_at timestamp; do not hard-delete)"
   */
  async deletePatient(patientId: string): Promise<IPatient> {
    // Verify patient exists first
    await this.getPatient(patientId);

    const deleted = await this.patientRepository.softDelete(patientId);

    if (!deleted) {
      throw new BadRequestException('Failed to delete patient');
    }

    this.logger.log(`🗑️ Patient soft-deleted: ${patientId}`);

    return deleted;
  }

  /**
   * Get dashboard stats
   */
  async getStats(): Promise<{
    totalPatients: number;
    todayRegistrations: number;
  }> {
    const [totalPatients, todayRegistrations] = await Promise.all([
      this.patientRepository.count(),
      this.patientRepository.countToday(),
    ]);

    return { totalPatients, todayRegistrations };
  }
}
