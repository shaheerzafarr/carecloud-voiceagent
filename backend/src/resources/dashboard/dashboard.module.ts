import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { PatientModule } from '../patients/patient.module';
import { CallLogModule } from '../call-logs/call-log.module';
import { AppointmentModule } from '../appointments/appointment.module';

@Module({
  imports: [PatientModule, CallLogModule, AppointmentModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
