import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { IsInRange } from 'src/common/validators/isInRange.validator';

export class ResetPasswordUserDto {
  @ApiProperty({ description: 'New Password', required: true })
  @IsNotEmpty({ message: 'Please provide password' })
  @IsString()
  @IsInRange(8, 30, {
    message: 'Password must be between 8 and 30 characters.',
  })
  password: string;

  @ApiProperty({ description: 'Confirm New Password', required: true })
  @IsNotEmpty({ message: 'Please provide confirm password' })
  @IsString()
  @IsInRange(8, 30, {
    message: 'Password must be between 8 and 30 characters.',
  })
  confirmPassword: string;

  @ApiProperty({ description: 'Confirm OTP', required: true })
  @IsNotEmpty({ message: 'Please provide reset code' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Email of the user', required: true })
  @IsNotEmpty({ message: 'Please provide email' })
  @IsString()
  email: string;

  @ApiProperty({ description: 'Type of the user', required: true })
  @IsNotEmpty({ message: 'Please provide type' })
  @IsString()
  type: 'email' | 'phone';
}
