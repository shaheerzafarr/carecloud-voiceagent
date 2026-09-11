import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * QueryPatientDto
 *
 * Supports the assessment requirement:
 * "GET /patients - List all patients. Support optional query params:
 *  ?last_name=, ?date_of_birth=, ?phone_number="
 */
export class QueryPatientDto {
  @ApiPropertyOptional({ example: 'Doe', description: 'Filter by last name (case-insensitive partial match)' })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiPropertyOptional({ example: '1990-05-15', description: 'Filter by date of birth' })
  @IsOptional()
  @IsString()
  date_of_birth?: string;

  @ApiPropertyOptional({ example: '5551234567', description: 'Filter by phone number (exact match)' })
  @IsOptional()
  @IsString()
  phone_number?: string;
}
