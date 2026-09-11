import { Injectable, Logger } from '@nestjs/common';
import { AppointmentRepository } from './appointment.repository';
import { IAppointment } from './entities/appointment.entity';
import { APPOINTMENT_TYPE } from './enums/appointment.enum';

@Injectable()
export class AppointmentService {
  private readonly logger = new Logger(AppointmentService.name);

  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  async scheduleAppointment(data: {
    patient_id: string;
    preferred_date?: string;
    preferred_time?: string;
    appointment_type?: string;
    notes?: string;
  }): Promise<IAppointment> {
    // Ensure appointment date is strictly in the future (no past appointments)
    let appointmentDate: Date;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (data.preferred_date) {
      const parsed = new Date(data.preferred_date);
      if (!isNaN(parsed.getTime())) {
        // If LLM defaulted to an older cutoff year (e.g. 2023 or 2024), bump to current year
        if (parsed.getFullYear() < today.getFullYear()) {
          parsed.setFullYear(today.getFullYear());
        }

        // If the parsed date is still in the past, default to next available weekday
        if (parsed < today) {
          appointmentDate = this.getNextAvailableDate();
        } else {
          appointmentDate = parsed;
        }
      } else {
        appointmentDate = this.getNextAvailableDate();
      }
    } else {
      appointmentDate = this.getNextAvailableDate();
    }

    const appointment = await this.appointmentRepository.create({
      patient_id: data.patient_id,
      date: appointmentDate,
      time: data.preferred_time || '10:00 AM',
      type: (data.appointment_type as APPOINTMENT_TYPE) || APPOINTMENT_TYPE.NEW_PATIENT,
      provider: 'Dr. Smith',
      notes: data.notes || null,
    });

    this.logger.log(
      `📅 Appointment scheduled: ${appointment.appointment_id} | Patient: ${data.patient_id} | Date: ${appointmentDate.toISOString()}`,
    );

    return appointment;
  }

  async findByPatientId(patientId: string): Promise<IAppointment[]> {
    return await this.appointmentRepository.findByPatientId(patientId);
  }

  /**
   * Get the next available weekday (Mon-Fri) for scheduling.
   * Skips weekends. Mock logic for the assessment.
   */
  private getNextAvailableDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 1); // Start from tomorrow
    while (date.getDay() === 0 || date.getDay() === 6) {
      date.setDate(date.getDate() + 1); // Skip weekends
    }
    return date;
  }
}
