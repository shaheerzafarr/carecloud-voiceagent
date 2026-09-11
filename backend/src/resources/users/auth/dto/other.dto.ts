import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
  MinLength,
  Validate,
} from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email to send reset password link',
    required: true,
  })
  @IsNotEmpty({ message: 'Please provide email.' })
  @IsString()
  email: string;

  @ApiProperty({
    description: 'User email',
    required: true,
  })
  @IsNotEmpty({ message: 'Please provide type.' })
  @IsString()
  type: 'email' | 'phone';
}

export class ResendOtpDto {
  @ApiProperty({
    description: 'Email to send reset password link',
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

export class ValidateOtpDto {
  @ApiProperty({
    description: 'OTP code to validate',
    required: true,
  })
  @IsNotEmpty({ message: 'Please provide code.' })
  @IsNumber()
  code: number;

  @ApiProperty({
    description: 'Email to validate OTP',
    required: true,
  })
  @IsNotEmpty({ message: 'Please provide email.' })
  @IsEmail()
  email: string;
}

export class SetPasswordDto {
  @ApiProperty({ description: 'User password', required: true })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiProperty({ description: 'User password', required: true })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Validate((o) => o.password === o.confirmPassword, {
    message: 'Password and Confirm Password do not match',
  })
  confirmPassword: string;

  @ApiProperty({ description: 'otp code', required: true })
  @IsNotEmpty({ message: 'otp code is required' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'user email', required: true })
  @IsNotEmpty({ message: 'user email is required' })
  @IsEmail()
  email: string;
}
