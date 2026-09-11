import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ValidateOtpDto {
  @ApiProperty({
    description: 'OTP code to validate',
    required: true,
  })
  @IsNotEmpty({ message: 'Please provide code.' })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Email to validate OTP',
    required: true,
  })
  @IsNotEmpty({ message: 'Please provide email.' })
  @IsString()
  email: string;

  @ApiProperty({
    description: 'Type of the user',
    required: true,
  })
  @IsNotEmpty({ message: 'Please provide type' })
  @IsString()
  type: 'email' | 'phone';
}
