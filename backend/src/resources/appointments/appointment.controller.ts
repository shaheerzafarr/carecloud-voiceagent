import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@ApiTags('Appointments')
@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  @ApiOperation({ summary: 'Schedule a new appointment' })
  async scheduleAppointment(@Body() dto: CreateAppointmentDto) {
    const data = await this.appointmentService.scheduleAppointment(dto);
    return { data, error: null };
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get appointments for a patient' })
  async getByPatient(@Param('patientId') patientId: string) {
    const data = await this.appointmentService.findByPatientId(patientId);
    return { data, error: null };
  }
}
