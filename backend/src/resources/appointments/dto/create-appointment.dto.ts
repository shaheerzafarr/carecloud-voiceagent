import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { APPOINTMENT_TYPE } from '../enums/appointment.enum';

export class CreateAppointmentDto {
  @ApiProperty({ example: 'uuid-here', description: 'Patient UUID' })
  @IsNotEmpty()
  @IsString()
  patient_id: string;

  @ApiPropertyOptional({ example: '2024-12-20', description: 'Preferred date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  preferred_date?: string;

  @ApiPropertyOptional({ example: '10:00 AM', description: 'Preferred time' })
  @IsOptional()
  @IsString()
  preferred_time?: string;

  @ApiPropertyOptional({ enum: APPOINTMENT_TYPE, description: 'Type of appointment' })
  @IsOptional()
  @IsEnum(APPOINTMENT_TYPE)
  appointment_type?: APPOINTMENT_TYPE;

  @ApiPropertyOptional({ example: 'First visit, needs full physical', description: 'Any notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
