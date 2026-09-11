import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Appointment, IAppointment } from './entities/appointment.entity';

@Injectable()
export class AppointmentRepository {
  constructor(
    @InjectModel(Appointment.name) private readonly Appointment: Model<Appointment>,
  ) {}

  async create(data: Partial<IAppointment>): Promise<IAppointment> {
    return await this.Appointment.create(data);
  }

  async findByPatientId(patientId: string): Promise<IAppointment[]> {
    return (await this.Appointment.find({ patient_id: patientId })
      .sort({ date: 1 })
      .exec()) as unknown as IAppointment[];
  }

  async findById(appointmentId: string): Promise<IAppointment | null> {
    return (await this.Appointment.findOne({
      appointment_id: appointmentId,
    })) as unknown as IAppointment | null;
  }
}
