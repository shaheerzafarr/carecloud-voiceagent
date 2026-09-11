import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  Validate,
} from 'class-validator';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { SEX, US_STATES } from '../enums/patient.enum';

/**
 * Custom validator: Ensures date_of_birth is not in the future
 * and is a valid date in any reasonable format.
 */
@ValidatorConstraint({ name: 'isNotFutureDate', async: false })
export class IsNotFutureDate implements ValidatorConstraintInterface {
  validate(value: string, _args: ValidationArguments): boolean {
    if (!value) return false;
    const date = new Date(value);
    if (isNaN(date.getTime())) return false;
    return date <= new Date();
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'date_of_birth must be a valid date and cannot be in the future';
  }
}

/**
 * CreatePatientDto
 *
 * Validates all patient demographic fields per the assessment spec:
 * - Names: 1-50 chars, alphabetic + hyphens/apostrophes/spaces
 * - Phone: Valid US 10-digit number
 * - DOB: Valid date, not in future
 * - Sex: Enum (Male, Female, Other, Decline to Answer)
 * - State: Valid 2-letter US state abbreviation
 * - ZIP: 5-digit or ZIP+4 format
 * - Email: Valid format (optional)
 */
export class CreatePatientDto {
  // ──── Required fields ────

  @ApiProperty({ example: 'Jane', description: '1-50 chars, alphabetic + hyphens/apostrophes' })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(/^[a-zA-Z\s'-]+$/, {
    message: 'first_name must contain only letters, spaces, hyphens, and apostrophes',
  })
  first_name: string;

  @ApiProperty({ example: 'Doe', description: '1-50 chars, alphabetic + hyphens/apostrophes' })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(/^[a-zA-Z\s'-]+$/, {
    message: 'last_name must contain only letters, spaces, hyphens, and apostrophes',
  })
  last_name: string;

  @ApiProperty({ example: '1990-05-15', description: 'Valid date, not in future (ISO or MM/DD/YYYY)' })
  @IsNotEmpty()
  @IsString()
  @Validate(IsNotFutureDate)
  date_of_birth: string;

  @ApiProperty({ example: 'Female', enum: SEX, description: 'Male, Female, Other, or Decline to Answer' })
  @IsNotEmpty()
  @IsEnum(SEX, {
    message: 'sex must be one of: Male, Female, Other, Decline to Answer',
  })
  sex: SEX;

  @ApiProperty({ example: '5551234567', description: 'Valid US 10-digit phone number' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{10}$/, {
    message: 'phone_number must be a valid 10-digit US phone number',
  })
  phone_number: string;

  @ApiProperty({ example: '123 Main Street', description: 'Street address' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  address_line_1: string;

  @ApiProperty({ example: 'Springfield', description: '1-100 characters' })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  city: string;

  @ApiProperty({ example: 'IL', description: 'Valid 2-letter US state abbreviation' })
  @IsNotEmpty()
  @IsString()
  @IsIn([...US_STATES], {
    message: 'state must be a valid 2-letter US state abbreviation',
  })
  state: string;

  @ApiProperty({ example: '62701', description: '5-digit or ZIP+4 US format' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{5}(-\d{4})?$/, {
    message: 'zip_code must be in 5-digit (12345) or ZIP+4 (12345-6789) format',
  })
  zip_code: string;

  // ──── Optional fields ────

  @ApiPropertyOptional({ example: 'jane.doe@email.com', description: 'Valid email format' })
  @IsOptional()
  @IsEmail({}, { message: 'email must be a valid email address' })
  email?: string;

  @ApiPropertyOptional({ example: 'Apt 4B', description: 'Apartment, Suite, Unit' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  address_line_2?: string;

  @ApiPropertyOptional({ example: 'Blue Cross Blue Shield', description: 'Insurance company name' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  insurance_provider?: string;

  @ApiPropertyOptional({ example: 'XYZ123456789', description: 'Alphanumeric member/subscriber ID' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  insurance_member_id?: string;

  @ApiPropertyOptional({ example: 'English', description: 'Default: English' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  preferred_language?: string;

  @ApiPropertyOptional({ example: 'John Doe', description: 'Emergency contact full name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  emergency_contact_name?: string;

  @ApiPropertyOptional({ example: '5559876543', description: 'Emergency contact US 10-digit phone' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{10}$/, {
    message: 'emergency_contact_phone must be a valid 10-digit US phone number',
  })
  emergency_contact_phone?: string;
}
