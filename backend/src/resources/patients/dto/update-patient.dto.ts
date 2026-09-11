import { PartialType } from '@nestjs/swagger';
import { CreatePatientDto } from './create-patient.dto';

/**
 * UpdatePatientDto
 *
 * Allows partial updates to patient records.
 * All fields from CreatePatientDto become optional.
 * Assessment requirement: "Partial updates allowed" on PUT /patients/:id
 */
export class UpdatePatientDto extends PartialType(CreatePatientDto) {}
