import { Module } from '@nestjs/common';
import { VapiController } from './vapi.controller';
import { VapiService } from './vapi.service';
import { PatientModule } from '../patients/patient.module';
import { CallLogModule } from '../call-logs/call-log.module';
import { AppointmentModule } from '../appointments/appointment.module';

@Module({
  imports: [PatientModule, CallLogModule, AppointmentModule],
  controllers: [VapiController],
  providers: [VapiService],
  exports: [VapiService],
})
export class VapiModule {}
